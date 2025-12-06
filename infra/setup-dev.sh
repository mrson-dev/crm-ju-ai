#!/bin/bash

set -euo pipefail

# ============================================================================
# CRM JURÍDICO - Setup Interativo de Ambiente de Desenvolvimento
# ============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/setup.log"
ENV_BACKEND="${PROJECT_ROOT}/backend/.env"
ENV_FRONTEND="${PROJECT_ROOT}/frontend/.env"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.example"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${BLUE}→${NC}"
STAR="${YELLOW}★${NC}"
INFO="${CYAN}ℹ${NC}"
WARN="${YELLOW}⚠${NC}"

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ $exit_code -ne 130 ]; then
        echo ""
        print_error "Script interrompido! Código: $exit_code"
        log "Script interrompido: $exit_code"
    fi
}

trap cleanup EXIT INT TERM

print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║           CRM JURÍDICO - Setup de Desenvolvimento             ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Bem-vindo ao assistente de configuração do ambiente de desenvolvimento!${NC}"
    echo "Este script irá guiá-lo passo a passo para instalar e configurar todas as"
    echo "dependências necessárias para rodar o projeto em sua máquina local."
    echo ""
}

print_section() {
    echo ""
    echo -e "${BOLD}${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${WHITE}$1${NC}"
    echo -e "${BOLD}${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${ARROW} ${BOLD}$1${NC}"
}

print_success() {
    echo -e "${CHECK} ${GREEN}$1${NC}"
}

print_error() {
    echo -e "${CROSS} ${RED}$1${NC}"
}

print_warning() {
    echo -e "${WARN} ${YELLOW}$1${NC}"
}

print_info() {
    echo -e "${INFO} ${CYAN}$1${NC}"
}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

pause() {
    echo ""
    read -r -p "Pressione ENTER para continuar..." _
}

confirm() {
    local prompt="$1"
    local default="${2:-n}"
    
    if [ "$default" = "y" ]; then
        prompt="$prompt [S/n]: "
    else
        prompt="$prompt [s/N]: "
    fi
    
    read -r -p "$(echo -e "${YELLOW}${prompt}${NC}")" response
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

    while ps -p "$pid" > /dev/null 2>&1; do
        if [ "$elapsed" -ge "$timeout" ]; then
            print_error "Timeout após ${timeout}s!"
            kill -9 "$pid" 2>/dev/null || true
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

    wait "$pid"
    return $?
}

is_gcloud_authenticated() {
    if command -v "gcloud" &> /dev/null && gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
        return 0
    else
        return 1
    fi
}

select_option() {
    local prompt="$1"
    shift
    local options=("$@")
    local selected_option=""

    echo ""
    echo -e "${CYAN}${prompt}${NC}"
    
    options+=("Digitar manualmente")
    
    # Workaround for select issues in some environments
    PS3="$(echo -e "${YELLOW}Sua escolha: ${NC}")"
    select opt in "${options[@]}"; do
        if [[ -n "$opt" ]]; then
            selected_option="$opt"
            break
        else
            print_error "Seleção inválida. Tente novamente."
        fi
    done < /dev/tty
    
    if [[ "$selected_option" == "Digitar manualmente" ]]; then
        echo "__manual__"
    else
        echo "$selected_option"
    fi
}

# ============================================================================
# VALIDAÇÃO DE DEPENDÊNCIAS
# ============================================================================

check_command() {
    local cmd=$1
    local name=$2
    local install_hint=$3
    
    if command -v "$cmd" &> /dev/null; then
        local version
        version=$("$cmd" --version 2>&1 | head -n1)
        print_success "$name instalado: $version"
        return 0
    else
        print_error "$name NÃO encontrado"
        print_info "Instale com: $install_hint"
        return 1
    fi
}

