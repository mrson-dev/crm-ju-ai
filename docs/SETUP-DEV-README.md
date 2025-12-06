# 🚀 Setup Automático de Ambiente de Desenvolvimento

Script interativo e didático para configurar o ambiente de desenvolvimento do CRM Jurídico.

## 📋 Pré-requisitos

O script valida automaticamente, mas você precisa ter instalado:

- **Python 3.8+** - Backend
- **Node.js 18+** - Frontend
- **Docker & Docker Compose** - Serviços (PostgreSQL, Redis)
- **Git** - Controle de versão
- **Make** - Automação de tarefas

### Instalação Rápida (Ubuntu/Debian)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Python
sudo apt install python3 python3-pip python3-venv -y

# Node.js (via nvm - recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo apt install docker-compose -y

# Git e Make
sudo apt install git build-essential -y
```

## 🎯 Uso

### Modo Interativo (Recomendado)

```bash
./setup-dev.sh
```

Apresenta um menu com opções:

```
1) Setup Completo (Recomendado)
2) Apenas Validar Dependências
3) Apenas Configurar Variáveis de Ambiente
4) Apenas Setup Backend
5) Apenas Setup Frontend
6) Apenas Setup Docker
7) Apenas Migrations
8) Validar Setup Existente
9) Limpar e Reconfigurar Tudo
0) Sair
```

**💡 Novo**: O menu agora possui **loop automático**! Após executar qualquer comando, você retorna automaticamente ao menu, permitindo executar múltiplas operações sem reiniciar o script.

**Exemplo de uso:**
```
Opção: 2  # Validar Dependências
✓ Validação OK!
[Pressione ENTER]

[MENU retorna automaticamente]
Opção: 4  # Setup Backend
✓ Backend configurado!
[Pressione ENTER]

[MENU retorna automaticamente]
Opção: 0  # Sair
```

### Modo Direto

```bash
# Setup completo
./setup-dev.sh --full

# Apenas validar dependências
./setup-dev.sh --validate

# Limpar e reconfigurar
./setup-dev.sh --clean

# Ajuda
./setup-dev.sh --help
```

## 📦 O que o Script Faz

### 1️⃣ Validação de Dependências

Verifica se todas as ferramentas necessárias estão instaladas:

- ✅ Python 3
- ✅ Node.js
- ✅ npm
- ✅ Docker
- ✅ Docker Compose
- ✅ Git
- ✅ Make

### 2️⃣ Configuração de Variáveis de Ambiente

Cria arquivos `.env` de forma interativa:

**Backend** (`backend/.env`):
- GCP (Project ID, Region, Bucket)
- PostgreSQL (User, Password, Database)
- Redis (Host, Port)
- Firebase (API Key, Auth Domain, Project ID)
- JWT Secret (gerado automaticamente)
- CORS, Cache, Pagination

**Frontend** (`frontend/.env`):
- API URL
- Firebase (API Key, Auth Domain, Project ID)

### 3️⃣ Setup do Backend

- Cria ambiente virtual Python (`venv`)
- Instala dependências do `requirements.txt`
- Instala dependências de desenvolvimento

### 4️⃣ Setup do Frontend

- Instala dependências Node.js (`npm install`)
- Configura hooks do Husky (se disponível)

### 5️⃣ Configuração Docker

- Inicia PostgreSQL (porta 5433)
- Inicia Redis (porta 6380)
- Aguarda serviços ficarem prontos

### 6️⃣ Migrations do Banco

- Executa migrations do Alembic
- Cria migration inicial se necessário

### 7️⃣ Pre-commit Hooks

- Instala pre-commit hooks (se configurado)
- Garante qualidade de código

### 8️⃣ Validação Final

Verifica se tudo foi configurado corretamente:
- Backend configurado
- Frontend configurado
- Serviços Docker rodando
- Conexão com banco de dados

## 🎨 Interface

O script possui interface colorida e didática:

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           CRM JURÍDICO - Setup de Desenvolvimento             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Validando Dependências do Sistema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Verificando ferramentas necessárias...

✓ Python 3 instalado: Python 3.10.12
✓ Node.js instalado: v18.17.0
✓ npm instalado: 9.6.7
✓ Docker instalado: Docker version 24.0.5
✓ Docker Compose instalado: docker-compose version 1.29.2
✓ Git instalado: git version 2.34.1
✓ Make instalado: GNU Make 4.3

✓ Todas as dependências estão instaladas!
```

