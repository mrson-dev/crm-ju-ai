# 🚀 Setup de Produção - GCP + Cloudflare + SMTP

Script interativo e didático para automatizar a configuração completa do ambiente de produção do CRM Jurídico no Google Cloud Platform, incluindo configuração de domínios no Cloudflare e SMTP para emails.

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Instalação de Ferramentas](#-instalação-de-ferramentas)
- [Uso](#-uso)
- [Funcionalidades](#-funcionalidades)
- [Fluxo Completo](#-fluxo-completo)
- [Configurações](#-configurações)
- [Troubleshooting](#-troubleshooting)
- [Custos Estimados](#-custos-estimados)

---

## 📋 Pré-requisitos

### Contas Necessárias

1. **Google Cloud Platform**
   - Conta Google
   - Cartão de crédito (para faturamento)
   - Créditos gratuitos: $300 por 90 dias

2. **Cloudflare** (Opcional)
   - Conta gratuita
   - Domínio registrado
   - Nameservers apontados para Cloudflare

3. **Provedor SMTP**
   - SendGrid (100 emails/dia grátis) - Recomendado
   - Mailgun (100 emails/dia grátis)
   - Amazon SES
   - Gmail (apenas desenvolvimento)

4. **Firebase**
   - Projeto Firebase (pode usar o mesmo do GCP)
   - Authentication habilitado

### Ferramentas Locais

- **Google Cloud SDK (gcloud)** - CLI do GCP
- **Docker** - Para build de imagens
- **Git** - Controle de versão
- **jq** - Parser JSON
- **curl** - Requisições HTTP
- **Python 3** - Para testes SMTP

---

## 🛠️ Instalação de Ferramentas

### Ubuntu/Debian

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Google Cloud SDK
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt update && sudo apt install google-cloud-sdk -y

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Outras ferramentas
sudo apt install git jq curl python3 python3-pip -y

# Reiniciar sessão para aplicar grupo docker
newgrp docker
```

### macOS

```bash
# Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Google Cloud SDK
brew install --cask google-cloud-sdk

# Docker Desktop
brew install --cask docker

# Outras ferramentas
brew install git jq curl python3
```

### Verificar Instalação

```bash
gcloud --version
docker --version
git --version
jq --version
curl --version
python3 --version
```

---

## 🎯 Uso

### Modo Interativo (Recomendado)

```bash
./setup-production.sh
```

### Menu Principal

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     CRM JURÍDICO - Setup de Produção (GCP)                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Escolha uma opção:

  Setup Inicial:
    1) Setup Completo (Recomendado)
    2) Validar Ferramentas

  Google Cloud Platform:
    3) Autenticar no GCP
    4) Configurar Projeto
    5) Habilitar APIs
    6) Configurar Faturamento
    7) Configurar Região

  Infraestrutura:
    8) Configurar Cloud SQL (PostgreSQL)
    9) Configurar Cloud Storage
   10) Configurar Secret Manager

  Serviços Externos:
   11) Configurar Firebase
   12) Configurar Cloudflare (DNS)
   13) Configurar SMTP (Email)

  Deploy:
   14) Deploy Backend (Cloud Run)
   15) Deploy Frontend (Cloud Run)
   16) Executar Migrations

  Finalização:
   17) Configurar DNS no Cloudflare
   18) Configurar Domínios Customizados
   19) Configurar Monitoramento
   20) Ver Resumo Final

  Utilitários:
   21) Ver Configurações Salvas
   22) Limpar Configurações

    0) Sair
```

---

## ✨ Funcionalidades

### 1. Validação de Ferramentas

Verifica se todas as ferramentas necessárias estão instaladas:
- ✅ Google Cloud SDK (gcloud)
- ✅ Docker
- ✅ Git
- ✅ jq
- ✅ curl

### 2. Autenticação GCP

- Login interativo no Google Cloud
- Seleção de conta
- Configuração de credenciais

### 3. Projeto GCP

- Listar projetos existentes
- Criar novo projeto
- Configurar projeto padrão

### 4. Habilitar APIs

APIs habilitadas automaticamente:
- Cloud Run API
- Cloud SQL Admin API
- Cloud Storage API
- Secret Manager API
- Cloud Build API
- Container Registry API
- Cloud Logging API
- Cloud Monitoring API
- Compute Engine API
- Service Networking API

### 5. Configuração de Faturamento

- Listar contas de faturamento
- Vincular projeto à conta
- Verificação de créditos

### 6. Região e Zona

Regiões recomendadas:
- **southamerica-east1** (São Paulo) - Recomendado para Brasil
- us-east1 (Carolina do Sul)
- us-central1 (Iowa)

### 7. Cloud SQL (PostgreSQL)

- Criação de instância PostgreSQL
- Configuração de versão (POSTGRES_15)
- Seleção de tier (db-f1-micro, db-g1-small, etc)
- Criação de banco de dados
- Configuração de usuário e senha
- Conexão via Unix socket (sem IP público)

### 8. Cloud Storage

- Criação de bucket
- Configuração de localização
- Configuração de CORS
- Permissões de acesso

### 9. Secret Manager

Secrets criados automaticamente:
- `jwt-secret` - Chave JWT (gerada automaticamente)
- `db-password` - Senha do banco
- `firebase-api-key` - API Key do Firebase
- `smtp-password` - Senha SMTP

### 10. Firebase Authentication

- Configuração interativa
- Suporte para múltiplos métodos de login
- Integração com GCP

### 11. Cloudflare (DNS)

- Autenticação via API Key
- Obtenção de Zone ID
- Criação de registros DNS:
  - `api.seudominio.com` → Backend
  - `app.seudominio.com` → Frontend
  - `www.seudominio.com` → Frontend
- Proxy habilitado (CDN + SSL)

### 12. SMTP (Email)

Provedores suportados:
- **SendGrid** (Recomendado)
- Mailgun
- Amazon SES
- Gmail SMTP
- Outro provedor customizado

Funcionalidades:
- Configuração interativa
- Teste de envio de email
- Armazenamento seguro de credenciais

### 13. Deploy Backend

- Build de imagem Docker via Cloud Build
- Deploy no Cloud Run
- Configuração de variáveis de ambiente
- Injeção de secrets
- Conexão com Cloud SQL
- URL pública gerada automaticamente

### 14. Deploy Frontend

- Build de imagem Docker com variáveis de ambiente
- Deploy no Cloud Run
- Configuração de API URL
- Configuração Firebase
- URL pública gerada automaticamente

### 15. Migrations

- Execução via Cloud Run Job
- Alembic upgrade head
- Conexão segura com Cloud SQL

### 16. Domínios Customizados

- Mapeamento de domínios no Cloud Run
- Certificados SSL automáticos
- Configuração de múltiplos domínios

### 17. Monitoramento

- Dashboards automáticos
- Alertas configurados:
  - Erros 5xx
  - Latência alta
  - CPU/Memória alta

---

## 🔄 Fluxo Completo

### Setup Completo (Opção 1)

```
1. Validar Ferramentas
   └─ Verificar gcloud, docker, git, jq, curl

2. Autenticar no GCP
   └─ gcloud auth login

3. Configurar Projeto
   ├─ Listar projetos existentes
   └─ Criar novo ou selecionar existente

4. Habilitar APIs
   └─ Habilitar 10+ APIs necessárias

5. Configurar Faturamento
   └─ Vincular conta de faturamento

6. Configurar Região
   └─ Selecionar região (southamerica-east1)

7. Cloud SQL
   ├─ Criar instância PostgreSQL
   ├─ Configurar usuário e senha
   └─ Criar banco de dados

8. Cloud Storage
   ├─ Criar bucket
   └─ Configurar CORS

9. Secret Manager
   ├─ Gerar JWT Secret
   ├─ Salvar senha do banco
   └─ Salvar credenciais Firebase e SMTP

10. Firebase
    └─ Configurar credenciais

11. Cloudflare (Opcional)
    ├─ Autenticar
    └─ Obter Zone ID

12. SMTP
    ├─ Configurar provedor
    └─ Testar envio de email

13. Deploy Backend
    ├─ Build imagem Docker
    ├─ Deploy no Cloud Run
    └─ Obter URL

14. Deploy Frontend
    ├─ Build imagem Docker
    ├─ Deploy no Cloud Run
    └─ Obter URL

15. Migrations
    └─ Executar alembic upgrade head

16. DNS Cloudflare (Se configurado)
    ├─ Criar registro api.dominio.com
    ├─ Criar registro app.dominio.com
    └─ Criar registro www.dominio.com

17. Domínios Customizados
    ├─ Mapear api.dominio.com
    ├─ Mapear app.dominio.com
    └─ Mapear www.dominio.com

18. Monitoramento
    └─ Configurar alertas

19. Resumo Final
    └─ Exibir todas as URLs e configurações
```

---

## ⚙️ Configurações

### Arquivo de Configuração

Todas as configurações são salvas em `.production-config`:

```bash
GCP_PROJECT_ID=crm-juridico-prod
GCP_REGION=southamerica-east1
GCP_ZONE=southamerica-east1-a
CLOUDSQL_INSTANCE=crm-juridico-db
CLOUDSQL_CONNECTION_NAME=crm-juridico-prod:southamerica-east1:crm-juridico-db
DB_NAME=crm_juridico
DB_USER=postgres
BUCKET_NAME=crm-juridico-prod-storage
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=crm-juridico-prod.firebaseapp.com
FIREBASE_PROJECT_ID=crm-juridico-prod
DOMAIN=crm-juridico.com.br
CLOUDFLARE_EMAIL=admin@crm-juridico.com.br
CLOUDFLARE_ZONE_ID=abc123...
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_FROM_EMAIL=noreply@crm-juridico.com.br
SMTP_FROM_NAME=CRM Jurídico
SERVICE_NAME=crm-juridico-api
FRONTEND_SERVICE_NAME=crm-juridico-app
BACKEND_URL=https://crm-juridico-api-xxx-uc.a.run.app
FRONTEND_URL=https://crm-juridico-app-xxx-uc.a.run.app
```

### Logs

Todos os eventos são registrados em `setup-production.log`:

```bash
[2024-01-15 10:30:00] GCP: Autenticado
[2024-01-15 10:31:00] GCP: Projeto crm-juridico-prod
[2024-01-15 10:32:00] GCP: APIs habilitadas
[2024-01-15 10:35:00] GCP: Cloud SQL criado - crm-juridico-db
[2024-01-15 10:40:00] Cloud Run: Backend deployado - https://...
```

---

## 🐛 Troubleshooting

### Erro: gcloud not found

```bash
# Instalar Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Erro: Permission denied (Docker)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Erro: API not enabled

```bash
# Habilitar API manualmente
gcloud services enable run.googleapis.com --project=SEU_PROJETO
```

### Erro: Billing not enabled

```bash
# Vincular conta de faturamento
gcloud billing projects link SEU_PROJETO --billing-account=ACCOUNT_ID
```

### Erro: Cloud SQL connection failed

```bash
# Verificar instância
gcloud sql instances describe INSTANCE_NAME

# Verificar conexão
gcloud sql connect INSTANCE_NAME --user=postgres
```

### Erro: Cloud Run deploy failed

```bash
# Ver logs
gcloud run services logs read SERVICE_NAME --region=REGION

# Verificar imagem
gcloud container images list
```

### Erro: DNS not propagating

```bash
# Verificar registros DNS
dig api.seudominio.com
nslookup api.seudominio.com

# Aguardar propagação (pode levar até 48h)
```

### Erro: SMTP test failed

```bash
# Verificar credenciais
# Verificar firewall/portas
# Testar com telnet
telnet smtp.sendgrid.net 587
```

---

## 💰 Custos Estimados (GCP)

### Tier Gratuito (Always Free)

- Cloud Run: 2 milhões de requisições/mês
- Cloud Storage: 5 GB
- Cloud Build: 120 minutos/dia

### Custos Mensais Estimados

#### Configuração Mínima (Desenvolvimento/Staging)

| Serviço | Configuração | Custo/Mês |
|---------|-------------|-----------|
| Cloud SQL | db-f1-micro (0.6 GB RAM) | ~$7 |
| Cloud Run Backend | 1 instância, 512MB RAM | ~$5 |
| Cloud Run Frontend | 1 instância, 512MB RAM | ~$5 |
| Cloud Storage | 10 GB | ~$0.20 |
| **Total** | | **~$17/mês** |

#### Configuração Produção (Pequeno Porte)

| Serviço | Configuração | Custo/Mês |
|---------|-------------|-----------|
| Cloud SQL | db-g1-small (1.7 GB RAM) | ~$25 |
| Cloud Run Backend | 2-5 instâncias, 1GB RAM | ~$20 |
| Cloud Run Frontend | 2-5 instâncias, 512MB RAM | ~$10 |
| Cloud Storage | 50 GB | ~$1 |
| Cloud CDN | 100 GB tráfego | ~$8 |
| **Total** | | **~$64/mês** |

#### Configuração Produção (Médio Porte)

| Serviço | Configuração | Custo/Mês |
|---------|-------------|-----------|
| Cloud SQL | db-n1-standard-1 (3.75 GB RAM) | ~$50 |
| Cloud Run Backend | 5-10 instâncias, 2GB RAM | ~$50 |
| Cloud Run Frontend | 5-10 instâncias, 1GB RAM | ~$25 |
| Cloud Storage | 200 GB | ~$4 |
| Cloud CDN | 500 GB tráfego | ~$40 |
| **Total** | | **~$169/mês** |

### Custos Adicionais

- **Cloudflare**: Gratuito (plano Free)
- **SendGrid**: Gratuito até 100 emails/dia
- **Firebase Auth**: Gratuito até 50k MAU

### Dicas para Reduzir Custos

1. **Use tier gratuito do Cloud Run** (2M requisições/mês)
2. **Configure auto-scaling** para escalar para zero quando não houver tráfego
3. **Use Cloud CDN** para reduzir requisições ao backend
4. **Configure lifecycle policies** no Cloud Storage
5. **Use Cloud SQL Proxy** para conexões eficientes
6. **Monitore custos** no GCP Console regularmente

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Google Cloud Run](https://cloud.google.com/run/docs)
- [Cloud SQL](https://cloud.google.com/sql/docs)
- [Cloud Storage](https://cloud.google.com/storage/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloudflare API](https://api.cloudflare.com/)
- [SendGrid API](https://docs.sendgrid.com/)

### Tutoriais

- [Deploy FastAPI no Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-python-service)
- [Conectar Cloud Run ao Cloud SQL](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Configurar domínio customizado](https://cloud.google.com/run/docs/mapping-custom-domains)

### Comunidade

- [Stack Overflow - Google Cloud](https://stackoverflow.com/questions/tagged/google-cloud-platform)
- [Reddit - r/googlecloud](https://reddit.com/r/googlecloud)
- [Discord - GCP Community](https://discord.gg/googlecloud)

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca commite** `.production-config` no Git
2. **Use Secret Manager** para todas as credenciais
3. **Habilite 2FA** em todas as contas (GCP, Cloudflare, etc)
4. **Rotacione secrets** periodicamente
5. **Configure IAM** com princípio de menor privilégio
6. **Habilite Cloud Armor** para proteção DDoS
7. **Configure alertas** de segurança
8. **Faça backups** regulares do banco de dados
9. **Use HTTPS** em todos os endpoints
10. **Monitore logs** de acesso e erros

### Checklist de Segurança

- [ ] 2FA habilitado no GCP
- [ ] 2FA habilitado no Cloudflare
- [ ] Secrets no Secret Manager (não em variáveis de ambiente)
- [ ] Cloud SQL sem IP público
- [ ] Bucket com permissões restritas
- [ ] CORS configurado corretamente
- [ ] Rate limiting configurado
- [ ] Logs de auditoria habilitados
- [ ] Backups automáticos configurados
- [ ] Alertas de segurança configurados

---

## 🎉 Conclusão

Este script automatiza completamente o setup de produção do CRM Jurídico, incluindo:

- ✅ Infraestrutura GCP (Cloud Run, Cloud SQL, Storage)
- ✅ Configuração de domínios (Cloudflare)
- ✅ Configuração de emails (SMTP)
- ✅ Deploy automatizado
- ✅ Monitoramento e logs
- ✅ Segurança (Secret Manager)

**Tempo estimado**: 30-45 minutos para setup completo

**Resultado**: Aplicação em produção, segura, escalável e monitorada!

---

**Desenvolvido com ❤️ para facilitar deploys em produção!**
