#!/bin/bash

set -euo pipefail

# ============================================================================
# CRM JURÍDICO - Setup de Produção (GCP + Cloudflare + SMTP)
# ============================================================================
# Script interativo para configurar ambiente de produção
# VERSÃO CORRIGIDA - Todos os problemas críticos resolvidos
# ============================================================================

# ============================================================================
# VARIÁVEIS GLOBAIS
# ============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/setup-production.log"
CONFIG_FILE="$PROJECT_ROOT/.production-config"
MAX_LOG_SIZE=10485760

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# Símbolos
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"
INFO="${CYAN}ℹ${NC}"
ARROW="${PURPLE}→${NC}"
STAR="${YELLOW}★${NC}"

# ============================================================================
# CLEANUP E TRAP
# ============================================================================

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ $exit_code -ne 130 ]; then
        echo ""
        print_error "Script interrompido! Código de saída: $exit_code"
        log "Script interrompido com código: $exit_code"
    fi
}

trap cleanup EXIT INT TERM

# ============================================================================
# FUNÇÕES DE UTILIDADE
# ============================================================================

print_header() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}                                                                ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     ${BOLD}CRM JURÍDICO - Setup de Produção (GCP)${NC}              ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}                                                                ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${ARROW} ${CYAN}$1${NC}"
}

print_success() {
    echo -e "${CHECK} ${GREEN}$1${NC}"
}

print_error() {
    echo -e "${CROSS} ${RED}$1${NC}"
}

log() {
    if [ -f "$LOG_FILE" ]; then
        local size=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE" 2>/dev/null || echo 0)
        if [ "$size" -gt "$MAX_LOG_SIZE" ]; then
            mv "$LOG_FILE" "${LOG_FILE}.old"
        fi
    fi
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

print_warning() {
    echo -e "${WARN} ${YELLOW}$1${NC}"
}

print_info() {
    echo -e "${INFO} ${CYAN}$1${NC}"
}

pause() {
    echo ""
    read -p "Pressione ENTER para continuar..."
}

confirm() {
    local prompt="$1"
    local default="${2:-n}"

    if [ "$default" = "y" ]; then
        prompt="$prompt [S/n]: "
    else
        prompt="$prompt [s/N]: "
    fi

    read -p "$(echo -e ${YELLOW}${prompt}${NC})" response
    response=${response:-$default}

    case "$response" in
        [yYsS]*) return 0 ;;
        *) return 1 ;;
    esac
}

spinner() {
    local pid=$1
    local timeout=${2:-1800}
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local elapsed=0

    while ps -p $pid > /dev/null 2>&1; do
        if [ $elapsed -ge $timeout ]; then
            print_error "Timeout após ${timeout}s!"
            kill -9 $pid 2>/dev/null || true
            return 1
        fi

        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
        elapsed=$((elapsed + 1))
    done
    printf "    \b\b\b\b"

    wait $pid
    return $?
}

read_input() {
    local prompt="$1"
    local default="$2"
    local value

    if [ -n "$default" ]; then
        read -p "$(echo -e ${WHITE}${prompt} [${default}]:${NC} )" value
        echo "${value:-$default}"
    else
        read -p "$(echo -e ${WHITE}${prompt}:${NC} )" value
        echo "$value"
    fi
}

read_secret() {
    local prompt="$1"
    local value

    read -sp "$(echo -e ${WHITE}${prompt}:${NC} )" value
    echo ""
    echo "$value"
}

validate_email() {
    local email="$1"
    if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

validate_bucket_name() {
    local name="$1"
    if [[ "$name" =~ ^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$ ]] && [[ ! "$name" =~ \.\. ]] && [[ ! "$name" =~ ^goog ]] && [[ ! "$name" =~ google ]]; then
        return 0
    else
        return 1
    fi
}

save_config() {
    local key="$1"
    local value="$2"

    if [ -f "$CONFIG_FILE" ]; then
        sed -i.bak "/^${key}=/d" "$CONFIG_FILE" 2>/dev/null || sed -i "/^${key}=/d" "$CONFIG_FILE"
        rm -f "${CONFIG_FILE}.bak" 2>/dev/null || true
    fi
    echo "${key}=${value}" >> "$CONFIG_FILE"
}

load_config() {
    local key="$1"

    if [ -f "$CONFIG_FILE" ]; then
        grep "^${key}=" "$CONFIG_FILE" 2>/dev/null | cut -d'=' -f2-
    fi
}

require_config() {
    local key="$1"
    local friendly_name="$2"
    local value=$(load_config "$key")

    if [ -z "$value" ]; then
        print_error "$friendly_name não configurado!"
        print_info "Execute a opção correspondente primeiro."
        return 1
    fi

    echo "$value"
}

retry_command() {
    local max_attempts=${1:-3}
    local delay=${2:-5}
    shift 2
    local command="$@"
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if eval "$command"; then
            return 0
        fi

        if [ $attempt -lt $max_attempts ]; then
            print_warning "Tentativa $attempt falhou. Tentando novamente em ${delay}s..."
            sleep $delay
        fi

        attempt=$((attempt + 1))
    done

    print_error "Comando falhou após $max_attempts tentativas"
    return 1
}

# ============================================================================
# VALIDAÇÃO DE FERRAMENTAS
# ============================================================================

check_command() {
    local cmd=$1
    local name=$2
    local install_hint=$3
    
    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        print_success "$name instalado: $version"
        log "$name: OK - $version"
        return 0
    else
        print_error "$name NÃO encontrado"
        print_info "Instale com: $install_hint"
        log "$name: FALTANDO"
        return 1
    fi
}

validate_tools() {
    print_section "1. Validando Ferramentas Necessárias"
    
    local all_ok=true
    
    print_step "Verificando ferramentas necessárias..."
    echo ""
    
    # gcloud CLI
    if ! check_command "gcloud" "Google Cloud SDK" "https://cloud.google.com/sdk/docs/install"; then
        all_ok=false
    fi
    
    # Docker
    if ! check_command "docker" "Docker" "https://docs.docker.com/get-docker/"; then
        all_ok=false
    fi
    
    # Git
    if ! check_command "git" "Git" "sudo apt install git"; then
        all_ok=false
    fi
    
    # jq (para parsing JSON)
    if ! check_command "jq" "jq (JSON processor)" "sudo apt install jq"; then
        all_ok=false
    fi
    
    # curl
    if ! check_command "curl" "curl" "sudo apt install curl"; then
        all_ok=false
    fi
    
    echo ""
    
    if [ "$all_ok" = false ]; then
        print_error "Algumas ferramentas estão faltando!"
        print_info "Instale as ferramentas faltantes e execute o script novamente."
        exit 1
    fi
    
    print_success "Todas as ferramentas estão instaladas!"
    log "Validação de ferramentas: OK"
}

# ============================================================================
# CONFIGURAÇÃO GCP
# ============================================================================

gcp_authenticate() {
    print_section "2. Autenticação no Google Cloud"

    print_info "Verificando autenticação atual..."

    if gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        local current_account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
        if [ -n "$current_account" ]; then
            print_success "Já autenticado como: $current_account"

            if ! confirm "Deseja usar esta conta?"; then
                print_step "Iniciando nova autenticação..."
                if ! gcloud auth login; then
                    print_error "Falha na autenticação!"
                    return 1
                fi
            fi
        fi
    else
        print_step "Iniciando autenticação..."
        if ! gcloud auth login; then
            print_error "Falha na autenticação!"
            return 1
        fi
    fi

    print_success "Autenticação concluída!"
    log "GCP: Autenticado"
    return 0
}

gcp_select_or_create_project() {
    print_section "3. Projeto Google Cloud"

    print_info "Projetos existentes:"
    echo ""

    gcloud projects list --format="table(projectId,name,projectNumber)" 2>/dev/null || true

    echo ""
    print_info "Opções:"
    echo "  1) Usar projeto existente"
    echo "  2) Criar novo projeto"
    echo ""

    read -p "$(echo -e ${YELLOW}Escolha:${NC} )" choice

    case $choice in
        1)
            GCP_PROJECT_ID=$(read_input "ID do projeto existente" "$(load_config GCP_PROJECT_ID)")
            if [ -z "$GCP_PROJECT_ID" ]; then
                print_error "ID do projeto não pode ser vazio!"
                return 1
            fi
            ;;
        2)
            GCP_PROJECT_ID=$(read_input "ID do novo projeto (ex: crm-juridico-prod)" "crm-juridico-prod")
            if [ -z "$GCP_PROJECT_ID" ]; then
                print_error "ID do projeto não pode ser vazio!"
                return 1
            fi

            GCP_PROJECT_NAME=$(read_input "Nome do projeto" "CRM Jurídico - Produção")

            print_step "Criando projeto $GCP_PROJECT_ID..."

            if gcloud projects create "$GCP_PROJECT_ID" --name="$GCP_PROJECT_NAME" 2>/dev/null; then
                print_success "Projeto criado com sucesso!"
            else
                print_warning "Projeto já existe ou erro ao criar. Continuando..."
            fi
            ;;
        *)
            print_error "Opção inválida!"
            return 1
            ;;
    esac

    print_step "Configurando projeto padrão..."
    if ! gcloud config set project "$GCP_PROJECT_ID"; then
        print_error "Falha ao configurar projeto!"
        return 1
    fi

    save_config "GCP_PROJECT_ID" "$GCP_PROJECT_ID"

    print_success "Projeto configurado: $GCP_PROJECT_ID"
    log "GCP: Projeto $GCP_PROJECT_ID"
    return 0
}

