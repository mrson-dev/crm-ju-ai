# CRM Jurídico

Sistema de Gestão Jurídica com IA - Plataforma completa para escritórios de advocacia.

## 🚀 Setup Rápido

### Desenvolvimento Local

```bash
./setup-dev.sh
```

Escolha opção **1** (Setup Completo) e siga as instruções. O script irá:
- ✅ Validar todas as dependências
- ✅ Configurar variáveis de ambiente
- ✅ Instalar dependências do backend e frontend
- ✅ Iniciar serviços Docker (PostgreSQL + Redis)
- ✅ Executar migrations do banco
- ✅ Validar instalação

**Documentação completa**: [SETUP-DEV-README.md](./SETUP-DEV-README.md)

### Produção (GCP + Cloudflare + SMTP)

```bash
./setup-production.sh
```

Script interativo para deploy em produção com:
- ✅ Google Cloud Platform (Cloud Run, Cloud SQL, Storage)
- ✅ Configuração de domínios (Cloudflare)
- ✅ Configuração de emails (SMTP)
- ✅ Deploy automatizado
- ✅ Monitoramento e logs

**Documentação completa**: [SETUP-PRODUCTION-README.md](./SETUP-PRODUCTION-README.md)
**Guia rápido**: [PRODUCTION-QUICKSTART.md](./PRODUCTION-QUICKSTART.md)

## 📋 Pré-requisitos

### Desenvolvimento

- Python 3.8+
- Node.js 18+
- Docker & Docker Compose
- Git
- Make

### Produção

- Google Cloud SDK (gcloud)
- Docker
- Git
- jq, curl, python3
- Contas: GCP, Cloudflare (opcional), SendGrid/SMTP

## 🏃 Desenvolvimento

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
- **Redoc**: http://localhost:8000/redoc

## 🐳 Docker

```bash
# Iniciar todos os serviços
make docker-up
# ou
docker-compose up -d

# Parar serviços
make docker-down
# ou
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar serviço específico
docker-compose restart postgres
```

## 🛠️ Comandos Úteis

```bash
make help           # Ver todos os comandos disponíveis
make setup          # Setup completo
make docker-up      # Subir todos os serviços
make docker-down    # Parar serviços
make test           # Executar testes
make test-coverage  # Testes com cobertura
make lint           # Verificar código
make format         # Formatar código
make clean          # Limpar arquivos temporários
```

## 🔧 Validar Setup

```bash
./validate-setup.sh
```

Verifica se o ambiente foi configurado corretamente.

## 📦 Estrutura do Projeto

```
crm-ju-ai/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── api/         # Endpoints
│   │   ├── core/        # Configurações
│   │   ├── models/      # Modelos SQLAlchemy
│   │   ├── schemas/     # Schemas Pydantic
│   │   └── services/    # Lógica de negócio
│   ├── alembic/         # Migrations
│   ├── tests/           # Testes
│   └── requirements.txt
│
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   ├── hooks/       # Custom hooks
│   │   ├── contexts/    # Contexts
│   │   └── services/    # API services
│   ├── public/
│   └── package.json
│
├── docker-compose.yml   # Serviços Docker
├── Makefile            # Automação
├── setup-dev.sh        # Setup automático
└── validate-setup.sh   # Validação
```

## 🌐 Portas

| Serviço    | Porta | URL                          |
|------------|-------|------------------------------|
| Frontend   | 5173  | http://localhost:5173        |
| Backend    | 8000  | http://localhost:8000        |
| API Docs   | 8000  | http://localhost:8000/docs   |
| PostgreSQL | 5433  | localhost:5433               |
| Redis      | 6380  | localhost:6380               |

## 🧪 Testes

```bash
# Backend
cd backend
source venv/bin/activate
pytest
pytest --cov=app tests/  # Com cobertura

# Frontend
cd frontend
npm test
npm run test:coverage
```

## 📝 Variáveis de Ambiente

Consulte [.env.example](./.env.example) para ver todas as variáveis disponíveis.

### Backend (backend/.env)

```env
# API
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=crm_juridico

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# Firebase
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-domain
FIREBASE_PROJECT_ID=your-project-id

# JWT
JWT_SECRET=your-secret-key
```

### Frontend (frontend/.env)

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite arquivos `.env` no Git
- ⚠️ Use senhas fortes em produção
- ⚠️ Rotacione JWT_SECRET periodicamente
- ⚠️ Configure CORS adequadamente

## 🚨 Troubleshooting

### Docker não está rodando

```bash
sudo systemctl start docker
sudo systemctl status docker
```

### Porta já em uso

```bash
# Verificar porta
sudo lsof -i :5173

# Matar processo
sudo kill -9 <PID>
```

### Reconfigurar ambiente

```bash
./setup-dev.sh --clean
```

### Mais problemas?

Consulte [SETUP-DEV-README.md](./SETUP-DEV-README.md#-troubleshooting)

## 📚 Documentação

- [Setup Completo](./SETUP-DEV-README.md) - Guia detalhado de instalação
- [Guia Rápido](./QUICKSTART.md) - Início rápido
- [Melhorias Frontend](./frontend/MELHORIAS.md) - Otimizações implementadas
- [API Docs](http://localhost:8000/docs) - Documentação interativa da API

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para facilitar a gestão jurídica**
