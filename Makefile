.PHONY: help install install-dev setup clean test lint format docker-up docker-down

help:
	@echo "Comandos disponíveis:"
	@echo "  make install          - Instala dependências de produção"
	@echo "  make install-dev      - Instala dependências de desenvolvimento"
	@echo "  make setup            - Setup completo do projeto"
	@echo "  make clean            - Remove arquivos temporários"
	@echo "  make test             - Executa todos os testes"
	@echo "  make test-backend     - Executa testes do backend"
	@echo "  make test-frontend    - Executa testes do frontend"
	@echo "  make lint             - Executa linting em todo o projeto"
	@echo "  make lint-backend     - Executa linting no backend"
	@echo "  make lint-frontend    - Executa linting no frontend"
	@echo "  make format           - Formata código de todo o projeto"
	@echo "  make format-backend   - Formata código do backend"
	@echo "  make format-frontend  - Formata código do frontend"
	@echo "  make docker-up        - Sobe containers Docker"
	@echo "  make docker-down      - Para containers Docker"
	@echo "  make pre-commit       - Instala pre-commit hooks"

install:
	@echo "Instalando dependências de produção..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

install-dev:
	@echo "Instalando dependências de desenvolvimento..."
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install
	pip install pre-commit

setup: install-dev pre-commit
	@echo "Setup completo realizado!"

pre-commit:
	@echo "Instalando pre-commit hooks..."
	pre-commit install
	@echo "Pre-commit hooks instalados!"

clean:
	@echo "Limpando arquivos temporários..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name "node_modules" -prune -o -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "coverage" -exec rm -rf {} + 2>/dev/null || true
	@echo "Limpeza concluída!"

test: test-backend test-frontend

test-backend:
	@echo "Executando testes do backend..."
	cd backend && pytest -v --cov=app --cov-report=html --cov-report=term

test-frontend:
	@echo "Executando testes do frontend..."
	cd frontend && npm run test

test-coverage:
	@echo "Gerando relatório de cobertura..."
	cd backend && pytest --cov=app --cov-report=html
	cd frontend && npm run test:coverage

lint: lint-backend lint-frontend

lint-backend:
	@echo "Executando linting no backend..."
	cd backend && ruff check .
	cd backend && mypy app

lint-frontend:
	@echo "Executando linting no frontend..."
	cd frontend && npm run lint

format: format-backend format-frontend

format-backend:
	@echo "Formatando código do backend..."
	cd backend && ruff check --fix .
	cd backend && black .
	cd backend && isort .

format-frontend:
	@echo "Formatando código do frontend..."
	cd frontend && npm run format

docker-up:
	@echo "Subindo containers Docker..."
	docker-compose up -d

docker-down:
	@echo "Parando containers Docker..."
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-rebuild:
	@echo "Reconstruindo containers Docker..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

migrate:
	@echo "Executando migrações do banco de dados..."
	cd backend && alembic upgrade head

migrate-create:
	@echo "Criando nova migração..."
	@read -p "Nome da migração: " name; \
	cd backend && alembic revision --autogenerate -m "$$name"

dev-backend:
	@echo "Iniciando backend em modo desenvolvimento..."
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@echo "Iniciando frontend em modo desenvolvimento..."
	cd frontend && npm run dev

check: lint test
	@echo "Verificação completa realizada!"