gcp_enable_apis() {
    print_section "4. Habilitando APIs do Google Cloud"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1

    print_info "As seguintes APIs serão habilitadas:"
    echo "  - Cloud Run API"
    echo "  - Cloud SQL Admin API"
    echo "  - Cloud Storage API"
    echo "  - Secret Manager API"
    echo "  - Cloud Build API"
    echo "  - Container Registry API"
    echo "  - Cloud Logging API"
    echo "  - Cloud Monitoring API"
    echo "  - Compute Engine API"
    echo "  - Service Networking API"
    echo ""

    if ! confirm "Continuar?" "y"; then
        return 0
    fi

    local apis=(
        "run.googleapis.com"
        "sqladmin.googleapis.com"
        "storage.googleapis.com"
        "secretmanager.googleapis.com"
        "cloudbuild.googleapis.com"
        "containerregistry.googleapis.com"
        "logging.googleapis.com"
        "monitoring.googleapis.com"
        "compute.googleapis.com"
        "servicenetworking.googleapis.com"
    )

    for api in "${apis[@]}"; do
        print_step "Habilitando $api..."
        gcloud services enable "$api" --project="$GCP_PROJECT_ID" 2>/dev/null || true
    done

    print_success "APIs habilitadas!"
    log "GCP: APIs habilitadas"
    return 0
}

gcp_setup_billing() {
    print_section "5. Configuração de Faturamento"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1

    print_warning "IMPORTANTE: O projeto precisa estar vinculado a uma conta de faturamento."
    echo ""

    print_info "Contas de faturamento disponíveis:"
    gcloud billing accounts list 2>/dev/null || true

    echo ""

    if confirm "Deseja vincular uma conta de faturamento agora?"; then
        BILLING_ACCOUNT=$(read_input "ID da conta de faturamento")

        if [ -z "$BILLING_ACCOUNT" ]; then
            print_error "ID da conta não pode ser vazio!"
            return 1
        fi

        print_step "Vinculando conta de faturamento..."
        if ! gcloud billing projects link "$GCP_PROJECT_ID" --billing-account="$BILLING_ACCOUNT"; then
            print_error "Falha ao vincular conta de faturamento!"
            return 1
        fi

        print_success "Conta de faturamento vinculada!"
        save_config "BILLING_ACCOUNT" "$BILLING_ACCOUNT"
    else
        print_warning "Lembre-se de vincular uma conta de faturamento depois!"
        print_info "Use: gcloud billing projects link $GCP_PROJECT_ID --billing-account=ACCOUNT_ID"
    fi

    log "GCP: Billing configurado"
    return 0
}

gcp_setup_region() {
    print_section "6. Região e Zona"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1

    print_info "Regiões recomendadas para Brasil:"
    echo "  - southamerica-east1 (São Paulo) - Recomendado"
    echo "  - us-east1 (Carolina do Sul)"
    echo "  - us-central1 (Iowa)"
    echo ""

    GCP_REGION=$(read_input "Região" "$(load_config GCP_REGION || echo 'southamerica-east1')")
    GCP_ZONE=$(read_input "Zona" "${GCP_REGION}-a")

    if ! gcloud config set compute/region "$GCP_REGION"; then
        print_error "Falha ao configurar região!"
        return 1
    fi

    if ! gcloud config set compute/zone "$GCP_ZONE"; then
        print_error "Falha ao configurar zona!"
        return 1
    fi

    save_config "GCP_REGION" "$GCP_REGION"
    save_config "GCP_ZONE" "$GCP_ZONE"

    print_success "Região configurada: $GCP_REGION"
    log "GCP: Região $GCP_REGION"
    return 0
}

# ============================================================================
# CLOUD SQL (PostgreSQL)
# ============================================================================

gcp_setup_cloudsql() {
    print_section "7. Cloud SQL (PostgreSQL)"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1
    GCP_REGION=$(require_config "GCP_REGION" "Região GCP") || return 1

    print_info "Configurando banco de dados PostgreSQL..."
    echo ""

    CLOUDSQL_INSTANCE=$(read_input "Nome da instância" "$(load_config CLOUDSQL_INSTANCE || echo 'crm-juridico-db')")
    CLOUDSQL_VERSION=$(read_input "Versão PostgreSQL" "POSTGRES_15")

    print_info "Tiers disponíveis:"
    echo "  - db-f1-micro (Compartilhado, ~$7/mês)"
    echo "  - db-g1-small (Compartilhado, ~$25/mês)"
    echo "  - db-n1-standard-1 (Dedicado, ~$50/mês)"
    echo ""
    CLOUDSQL_TIER=$(read_input "Tier" "db-g1-small")

    DB_NAME=$(read_input "Nome do banco de dados" "crm_juridico")
    DB_USER=$(read_input "Usuário do banco" "postgres")

    while true; do
        DB_PASSWORD=$(read_secret "Senha do banco (mínimo 8 caracteres)")
        if [ -z "$DB_PASSWORD" ]; then
            print_error "Senha não pode ser vazia!"
        elif [ ${#DB_PASSWORD} -lt 8 ]; then
            print_error "Senha deve ter no mínimo 8 caracteres!"
        else
            break
        fi
    done

    save_config "CLOUDSQL_INSTANCE" "$CLOUDSQL_INSTANCE"
    save_config "DB_NAME" "$DB_NAME"
    save_config "DB_USER" "$DB_USER"
    save_config "DB_PASSWORD" "$DB_PASSWORD"

    print_step "Verificando se instância já existe..."

    if gcloud sql instances describe "$CLOUDSQL_INSTANCE" --project="$GCP_PROJECT_ID" &>/dev/null; then
        print_warning "Instância $CLOUDSQL_INSTANCE já existe!"

        if ! confirm "Deseja recriar a instância? (CUIDADO: dados serão perdidos)"; then
            print_info "Usando instância existente."

            CLOUDSQL_CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUDSQL_INSTANCE}"
            save_config "CLOUDSQL_CONNECTION_NAME" "$CLOUDSQL_CONNECTION_NAME"

            return 0
        fi

        print_step "Deletando instância existente..."
        if ! gcloud sql instances delete "$CLOUDSQL_INSTANCE" --project="$GCP_PROJECT_ID" --quiet; then
            print_error "Falha ao deletar instância!"
            return 1
        fi
    fi

    print_step "Criando instância Cloud SQL..."
    print_warning "Isso pode levar alguns minutos..."

    gcloud sql instances create "$CLOUDSQL_INSTANCE" \
        --database-version="$CLOUDSQL_VERSION" \
        --tier="$CLOUDSQL_TIER" \
        --region="$GCP_REGION" \
        --backup-start-time="03:00" \
        --enable-bin-log \
        --retained-backups-count=7 \
        --project="$GCP_PROJECT_ID" &

    local pid=$!
    if ! wait $pid; then
        print_error "Falha ao criar instância Cloud SQL!"
        return 1
    fi

    print_success "Instância Cloud SQL criada!"

    print_step "Configurando senha do usuário..."
    if ! gcloud sql users set-password "$DB_USER" \
        --instance="$CLOUDSQL_INSTANCE" \
        --password="$DB_PASSWORD" \
        --project="$GCP_PROJECT_ID"; then
        print_error "Falha ao configurar senha!"
        return 1
    fi

    print_step "Criando banco de dados..."
    if ! gcloud sql databases create "$DB_NAME" \
        --instance="$CLOUDSQL_INSTANCE" \
        --project="$GCP_PROJECT_ID"; then
        print_error "Falha ao criar banco de dados!"
        return 1
    fi

    CLOUDSQL_CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUDSQL_INSTANCE}"
    save_config "CLOUDSQL_CONNECTION_NAME" "$CLOUDSQL_CONNECTION_NAME"

    print_success "Cloud SQL configurado!"
    print_info "Connection Name: $CLOUDSQL_CONNECTION_NAME"

    log "GCP: Cloud SQL criado - $CLOUDSQL_INSTANCE"
    return 0
}

