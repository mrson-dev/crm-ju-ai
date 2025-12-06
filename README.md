# CRM Jurídico com IA

Sistema completo de gestão jurídica para escritórios de advocacia, construído com FastAPI e React.

## 🚀 Início Rápido

### Desenvolvimento Local

```bash
./infra/setup-dev.sh
```

### Produção (GCP)

```bash
./infra/setup-production.sh
```

## 📚 Documentação

- **[Guia de Desenvolvimento](docs/SETUP-DEV-README.md)** - Setup completo para desenvolvimento
- **[Guia de Produção](docs/SETUP-PRODUCTION-README.md)** - Deploy em produção (GCP)
- **[Quick Start](docs/QUICKSTART.md)** - Guia rápido de 3 passos
- **[Checklist de Setup](docs/SETUP-CHECKLIST.md)** - Lista de verificação
- **[Changelog](docs/CHANGELOG-LOOP.md)** - Histórico de mudanças

## 🏗️ Estrutura do Projeto

```
crm-ju-ai-master/
├── backend/           # API FastAPI + Python
│   ├── app/          # Código da aplicação
│   ├── alembic/      # Migrations do banco
│   └── tests/        # Testes automatizados
├── frontend/         # Interface React + Vite
│   └── src/          # Código da aplicação
├── infra/            # Scripts de infraestrutura
│   ├── docker-compose.yml
│   ├── setup-dev.sh
│   └── setup-production.sh
├── docs/             # Documentação completa
└── revisao/          # Análises e revisões técnicas
```

## 🛠️ Tecnologias

### Backend
- **FastAPI** - Framework web moderno
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e rate limiting
- **Firebase** - Autenticação
- **Alembic** - Migrations

### Frontend
- **React 18** - Interface de usuário
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **React Query** - Gerenciamento de estado

### Infraestrutura
- **Docker** - Containerização
- **GCP Cloud Run** - Deploy serverless
- **Cloud SQL** - PostgreSQL gerenciado
- **Cloud Storage** - Armazenamento de arquivos

## 📋 Pré-requisitos

### Desenvolvimento
- Python 3.8+
- Node.js 18+
- Docker & Docker Compose
- Git

### Produção
- Conta GCP
- Google Cloud SDK
- Firebase Project
- Domínio (opcional)

## 🔧 Configuração

1. Clone o repositório
2. Copie `.env.example` para `.env`
3. Configure as variáveis de ambiente
4. Execute o script de setup apropriado

## 📖 Documentação Adicional

### Desenvolvimento
- [Setup Visual](docs/SETUP-VISUAL.md) - Guia visual completo
- [Exemplos de Setup](docs/SETUP-EXAMPLES.md) - Exemplos práticos
- [Resumo de Setup](docs/SETUP-SUMMARY.md) - Visão geral

### Produção
- [Quick Start de Produção](docs/PRODUCTION-QUICKSTART.md) - Deploy rápido

### Revisões Técnicas
- [Revisão Completa](revisao/REVISAO_COMPLETA.md) - Análise técnica do projeto
- [Métricas e KPIs](revisao/METRICAS_KPIS.md) - Indicadores de qualidade
- [Roadmap](revisao/ROADMAP_DESENVOLVIMENTO.md) - Plano de desenvolvimento
- [Soluções Práticas](revisao/SOLUCOES_PRATICAS.md) - Implementações recomendadas

## 🔒 Segurança

- Autenticação via Firebase
- Rate limiting configurável
- Sanitização de inputs
- CORS configurado
- Headers de segurança

## 🧪 Testes

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 📝 Licença

[Adicione sua licença aqui]

## 👥 Contribuindo

[Adicione diretrizes de contribuição aqui]

## 📞 Suporte

[Adicione informações de suporte aqui]
