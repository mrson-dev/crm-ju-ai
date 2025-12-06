"""
Database configuration and session management for Cloud SQL PostgreSQL.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import Session, sessionmaker, declarative_base
from contextlib import contextmanager, asynccontextmanager
from typing import AsyncGenerator, Generator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Base class para modelos SQLAlchemy
Base = declarative_base()

# Engine síncrono (para migrations e scripts)
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Verifica conexão antes de usar
    pool_size=5,
    max_overflow=10,
    echo=settings.ENVIRONMENT == "development"
)

# Engine assíncrono (para API)
async_engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=settings.ENVIRONMENT == "development"
)

# Session makers
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency para obter sessão síncrona do banco de dados.
    Usado em endpoints FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para obter sessão assíncrona do banco de dados.
    Usado em endpoints FastAPI assíncronos.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@contextmanager
def get_db_context():
    """
    Context manager para uso fora de endpoints.
    
    Usage:
        with get_db_context() as db:
            result = db.query(Model).all()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@asynccontextmanager
async def get_async_db_context():
    """
    Async context manager para uso fora de endpoints.
    
    Usage:
        async with get_async_db_context() as db:
            result = await db.execute(select(Model))
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def init_db():
    """
    Inicializa o banco de dados criando todas as tabelas.
    Use apenas para desenvolvimento. Em produção, use Alembic migrations.
    """
    logger.info("Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tabelas criadas com sucesso!")


def drop_db():
    """
    CUIDADO: Remove todas as tabelas do banco de dados.
    Use apenas em desenvolvimento/testes.
    """
    logger.warning("Removendo todas as tabelas do banco de dados...")
    Base.metadata.drop_all(bind=engine)
    logger.info("Tabelas removidas!")