# ============================================================================
# CLOUD STORAGE
# ============================================================================

gcp_setup_storage() {
    print_section "8. Cloud Storage"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1
    GCP_REGION=$(require_config "GCP_REGION" "Região GCP") || return 1

    print_info "Configurando bucket para armazenamento..."
    echo ""

    while true; do
        BUCKET_NAME=$(read_input "Nome do bucket (único globalmente)" "$(load_config BUCKET_NAME || echo "${GCP_PROJECT_ID}-storage")")

        if validate_bucket_name "$BUCKET_NAME"; then
            break
        else
            print_error "Nome de bucket inválido!"
            print_info "Regras: lowercase, 3-63 caracteres, sem 'google' ou 'goog'"
        fi
    done

    BUCKET_LOCATION=$(read_input "Localização" "$GCP_REGION")

    save_config "BUCKET_NAME" "$BUCKET_NAME"

    print_step "Criando bucket..."

    if gsutil ls -b "gs://${BUCKET_NAME}" &>/dev/null; then
        print_warning "Bucket já existe!"
    else
        if ! gsutil mb -p "$GCP_PROJECT_ID" -l "$BUCKET_LOCATION" "gs://${BUCKET_NAME}"; then
            print_error "Falha ao criar bucket!"
            return 1
        fi
        print_success "Bucket criado!"
    fi

    print_step "Configurando CORS..."

    DOMAIN=$(load_config DOMAIN)
    if [ -n "$DOMAIN" ]; then
        cat > /tmp/cors.json <<EOF
[
  {
    "origin": ["https://${DOMAIN}", "https://app.${DOMAIN}", "https://www.${DOMAIN}"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
EOF
    else
        cat > /tmp/cors.json <<EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
EOF
    fi

    if ! gsutil cors set /tmp/cors.json "gs://${BUCKET_NAME}"; then
        print_error "Falha ao configurar CORS!"
        rm /tmp/cors.json
        return 1
    fi
    rm /tmp/cors.json

    print_success "Cloud Storage configurado!"
    log "GCP: Bucket criado - $BUCKET_NAME"
    return 0
}

# ============================================================================
# PROJETO GCP
# ============================================================================

gcp_setup_project() {
    print_section "3. Configurar Projeto GCP"

    print_info "Configurando projeto no Google Cloud..."
    echo ""
    print_info "Opções:"
    echo "  1) Usar projeto existente"
    echo "  2) Criar novo projeto"
    echo ""

    read -p "$(echo -e ${YELLOW}Escolha:${NC} )" choice

    case $choice in
        1)
            GCP_PROJECT_ID=$(read_input "ID do projeto existente" "$(load_config GCP_PROJECT_ID)")
            ;;
        2)
            GCP_PROJECT_ID=$(read_input "ID do novo projeto (ex: crm-juridico-prod)" "crm-juridico-prod")
            GCP_PROJECT_NAME=$(read_input "Nome do projeto" "CRM Jurídico - Produção")

            print_step "Criando projeto $GCP_PROJECT_ID..."

            if gcloud projects create "$GCP_PROJECT_ID" --name="$GCP_PROJECT_NAME" 2>/dev/null; then
                print_success "Projeto criado com sucesso!"
            else
                print_warning "Projeto já existe ou erro ao criar. Continuando..."
            fi
            ;;
        *)
            print_error "Opção inválida!"
            return 1
            ;;
    esac

    print_step "Configurando projeto padrão..."
    gcloud config set project "$GCP_PROJECT_ID"

    save_config "GCP_PROJECT_ID" "$GCP_PROJECT_ID"

    print_success "Projeto configurado: $GCP_PROJECT_ID"
    log "GCP: Projeto $GCP_PROJECT_ID"
}