validate_dependencies() {
    print_section "1. Validando Dependências do Sistema"
    print_info "O primeiro passo é verificar se você possui as ferramentas básicas necessárias."
    print_info "Explicaremos a utilidade de cada uma delas no projeto."
    echo ""

    local all_ok=true

    print_step "Verificando ferramentas de desenvolvimento..."
    echo ""

    if ! check_command "python3" "Python 3" "sudo apt install python3 python3-pip"; then all_ok=false; fi
    print_info "  ↳ Utilidade: Linguagem principal do backend (a API) do projeto."
    echo ""
    
    if ! check_command "node" "Node.js" "https://nodejs.org/"; then all_ok=false; fi
    if ! check_command "npm" "npm" "vem com o Node.js"; then all_ok=false; fi
    print_info "  ↳ Utilidade: Node.js e npm são usados para construir e rodar o frontend da aplicação (React)."
    echo ""

    if ! check_command "docker" "Docker" "https://docs.docker.com/get-docker/"; then all_ok=false; fi
    if ! check_command "docker-compose" "Docker Compose" "https://docs.docker.com/compose/install/"; then all_ok=false; fi
    print_info "  ↳ Utilidade: Usado para rodar serviços de apoio, como o banco de dados PostgreSQL, de forma isolada e consistente."
    echo ""

    if ! check_command "git" "Git" "sudo apt install git"; then all_ok=false; fi
    print_info "  ↳ Utilidade: Sistema de controle de versão para gerenciar o código-fonte."
    echo ""
    
    if ! check_command "make" "Make" "sudo apt install build-essential"; then all_ok=false; fi
    print_info "  ↳ Utilidade: Fornece comandos de atalho para tarefas comuns (ex: 'make backend-dev')."
    echo ""
    
    print_step "Verificando ferramentas opcionais (para setup interativo)..."
    if command -v "gcloud" &> /dev/null; then
        if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
            print_warning "Google Cloud SDK instalado, mas não autenticado. A configuração de GCP será manual."
            print_info "  ↳ Execute 'gcloud auth login' para usar o menu interativo de configuração."
        else
            local gcloud_account
            gcloud_account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
            print_success "Google Cloud SDK autenticado como: $gcloud_account"
            print_info "  ↳ Utilidade: Facilita a configuração buscando seus projetos, regiões e buckets na nuvem."
        fi
    else
        print_warning "Google Cloud SDK (gcloud) não encontrado. A configuração de GCP será manual."
        print_info "  ↳ Utilidade: Facilita a configuração. Instale-o para usar o menu interativo: https://cloud.google.com/sdk/docs/install"
    fi

    echo ""

    if [ "$all_ok" = false ]; then
        print_error "Algumas dependências essenciais estão faltando!"
        print_info "Instale as dependências faltantes e execute o script novamente."
        return 1
    fi

    print_success "Validação de dependências concluída!"
    log "Validação de dependências: OK"
    return 0
}

# ============================================================================
# CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ============================================================================

