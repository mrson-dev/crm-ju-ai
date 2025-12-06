# 🎬 Exemplos de Uso - Setup Automático

## 📺 Cenário 1: Desenvolvedor Novo no Projeto

### Situação
João acabou de entrar na equipe e precisa configurar o ambiente.

### Solução

```bash
# 1. Clone o repositório
git clone https://github.com/empresa/crm-ju-ai.git
cd crm-ju-ai

# 2. Execute o setup
./setup-dev.sh
```

### Output Esperado

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           CRM JURÍDICO - Setup de Desenvolvimento             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Escolha uma opção:

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

Opção: 1

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

Pressione ENTER para continuar...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. Configuração de Variáveis de Ambiente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Vamos configurar as variáveis de ambiente necessárias.
ℹ Você pode usar valores padrão para desenvolvimento local.

→ Configurando Backend (.env)...

Google Cloud Platform:
GCP_PROJECT_ID [crm-juridico-dev]: 
GCP_REGION [us-central1]: 
GCS_BUCKET_NAME [crm-juridico-dev-bucket]: 

PostgreSQL (Local):
DB_USER [postgres]: 
DB_PASSWORD [postgres123]: 
DB_NAME [crm_juridico]: 
DB_HOST [localhost]: 
DB_PORT [5433]: 

Redis (Local):
REDIS_HOST [localhost]: 
REDIS_PORT [6380]: 

Firebase:
ℹ Obtenha as credenciais em: https://console.firebase.google.com/
FIREBASE_API_KEY: AIzaSyC...
FIREBASE_AUTH_DOMAIN: crm-juridico.firebaseapp.com
FIREBASE_PROJECT_ID: crm-juridico

JWT Secret:
ℹ Gerado automaticamente: a3f8d9e2c1b4a5f6...

✓ Backend .env criado: /home/joao/crm-ju-ai/backend/.env

→ Configurando Frontend (.env)...

✓ Frontend .env criado: /home/joao/crm-ju-ai/frontend/.env