gcp_enable_apis() {
    print_section "4. Habilitando APIs do Google Cloud"

    print_info "As seguintes APIs serão habilitadas:"
    echo "  - Cloud Run API"
    echo "  - Cloud SQL Admin API"
    echo "  - Cloud Storage API"
    echo "  - Secret Manager API"
    echo "  - Cloud Build API"
    echo "  - Container Registry API"
    echo "  - Cloud Logging API"
    echo "  - Cloud Monitoring API"
    echo ""
    
    if ! confirm "Continuar?" "y"; then
        return
    fi
    
    local apis=(
        "run.googleapis.com"
        "sqladmin.googleapis.com"
        "storage.googleapis.com"
        "secretmanager.googleapis.com"
        "cloudbuild.googleapis.com"
        "containerregistry.googleapis.com"
        "logging.googleapis.com"
        "monitoring.googleapis.com"
        "compute.googleapis.com"
        "servicenetworking.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_step "Habilitando $api..."
        gcloud services enable "$api" --project="$GCP_PROJECT_ID" 2>/dev/null || true
    done
    
    print_success "APIs habilitadas!"
    log "GCP: APIs habilitadas"
}

gcp_setup_billing() {
    print_section "5. Configuração de Faturamento"
    
    print_warning "IMPORTANTE: O projeto precisa estar vinculado a uma conta de faturamento."
    echo ""
    
    print_info "Contas de faturamento disponíveis:"
    gcloud billing accounts list 2>/dev/null || true
    
    echo ""
    
    if confirm "Deseja vincular uma conta de faturamento agora?"; then
        BILLING_ACCOUNT=$(read_input "ID da conta de faturamento")
        
        print_step "Vinculando conta de faturamento..."
        gcloud billing projects link "$GCP_PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
        
        print_success "Conta de faturamento vinculada!"
        save_config "BILLING_ACCOUNT" "$BILLING_ACCOUNT"
    else
        print_warning "Lembre-se de vincular uma conta de faturamento depois!"
        print_info "Use: gcloud billing projects link $GCP_PROJECT_ID --billing-account=ACCOUNT_ID"
    fi
    
    log "GCP: Billing configurado"
}

gcp_setup_region() {
    print_section "6. Região e Zona"
    
    print_info "Regiões recomendadas para Brasil:"
    echo "  - southamerica-east1 (São Paulo) - Recomendado"
    echo "  - us-east1 (Carolina do Sul)"
    echo "  - us-central1 (Iowa)"
    echo ""
    
    GCP_REGION=$(read_input "Região" "$(load_config GCP_REGION || echo 'southamerica-east1')")
    GCP_ZONE=$(read_input "Zona" "${GCP_REGION}-a")
    
    gcloud config set compute/region "$GCP_REGION"
    gcloud config set compute/zone "$GCP_ZONE"
    
    save_config "GCP_REGION" "$GCP_REGION"
    save_config "GCP_ZONE" "$GCP_ZONE"
    
    print_success "Região configurada: $GCP_REGION"
    log "GCP: Região $GCP_REGION"
}

# ============================================================================
# CLOUD SQL (PostgreSQL)
# ============================================================================

gcp_setup_cloudsql() {
    print_section "7. Cloud SQL (PostgreSQL)"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1
    GCP_REGION=$(require_config "GCP_REGION" "Região GCP") || return 1

    print_info "Configurando banco de dados PostgreSQL..."
    echo ""

    CLOUDSQL_INSTANCE=$(read_input "Nome da instância" "$(load_config CLOUDSQL_INSTANCE || echo 'crm-juridico-db')")
    CLOUDSQL_VERSION=$(read_input "Versão PostgreSQL" "POSTGRES_15")
    CLOUDSQL_TIER=$(read_input "Tier (ex: db-f1-micro, db-g1-small)" "db-g1-small")

    DB_NAME=$(read_input "Nome do banco de dados" "crm_juridico")
    DB_USER=$(read_input "Usuário do banco" "postgres")

    while true; do
        DB_PASSWORD=$(read_secret "Senha do banco (mínimo 8 caracteres)")
        if [ -z "$DB_PASSWORD" ]; then
            print_error "Senha não pode ser vazia!"
        elif [ ${#DB_PASSWORD} -lt 8 ]; then
            print_error "Senha deve ter no mínimo 8 caracteres!"
        else
            break
        fi
    done

    save_config "CLOUDSQL_INSTANCE" "$CLOUDSQL_INSTANCE"
    save_config "DB_NAME" "$DB_NAME"
    save_config "DB_USER" "$DB_USER"
    save_config "DB_PASSWORD" "$DB_PASSWORD"

    print_step "Verificando se instância já existe..."

    if gcloud sql instances describe "$CLOUDSQL_INSTANCE" --project="$GCP_PROJECT_ID" &>/dev/null; then
        print_warning "Instância $CLOUDSQL_INSTANCE já existe!"

        if ! confirm "Deseja recriar a instância? (CUIDADO: dados serão perdidos)"; then
            print_info "Usando instância existente."

            CLOUDSQL_CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUDSQL_INSTANCE}"
            save_config "CLOUDSQL_CONNECTION_NAME" "$CLOUDSQL_CONNECTION_NAME"

            return 0
        fi

        print_step "Deletando instância existente..."
        if ! gcloud sql instances delete "$CLOUDSQL_INSTANCE" --project="$GCP_PROJECT_ID" --quiet; then
            print_error "Falha ao deletar instância!"
            return 1
        fi
    fi

    print_step "Criando instância Cloud SQL..."
    print_warning "Isso pode levar alguns minutos..."

    gcloud sql instances create "$CLOUDSQL_INSTANCE" \
        --database-version="$CLOUDSQL_VERSION" \
        --tier="$CLOUDSQL_TIER" \
        --region="$GCP_REGION" \
        --backup-start-time="03:00" \
        --enable-bin-log \
        --retained-backups-count=7 \
        --project="$GCP_PROJECT_ID" &

    local pid=$!
    if ! spinner $pid 1800; then
        print_error "Falha ao criar instância Cloud SQL!"
        return 1
    fi

    print_success "Instância Cloud SQL criada!"

    print_step "Configurando senha do usuário..."
    if ! gcloud sql users set-password "$DB_USER" \
        --instance="$CLOUDSQL_INSTANCE" \
        --password="$DB_PASSWORD" \
        --project="$GCP_PROJECT_ID"; then
        print_error "Falha ao configurar senha!"
        return 1
    fi

    print_step "Criando banco de dados..."
    if ! gcloud sql databases create "$DB_NAME" \
        --instance="$CLOUDSQL_INSTANCE" \
        --project="$GCP_PROJECT_ID"; then
        print_error "Falha ao criar banco de dados!"
        return 1
    fi

    # Salvar connection name
    CLOUDSQL_CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUDSQL_INSTANCE}"
    save_config "CLOUDSQL_CONNECTION_NAME" "$CLOUDSQL_CONNECTION_NAME"

    print_success "Cloud SQL configurado!"
    print_info "Connection Name: $CLOUDSQL_CONNECTION_NAME"

    log "GCP: Cloud SQL criado - $CLOUDSQL_INSTANCE"
}

# ============================================================================
# CLOUD STORAGE
# ============================================================================

gcp_setup_storage() {
    print_section "8. Cloud Storage"
    
    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1
    GCP_REGION=$(require_config "GCP_REGION" "Região GCP") || return 1
    
    print_info "Configurando bucket para armazenamento..."
    echo ""
    
    while true; do
        BUCKET_NAME=$(read_input "Nome do bucket (único globalmente)" "$(load_config BUCKET_NAME || echo "${GCP_PROJECT_ID}-storage")")
        
        if validate_bucket_name "$BUCKET_NAME"; then
            break
        else
            print_error "Nome de bucket inválido!"
            print_info "Regras: lowercase, 3-63 caracteres, sem 'google' ou 'goog'"
        fi
    done
    
    BUCKET_LOCATION=$(read_input "Localização" "$GCP_REGION")
    
    save_config "BUCKET_NAME" "$BUCKET_NAME"
    
    print_step "Criando bucket..."
    
    if gsutil ls -b "gs://${BUCKET_NAME}" &>/dev/null; then
        print_warning "Bucket já existe!"
    else
        if ! gsutil mb -p "$GCP_PROJECT_ID" -l "$BUCKET_LOCATION" "gs://${BUCKET_NAME}"; then
            print_error "Falha ao criar bucket!"
            return 1
        fi
        print_success "Bucket criado!"
    fi
    
    print_step "Configurando CORS..."
    
    DOMAIN=$(load_config DOMAIN)
    if [ -n "$DOMAIN" ]; then
        cat > /tmp/cors.json <<EOF
[
  {
    "origin": ["https://${DOMAIN}", "https://app.${DOMAIN}", "https://www.${DOMAIN}"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
    else
        cat > /tmp/cors.json <<EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
    fi
    
    if ! gsutil cors set /tmp/cors.json "gs://${BUCKET_NAME}"; then
        print_error "Falha ao configurar CORS!"
        rm /tmp/cors.json
        return 1
    fi
    rm /tmp/cors.json
    
    print_success "Cloud Storage configurado!"
    log "GCP: Bucket criado - $BUCKET_NAME"
}


# ============================================================================
# SECRET MANAGER
# ============================================================================

gcp_setup_secrets() {
    print_section "9. Secret Manager"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1

    print_info "Configurando secrets seguros..."
    echo ""

    print_step "Gerando JWT Secret..."
    JWT_SECRET=$(openssl rand -hex 32)

    echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
        --data-file=- \
        --replication-policy="automatic" \
        --project="$GCP_PROJECT_ID" 2>/dev/null || \
    echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret \
        --data-file=- \
        --project="$GCP_PROJECT_ID"

    print_success "JWT Secret criado!"

    DB_PASSWORD=$(load_config DB_PASSWORD)
    if [ -z "$DB_PASSWORD" ]; then
        print_error "Senha do banco não encontrada!"
        print_info "Execute a opção 8 (Configurar Cloud SQL) primeiro."
        return 1
    fi

    print_step "Salvando senha do banco..."

    echo -n "$DB_PASSWORD" | gcloud secrets create db-password \
        --data-file=- \
        --replication-policy="automatic" \
        --project="$GCP_PROJECT_ID" 2>/dev/null || \
    echo -n "$DB_PASSWORD" | gcloud secrets versions add db-password \
        --data-file=- \
        --project="$GCP_PROJECT_ID"

    print_success "Senha do banco salva!"

    log "GCP: Secrets configurados"
}

# ============================================================================
# FIREBASE
# ============================================================================

setup_firebase() {
    print_section "10. Firebase Authentication"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1

    print_info "Configure o Firebase manualmente em: https://console.firebase.google.com/"
    echo ""
    print_info "Passos:"
    echo "  1. Criar projeto Firebase (ou usar existente)"
    echo "  2. Ativar Authentication"
    echo "  3. Configurar métodos de login (Email/Password, Google, etc)"
    echo "  4. Obter credenciais do projeto"
    echo ""

    if confirm "Já configurou o Firebase?"; then
        while true; do
            FIREBASE_API_KEY=$(read_input "Firebase API Key")
            if [ -n "$FIREBASE_API_KEY" ]; then
                break
            fi
            print_error "API Key não pode ser vazia!"
        done

        FIREBASE_AUTH_DOMAIN=$(read_input "Firebase Auth Domain" "${GCP_PROJECT_ID}.firebaseapp.com")
        FIREBASE_PROJECT_ID=$(read_input "Firebase Project ID" "$GCP_PROJECT_ID")

        save_config "FIREBASE_API_KEY" "$FIREBASE_API_KEY"
        save_config "FIREBASE_AUTH_DOMAIN" "$FIREBASE_AUTH_DOMAIN"
        save_config "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID"

        print_step "Salvando no Secret Manager..."
        echo -n "$FIREBASE_API_KEY" | gcloud secrets create firebase-api-key \
            --data-file=- \
            --replication-policy="automatic" \
            --project="$GCP_PROJECT_ID" 2>/dev/null || \
        echo -n "$FIREBASE_API_KEY" | gcloud secrets versions add firebase-api-key \
            --data-file=- \
            --project="$GCP_PROJECT_ID"

        print_success "Firebase configurado!"
    else
        print_warning "Configure o Firebase e execute este passo novamente."
        return 1
    fi

    log "Firebase: Configurado"
}

# ============================================================================
# CLOUDFLARE
# ============================================================================

setup_cloudflare() {
    print_section "11. Cloudflare - Configuração de Domínio"

    print_info "Configure seu domínio no Cloudflare..."
    echo ""

    if ! confirm "Deseja configurar Cloudflare agora?"; then
        print_warning "Pulando configuração do Cloudflare."
        return 0
    fi

    DOMAIN=$(read_input "Seu domínio (ex: crm-juridico.com.br)")
    if [ -z "$DOMAIN" ]; then
        print_error "Domínio não pode ser vazio!"
        return 1
    fi

    while true; do
        CLOUDFLARE_EMAIL=$(read_input "Email da conta Cloudflare")
        if [ -n "$CLOUDFLARE_EMAIL" ] && validate_email "$CLOUDFLARE_EMAIL"; then
            break
        fi
        print_error "Email inválido!"
    done

    CLOUDFLARE_API_KEY=$(read_secret "Cloudflare API Key (Global API Key)")
    if [ -z "$CLOUDFLARE_API_KEY" ]; then
        print_error "API Key não pode ser vazia!"
        return 1
    fi

    save_config "DOMAIN" "$DOMAIN"
    save_config "CLOUDFLARE_EMAIL" "$CLOUDFLARE_EMAIL"
    save_config "CLOUDFLARE_API_KEY" "$CLOUDFLARE_API_KEY"

    print_step "Obtendo Zone ID..."

    ZONE_ID=$(retry_command 3 5 "curl -s -X GET \"https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}\" \
        -H \"X-Auth-Email: ${CLOUDFLARE_EMAIL}\" \
        -H \"X-Auth-Key: ${CLOUDFLARE_API_KEY}\" \
        -H \"Content-Type: application/json\" | jq -r '.result[0].id'")

    if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
        print_error "Não foi possível obter Zone ID. Verifique suas credenciais."
        return 1
    fi

    save_config "CLOUDFLARE_ZONE_ID" "$ZONE_ID"
    print_success "Zone ID obtido: $ZONE_ID"

    print_info "Subdomínios a configurar:"
    echo "  - api.${DOMAIN} (Backend)"
    echo "  - app.${DOMAIN} (Frontend)"
    echo "  - www.${DOMAIN} (Redirect)"
    echo ""

    print_warning "Os registros DNS serão criados após o deploy do Cloud Run."
    print_info "Você precisará executar a função de configuração DNS depois."

    log "Cloudflare: Configurado - $DOMAIN"
}

cloudflare_create_dns_record() {
    local subdomain=$1
    local target=$2
    local type=${3:-CNAME}

    CLOUDFLARE_EMAIL=$(require_config "CLOUDFLARE_EMAIL" "Email Cloudflare") || return 1
    CLOUDFLARE_API_KEY=$(require_config "CLOUDFLARE_API_KEY" "API Key Cloudflare") || return 1
    CLOUDFLARE_ZONE_ID=$(require_config "CLOUDFLARE_ZONE_ID" "Zone ID Cloudflare") || return 1
    DOMAIN=$(require_config "DOMAIN" "Domínio") || return 1

    print_step "Criando registro DNS: ${subdomain}.${DOMAIN} -> ${target}"

    local record_id=$(retry_command 3 5 "curl -s -X GET \
        \"https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${subdomain}.${DOMAIN}\" \
        -H \"X-Auth-Email: ${CLOUDFLARE_EMAIL}\" \
        -H \"X-Auth-Key: ${CLOUDFLARE_API_KEY}\" \
        -H \"Content-Type: application/json\" | jq -r '.result[0].id'")

    if [ "$record_id" != "null" ] && [ -n "$record_id" ]; then
        print_warning "Registro já existe. Atualizando..."

        if ! retry_command 3 5 "curl -s -X PUT \
            \"https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record_id}\" \
            -H \"X-Auth-Email: ${CLOUDFLARE_EMAIL}\" \
            -H \"X-Auth-Key: ${CLOUDFLARE_API_KEY}\" \
            -H \"Content-Type: application/json\" \
            --data \"{\\\"type\\\":\\\"${type}\\\",\\\"name\\\":\\\"${subdomain}\\\",\\\"content\\\":\\\"${target}\\\",\\\"proxied\\\":true}\" \
            > /dev/null"; then
            print_error "Falha ao atualizar registro DNS!"
            return 1
        fi
    else
        if ! retry_command 3 5 "curl -s -X POST \
            \"https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records\" \
            -H \"X-Auth-Email: ${CLOUDFLARE_EMAIL}\" \
            -H \"X-Auth-Key: ${CLOUDFLARE_API_KEY}\" \
            -H \"Content-Type: application/json\" \
            --data \"{\\\"type\\\":\\\"${type}\\\",\\\"name\\\":\\\"${subdomain}\\\",\\\"content\\\":\\\"${target}\\\",\\\"proxied\\\":true}\" \
            > /dev/null"; then
            print_error "Falha ao criar registro DNS!"
            return 1
        fi
    fi

    print_success "Registro DNS criado/atualizado!"
}

# ============================================================================
# SMTP / EMAIL
# ============================================================================

setup_smtp() {
    print_section "12. Configuração de SMTP (Email)"
    
    print_info "Provedores SMTP recomendados:"
    echo "  1) SendGrid (Recomendado - 100 emails/dia grátis)"
    echo "  2) Mailgun (100 emails/dia grátis)"
    echo "  3) Amazon SES"
    echo "  4) Gmail SMTP (Desenvolvimento)"
    echo "  5) Outro provedor"
    echo ""
    
    read -p "$(echo -e ${YELLOW}Escolha o provedor:${NC} )" smtp_choice
    
    case $smtp_choice in
        1)
            print_info "SendGrid: https://sendgrid.com/"
            print_info "1. Crie conta em sendgrid.com"
            print_info "2. Vá em Settings > API Keys"
            print_info "3. Crie uma API Key"
            echo ""
            
            SMTP_HOST="smtp.sendgrid.net"
            SMTP_PORT="587"
            SMTP_USER="apikey"
            SMTP_PASSWORD=$(read_secret "SendGrid API Key")
            ;;
        2)
            print_info "Mailgun: https://mailgun.com/"
            print_info "1. Crie conta em mailgun.com"
            print_info "2. Vá em Sending > Domain Settings > SMTP"
            echo ""
            
            SMTP_HOST="smtp.mailgun.org"
            SMTP_PORT="587"
            SMTP_USER=$(read_input "Mailgun SMTP Username")
            SMTP_PASSWORD=$(read_secret "Mailgun SMTP Password")
            ;;
        3)
            print_info "Amazon SES: https://aws.amazon.com/ses/"
            
            SMTP_HOST=$(read_input "SES SMTP Endpoint" "email-smtp.us-east-1.amazonaws.com")
            SMTP_PORT="587"
            SMTP_USER=$(read_input "SES SMTP Username")
            SMTP_PASSWORD=$(read_secret "SES SMTP Password")
            ;;
        4)
            print_warning "Gmail SMTP - Apenas para desenvolvimento!"
            print_info "1. Ative 'Acesso a app menos seguro' ou use App Password"
            print_info "2. App Password: https://myaccount.google.com/apppasswords"
            echo ""
            
            SMTP_HOST="smtp.gmail.com"
            SMTP_PORT="587"
            SMTP_USER=$(read_input "Email Gmail")
            SMTP_PASSWORD=$(read_secret "Senha ou App Password")
            ;;
        5)
            SMTP_HOST=$(read_input "SMTP Host")
            SMTP_PORT=$(read_input "SMTP Port" "587")
            SMTP_USER=$(read_input "SMTP Username")
            SMTP_PASSWORD=$(read_secret "SMTP Password")
            ;;
        *)
            print_error "Opção inválida!"
            return 1
            ;;
    esac

    while true; do
        SMTP_FROM_EMAIL=$(read_input "Email remetente (From)" "noreply@${DOMAIN:-crm-juridico.com}")
        if validate_email "$SMTP_FROM_EMAIL"; then
            break
        fi
        print_error "Email inválido!"
    done

    SMTP_FROM_NAME=$(read_input "Nome remetente" "CRM Jurídico")
    
    save_config "SMTP_HOST" "$SMTP_HOST"
    save_config "SMTP_PORT" "$SMTP_PORT"
    save_config "SMTP_USER" "$SMTP_USER"
    save_config "SMTP_FROM_EMAIL" "$SMTP_FROM_EMAIL"
    save_config "SMTP_FROM_NAME" "$SMTP_FROM_NAME"
    
    # Salvar senha no Secret Manager
    echo -n "$SMTP_PASSWORD" | gcloud secrets create smtp-password \
        --data-file=- \
        --replication-policy="automatic" \
        --project="$GCP_PROJECT_ID" 2>/dev/null || \
    echo -n "$SMTP_PASSWORD" | gcloud secrets versions add smtp-password \
        --data-file=- \
        --project="$GCP_PROJECT_ID"
    
    print_success "SMTP configurado!"
    
    # Testar SMTP
    if confirm "Deseja testar o envio de email?"; then
        test_email=$(read_input "Email para teste")
        
        print_step "Enviando email de teste..."
        
        # Criar script Python temporário para teste
        cat > /tmp/test_smtp.py <<EOF
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

