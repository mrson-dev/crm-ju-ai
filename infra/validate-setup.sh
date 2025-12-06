#!/bin/bash

set -euo pipefail

# ============================================================================
# Script de Teste do Setup
# ============================================================================
# Valida se o ambiente foi configurado corretamente
# ============================================================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Validando Setup do Ambiente${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Contador de erros
ERRORS=0

# ============================================================================
# 1. Arquivos de Configuração
# ============================================================================

echo "1. Verificando arquivos de configuração..."

if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "   ${CHECK} backend/.env existe"
else
    echo -e "   ${CROSS} backend/.env NÃO encontrado"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "$PROJECT_ROOT/frontend/.env" ]; then
    echo -e "   ${CHECK} frontend/.env existe"
else
    echo -e "   ${CROSS} frontend/.env NÃO encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# 2. Backend
# ============================================================================

echo "2. Verificando Backend..."

if [ -d "$PROJECT_ROOT/backend/venv" ]; then
    echo -e "   ${CHECK} Ambiente virtual Python existe"
    
    # Verificar se pode ativar
    if source "$PROJECT_ROOT/backend/venv/bin/activate" 2>/dev/null; then
        echo -e "   ${CHECK} Ambiente virtual pode ser ativado"
        
        # Verificar pacotes principais
        if python -c "import fastapi" 2>/dev/null; then
            echo -e "   ${CHECK} FastAPI instalado"
        else
            echo -e "   ${CROSS} FastAPI NÃO instalado"
            ERRORS=$((ERRORS + 1))
        fi
        
        if python -c "import sqlalchemy" 2>/dev/null; then
            echo -e "   ${CHECK} SQLAlchemy instalado"
        else
            echo -e "   ${CROSS} SQLAlchemy NÃO instalado"
            ERRORS=$((ERRORS + 1))
        fi
        
        deactivate 2>/dev/null || true
    else
        echo -e "   ${CROSS} Não foi possível ativar ambiente virtual"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${CROSS} Ambiente virtual Python NÃO encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# 3. Frontend
# ============================================================================

echo "3. Verificando Frontend..."

if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "   ${CHECK} node_modules existe"
    
    # Verificar pacotes principais
    if [ -d "$PROJECT_ROOT/frontend/node_modules/react" ]; then
        echo -e "   ${CHECK} React instalado"
    else
        echo -e "   ${CROSS} React NÃO instalado"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -d "$PROJECT_ROOT/frontend/node_modules/vite" ]; then
        echo -e "   ${CHECK} Vite instalado"
    else
        echo -e "   ${CROSS} Vite NÃO instalado"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${CROSS} node_modules NÃO encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# 4. Docker
# ============================================================================

echo "4. Verificando Docker..."

if docker info > /dev/null 2>&1; then
    echo -e "   ${CHECK} Docker está rodando"
    
    # Verificar containers
    if docker-compose ps | grep -q "postgres.*Up"; then
        echo -e "   ${CHECK} PostgreSQL está rodando"
        
        # Testar conexão
        if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            echo -e "   ${CHECK} PostgreSQL aceita conexões"
        else
            echo -e "   ${WARN} PostgreSQL não está aceitando conexões"
        fi
    else
        echo -e "   ${WARN} PostgreSQL não está rodando"
        echo -e "       Execute: docker-compose up -d postgres"
    fi
    
    if docker-compose ps | grep -q "redis.*Up"; then
        echo -e "   ${CHECK} Redis está rodando"
        
        # Testar conexão
        if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            echo -e "   ${CHECK} Redis aceita conexões"
        else
            echo -e "   ${WARN} Redis não está aceitando conexões"
        fi
    else
        echo -e "   ${WARN} Redis não está rodando"
        echo -e "       Execute: docker-compose up -d redis"
    fi
else
    echo -e "   ${CROSS} Docker não está rodando"
    echo -e "       Execute: sudo systemctl start docker"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# 5. Portas
# ============================================================================

echo "5. Verificando portas..."

check_port() {
    local port=$1
    local name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "   ${WARN} Porta $port ($name) está em uso"
    else
        echo -e "   ${CHECK} Porta $port ($name) está livre"
    fi
}

check_port 5173 "Frontend"
check_port 8000 "Backend"
check_port 5433 "PostgreSQL"
check_port 6380 "Redis"

echo ""

# ============================================================================
# 6. Variáveis de Ambiente Críticas
# ============================================================================

echo "6. Verificando variáveis de ambiente críticas..."

if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    source "$PROJECT_ROOT/backend/.env"
    
    if [ -n "$DB_NAME" ]; then
        echo -e "   ${CHECK} DB_NAME configurado"
    else
        echo -e "   ${CROSS} DB_NAME não configurado"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -n "$JWT_SECRET" ]; then
        echo -e "   ${CHECK} JWT_SECRET configurado"
    else
        echo -e "   ${CROSS} JWT_SECRET não configurado"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -n "$FIREBASE_PROJECT_ID" ]; then
        echo -e "   ${CHECK} FIREBASE_PROJECT_ID configurado"
    else
        echo -e "   ${WARN} FIREBASE_PROJECT_ID não configurado"
    fi
fi

echo ""

# ============================================================================
# Resultado Final
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Ambiente configurado corretamente!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
    echo "  2. cd frontend && npm run dev"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Encontrados $ERRORS erro(s) na configuração${NC}"
    echo ""
    echo "Execute o setup novamente:"
    echo "  ./setup-dev.sh"
    echo ""
    exit 1
fi
