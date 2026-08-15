"""payment tables: payments, orders.payment_method

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-15 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('payment_method', sa.String(length=20), nullable=True))
    op.alter_column(
        'orders', 'status', existing_type=sa.String(length=20),
        server_default='awaiting_payment',
    )
    op.create_table('payments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('order_id', sa.Integer(), nullable=False),
    sa.Column('method', sa.String(length=20), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('shop_process_id', sa.String(length=20), nullable=False),
    sa.Column('gateway_reference', sa.String(length=120), nullable=True),
    sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('currency', sa.String(length=3), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_shop_process_id'), 'payments', ['shop_process_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_payments_shop_process_id'), table_name='payments')
    op.drop_table('payments')
    op.alter_column('orders', 'status', existing_type=sa.String(length=20), server_default=None)
    op.drop_column('orders', 'payment_method')