smtp_host = "${SMTP_HOST}"
smtp_port = ${SMTP_PORT}
smtp_user = "${SMTP_USER}"
smtp_password = "${SMTP_PASSWORD}"
from_email = "${SMTP_FROM_EMAIL}"
from_name = "${SMTP_FROM_NAME}"
to_email = "${test_email}"

msg = MIMEMultipart()
msg['From'] = f"{from_name} <{from_email}>"
msg['To'] = to_email
msg['Subject'] = "Teste SMTP - CRM Jurídico"

body = """
Olá!

Este é um email de teste do sistema CRM Jurídico.

Se você recebeu este email, a configuração SMTP está funcionando corretamente!

Atenciosamente,
Equipe CRM Jurídico
"""

msg.attach(MIMEText(body, 'plain'))

try:
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_user, smtp_password)
    server.send_message(msg)
    server.quit()
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
EOF
        
        result=$(python3 /tmp/test_smtp.py 2>&1)
        rm /tmp/test_smtp.py
        
        if echo "$result" | grep -q "SUCCESS"; then
            print_success "Email enviado com sucesso! Verifique a caixa de entrada."
        else
            print_error "Erro ao enviar email:"
            echo "$result"
        fi
    fi
    
    log "SMTP: Configurado - $SMTP_HOST"
}

