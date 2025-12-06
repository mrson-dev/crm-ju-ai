"""Add financial models (Fee, Expense, Invoice, Payment)

Revision ID: 001_financial
Revises: 
Create Date: 2025-12-05 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_financial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types usando SQL direto para evitar problemas com checkfirst
    conn = op.get_bind()
    
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE feetypeenum AS ENUM ('fixed', 'hourly', 'success', 'contingency');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE feestatusenum AS ENUM ('pending', 'partial', 'paid', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE expensecategoryenum AS ENUM ('custas', 'viagem', 'copia', 'cartorio', 'perito', 'correio', 'outros');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE expensestatusenum AS ENUM ('pending', 'approved', 'reimbursed', 'rejected');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE invoicestatusenum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE paymentmethodenum AS ENUM ('pix', 'boleto', 'cartao', 'transferencia', 'dinheiro');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    # Criar ENUMs do PostgreSQL para usar nas tabelas
    fee_type_enum = postgresql.ENUM('fixed', 'hourly', 'success', 'contingency', name='feetypeenum', create_type=False)
    fee_status_enum = postgresql.ENUM('pending', 'partial', 'paid', 'cancelled', name='feestatusenum', create_type=False)
    expense_category_enum = postgresql.ENUM('custas', 'viagem', 'copia', 'cartorio', 'perito', 'correio', 'outros', name='expensecategoryenum', create_type=False)
    expense_status_enum = postgresql.ENUM('pending', 'approved', 'reimbursed', 'rejected', name='expensestatusenum', create_type=False)
    invoice_status_enum = postgresql.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', name='invoicestatusenum', create_type=False)
    payment_method_enum = postgresql.ENUM('pix', 'boleto', 'cartao', 'transferencia', 'dinheiro', name='paymentmethodenum', create_type=False)
    
    # Create fees table
    op.create_table(
        'fees',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.String(length=50), nullable=False),
        sa.Column('client_id', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('fee_type', fee_type_enum, nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('installments', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', fee_status_enum, nullable=False, server_default='pending'),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('paid_amount_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount_cents >= 0', name='fees_amount_positive'),
        sa.CheckConstraint('paid_amount_cents >= 0', name='fees_paid_amount_positive'),
        sa.CheckConstraint('installments > 0', name='fees_installments_positive')
    )
    op.create_index('ix_fees_case_id', 'fees', ['case_id'])
    op.create_index('ix_fees_client_id', 'fees', ['client_id'])
    op.create_index('ix_fees_status', 'fees', ['status'])
    op.create_index('ix_fees_due_date', 'fees', ['due_date'])
    
    # Create expenses table
    op.create_table(
        'expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.String(length=50), nullable=True),
        sa.Column('category', expense_category_enum, nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('status', expense_status_enum, nullable=False, server_default='pending'),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('receipt_url', sa.String(length=500), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('approved_by', sa.String(length=50), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount_cents >= 0', name='expenses_amount_positive')
    )
    op.create_index('ix_expenses_case_id', 'expenses', ['case_id'])
    op.create_index('ix_expenses_category', 'expenses', ['category'])
    op.create_index('ix_expenses_status', 'expenses', ['status'])
    op.create_index('ix_expenses_date', 'expenses', ['date'])
    
    # Create invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(length=50), nullable=False),
        sa.Column('client_id', sa.String(length=50), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', invoice_status_enum, nullable=False, server_default='draft'),
        sa.Column('subtotal_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tax_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('discount_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number', name='uq_invoices_invoice_number'),
        sa.CheckConstraint('subtotal_cents >= 0', name='invoices_subtotal_positive'),
        sa.CheckConstraint('tax_cents >= 0', name='invoices_tax_positive'),
        sa.CheckConstraint('discount_cents >= 0', name='invoices_discount_positive'),
        sa.CheckConstraint('total_cents >= 0', name='invoices_total_positive')
    )
    op.create_index('ix_invoices_client_id', 'invoices', ['client_id'])
    op.create_index('ix_invoices_status', 'invoices', ['status'])
    op.create_index('ix_invoices_due_date', 'invoices', ['due_date'])
    
    # Create payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fee_id', sa.Integer(), nullable=True),
        sa.Column('invoice_id', sa.Integer(), nullable=True),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('payment_method', payment_method_enum, nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['fee_id'], ['fees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.CheckConstraint('amount_cents > 0', name='payments_amount_positive'),
        sa.CheckConstraint('(fee_id IS NOT NULL) OR (invoice_id IS NOT NULL)', name='payments_has_reference')
    )
    op.create_index('ix_payments_fee_id', 'payments', ['fee_id'])
    op.create_index('ix_payments_invoice_id', 'payments', ['invoice_id'])
    op.create_index('ix_payments_payment_date', 'payments', ['payment_date'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('payments')
    op.drop_table('invoices')
    op.drop_table('expenses')
    op.drop_table('fees')
    
    # Drop enum types
    sa.Enum(name='paymentmethodenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='invoicestatusenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='expensestatusenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='expensecategoryenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='feestatusenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='feetypeenum').drop(op.get_bind(), checkfirst=True)

