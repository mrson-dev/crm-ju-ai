# ✅ Checklist de Setup - CRM Jurídico

Use este checklist para garantir que tudo foi configurado corretamente.

## 📋 Pré-Setup

- [ ] Git instalado (`git --version`)
- [ ] Python 3.8+ instalado (`python3 --version`)
- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Docker instalado (`docker --version`)
- [ ] Docker Compose instalado (`docker-compose --version`)
- [ ] Make instalado (`make --version`)
- [ ] Docker daemon rodando (`docker info`)

## 🚀 Executar Setup

- [ ] Clonou o repositório
- [ ] Navegou para o diretório do projeto (`cd crm-ju-ai`)
- [ ] Tornou o script executável (`chmod +x setup-dev.sh`)
- [ ] Executou o setup (`./setup-dev.sh`)
- [ ] Escolheu opção 1 (Setup Completo)

## 🔧 Configuração de Variáveis

### Backend (.env)

- [ ] GCP_PROJECT_ID configurado
- [ ] GCP_REGION configurado
- [ ] GCS_BUCKET_NAME configurado
- [ ] DB_USER configurado
- [ ] DB_PASSWORD configurado
- [ ] DB_NAME configurado
- [ ] DB_HOST configurado (localhost para dev)
- [ ] DB_PORT configurado (5433 para dev)
- [ ] REDIS_HOST configurado (localhost para dev)
- [ ] REDIS_PORT configurado (6380 para dev)
- [ ] FIREBASE_API_KEY configurado
- [ ] FIREBASE_AUTH_DOMAIN configurado
- [ ] FIREBASE_PROJECT_ID configurado
- [ ] JWT_SECRET gerado automaticamente

### Frontend (.env)