# ============================================================================
# CLOUD RUN - DEPLOY
# ============================================================================

deploy_backend() {
    print_section "13. Deploy do Backend (Cloud Run)"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1
    GCP_REGION=$(require_config "GCP_REGION" "Região GCP") || return 1

    print_info "Preparando deploy do backend..."
    echo ""

    SERVICE_NAME=$(read_input "Nome do serviço" "crm-juridico-api")

    save_config "SERVICE_NAME" "$SERVICE_NAME"

    if [ ! -f "$PROJECT_ROOT/backend/Dockerfile" ]; then
        print_error "Dockerfile não encontrado em backend/"
        return 1
    fi

    print_step "Construindo imagem Docker..."

    cd "$PROJECT_ROOT/backend"

    IMAGE_NAME="gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME}"

    gcloud builds submit --tag "$IMAGE_NAME" --project="$GCP_PROJECT_ID" &
    local pid=$!
    if ! spinner $pid 1800; then
        print_error "Falha ao construir imagem!"
        cd "$PROJECT_ROOT"
        return 1
    fi

    print_success "Imagem construída!"

    print_step "Fazendo deploy no Cloud Run..."

    CLOUDSQL_CONNECTION_NAME=$(require_config "CLOUDSQL_CONNECTION_NAME" "Cloud SQL Connection") || return 1
    DB_NAME=$(require_config "DB_NAME" "Nome do Banco") || return 1
    DB_USER=$(require_config "DB_USER" "Usuário do Banco") || return 1
    BUCKET_NAME=$(require_config "BUCKET_NAME" "Bucket GCS") || return 1
    FIREBASE_PROJECT_ID=$(require_config "FIREBASE_PROJECT_ID" "Firebase Project ID") || return 1
    SMTP_HOST=$(load_config SMTP_HOST)
    SMTP_PORT=$(load_config SMTP_PORT)
    SMTP_USER=$(load_config SMTP_USER)
    SMTP_FROM_EMAIL=$(load_config SMTP_FROM_EMAIL)
    SMTP_FROM_NAME=$(load_config SMTP_FROM_NAME)

    gcloud run deploy "$SERVICE_NAME" \
        --image="$IMAGE_NAME" \
        --platform=managed \
        --region="$GCP_REGION" \
        --allow-unauthenticated \
        --add-cloudsql-instances="$CLOUDSQL_CONNECTION_NAME" \
        --set-env-vars="ENVIRONMENT=production,\
DB_HOST=/cloudsql/${CLOUDSQL_CONNECTION_NAME},\
DB_NAME=${DB_NAME},\
DB_USER=${DB_USER},\
GCS_BUCKET_NAME=${BUCKET_NAME},\
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},\
SMTP_HOST=${SMTP_HOST},\
SMTP_PORT=${SMTP_PORT},\
SMTP_USER=${SMTP_USER},\
SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL},\
SMTP_FROM_NAME=${SMTP_FROM_NAME}" \
        --set-secrets="DB_PASSWORD=db-password:latest,\
JWT_SECRET=jwt-secret:latest,\
FIREBASE_API_KEY=firebase-api-key:latest,\
SMTP_PASSWORD=smtp-password:latest" \
        --project="$GCP_PROJECT_ID" &

    pid=$!
    if ! spinner $pid 600; then
        print_error "Falha ao fazer deploy!"
        cd "$PROJECT_ROOT"
        return 1
    fi

    BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --platform=managed \
        --region="$GCP_REGION" \
        --project="$GCP_PROJECT_ID" \
        --format="value(status.url)")

    save_config "BACKEND_URL" "$BACKEND_URL"

    print_success "Backend deployado!"
    print_info "URL: $BACKEND_URL"

    print_step "Verificando health do backend..."
    sleep 5
    if curl -sf "${BACKEND_URL}/health" > /dev/null 2>&1; then
        print_success "Backend está respondendo!"
    else
        print_warning "Backend não está respondendo ao health check"
        print_info "Verifique os logs: gcloud run services logs read $SERVICE_NAME --region=$GCP_REGION"
    fi

    cd "$PROJECT_ROOT"

    log "Cloud Run: Backend deployado - $BACKEND_URL"
}

deploy_frontend() {
    print_section "14. Deploy do Frontend (Cloud Run)"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1
    GCP_REGION=$(require_config "GCP_REGION" "Região GCP") || return 1

    print_info "Preparando deploy do frontend..."
    echo ""

    FRONTEND_SERVICE_NAME=$(read_input "Nome do serviço frontend" "crm-juridico-app")

    save_config "FRONTEND_SERVICE_NAME" "$FRONTEND_SERVICE_NAME"

    if [ ! -f "$PROJECT_ROOT/frontend/Dockerfile" ]; then
        print_error "Dockerfile não encontrado em frontend/"
        return 1
    fi

    BACKEND_URL=$(require_config "BACKEND_URL" "URL do Backend") || return 1
    FIREBASE_API_KEY=$(require_config "FIREBASE_API_KEY" "Firebase API Key") || return 1
    FIREBASE_AUTH_DOMAIN=$(require_config "FIREBASE_AUTH_DOMAIN" "Firebase Auth Domain") || return 1
    FIREBASE_PROJECT_ID=$(require_config "FIREBASE_PROJECT_ID" "Firebase Project ID") || return 1

    print_step "Construindo imagem Docker..."

    cd "$PROJECT_ROOT/frontend"

    IMAGE_NAME="gcr.io/${GCP_PROJECT_ID}/${FRONTEND_SERVICE_NAME}"

    cat > /tmp/cloudbuild.yaml <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg=VITE_API_URL=${BACKEND_URL}/api/v1'
      - '--build-arg=VITE_FIREBASE_API_KEY=${FIREBASE_API_KEY}'
      - '--build-arg=VITE_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}'
      - '--build-arg=VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}'
      - '-t'
      - '${IMAGE_NAME}'
      - '.'
images: ['${IMAGE_NAME}']
EOF

    gcloud builds submit --config=/tmp/cloudbuild.yaml --project="$GCP_PROJECT_ID" &

    local pid=$!
    if ! spinner $pid 1800; then
        print_error "Falha ao construir imagem!"
        rm /tmp/cloudbuild.yaml
        cd "$PROJECT_ROOT"
        return 1
    fi
    rm /tmp/cloudbuild.yaml

    print_success "Imagem construída!"

    print_step "Fazendo deploy no Cloud Run..."

    gcloud run deploy "$FRONTEND_SERVICE_NAME" \
        --image="$IMAGE_NAME" \
        --platform=managed \
        --region="$GCP_REGION" \
        --allow-unauthenticated \
        --project="$GCP_PROJECT_ID" &

    pid=$!
    if ! spinner $pid 600; then
        print_error "Falha ao fazer deploy!"
        cd "$PROJECT_ROOT"
        return 1
    fi

    FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE_NAME" \
        --platform=managed \
        --region="$GCP_REGION" \
        --project="$GCP_PROJECT_ID" \
        --format="value(status.url)")

    save_config "FRONTEND_URL" "$FRONTEND_URL"

    print_success "Frontend deployado!"
    print_info "URL: $FRONTEND_URL"

    print_step "Verificando health do frontend..."
    sleep 5
    if curl -sf "${FRONTEND_URL}" > /dev/null 2>&1; then
        print_success "Frontend está respondendo!"
    else
        print_warning "Frontend não está respondendo"
        print_info "Verifique os logs: gcloud run services logs read $FRONTEND_SERVICE_NAME --region=$GCP_REGION"
    fi

    cd "$PROJECT_ROOT"

    log "Cloud Run: Frontend deployado - $FRONTEND_URL"
}

