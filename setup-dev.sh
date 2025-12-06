#!/bin/bash

# ============================================================================
# CRM JURÍDICO - Setup Interativo de Ambiente de Desenvolvimento
# ============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
            kill -9 $pid 2>/dev/null
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

# ============================================================================
# VALIDAÇÃO DE DEPENDÊNCIAS
# ============================================================================

check_command() {
    local cmd=$1
    local name=$2
    local install_hint=$3
    
    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
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

    local all_ok=true

    print_step "Verificando ferramentas necessárias..."
    echo ""

    if ! check_command "python3" "Python 3" "sudo apt install python3 python3-pip"; then
        all_ok=false
    fi

    if ! check_command "node" "Node.js" "https://nodejs.org/"; then
        all_ok=false
    fi

    if ! check_command "npm" "npm" "vem com Node.js"; then
        all_ok=false
    fi

    if ! check_command "docker" "Docker" "https://docs.docker.com/get-docker/"; then
        all_ok=false
    fi

    if ! check_command "docker-compose" "Docker Compose" "https://docs.docker.com/compose/install/"; then
        all_ok=false
    fi

    if ! check_command "git" "Git" "sudo apt install git"; then
        all_ok=false
    fi

    if ! check_command "make" "Make" "sudo apt install build-essential"; then
        all_ok=false
    fi

    echo ""

    if [ "$all_ok" = false ]; then
        print_error "Algumas dependências estão faltando!"
        print_info "Instale as dependências faltantes e execute o script novamente."
        return 1
    fi

    print_success "Todas as dependências estão instaladas!"
    log "Validação de dependências: OK"
    return 0
}

# ============================================================================
# CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ============================================================================