- [ ] VITE_API_URL configurado (http://localhost:8000/api/v1)
- [ ] VITE_FIREBASE_API_KEY configurado
- [ ] VITE_FIREBASE_AUTH_DOMAIN configurado
- [ ] VITE_FIREBASE_PROJECT_ID configurado

## 📦 Instalação de Dependências

### Backend

- [ ] Ambiente virtual Python criado (`backend/venv/`)
- [ ] Dependências instaladas (`requirements.txt`)
- [ ] Dependências de dev instaladas (`requirements-dev.txt`)
- [ ] FastAPI instalado
- [ ] SQLAlchemy instalado
- [ ] Alembic instalado

### Frontend

- [ ] node_modules criado (`frontend/node_modules/`)
- [ ] React instalado
- [ ] Vite instalado
- [ ] React Router instalado
- [ ] React Query instalado
- [ ] Firebase instalado

## 🐳 Docker

- [ ] PostgreSQL container iniciado
- [ ] PostgreSQL aceita conexões (`pg_isready`)
- [ ] Redis container iniciado
- [ ] Redis aceita conexões (`redis-cli ping`)
- [ ] Volumes criados

## 🗄️ Banco de Dados

- [ ] Migrations executadas (`alembic upgrade head`)
- [ ] Tabelas criadas
- [ ] Conexão com banco funciona

## ✅ Validação

- [ ] Executou `./validate-setup.sh`
- [ ] Todos os checks passaram
- [ ] Nenhum erro crítico encontrado

## 🚀 Iniciar Serviços

### Backend

- [ ] Navegou para `backend/`
- [ ] Ativou ambiente virtual (`source venv/bin/activate`)
- [ ] Iniciou servidor (`uvicorn app.main:app --reload`)
- [ ] Backend acessível em http://localhost:8000
- [ ] API Docs acessível em http://localhost:8000/docs

### Frontend

- [ ] Navegou para `frontend/`
- [ ] Iniciou dev server (`npm run dev`)
- [ ] Frontend acessível em http://localhost:5173
- [ ] Página carrega sem erros

## 🔍 Testes Funcionais

### Backend

- [ ] Acessa http://localhost:8000/docs
- [ ] Swagger UI carrega
- [ ] Endpoints aparecem
- [ ] Health check funciona (`GET /health`)

### Frontend

- [ ] Acessa http://localhost:5173
- [ ] Página de login carrega
- [ ] Não há erros no console
- [ ] Assets carregam corretamente

### Integração

- [ ] Frontend consegue fazer requisições ao backend
- [ ] CORS configurado corretamente
- [ ] Autenticação Firebase funciona

## 🔒 Segurança

- [ ] Arquivos `.env` NÃO estão no Git
- [ ] `.env` está no `.gitignore`
- [ ] Senhas fortes em produção (não usar padrões)
- [ ] JWT_SECRET é único e seguro

## 📝 Documentação

- [ ] Leu [SETUP-DEV-README.md](./SETUP-DEV-README.md)
- [ ] Leu [QUICKSTART.md](./QUICKSTART.md)
- [ ] Conhece os comandos do Makefile (`make help`)
- [ ] Sabe onde encontrar logs (`setup.log`)

## 🛠️ Comandos Úteis Testados

- [ ] `make help` funciona
- [ ] `make docker-up` funciona
- [ ] `make docker-down` funciona
- [ ] `make test` funciona (se houver testes)
- [ ] `make lint` funciona
- [ ] `make format` funciona

## 🎯 Próximos Passos

- [ ] Criou branch de desenvolvimento
- [ ] Configurou Git user (`git config user.name/email`)
- [ ] Instalou extensões do VSCode (se usar)
- [ ] Configurou pre-commit hooks
- [ ] Leu documentação da API
- [ ] Entendeu estrutura do projeto

## 🐛 Troubleshooting

Se algo não funcionar:

### Problema: Docker não inicia

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

- [ ] Docker iniciado
- [ ] Docker habilitado no boot

### Problema: Porta em uso

```bash
sudo lsof -i :5173  # Frontend
sudo lsof -i :8000  # Backend
sudo lsof -i :5433  # PostgreSQL
sudo lsof -i :6380  # Redis
```

- [ ] Portas verificadas
- [ ] Processos conflitantes mortos

### Problema: Permissão negada

```bash
chmod +x setup-dev.sh
chmod +x validate-setup.sh
```

- [ ] Scripts executáveis

### Problema: Módulo Python não encontrado

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

- [ ] Ambiente virtual ativado
- [ ] Dependências reinstaladas

### Problema: Módulo Node não encontrado

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

- [ ] node_modules removido
- [ ] Dependências reinstaladas

### Problema: PostgreSQL não conecta

```bash
docker-compose restart postgres
docker-compose logs postgres
```

- [ ] PostgreSQL reiniciado
- [ ] Logs verificados

### Problema: Precisa reconfigurar tudo

```bash
./setup-dev.sh --clean
```

- [ ] Ambiente limpo
- [ ] Setup reexecutado

## 📊 Status Final

### ✅ Tudo Funcionando

- [ ] Backend rodando sem erros
- [ ] Frontend rodando sem erros
- [ ] Docker services rodando
- [ ] Banco de dados conectado
- [ ] Redis conectado
- [ ] Autenticação funciona
- [ ] API responde corretamente

### 🎉 Pronto para Desenvolver!

Parabéns! Seu ambiente está configurado e você está pronto para começar a desenvolver.

---

## 📞 Precisa de Ajuda?

1. **Documentação**: [SETUP-DEV-README.md](./SETUP-DEV-README.md)
2. **Exemplos**: [SETUP-EXAMPLES.md](./SETUP-EXAMPLES.md)
3. **Logs**: `cat setup.log`
4. **Validação**: `./validate-setup.sh`
5. **Reconfigurar**: `./setup-dev.sh --clean`

---

**Data do Setup**: _______________

**Configurado por**: _______________

**Tempo total**: _______________ minutos

**Problemas encontrados**: 

_______________________________________________

_______________________________________________

_______________________________________________

**Notas adicionais**:

_______________________________________________

_______________________________________________

_______________________________________________