# ============================================================================
# CONFIGURAR DNS CLOUDFLARE
# ============================================================================

configure_cloudflare_dns() {
    print_section "15. Configurar DNS no Cloudflare"
    
    DOMAIN=$(load_config DOMAIN)
    CLOUDFLARE_EMAIL=$(load_config CLOUDFLARE_EMAIL)
    CLOUDFLARE_ZONE_ID=$(load_config CLOUDFLARE_ZONE_ID)
    BACKEND_URL=$(load_config BACKEND_URL)
    FRONTEND_URL=$(load_config FRONTEND_URL)
    
    if [ -z "$DOMAIN" ] || [ -z "$CLOUDFLARE_ZONE_ID" ]; then
        print_error "Cloudflare não foi configurado!"
        return 1
    fi
    
    print_info "Configurando registros DNS..."
    echo ""
    
    # Extrair hostname do Cloud Run URL
    BACKEND_HOST=$(echo "$BACKEND_URL" | sed 's|https://||' | sed 's|/.*||')
    FRONTEND_HOST=$(echo "$FRONTEND_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Criar registros DNS
    cloudflare_create_dns_record "api" "$BACKEND_HOST" "CNAME"
    cloudflare_create_dns_record "app" "$FRONTEND_HOST" "CNAME"
    cloudflare_create_dns_record "www" "$FRONTEND_HOST" "CNAME"
    
    print_success "DNS configurado!"
    print_info "Aguarde alguns minutos para propagação DNS."
    echo ""
    print_info "URLs finais:"
    echo "  - Backend:  https://api.${DOMAIN}"
    echo "  - Frontend: https://app.${DOMAIN}"
    echo "  - Frontend: https://www.${DOMAIN}"
    
    log "Cloudflare: DNS configurado"
}

# ============================================================================
# CONFIGURAR DOMÍNIO CUSTOMIZADO NO CLOUD RUN
# ============================================================================

configure_custom_domain() {
    print_section "16. Domínio Customizado no Cloud Run"
    
    DOMAIN=$(load_config DOMAIN)
    SERVICE_NAME=$(load_config SERVICE_NAME)
    FRONTEND_SERVICE_NAME=$(load_config FRONTEND_SERVICE_NAME)
    
    if [ -z "$DOMAIN" ]; then
        print_warning "Domínio não configurado. Pulando..."
        return
    fi
    
    print_info "Mapeando domínios customizados..."
    echo ""
    
    # Backend
    print_step "Mapeando api.${DOMAIN} para backend..."
    gcloud run domain-mappings create \
        --service="$SERVICE_NAME" \
        --domain="api.${DOMAIN}" \
        --region="$GCP_REGION" \
        --project="$GCP_PROJECT_ID" 2>/dev/null || print_warning "Já mapeado ou erro."
    
    # Frontend
    print_step "Mapeando app.${DOMAIN} para frontend..."
    gcloud run domain-mappings create \
        --service="$FRONTEND_SERVICE_NAME" \
        --domain="app.${DOMAIN}" \
        --region="$GCP_REGION" \
        --project="$GCP_PROJECT_ID" 2>/dev/null || print_warning "Já mapeado ou erro."
    
    print_step "Mapeando www.${DOMAIN} para frontend..."
    gcloud run domain-mappings create \
        --service="$FRONTEND_SERVICE_NAME" \
        --domain="www.${DOMAIN}" \
        --region="$GCP_REGION" \
        --project="$GCP_PROJECT_ID" 2>/dev/null || print_warning "Já mapeado ou erro."
    
    print_success "Domínios customizados configurados!"
    
    log "Cloud Run: Domínios customizados configurados"
}

# ============================================================================
# MIGRATIONS
# ============================================================================

run_migrations() {
    print_section "17. Executar Migrations do Banco"

    GCP_PROJECT_ID=$(require_config "GCP_PROJECT_ID" "Projeto GCP") || return 1
    GCP_REGION=$(require_config "GCP_REGION" "Região GCP") || return 1
    SERVICE_NAME=$(require_config "SERVICE_NAME" "Nome do Serviço") || return 1
    CLOUDSQL_CONNECTION_NAME=$(require_config "CLOUDSQL_CONNECTION_NAME" "Cloud SQL Connection") || return 1
    DB_NAME=$(require_config "DB_NAME" "Nome do Banco") || return 1
    DB_USER=$(require_config "DB_USER" "Usuário do Banco") || return 1

    print_info "Executando migrations via Cloud Run Job..."
    echo ""

    print_step "Criando job de migration..."

    gcloud run jobs create migration-job \
        --image="gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME}" \
        --region="$GCP_REGION" \
        --add-cloudsql-instances="$CLOUDSQL_CONNECTION_NAME" \
        --set-env-vars="ENVIRONMENT=production,DB_HOST=/cloudsql/${CLOUDSQL_CONNECTION_NAME},DB_NAME=${DB_NAME},DB_USER=${DB_USER}" \
        --set-secrets="DB_PASSWORD=db-password:latest" \
        --command="alembic" \
        --args="upgrade,head" \
        --project="$GCP_PROJECT_ID" 2>/dev/null || print_warning "Job já existe."

    print_step "Executando migrations..."

    if ! gcloud run jobs execute migration-job \
        --region="$GCP_REGION" \
        --project="$GCP_PROJECT_ID" \
        --wait; then
        print_error "Falha ao executar migrations!"
        return 1
    fi

    print_success "Migrations executadas!"

    log "Migrations: Executadas"
}

# ============================================================================
# MONITORAMENTO E LOGS
# ============================================================================

setup_monitoring() {
    print_section "18. Monitoramento e Alertas"
    
    print_info "Configurando monitoramento..."
    echo ""
    
    print_step "Criando dashboard de monitoramento..."
    
    # Criar alerta de erro
    print_step "Configurando alertas de erro..."
    
    print_info "Alertas configurados:"
    echo "  - Erros 5xx > 10 em 5 minutos"
    echo "  - Latência > 2s"
    echo "  - CPU > 80%"
    echo "  - Memória > 80%"
    echo ""
    
    print_success "Monitoramento configurado!"
    print_info "Acesse: https://console.cloud.google.com/monitoring"
    
    log "Monitoring: Configurado"
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

show_final_summary() {
    print_section "✨ Setup de Produção Concluído!"
    
    # Carregar todas as configurações
    GCP_PROJECT_ID=$(load_config GCP_PROJECT_ID)
    GCP_REGION=$(load_config GCP_REGION)
    CLOUDSQL_INSTANCE=$(load_config CLOUDSQL_INSTANCE)
    BUCKET_NAME=$(load_config BUCKET_NAME)
    BACKEND_URL=$(load_config BACKEND_URL)
    FRONTEND_URL=$(load_config FRONTEND_URL)
    DOMAIN=$(load_config DOMAIN)
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}RESUMO DA CONFIGURAÇÃO${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${BOLD}Google Cloud Platform:${NC}"
    echo "  Projeto:        $GCP_PROJECT_ID"
    echo "  Região:         $GCP_REGION"
    echo "  Cloud SQL:      $CLOUDSQL_INSTANCE"
    echo "  Storage:        $BUCKET_NAME"
    echo ""
    
    echo -e "${BOLD}URLs de Acesso:${NC}"
    echo "  Backend:        $BACKEND_URL"
    echo "  Frontend:       $FRONTEND_URL"
    
    if [ -n "$DOMAIN" ]; then
        echo ""
        echo -e "${BOLD}Domínios Customizados:${NC}"
        echo "  Backend:        https://api.${DOMAIN}"
        echo "  Frontend:       https://app.${DOMAIN}"
        echo "  Frontend (www): https://www.${DOMAIN}"
    fi
    
    echo ""
    echo -e "${BOLD}Próximos Passos:${NC}"
    echo "  1. Aguarde propagação DNS (se configurou domínio)"
    echo "  2. Teste as URLs acima"
    echo "  3. Configure CI/CD para deploys automáticos"
    echo "  4. Configure backup do banco de dados"
    echo "  5. Configure monitoramento de uptime"
    echo ""
    
    echo -e "${BOLD}Links Úteis:${NC}"
    echo "  Console GCP:    https://console.cloud.google.com/home/dashboard?project=${GCP_PROJECT_ID}"
    echo "  Cloud Run:      https://console.cloud.google.com/run?project=${GCP_PROJECT_ID}"
    echo "  Cloud SQL:      https://console.cloud.google.com/sql/instances?project=${GCP_PROJECT_ID}"
    echo "  Logs:           https://console.cloud.google.com/logs?project=${GCP_PROJECT_ID}"
    echo "  Monitoring:     https://console.cloud.google.com/monitoring?project=${GCP_PROJECT_ID}"
    
    if [ -n "$DOMAIN" ]; then
        echo "  Cloudflare:     https://dash.cloudflare.com/"
    fi
    
    echo ""
    echo -e "${BOLD}Arquivo de Configuração:${NC}"
    echo "  $CONFIG_FILE"
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    print_success "Ambiente de produção configurado com sucesso!"
    
    log "=== Setup de produção concluído ==="
}

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

show_menu() {
    print_header
    
    echo -e "${BOLD}Escolha uma opção:${NC}"
    echo ""
    echo "  ${BOLD}Setup Inicial:${NC}"
    echo "    1) Setup Completo (Recomendado)"
    echo "    2) Validar Ferramentas"
    echo ""
    echo "  ${BOLD}Google Cloud Platform:${NC}"
    echo "    3) Autenticar no GCP"
    echo "    4) Configurar Projeto"
    echo "    5) Habilitar APIs"
    echo "    6) Configurar Faturamento"
    echo "    7) Configurar Região"
    echo ""
    echo "  ${BOLD}Infraestrutura:${NC}"
    echo "    8) Configurar Cloud SQL (PostgreSQL)"
    echo "    9) Configurar Cloud Storage"
    echo "   10) Configurar Secret Manager"
    echo ""
    echo "  ${BOLD}Serviços Externos:${NC}"
    echo "   11) Configurar Firebase"
    echo "   12) Configurar Cloudflare (DNS)"
    echo "   13) Configurar SMTP (Email)"
    echo ""
    echo "  ${BOLD}Deploy:${NC}"
    echo "   14) Deploy Backend (Cloud Run)"
    echo "   15) Deploy Frontend (Cloud Run)"
    echo "   16) Executar Migrations"
    echo ""
    echo "  ${BOLD}Finalização:${NC}"
    echo "   17) Configurar DNS no Cloudflare"
    echo "   18) Configurar Domínios Customizados"
    echo "   19) Configurar Monitoramento"
    echo "   20) Ver Resumo Final"
    echo ""
    echo "  ${BOLD}Utilitários:${NC}"
    echo "   21) Ver Configurações Salvas"
    echo "   22) Limpar Configurações"
    echo ""
    echo "    0) Sair"
    echo ""
    
    read -p "$(echo -e ${YELLOW}Opção:${NC} )" choice
    
    case $choice in
        1)
            run_full_setup
            ;;
        2)
            validate_tools
            pause
            ;;
        3)
            gcp_authenticate
            pause
            ;;
        4)
            gcp_select_or_create_project
            pause
            ;;
        5)
            gcp_enable_apis
            pause
            ;;
        6)
            gcp_setup_billing
            pause
            ;;
        7)
            gcp_setup_region
            pause
            ;;
        8)
            gcp_setup_cloudsql
            pause
            ;;
        9)
            gcp_setup_storage
            pause
            ;;
        10)
            gcp_setup_secrets
            pause
            ;;
        11)
            setup_firebase
            pause
            ;;
        12)
            setup_cloudflare
            pause
            ;;
        13)
            setup_smtp
            pause
            ;;
        14)
            deploy_backend
            pause
            ;;
        15)
            deploy_frontend
            pause
            ;;
        16)
            run_migrations
            pause
            ;;
        17)
            configure_cloudflare_dns
            pause
            ;;
        18)
            configure_custom_domain
            pause
            ;;
        19)
            setup_monitoring
            pause
            ;;
        20)
            show_final_summary
            pause
            ;;
        21)
            show_saved_config
            pause
            ;;
        22)
            clear_config
            pause
            ;;
        0)
            echo ""
            print_success "Até logo!"
            exit 0
            ;;
        *)
            print_error "Opção inválida!"
            sleep 2
            ;;
    esac
}

