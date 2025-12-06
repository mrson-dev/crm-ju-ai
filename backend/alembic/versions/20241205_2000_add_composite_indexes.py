"""add composite indexes for performance

Revision ID: 002_indexes
Revises: 001_financial
Create Date: 2024-12-05 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_indexes'
down_revision = '001_financial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Adiciona índices compostos para melhorar performance de queries comuns.
    
    Índices criados:
    - (user_id, created_at) - Para listagens ordenadas por data
    - (user_id, status) - Para filtros por status
    - (user_id, email) - Para busca por email
    - (client_id, created_at) - Para casos por cliente ordenados
    - (case_id, created_at) - Para documentos por caso ordenados
    """
    
    # Índices na tabela clients
    op.create_index(
        'idx_clients_user_created',
        'clients',
        ['user_id', 'created_at'],
        unique=False
    )
    
    op.create_index(
        'idx_clients_user_email',
        'clients',
        ['user_id', 'email'],
        unique=False
    )
    
    # Índices na tabela cases
    op.create_index(
        'idx_cases_user_status',
        'cases',
        ['user_id', 'status'],
        unique=False
    )
    
    op.create_index(
        'idx_cases_user_created',
        'cases',
        ['user_id', 'created_at'],
        unique=False
    )
    
    op.create_index(
        'idx_cases_client_created',
        'cases',
        ['client_id', 'created_at'],
        unique=False
    )
    
    # Índices na tabela documents
    op.create_index(
        'idx_documents_case_created',
        'documents',
        ['case_id', 'created_at'],
        unique=False
    )
    
    op.create_index(
        'idx_documents_user_created',
        'documents',
        ['user_id', 'created_at'],
        unique=False
    )
    
    # Índices na tabela templates
    op.create_index(
        'idx_templates_user_category',
        'templates',
        ['user_id', 'category'],
        unique=False
    )
    
    # Índices financeiros
    op.create_index(
        'idx_fees_user_status',
        'fees',
        ['user_id', 'status'],
        unique=False
    )
    
    op.create_index(
        'idx_fees_client_status',
        'fees',
        ['client_id', 'status'],
        unique=False
    )
    
    op.create_index(
        'idx_expenses_user_status',
        'expenses',
        ['user_id', 'status'],
        unique=False
    )
    
    op.create_index(
        'idx_invoices_user_status',
        'invoices',
        ['user_id', 'status'],
        unique=False
    )


def downgrade() -> None:
    """Remove os índices compostos."""
    
    # Remover índices financeiros
    op.drop_index('idx_invoices_user_status', table_name='invoices')
    op.drop_index('idx_expenses_user_status', table_name='expenses')
    op.drop_index('idx_fees_client_status', table_name='fees')
    op.drop_index('idx_fees_user_status', table_name='fees')
    
    # Remover índices de templates
    op.drop_index('idx_templates_user_category', table_name='templates')
    
    # Remover índices de documents
    op.drop_index('idx_documents_user_created', table_name='documents')
    op.drop_index('idx_documents_case_created', table_name='documents')
    
    # Remover índices de cases
    op.drop_index('idx_cases_client_created', table_name='cases')
    op.drop_index('idx_cases_user_created', table_name='cases')
    op.drop_index('idx_cases_user_status', table_name='cases')
    
    # Remover índices de clients
    op.drop_index('idx_clients_user_email', table_name='clients')
    op.drop_index('idx_clients_user_created', table_name='clients')