setup_env_interactive() {
    print_section "2. Configuração de Variáveis de Ambiente"

    print_info "Nesta etapa, vamos criar o arquivo '.env' que guarda as configurações e segredos"
    print_info "que a aplicação precisa para funcionar, como chaves de API e acesso ao banco de dados."
    echo ""

    print_step "Configurando Backend (.env)..."
    echo ""

    echo -e "${BOLD}Google Cloud Platform (GCP):${NC}"
    print_info "  ↳ O projeto pode usar serviços do Google Cloud, como o GCS para armazenar arquivos."
    print_info "  ↳ Se você tiver o 'gcloud' configurado, o script buscará seus projetos, regiões e buckets."
    echo ""
    
    GCP_PROJECT_ID=""
    if is_gcloud_authenticated; then
        print_info "O 'Project ID' é o identificador único do seu projeto no Google Cloud."
        local projects
        mapfile -t projects < <(gcloud projects list --format="value(projectId)" --sort-by=projectId 2>/dev/null)
        
        if [ ${#projects[@]} -gt 0 ]; then
            local selected_project
            selected_project=$(select_option "Selecione um projeto GCP:" "${projects[@]}")
            
            if [ "$selected_project" != "__manual__" ]; then
                GCP_PROJECT_ID=$selected_project
            fi
        else
            print_warning "Nenhum projeto GCP encontrado na sua conta."
        fi
    else
        print_warning "gcloud não está autenticado. Você precisará inserir os dados do GCP manualmente."
    fi

    if [ -z "$GCP_PROJECT_ID" ]; then
        read -r -p "GCP_PROJECT_ID [crm-juridico-dev]: " GCP_PROJECT_ID
        GCP_PROJECT_ID=${GCP_PROJECT_ID:-crm-juridico-dev}
    else
        print_success "GCP_PROJECT_ID = $GCP_PROJECT_ID"
    fi

    GCP_REGION=""
    if is_gcloud_authenticated; then
        echo""
        print_info "A 'Região' é a localização geográfica onde alguns recursos rodam. Escolha uma perto de você."
        local regions
        mapfile -t regions < <(gcloud compute regions list --format="value(name)" --sort-by=name 2>/dev/null)
        
        if [ ${#regions[@]} -gt 0 ]; then
            local recommended_regions=("us-central1" "us-east1" "europe-west1" "southamerica-east1")
            local augmented_regions=()
            for region in "${regions[@]}"; do
                local is_recommended=false
                for rec_region in "${recommended_regions[@]}"; do
                    if [[ "$region" == "$rec_region" ]]; then
                        augmented_regions+=("$region (recomendado)")
                        is_recommended=true
                        break
                    fi
                done
                if ! $is_recommended; then
                    augmented_regions+=("$region")
                fi
            done

            local selected_region
            selected_region=$(select_option "Selecione uma Região GCP:" "${augmented_regions[@]}")
            
            if [ "$selected_region" != "__manual__" ]; then
                GCP_REGION=$(echo "$selected_region" | sed 's/ (recomendado)//')
            fi
        else
            print_warning "Não foi possível carregar as regiões GCP."
        fi
    fi

    if [ -z "$GCP_REGION" ]; then
        read -r -p "GCP_REGION [us-central1]: " GCP_REGION
        GCP_REGION=${GCP_REGION:-us-central1}
    else
        print_success "GCP_REGION = $GCP_REGION"
    fi

    GCS_BUCKET_NAME=""
    if is_gcloud_authenticated && [ -n "$GCP_PROJECT_ID" ]; then
        echo ""
        print_info "O 'GCS Bucket' é um 'contêiner' para armazenar arquivos na nuvem (como documentos de um processo)."
        local buckets
        mapfile -t buckets < <(gcloud storage buckets list --project="$GCP_PROJECT_ID" --format="value(name)" 2>/dev/null)
        
        for i in "${!buckets[@]}"; do
            buckets[$i]=$(echo "${buckets[$i]}" | sed 's|^gs://||; s|/$||')
        done

        if [ ${#buckets[@]} -gt 0 ]; then
            local selected_bucket
            selected_bucket=$(select_option "Selecione um GCS Bucket:" "${buckets[@]}")
            
            if [ "$selected_bucket" != "__manual__" ]; then
                GCS_BUCKET_NAME=$selected_bucket
            fi
        else
            print_warning "Nenhum bucket encontrado no projeto '$GCP_PROJECT_ID'."
        fi
    fi

    if [ -z "$GCS_BUCKET_NAME" ]; then
        read -r -p "GCS_BUCKET_NAME [crm-juridico-dev-bucket]: " GCS_BUCKET_NAME
        GCS_BUCKET_NAME=${GCS_BUCKET_NAME:-crm-juridico-dev-bucket}
    else
        print_success "GCS_BUCKET_NAME = $GCS_BUCKET_NAME"
    fi

    echo ""

    echo -e "${BOLD}PostgreSQL (Banco de Dados local via Docker):${NC}"
    print_info "  ↳ Configure o usuário e senha para o banco de dados que rodará em sua máquina."
    print_info "  ↳ Para desenvolvimento, os valores padrão são seguros o suficiente."
    echo ""
    read -r -p "DB_USER [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -r -s -p "DB_PASSWORD [postgres123]: " DB_PASSWORD
    echo ""
    DB_PASSWORD=${DB_PASSWORD:-postgres123}

    read -r -p "DB_NAME [crm_juridico]: " DB_NAME
    DB_NAME=${DB_NAME:-crm_juridico}

    read -r -p "DB_HOST [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -r -p "DB_PORT [5433]: " DB_PORT
    DB_PORT=${DB_PORT:-5433}

    echo ""

    echo -e "${BOLD}Redis (Cache local via Docker):${NC}"
    print_info "  ↳ O Redis é um banco de dados em memória usado como cache para acelerar a aplicação."
    echo ""
    read -r -p "REDIS_HOST [localhost]: " REDIS_HOST
    REDIS_HOST=${REDIS_HOST:-localhost}

    read -r -p "REDIS_PORT [6380]: " REDIS_PORT
    REDIS_PORT=${REDIS_PORT:-6380}

    echo ""

    echo -e "${BOLD}Firebase (Autenticação de Usuários):${NC}"
    print_info "  ↳ O projeto usa Firebase para gerenciar login e autenticação de usuários."
    print_info "  ↳ Crie um projeto em 'firebase.google.com' e um 'Aplicativo da Web' para obter as credenciais."
    print_info "  ↳ Encontre-as em: Configurações do Projeto > Geral > Seus aplicativos > Configuração do SDK."
    echo ""

    read -r -p "FIREBASE_API_KEY: " FIREBASE_API_KEY
    read -r -p "FIREBASE_AUTH_DOMAIN: " FIREBASE_AUTH_DOMAIN
    read -r -p "FIREBASE_PROJECT_ID: " FIREBASE_PROJECT_ID

    echo ""

    echo -e "${BOLD}JWT Secret (Segurança da API):${NC}"
    print_info "  ↳ Esta é uma chave secreta para assinar os 'tokens' de sessão da API."
    JWT_SECRET=$(openssl rand -hex 32)
    print_success "Gerado um segredo seguro automaticamente."

    echo ""
    cat > "$ENV_BACKEND" << EOF
# API
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development

# GCP
GCP_PROJECT_ID=$GCP_PROJECT_ID
GCP_REGION=$GCP_REGION
GCS_BUCKET_NAME=$GCS_BUCKET_NAME

# Cloud SQL PostgreSQL (Local)
DB_INSTANCE_CONNECTION_NAME=$GCP_PROJECT_ID:$GCP_REGION:crm-juridico-db
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

# Redis Cache
REDIS_ENABLED=true
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_DB=0
REDIS_PASSWORD=
REDIS_MAX_CONNECTIONS=10
REDIS_SOCKET_TIMEOUT=5
REDIS_CONNECT_TIMEOUT=5
REDIS_DEFAULT_TTL=300

# Firebase
FIREBASE_API_KEY=$FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID

# Security
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Cache
CACHE_TTL=300

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# Sentry (opcional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
EOF

}

setup_backend() {
    print_section "3. Configurando Backend (Python/FastAPI)"
    print_info "Agora vamos preparar o ambiente do backend. Isso envolve duas etapas principais:"
    print_info " 1. Criar um 'ambiente virtual' (venv): uma pasta que isola as dependências do Python"
    print_info "    deste projeto, evitando conflitos com outros projetos na sua máquina."
    print_info " 2. Instalar as dependências: baixar e instalar as bibliotecas que o backend usa."
    echo ""

    if [ ! -f "$ENV_BACKEND" ]; then
        print_warning "Arquivo de ambiente do backend (.env) não encontrado."
        if confirm "Deseja executar a 'Configuração de Variáveis de Ambiente' (opção 3) agora?" "y"; then
            if ! setup_env_interactive; then
                print_error "Ocorreu um erro durante a configuração do ambiente."
                return
            fi
            print_info "Configuração de ambiente concluída. Retomando o setup do backend..."
        else
            print_info "Setup do backend cancelado."
            return
        fi
    fi
    
    cd "$PROJECT_ROOT/backend" || return 1
    
    print_step "Criando ambiente virtual Python em 'backend/venv'..."
    if [ ! -d "venv" ]; then
        python3 -m venv venv &
        local pid=$!
        if ! spinner $pid 300; then
            print_error "Falha ao criar ambiente virtual"
            cd "$PROJECT_ROOT"
            return 1
        fi
        print_success "Ambiente virtual criado"
    else
        print_info "Ambiente virtual já existe"
    fi
    
    source venv/bin/activate || return 1
    
    print_step "Instalando dependências Python (pode levar alguns minutos)..."
    pip install --upgrade pip > /dev/null 2>&1 &
    pid=$!
    if ! spinner $pid 300; then
        print_error "Falha ao atualizar pip"
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    pip install -r requirements.txt > /dev/null 2>&1 &
    pid=$!
    if ! spinner $pid 600; then
        print_error "Falha ao instalar dependências"
        cd "$PROJECT_ROOT"
        return 1
    fi
    print_success "Dependências instaladas"
    
    if [ -f "requirements-dev.txt" ]; then
        print_step "Instalando dependências de desenvolvimento..."
        pip install -r requirements-dev.txt > /dev/null 2>&1 &
        pid=$!
        if ! spinner $pid 300; then
            print_warning "Falha ao instalar dependências de dev"
        else
            print_success "Dependências de dev instaladas"
        fi
    fi
    
    log "Backend setup: OK"
    cd "$PROJECT_ROOT"
    return 0
}

setup_frontend() {
    print_section "4. Configurando Frontend (React/Vite)"
    print_info "Vamos instalar as dependências do frontend (React)."
    print_info "Isso criará a pasta 'node_modules', que contém todas as bibliotecas"
    print_info "necessárias para a interface da aplicação."
    echo ""
    
    cd "$PROJECT_ROOT/frontend" || return 1
    
    print_step "Instalando dependências Node.js (pode levar alguns minutos)..."
    npm install > /dev/null 2>&1 &
    local pid=$!
    if ! spinner $pid 600; then
        print_error "Falha ao instalar dependências com npm"
        cd "$PROJECT_ROOT"
        return 1
    fi
    print_success "Dependências instaladas"
    
    log "Frontend setup: OK"
    cd "$PROJECT_ROOT"
    return 0
}

# ============================================================================
# DOCKER SETUP
# ============================================================================

setup_docker() {
    print_section "5. Configurando Serviços Docker"
    print_info "A aplicação precisa de alguns serviços de apoio para funcionar, como o banco de dados."
    print_info "Usamos o Docker para iniciar esses serviços de forma rápida e padronizada."
    print_info "Esta etapa irá baixar as imagens (se necessário) e iniciar os contêineres."
    echo ""

    if [ ! -f "$ENV_BACKEND" ]; then
        print_warning "Arquivo de ambiente do backend (.env) não encontrado."
        print_info "As configurações do Docker Compose dependem deste arquivo."
        if confirm "Deseja executar a 'Configuração de Variáveis de Ambiente' (opção 3) agora?" "y"; then
            if ! setup_env_interactive; then
                print_error "Ocorreu um erro durante a configuração do ambiente."
                return
            fi
            print_info "Configuração de ambiente concluída. Retomando o setup do Docker..."
        else
            print_info "Setup do Docker cancelado."
            return
        fi
    fi

    print_step "Verificando se o serviço do Docker está rodando..."
    if ! docker info > /dev/null 2>&1; then
        print_error "O serviço (daemon) do Docker não está rodando!"
        print_info "Inicie o aplicativo do Docker em sua máquina e tente novamente."
        return 1
    fi
    print_success "Docker está rodando"

    print_step "Iniciando contêineres (PostgreSQL + Redis)..."
    docker-compose up -d postgres redis > /dev/null 2>&1 &
    local pid=$!
    if ! spinner $pid 300; then
        print_error "Falha ao iniciar serviços Docker"
        return 1
    fi

    print_step "Aguardando o serviço do PostgreSQL ficar pronto..."
    sleep 5

    local retries=0
    local max_retries=30

    while ! docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
        retries=$((retries + 1))
        if [ $retries -ge $max_retries ]; then
            print_error "PostgreSQL não ficou pronto a tempo"
            return 1
        fi
        sleep 1
    done

    print_success "PostgreSQL está pronto para conexões"

    print_step "Verificando o serviço do Redis..."
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis está pronto para conexões"
    else
        print_warning "Redis pode não estar pronto ainda"
    fi

    log "Docker services: OK"
    return 0
}

# ============================================================================
# DATABASE MIGRATIONS
# ============================================================================

setup_database() {
    print_section "6. Configurando Banco de Dados (Migrations)"
    print_info "Com o banco de dados rodando, precisamos garantir que sua estrutura (tabelas, colunas, etc.)"
    print_info "esteja correta. As 'migrations' são como um controle de versão para o banco de dados."
    print_info "Esta etapa aplica as 'migrations' para deixar o banco na versão mais recente."
    echo ""

    # --- Dependency 1: Backend Venv ---
    if [ ! -f "$PROJECT_ROOT/backend/venv/bin/activate" ]; then
        print_warning "Ambiente virtual do backend não encontrado."
        if confirm "Deseja executar o 'Setup Backend' (opção 4) agora?" "y"; then
            if ! setup_backend; then
                print_error "Falha no setup do backend. Abortando migrations."
                return
            fi
            print_info "Setup do backend concluído. Continuando..."
        else
            print_info "Operação de migração cancelada."
            return
        fi
    fi

    # --- Dependency 2: Running Docker DB ---
    if ! docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_warning "Serviço PostgreSQL não está respondendo."
        if confirm "Deseja executar o 'Setup Docker' (opção 6) agora para iniciá-lo?" "y"; then
            if ! setup_docker; then
                print_error "Falha no setup do Docker. Abortando migrations."
                return
            fi
            print_info "Setup do Docker concluído. Continuando..."
        else
            print_info "Operação de migração cancelada."
            return
        fi
    fi

    # --- All dependencies met, proceed with migrations ---
    cd "$PROJECT_ROOT/backend" || return 1
    
    source venv/bin/activate || return 1

    print_step "Executando 'migrations' do Alembic..."

    if [ -d "alembic/versions" ] && [ "$(ls -A alembic/versions)" ]; then
        alembic upgrade head > /dev/null 2>&1 &
        local pid=$!
        if ! spinner $pid 300; then
            print_error "Falha ao executar migrations"
            cd "$PROJECT_ROOT"
            return 1
        fi
        print_success "Migrations executadas com sucesso"
    else
        print_info "Nenhuma migration encontrada para aplicar."

        if confirm "Deseja criar a migration inicial (recomendado na primeira execução)?"; then
            print_step "Criando migration inicial..."
            if ! alembic revision --autogenerate -m "Initial migration" > /dev/null 2>&1; then
                print_error "Falha ao criar migration"
                cd "$PROJECT_ROOT"
                return 1
            fi

            alembic upgrade head > /dev/null 2>&1 &
            pid=$!
            if ! spinner $pid 300; then
                print_error "Falha ao executar migration"
                cd "$PROJECT_ROOT"
                return 1
            fi
            print_success "Migration inicial criada e executada"
        fi
    fi

    log "Database migrations: OK"
    cd "$PROJECT_ROOT"
    return 0
}

# ============================================================================
# PRE-COMMIT HOOKS
# ============================================================================

setup_precommit() {
    print_section "7. Configurando Pre-commit Hooks"

    if [ -f ".pre-commit-config.yaml" ]; then
        # Dependency: Backend Venv
        if [ ! -f "$PROJECT_ROOT/backend/venv/bin/activate" ]; then
            print_warning "Ambiente virtual do backend (venv) é necessário para instalar os hooks do pre-commit."
            if confirm "Deseja executar o 'Setup Backend' agora?" "y"; then
                if ! setup_backend; then
                    print_error "Falha no setup do backend. Abortando configuração do pre-commit."
                    return
                fi
                print_info "Setup do backend concluído. Continuando..."
            else
                print_info "Configuração do pre-commit cancelada."
                return
            fi
        fi

        print_step "Instalando pre-commit hooks..."
        cd "$PROJECT_ROOT/backend" || return 1
        source venv/bin/activate || return 1

        pip install pre-commit > /dev/null 2>&1 &
        local pid=$!
        if ! spinner $pid 300; then
            print_warning "Falha ao instalar pre-commit"
            cd "$PROJECT_ROOT"
            return 1
        fi

        cd "$PROJECT_ROOT"
        if ! pre-commit install > /dev/null 2>&1; then
            print_warning "Falha ao instalar hooks"
            return 1
        fi

        print_success "Pre-commit hooks instalados"
        log "Pre-commit: OK"
    else
        print_info "Arquivo .pre-commit-config.yaml não encontrado"
    fi
    return 0
}

# ============================================================================
# VALIDAÇÃO FINAL
# ============================================================================

validate_setup() {
    print_section "8. Validando Instalação"
    
    local all_ok=true
    
    # Backend
    print_step "Verificando backend..."
    if [ -f "$ENV_BACKEND" ] && [ -d "$PROJECT_ROOT/backend/venv" ]; then
        print_success "Backend configurado"
    else
        print_error "Backend com problemas"
        all_ok=false
    fi
    
    # Frontend
    print_step "Verificando frontend..."
    if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        print_success "Frontend configurado"
    else
        print_error "Frontend com problemas (execute 'npm install' em frontend/)"
        all_ok=false
    fi
    
    # Docker
    print_step "Verificando serviços Docker..."
    if docker-compose ps 2>/dev/null | grep -q "Up"; then
        print_success "Serviços Docker rodando"
    else
        print_error "Serviços Docker com problemas"
        all_ok=false
    fi
    
    # Database
    print_step "Verificando conexão com banco..."
    if [ -f "$PROJECT_ROOT/backend/venv/bin/activate" ]; then
        cd "$PROJECT_ROOT/backend"
        source venv/bin/activate
        
        if python -c "from app.core.database import engine; engine.connect()" 2>/dev/null; then
            print_success "Conexão com banco OK"
        else
            print_warning "Não foi possível conectar ao banco (pode ser normal se os serviços Docker não estiverem rodando)"
        fi
        
        cd "$PROJECT_ROOT"
    else
        print_warning "Não foi possível verificar a conexão com o banco (ambiente virtual do backend não encontrado)"
    fi
    
    echo ""
    
    if [ "$all_ok" = true ]; then
        print_success "Validação concluída com sucesso!"
    else
        print_warning "Alguns problemas foram encontrados"
    fi
    
    log "Validation: $all_ok"
}

# ============================================================================
# INFORMAÇÕES FINAIS
# ============================================================================

show_final_info() {
    print_section "✨ Setup Concluído!"
    
    echo -e "${GREEN}${BOLD}Seu ambiente de desenvolvimento foi configurado com sucesso!${NC}"
    echo ""
    print_info "Abaixo estão as instruções para iniciar a aplicação e outros comandos úteis."
    echo ""
    
    echo -e "${BOLD}📋 Próximos Passos: Como Iniciar a Aplicação${NC}"
    echo ""
    
    echo -e "${CYAN}1. Iniciar o Backend (API):${NC}"
    echo -e "   Em um terminal, execute o comando:"
    echo -e "   ${YELLOW}make backend-dev${NC}"
    echo -e "   ↳ Isso ativará o ambiente virtual e iniciará um servidor de desenvolvimento"
    echo -e "     para a API na porta 8000. Ele recarregará automaticamente se você alterar o código."
    echo ""
    
    echo -e "${CYAN}2. Iniciar o Frontend (Interface Web):${NC}"
    echo -e "   Em ${BOLD}outro terminal${NC}, execute o comando:"
    echo -e "   ${YELLOW}make frontend-dev${NC}"
    echo -e "   ↳ Isso iniciará o servidor de desenvolvimento do React (Vite) na porta 5173."
    echo ""
    
    echo -e "${CYAN}3. Acessar a Aplicação:${NC}"
    echo -e "   Abra seu navegador e acesse os seguintes endereços:"
    echo -e "   - ${BOLD}Interface Gráfica:${NC} ${WHITE}http://localhost:5173${NC}"
    echo -e "   - ${BOLD}Documentação da API:${NC}  ${WHITE}http://localhost:8000/docs${NC}"
    echo ""
    
    echo -e "${BOLD}🐳 Serviços de Apoio (Docker):${NC}"
    print_info "Os seguintes serviços estão rodando em background via Docker:"
    echo -e "   - ${BOLD}PostgreSQL (Banco de Dados):${NC} Disponível em: ${WHITE}localhost:5433${NC}"
    echo -e "   - ${BOLD}Redis (Cache):${NC}              Disponível em: ${WHITE}localhost:6380${NC}"
    echo ""
    
    echo -e "${BOLD}📚 Comandos Úteis (via Make):${NC}"
    print_info "Você pode usar o comando 'make' para simplificar tarefas comuns:"
    echo "   make help           - Ver todos os comandos disponíveis."
    echo "   make docker-up      - Iniciar serviços Docker (Postgres, Redis)."
    echo "   make docker-down    - Parar serviços Docker."
    echo "   make test           - Executar os testes automatizados do backend."
    echo "   make lint           - Rodar verificadores de qualidade de código."
    echo "   make format         - Formatar o código para manter o padrão."
    echo ""
    
    echo -e "${YELLOW}${BOLD}⚠️  Lembretes Importantes:${NC}"
    echo "   - Não adicione os arquivos '.env' ao Git. Eles contêm segredos."
    echo "   - As portas 5173, 8000, 5433 e 6380 precisam estar livres em sua máquina."
    echo ""
    
    echo -e "${GREEN}${BOLD}🎉 Bom desenvolvimento!${NC}"
    echo ""
}


# ============================================================================
# SETUP AUTOMATIZADO
# ============================================================================

setup_env_automated() {
    print_section "2. Configurando Variáveis de Ambiente (Modo Automatizado)"
    print_info "Criando arquivos .env a partir de .env.example..."

    if [ ! -f "$ENV_EXAMPLE" ]; then
        print_error "Arquivo .env.example não encontrado! Não é possível continuar."
        return 1
    fi

    # --- Backend .env ---
    print_step "Gerando backend/.env..."
    cp "$ENV_EXAMPLE" "$ENV_BACKEND"
    
    # Gerar JWT Secret
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$ENV_BACKEND"
    
    # Usar senha padrão de dev para o DB
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=postgres123|" "$ENV_BACKEND"
    
    print_success "backend/.env gerado."

    # --- Frontend .env ---
    print_step "Gerando frontend/.env..."
    
    # Extrair valores do .env.example para o frontend
    FIREBASE_API_KEY_VALUE=$(grep "FIREBASE_API_KEY=" "$ENV_EXAMPLE" | cut -d'=' -f2-)
    FIREBASE_AUTH_DOMAIN_VALUE=$(grep "FIREBASE_AUTH_DOMAIN=" "$ENV_EXAMPLE" | cut -d'=' -f2-)
    FIREBASE_PROJECT_ID_VALUE=$(grep "FIREBASE_PROJECT_ID=" "$ENV_EXAMPLE" | cut -d'=' -f2-)
    
    cat > "$ENV_FRONTEND" << EOF
# Generated by setup-dev.sh
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=${FIREBASE_API_KEY_VALUE}
VITE_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN_VALUE}
VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID_VALUE}
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
EOF
    print_success "frontend/.env gerado."
    
    log "Configuração de ambiente automatizada: OK"
    return 0
}

print_automated_setup_warnings() {
    echo ""
    echo -e "${YELLOW}${BOLD}⚠️  Atenção: Ação Manual Necessária!${NC}"
    echo ""
    echo -e "${WHITE}O setup automatizado configurou o básico, mas você ${BOLD}precisa${NC} editar os seguintes arquivos"
    echo -e "e preencher os valores dos segredos para que a autenticação funcione:${NC}"
    echo ""
    echo -e "  ${BOLD}1. Edite o arquivo:${NC} ${CYAN}backend/.env${NC}"
    echo "     - FIREBASE_API_KEY"
    echo "     - FIREBASE_AUTH_DOMAIN"
    echo "     - FIREBASE_PROJECT_ID"
    echo ""
    echo -e "  ${BOLD}2. Edite o arquivo:${NC} ${CYAN}frontend/.env${NC}"
    echo "     - VITE_FIREBASE_API_KEY"
    echo "     - VITE_FIREBASE_AUTH_DOMAIN"
    echo "     - VITE_FIREBASE_PROJECT_ID"
    echo "     - (e outros valores do Firebase se necessário)"
    echo ""
    print_info "Você pode obter esses valores no console do seu projeto Firebase."
    echo ""
}

run_full_automated_setup() {
    print_header
    echo -e "${BOLD}Iniciando setup completo do ambiente (Modo Automatizado)...${NC}"
    echo ""
    log "=== Setup automatizado iniciado ==="

    if ! validate_dependencies; then exit 1; fi
    if ! setup_env_automated; then exit 1; fi
    if ! setup_backend; then exit 1; fi
    if ! setup_frontend; then exit 1; fi
    if ! setup_docker; then exit 1; fi
    if ! setup_database; then exit 1; fi
    if ! setup_precommit; then exit 1; fi
    
    validate_setup
    
    show_final_info
    
    print_automated_setup_warnings

    log "=== Setup automatizado concluído com avisos ==="

    # We don't pause in automated mode
}

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

show_menu() {
    while true; do
        print_header

        echo -e "${BOLD}Escolha uma opção:${NC}"
        echo ""
        echo -e "  1) Setup Completo Interativo ${YELLOW}(Recomendado)${NC}"
        echo "  2) Setup Completo Automatizado"
        echo "  ------------------------------------"
        echo "  3) Apenas Validar Dependências"
        echo "  4) Apenas Configurar Variáveis (Interativo)"
        echo "  5) Apenas Setup Backend"
        echo "  6) Apenas Setup Frontend"
        echo "  7) Apenas Setup Docker"
        echo "  8) Apenas Migrations"
        echo "  9) Validar Setup Existente"
        echo "  10) Limpar e Reconfigurar Tudo"
        echo "  0) Sair"
        echo ""

        read -r -p "$(echo -e \"${YELLOW}Opção:${NC}\" )" choice

        case $choice in
            1)
                run_full_setup
                ;;
            2)
                run_full_automated_setup
                ;;
            3)
                validate_dependencies
                pause
                ;;
            4)
                setup_env_interactive
                pause
                ;;
            5)
                setup_backend
                pause
                ;;
            6)
                setup_frontend
                pause
                ;;
            7)
                setup_docker
                pause
                ;;
            8)
                setup_database
                pause
                ;;
            9)
                validate_setup
                pause
                ;;
            10)
                clean_and_reset
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
    done
}

