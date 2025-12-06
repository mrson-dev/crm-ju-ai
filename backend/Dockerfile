# Build stage
FROM python:3.14-slim as builder

WORKDIR /app

# Instala dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements
COPY requirements.txt .

# Instala dependências Python em diretório separado
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.14-slim

WORKDIR /app

# Instala apenas libs de runtime PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia dependências do build stage
COPY --from=builder /root/.local /root/.local

# Adiciona local bin ao PATH
ENV PATH=/root/.local/bin:$PATH

# Copia código
COPY . .

# Cria usuário não-root para segurança
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expõe porta
EXPOSE 8000

# Healthcheck simples (verifica se processo está rodando)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Comando de inicialização
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