[... continua com setup backend, frontend, docker, migrations ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Setup Concluído!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Ambiente de desenvolvimento configurado com sucesso!

📋 Próximos Passos:

1. Iniciar Backend:
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   ou use: make backend-dev

2. Iniciar Frontend:
   cd frontend
   npm run dev

   ou use: make frontend-dev

3. Acessar Aplicação:
   Frontend: http://localhost:5173
   Backend:  http://localhost:8000
   API Docs: http://localhost:8000/docs
```

**Resultado**: João configurou o ambiente em 5 minutos! 🎉

---

## 🔧 Cenário 2: Desenvolvedor com Problema no Setup

### Situação
Maria tentou configurar manualmente mas algo deu errado. PostgreSQL não conecta.

### Solução

```bash
# 1. Limpar tudo e reconfigurar
./setup-dev.sh --clean
```

### Output Esperado

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           CRM JURÍDICO - Setup de Desenvolvimento             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

⚠ Esta ação irá remover:
  - Arquivos .env
  - Ambiente virtual Python
  - node_modules
  - Containers Docker
  - Volumes Docker

Tem certeza que deseja continuar? [s/N]: s

→ Limpando ambiente...
✓ Ambiente limpo!

Deseja executar o setup completo agora? [S/n]: s

[... executa setup completo ...]
```

**Resultado**: Maria resolveu o problema em 2 minutos! 🎉

---

## ✅ Cenário 3: Validar Setup Existente

### Situação
Pedro configurou o ambiente ontem mas hoje não está funcionando.

### Solução

```bash
./validate-setup.sh
```

### Output Esperado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Validando Setup do Ambiente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Verificando arquivos de configuração...
   ✓ backend/.env existe
   ✓ frontend/.env existe

2. Verificando Backend...
   ✓ Ambiente virtual Python existe
   ✓ Ambiente virtual pode ser ativado
   ✓ FastAPI instalado
   ✓ SQLAlchemy instalado

3. Verificando Frontend...
   ✓ node_modules existe
   ✓ React instalado
   ✓ Vite instalado

4. Verificando Docker...
   ✓ Docker está rodando
   ⚠ PostgreSQL não está rodando
       Execute: docker-compose up -d postgres
   ⚠ Redis não está rodando
       Execute: docker-compose up -d redis

5. Verificando portas...
   ✓ Porta 5173 (Frontend) está livre
   ✓ Porta 8000 (Backend) está livre
   ✓ Porta 5433 (PostgreSQL) está livre
   ✓ Porta 6380 (Redis) está livre

6. Verificando variáveis de ambiente críticas...
   ✓ DB_NAME configurado
   ✓ JWT_SECRET configurado
   ✓ FIREBASE_PROJECT_ID configurado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ Alguns problemas foram encontrados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Ação de Pedro

```bash
# Iniciar serviços Docker
docker-compose up -d postgres redis

# Validar novamente
./validate-setup.sh
```

**Resultado**: Pedro identificou e resolveu o problema em 1 minuto! 🎉

---

## 🚀 Cenário 4: Setup Rápido (Desenvolvedor Experiente)

### Situação
Ana é experiente e quer setup rápido sem interação.

### Solução

```bash
# Setup completo em modo direto
./setup-dev.sh --full
```

### Output Esperado

```
[Executa todas as etapas automaticamente sem pausas]

✓ Ambiente de desenvolvimento configurado com sucesso!
```

**Resultado**: Ana configurou em 3 minutos sem interação! 🎉

---

## 🔍 Cenário 5: Apenas Validar Dependências

### Situação
Carlos quer verificar se tem tudo instalado antes de começar.

### Solução

```bash
./setup-dev.sh --validate
```

### Output Esperado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Validando Dependências do Sistema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Verificando ferramentas necessárias...

✓ Python 3 instalado: Python 3.10.12
✓ Node.js instalado: v18.17.0
✓ npm instalado: 9.6.7
✗ Docker NÃO encontrado
ℹ Instale com: https://docs.docker.com/get-docker/
✗ Docker Compose NÃO encontrado
ℹ Instale com: https://docs.docker.com/compose/install/
✓ Git instalado: git version 2.34.1
✓ Make instalado: GNU Make 4.3

✗ Algumas dependências estão faltando!
ℹ Instale as dependências faltantes e execute o script novamente.
```

**Resultado**: Carlos sabe exatamente o que precisa instalar! 🎉

---

## 🎯 Cenário 6: Configurar Apenas Backend

### Situação
Beatriz só trabalha no backend e não precisa do frontend.

### Solução

```bash
./setup-dev.sh
# Escolhe opção 4 (Apenas Setup Backend)
```

### Output Esperado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Configurando Backend (Python/FastAPI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Criando ambiente virtual Python...
✓ Ambiente virtual criado

→ Instalando dependências Python...
✓ Dependências instaladas

→ Instalando dependências de desenvolvimento...
✓ Dependências de dev instaladas
```

**Resultado**: Beatriz configurou apenas o que precisa! 🎉

---

## 🐳 Cenário 7: Apenas Iniciar Docker

### Situação
Roberto já tem tudo configurado, só precisa iniciar os serviços.

### Solução

```bash
./setup-dev.sh
# Escolhe opção 6 (Apenas Setup Docker)
```

### Output Esperado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Configurando Serviços Docker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Verificando Docker daemon...
✓ Docker está rodando

→ Iniciando serviços (PostgreSQL + Redis)...
→ Aguardando PostgreSQL ficar pronto...
✓ PostgreSQL está pronto

→ Verificando Redis...
✓ Redis está pronto
```

**Resultado**: Roberto iniciou os serviços em 30 segundos! 🎉

---

## 📊 Cenário 8: Executar Migrations

### Situação
Fernanda atualizou os models e precisa criar uma migration.

### Solução

```bash
./setup-dev.sh
# Escolhe opção 7 (Apenas Migrations)
```

### Output Esperado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. Configurando Banco de Dados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Executando migrations do Alembic...
ℹ Nenhuma migration encontrada

Deseja criar a migration inicial? [s/N]: s

→ Criando migration inicial...
✓ Migration inicial criada e executada
```

**Resultado**: Fernanda criou a migration facilmente! 🎉

---

## 🔄 Cenário 9: Workflow Completo

### Situação
Equipe nova começando o projeto do zero.

### Workflow

```bash
# 1. Clone
git clone https://github.com/empresa/crm-ju-ai.git
cd crm-ju-ai

# 2. Setup
./setup-dev.sh --full

# 3. Validar
./validate-setup.sh

# 4. Iniciar Backend (Terminal 1)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 5. Iniciar Frontend (Terminal 2)
cd frontend
npm run dev

# 6. Acessar
# http://localhost:5173
```

**Resultado**: Equipe inteira configurada em 10 minutos! 🎉

---

## 📝 Cenário 10: Troubleshooting

### Situação
Algo deu errado e precisa debugar.

### Solução

```bash
# 1. Ver logs do setup
cat setup.log

# 2. Validar setup
./validate-setup.sh

# 3. Ver logs do Docker
docker-compose logs -f postgres
docker-compose logs -f redis

# 4. Verificar portas
sudo lsof -i :5173
sudo lsof -i :8000
sudo lsof -i :5433
sudo lsof -i :6380

# 5. Se necessário, limpar e reconfigurar
./setup-dev.sh --clean
```

**Resultado**: Problema identificado e resolvido! 🎉

---

## 🎓 Dicas e Truques

### Usar Valores Padrão

Durante o setup interativo, apenas pressione ENTER para usar valores padrão:

```
GCP_PROJECT_ID [crm-juridico-dev]: [ENTER]
GCP_REGION [us-central1]: [ENTER]
DB_USER [postgres]: [ENTER]
```

### Pular Confirmações

Para setup sem pausas:

```bash
./setup-dev.sh --full
```

### Ver Apenas Erros

```bash
./validate-setup.sh 2>&1 | grep "✗"
```

### Logs Detalhados

```bash
tail -f setup.log
```

---

**Estes exemplos cobrem os casos de uso mais comuns!** 🚀