## 📝 Logs

Todas as ações são registradas em `setup.log`:

```bash
[2024-12-06 10:30:15] Validação de dependências: OK
[2024-12-06 10:31:20] Backend .env criado
[2024-12-06 10:31:21] Frontend .env criado
[2024-12-06 10:32:45] Backend setup: OK
[2024-12-06 10:34:10] Frontend setup: OK
[2024-12-06 10:35:30] Docker services: OK
[2024-12-06 10:36:00] Database migrations: OK
[2024-12-06 10:36:15] Validation: true
```

## 🔧 Configuração Padrão

### Backend

```env
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development

DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=crm_juridico

REDIS_HOST=localhost
REDIS_PORT=6380
```

### Frontend

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 🚀 Após o Setup

### Iniciar Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ou
make backend-dev
```

### Iniciar Frontend

```bash
cd frontend
npm run dev

# ou
make frontend-dev
```

### Acessar Aplicação

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6380

## 🛠️ Comandos Úteis

```bash
# Ver todos os comandos
make help

# Iniciar serviços Docker
make docker-up

# Parar serviços Docker
make docker-down

# Executar testes
make test

# Verificar código
make lint

# Formatar código
make format

# Limpar ambiente
./setup-dev.sh --clean
```

## 🔄 Reconfigurar Ambiente

Se algo der errado:

```bash
# Opção 1: Menu interativo
./setup-dev.sh
# Escolha opção 9 (Limpar e Reconfigurar Tudo)

# Opção 2: Linha de comando
./setup-dev.sh --clean
```

Isso irá:
- Remover arquivos `.env`
- Remover ambiente virtual Python
- Remover `node_modules`
- Parar e remover containers Docker
- Remover volumes Docker

## ⚠️ Troubleshooting

### Erro: "Docker não está rodando"

```bash
# Iniciar Docker
sudo systemctl start docker

# Verificar status
sudo systemctl status docker
```

### Erro: "Porta já em uso"

```bash
# Verificar portas em uso
sudo lsof -i :5173  # Frontend
sudo lsof -i :8000  # Backend
sudo lsof -i :5433  # PostgreSQL
sudo lsof -i :6380  # Redis

# Matar processo
sudo kill -9 <PID>
```

### Erro: "Permission denied"

```bash
# Tornar script executável
chmod +x setup-dev.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Erro: "PostgreSQL não fica pronto"

```bash
# Verificar logs
docker-compose logs postgres

# Reiniciar serviço
docker-compose restart postgres
```

### Erro: "Module not found" (Python)

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Erro: "Module not found" (Node)

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📚 Estrutura de Arquivos Criados

```
crm-ju-ai/
├── setup-dev.sh              # Script de setup
├── setup.log                 # Log de execução
├── backend/
│   ├── .env                  # Variáveis de ambiente
│   └── venv/                 # Ambiente virtual Python
└── frontend/
    ├── .env                  # Variáveis de ambiente
    └── node_modules/         # Dependências Node
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite arquivos `.env` no Git
- ⚠️ Arquivos `.env` estão no `.gitignore`
- ⚠️ JWT Secret é gerado automaticamente
- ⚠️ Senhas padrão são apenas para desenvolvimento local

## 🎓 Modo Educacional

O script é didático e explica cada passo:

- ✅ Mensagens claras e coloridas
- ✅ Spinner durante operações longas
- ✅ Confirmações antes de ações destrutivas
- ✅ Logs detalhados
- ✅ Validação em cada etapa
- ✅ Instruções finais completas

## 🤝 Contribuindo

Para melhorar o script:

1. Teste em diferentes sistemas operacionais
2. Adicione validações extras
3. Melhore mensagens de erro
4. Adicione mais opções de configuração

## 📄 Licença

Este script faz parte do projeto CRM Jurídico.

---

**Desenvolvido com ❤️ por Claude Sonnet 4.5**
