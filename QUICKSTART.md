# 🚀 Guia Rápido de Início

## Setup em 3 Passos

### 1️⃣ Clone o Repositório

```bash
git clone <repository-url>
cd crm-ju-ai
```

### 2️⃣ Execute o Setup Automático

```bash
./setup-dev.sh
```

Escolha opção **1** (Setup Completo) e siga as instruções.

### 3️⃣ Inicie os Serviços

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### ✅ Pronto!

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Comandos Úteis

```bash
# Ver todos os comandos disponíveis
make help

# Iniciar tudo com Docker
make docker-up

# Parar tudo
make docker-down

# Executar testes
make test

# Verificar código
make lint

# Formatar código
make format
```

---

## Problemas?

Consulte [SETUP-DEV-README.md](./SETUP-DEV-README.md) para documentação completa.

### Erros Comuns

**Docker não está rodando:**
```bash
sudo systemctl start docker
```

**Porta já em uso:**
```bash
sudo lsof -i :5173  # Verificar porta
sudo kill -9 <PID>  # Matar processo
```

**Reconfigurar tudo:**
```bash
./setup-dev.sh --clean
```

---

**Desenvolvido com ❤️ para facilitar sua vida!**
