# 🚀 Guia Rápido - Deploy em Produção

## Setup em 5 Passos

### 1️⃣ Preparação (5 minutos)

```bash
# Instalar Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Instalar outras ferramentas
sudo apt install docker.io git jq curl python3 -y

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2️⃣ Criar Contas (10 minutos)

**Google Cloud Platform:**
- Acesse: https://console.cloud.google.com/
- Crie conta (ou faça login)
- Adicione cartão de crédito
- Ganhe $300 de créditos grátis

**Cloudflare (Opcional):**
- Acesse: https://dash.cloudflare.com/
- Crie conta gratuita
- Adicione seu domínio
- Aponte nameservers

**SendGrid (Email):**
- Acesse: https://sendgrid.com/
- Crie conta gratuita (100 emails/dia)
- Crie API Key em Settings > API Keys

**Firebase:**
- Acesse: https://console.firebase.google.com/
- Crie projeto (ou use o mesmo do GCP)
- Ative Authentication
- Configure métodos de login

### 3️⃣ Executar Script (30 minutos)

```bash
cd crm-ju-ai
./setup-production.sh
```

Escolha opção **1** (Setup Completo) e siga as instruções.

### 4️⃣ Configurar Domínio (5 minutos)

Se você tem um domínio:

```bash
# No menu do script, escolha:
# 17) Configurar DNS no Cloudflare
# 18) Configurar Domínios Customizados
```

### 5️⃣ Testar (5 minutos)

```bash
# Acessar URLs
curl https://api.seudominio.com/health
curl https://app.seudominio.com

# Ou URLs do Cloud Run
curl https://crm-juridico-api-xxx.a.run.app/health
```

---

## ✅ Checklist Rápido

### Antes de Começar

- [ ] Conta GCP criada
- [ ] Cartão de crédito adicionado
- [ ] gcloud CLI instalado
- [ ] Docker instalado
- [ ] Domínio registrado (opcional)
- [ ] Conta Cloudflare (opcional)
- [ ] Conta SendGrid criada
- [ ] Firebase configurado

### Durante o Setup

- [ ] Autenticou no GCP
- [ ] Criou/selecionou projeto
- [ ] Habilitou APIs
- [ ] Vinculou faturamento
- [ ] Configurou região (southamerica-east1)
- [ ] Criou Cloud SQL
- [ ] Criou Cloud Storage
- [ ] Configurou Firebase
- [ ] Configurou SMTP
- [ ] Testou envio de email
- [ ] Deploy backend OK
- [ ] Deploy frontend OK
- [ ] Migrations executadas
- [ ] DNS configurado (se aplicável)

### Após o Setup

- [ ] Backend acessível
- [ ] Frontend acessível
- [ ] Login funciona
- [ ] API responde
- [ ] Emails sendo enviados
- [ ] Logs funcionando
- [ ] Monitoramento ativo

---

## 🎯 Comandos Úteis

### Ver Logs

```bash
# Backend
gcloud run services logs read crm-juridico-api --region=southamerica-east1

# Frontend
gcloud run services logs read crm-juridico-app --region=southamerica-east1
```

### Ver Status

```bash
# Serviços Cloud Run
gcloud run services list

# Instâncias Cloud SQL
gcloud sql instances list

# Buckets
gsutil ls
```

### Conectar ao Banco

```bash
gcloud sql connect crm-juridico-db --user=postgres
```

### Atualizar Código

```bash
# Fazer alterações no código
git add .
git commit -m "Update"
git push

# Rebuild e redeploy
./setup-production.sh
# Escolha opção 14 (Deploy Backend) ou 15 (Deploy Frontend)
```

---

## 💰 Custos Esperados

### Primeiro Mês (Com Créditos)

- **Custo**: $0 (usando créditos de $300)
- **Créditos restantes**: ~$283

### Meses Seguintes (Tráfego Baixo)

- **Cloud SQL**: ~$7/mês (db-f1-micro)
- **Cloud Run**: ~$10/mês (tier gratuito + excedente)
- **Storage**: ~$0.20/mês
- **Total**: **~$17/mês**

### Escala (Tráfego Médio)

- **Cloud SQL**: ~$25/mês (db-g1-small)
- **Cloud Run**: ~$30/mês
- **Storage + CDN**: ~$10/mês
- **Total**: **~$65/mês**

---

## 🚨 Problemas Comuns

### "gcloud: command not found"

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### "Permission denied (docker)"

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### "Billing not enabled"

```bash
# Acesse: https://console.cloud.google.com/billing
# Vincule uma conta de faturamento ao projeto
```

### "API not enabled"

```bash
# Execute novamente a opção 5 (Habilitar APIs)
# Ou manualmente:
gcloud services enable run.googleapis.com
```

### "Cloud SQL connection failed"

```bash
# Verificar instância
gcloud sql instances describe crm-juridico-db

# Reiniciar instância
gcloud sql instances restart crm-juridico-db
```

### "DNS not resolving"

```bash
# Aguardar propagação (até 48h)
# Verificar:
dig api.seudominio.com
nslookup api.seudominio.com

# Verificar Cloudflare:
# https://dash.cloudflare.com/ > DNS
```

---

## 📞 Suporte

### Documentação

- [Setup Completo](./SETUP-PRODUCTION-README.md)
- [Troubleshooting Detalhado](./SETUP-PRODUCTION-README.md#-troubleshooting)

### Logs

```bash
# Ver log do script
cat setup-production.log

# Ver configurações
cat .production-config
```

### Comunidade

- Stack Overflow: [google-cloud-platform](https://stackoverflow.com/questions/tagged/google-cloud-platform)
- Reddit: [r/googlecloud](https://reddit.com/r/googlecloud)

---

## 🎉 Pronto!

Sua aplicação está em produção! 🚀

**URLs:**
- Backend: `https://api.seudominio.com`
- Frontend: `https://app.seudominio.com`
- Console GCP: `https://console.cloud.google.com/`

**Próximos Passos:**
1. Configure CI/CD (GitHub Actions)
2. Configure backups automáticos
3. Configure monitoramento de uptime
4. Configure alertas por email
5. Documente processos internos

---

**Tempo total**: ~1 hora
**Dificuldade**: Fácil (script automatizado)
**Resultado**: Aplicação em produção! 🎊