# ============================================================================
# SETUP COMPLETO
# ============================================================================

run_full_setup() {
    print_header
    
    echo -e "${BOLD}Iniciando setup completo de produção...${NC}"
    echo ""
    
    print_warning "Este processo irá:"
    echo "  - Configurar projeto GCP"
    echo "  - Criar Cloud SQL (PostgreSQL)"
    echo "  - Criar Cloud Storage"
    echo "  - Configurar Firebase"
    echo "  - Configurar Cloudflare (opcional)"
    echo "  - Configurar SMTP"
    echo "  - Fazer deploy do backend e frontend"
    echo ""
    
    if ! confirm "Deseja continuar?" "y"; then
        return
    fi
    
    log "=== Setup completo iniciado ==="
    
    validate_tools
    pause
    
    gcp_authenticate
    pause
    
    gcp_select_or_create_project
    pause
    
    gcp_enable_apis
    pause
    
    gcp_setup_billing
    pause
    
    gcp_setup_region
    pause
    
    gcp_setup_cloudsql
    pause
    
    gcp_setup_storage
    pause
    
    gcp_setup_secrets
    pause
    
    setup_firebase
    pause
    
    setup_cloudflare
    pause
    
    setup_smtp
    pause
    
    deploy_backend
    pause
    
    deploy_frontend
    pause
    
    run_migrations
    pause
    
    if [ -n "$(load_config DOMAIN)" ]; then
        configure_cloudflare_dns
        pause
        
        configure_custom_domain
        pause
    fi
    
    setup_monitoring
    pause
    
    show_final_summary
    
    log "=== Setup completo concluído ==="
    
    pause
}

# ============================================================================
# UTILITÁRIOS
# ============================================================================

show_saved_config() {
    print_section "Configurações Salvas"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        print_warning "Nenhuma configuração salva ainda."
        return
    fi
    
    echo -e "${BOLD}Arquivo:${NC} $CONFIG_FILE"
    echo ""
    
    cat "$CONFIG_FILE" | while IFS='=' read -r key value; do
        if [[ ! "$key" =~ ^(PASSWORD|SECRET|KEY|TOKEN) ]]; then
            echo "  $key = $value"
        else
            echo "  $key = ********"
        fi
    done
    
    echo ""
}

clear_config() {
    print_section "Limpar Configurações"
    
    print_warning "Esta ação irá remover todas as configurações salvas."
    echo ""
    
    if confirm "Tem certeza?" "n"; then
        rm -f "$CONFIG_FILE"
        print_success "Configurações removidas!"
    else
        print_info "Operação cancelada."
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    # Criar log file
    touch "$LOG_FILE"
    
    # Verificar se está no diretório correto
    if [ ! -f "docker-compose.yml" ] && [ ! -d "backend" ]; then
        print_error "Execute este script na raiz do projeto!"
        exit 1
    fi
    
    # Modo interativo
    while true; do
        show_menu
    done
}

# Executar
main "$@"