setup_env_interactive() {
    print_section "2. Configuração de Variáveis de Ambiente"

    print_info "Vamos configurar as variáveis de ambiente necessárias."
    print_info "Você pode usar valores padrão para desenvolvimento local."
    echo ""

    print_step "Configurando Backend (.env)..."
    echo ""

    echo -e "${BOLD}Google Cloud Platform:${NC}"
    read -p "GCP_PROJECT_ID [crm-juridico-dev]: " GCP_PROJECT_ID
    GCP_PROJECT_ID=${GCP_PROJECT_ID:-crm-juridico-dev}

    read -p "GCP_REGION [us-central1]: " GCP_REGION
    GCP_REGION=${GCP_REGION:-us-central1}

    read -p "GCS_BUCKET_NAME [crm-juridico-dev-bucket]: " GCS_BUCKET_NAME
    GCS_BUCKET_NAME=${GCS_BUCKET_NAME:-crm-juridico-dev-bucket}

    echo ""

    echo -e "${BOLD}PostgreSQL (Local):${NC}"
    read -p "DB_USER [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -sp "DB_PASSWORD [postgres123]: " DB_PASSWORD
    echo ""
    DB_PASSWORD=${DB_PASSWORD:-postgres123}

    read -p "DB_NAME [crm_juridico]: " DB_NAME
    DB_NAME=${DB_NAME:-crm_juridico}

    read -p "DB_HOST [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "DB_PORT [5433]: " DB_PORT
    DB_PORT=${DB_PORT:-5433}

    echo ""

    echo -e "${BOLD}Redis (Local):${NC}"
    read -p "REDIS_HOST [localhost]: " REDIS_HOST
    REDIS_HOST=${REDIS_HOST:-localhost}

    read -p "REDIS_PORT [6380]: " REDIS_PORT
    REDIS_PORT=${REDIS_PORT:-6380}

    echo ""

    echo -e "${BOLD}Firebase:${NC}"
    print_info "Obtenha as credenciais em: https://console.firebase.google.com/"

    read -p "FIREBASE_API_KEY: " FIREBASE_API_KEY
    read -p "FIREBASE_AUTH_DOMAIN: " FIREBASE_AUTH_DOMAIN
    read -p "FIREBASE_PROJECT_ID: " FIREBASE_PROJECT_ID

    echo ""

    echo -e "${BOLD}JWT Secret:${NC}"
    JWT_SECRET=$(openssl rand -hex 32)
    print_info "Gerado automaticamente: ${JWT_SECRET:0:20}..."

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
    
setup_backend() {
    print_section "3. Configurando Backend (Python/FastAPI)"
    
    cd "$PROJECT_ROOT/backend" || return 1
    
    print_step "Criando ambiente virtual Python..."
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
    
    print_step "Instalando dependências Python..."
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
    
    cd "$PROJECT_ROOT/frontend" || return 1
    
    print_step "Instalando dependências Node.js..."
    npm install > /dev/null 2>&1 &
    local pid=$!
    if ! spinner $pid 600; then
        print_error "Falha ao instalar dependências"
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

    print_step "Verificando Docker daemon..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker não está rodando!"
        print_info "Inicie o Docker e tente novamente."
        return 1
    fi
    print_success "Docker está rodando"

    print_step "Iniciando serviços (PostgreSQL + Redis)..."
    docker-compose up -d postgres redis > /dev/null 2>&1 &
    local pid=$!
    if ! spinner $pid 300; then
        print_error "Falha ao iniciar serviços Docker"
        return 1
    fi

    print_step "Aguardando PostgreSQL ficar pronto..."
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

    print_success "PostgreSQL está pronto"

    print_step "Verificando Redis..."
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis está pronto"
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
    print_section "6. Configurando Banco de Dados"

    cd "$PROJECT_ROOT/backend" || return 1
    source venv/bin/activate || return 1

    print_step "Executando migrations do Alembic..."

    if [ -d "alembic/versions" ] && [ "$(ls -A alembic/versions)" ]; then
        alembic upgrade head > /dev/null 2>&1 &
        local pid=$!
        if ! spinner $pid 300; then
            print_error "Falha ao executar migrations"
            cd "$PROJECT_ROOT"
            return 1
        fi
        print_success "Migrations executadas"
    else
        print_info "Nenhuma migration encontrada"

        if confirm "Deseja criar a migration inicial?"; then
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
    if [ -f "$ENV_FRONTEND" ] && [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        print_success "Frontend configurado"
    else
        print_error "Frontend com problemas"
        all_ok=false
    fi
    
    # Docker
    print_step "Verificando serviços Docker..."
    if docker-compose ps | grep -q "Up"; then
        print_success "Serviços Docker rodando"
    else
        print_error "Serviços Docker com problemas"
        all_ok=false
    fi
    
    # Database
    print_step "Verificando conexão com banco..."
    cd "$PROJECT_ROOT/backend"
    source venv/bin/activate
    
    if python -c "from app.core.database import engine; engine.connect()" 2>/dev/null; then
        print_success "Conexão com banco OK"
    else
        print_warning "Não foi possível conectar ao banco (pode ser normal se ainda não iniciou)"
    fi
    
    cd "$PROJECT_ROOT"
    
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
    
    echo -e "${GREEN}${BOLD}Ambiente de desenvolvimento configurado com sucesso!${NC}"
    echo ""
    
    echo -e "${BOLD}📋 Próximos Passos:${NC}"
    echo ""
    
    echo -e "${CYAN}1. Iniciar Backend:${NC}"
    echo "   cd backend"
    echo "   source venv/bin/activate"
    echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "   ${BOLD}ou use:${NC} make backend-dev"
    echo ""
    
    echo -e "${CYAN}2. Iniciar Frontend:${NC}"
    echo "   cd frontend"
    echo "   npm run dev"
    echo ""
    echo "   ${BOLD}ou use:${NC} make frontend-dev"
    echo ""
    
    echo -e "${CYAN}3. Acessar Aplicação:${NC}"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    
    echo -e "${BOLD}🐳 Serviços Docker:${NC}"
    echo "   PostgreSQL: localhost:5433"
    echo "   Redis:      localhost:6380"
    echo ""
    
    echo -e "${BOLD}📚 Comandos Úteis:${NC}"
    echo "   make help           - Ver todos os comandos disponíveis"
    echo "   make docker-up      - Iniciar serviços Docker"
    echo "   make docker-down    - Parar serviços Docker"
    echo "   make test           - Executar testes"
    echo "   make lint           - Verificar código"
    echo "   make format         - Formatar código"
    echo ""
    
    echo -e "${BOLD}📝 Arquivos Criados:${NC}"
    echo "   $ENV_BACKEND"
    echo "   $ENV_FRONTEND"
    echo "   $LOG_FILE"
    echo ""
    
    echo -e "${YELLOW}${BOLD}⚠️  Importante:${NC}"
    echo "   - Não commite os arquivos .env no Git"
    echo "   - Configure as credenciais do Firebase corretamente"
    echo "   - Verifique as portas 5173, 8000, 5433 e 6380 estão livres"
    echo ""
    
    echo -e "${GREEN}${BOLD}🎉 Bom desenvolvimento!${NC}"
    echo ""
}

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

show_menu() {
    while true; do
        print_header

        echo -e "${BOLD}Escolha uma opção:${NC}"
        echo ""
        echo "  1) Setup Completo (Recomendado)"
        echo "  2) Apenas Validar Dependências"
        echo "  3) Apenas Configurar Variáveis de Ambiente"
        echo "  4) Apenas Setup Backend"
        echo "  5) Apenas Setup Frontend"
        echo "  6) Apenas Setup Docker"
        echo "  7) Apenas Migrations"
        echo "  8) Validar Setup Existente"
        echo "  9) Limpar e Reconfigurar Tudo"
        echo "  0) Sair"
        echo ""

        read -p "$(echo -e ${YELLOW}Opção:${NC} )" choice

        case $choice in
            1)
                run_full_setup
                ;;
            2)
                validate_dependencies
                pause
                ;;
            3)
                setup_env_interactive
                pause
                ;;
            4)
                setup_backend
                pause
                ;;
            5)
                setup_frontend
                pause
                ;;
            6)
                setup_docker
                pause
                ;;
            7)
                setup_database
                pause
                ;;
            8)
                validate_setup
                pause
                ;;
            9)
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
            --validate) validate_dependencies ;;
            --clean) clean_and_reset ;;
            --help)
                echo "Uso: $0 [opção]"
                echo ""
                echo "Opções:"
                echo "  --full      Setup completo"
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