# ============================================================================
# SETUP COMPLETO
# ============================================================================

run_full_setup() {
    print_header

    echo -e "${BOLD}Iniciando setup completo do ambiente...${NC}"
    echo ""

    log "=== Setup iniciado ==="

    validate_dependencies
    pause

    setup_env_interactive
    pause

    setup_backend
    pause

    setup_frontend
    pause

    setup_docker
    pause

    setup_database
    pause

    setup_precommit
    pause

    validate_setup
    pause

    show_final_info

    log "=== Setup concluído ==="

    pause
}

# ============================================================================
# LIMPEZA E RESET
# ============================================================================

clean_and_reset() {
    print_header

    print_warning "Esta ação irá remover:"
    echo "  - Arquivos .env"
    echo "  - Ambiente virtual Python"
    echo "  - node_modules"
    echo "  - Containers Docker"
    echo "  - Volumes Docker"
    echo ""

    if ! confirm "Tem certeza que deseja continuar?" "n"; then
        return
    fi

    print_step "Limpando ambiente..."

    # Parar Docker
    docker-compose down -v > /dev/null 2>&1

    # Remover .env
    rm -f "$ENV_BACKEND" "$ENV_FRONTEND"

    # Remover venv
    rm -rf "$PROJECT_ROOT/backend/venv"

    # Remover node_modules
    rm -rf "$PROJECT_ROOT/frontend/node_modules"

    print_success "Ambiente limpo!"

    if confirm "Deseja executar o setup completo agora?"; then
        run_full_setup
    else
        pause
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    # Criar log file
    touch "$LOG_FILE"
    
    # Verificar se está no diretório correto
    if [ ! -f "docker-compose.yml" ]; then
        print_error "Execute este script na raiz do projeto!"
        exit 1
    fi
    
    # Modo interativo ou direto
    if [ $# -eq 0 ]; then
        # Modo interativo
        while true; do
            show_menu
        done
    else
        # Modo direto
        case $1 in
            --full) run_full_setup ;;
            --automate) run_full_automated_setup ;;
            --validate) validate_dependencies ;;
            --clean) clean_and_reset ;;
            --help)
                echo "Uso: $0 [opção]"
                echo ""
                echo "Opções:"
                echo "  --full      Setup completo interativo"
                echo "  --automate  Setup completo automatizado (requer preenchimento do .env)"
                echo "  --validate  Apenas validar dependências"
                echo "  --clean     Limpar e reconfigurar"
                echo "  --help      Mostrar esta ajuda"
                echo ""
                echo "Sem opções: Modo interativo"
                ;;
            *)
                print_error "Opção inválida: $1"
                echo "Use --help para ver as opções disponíveis"
                exit 1
                ;;
        esac
    fi
}

# Executar
main "$@"
