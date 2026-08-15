"""quote requests table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-15 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('quote_requests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('reference', sa.String(length=20), nullable=False),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('phone', sa.String(length=40), nullable=False),
    sa.Column('message', sa.Text(), nullable=True),
    sa.Column('product_id', sa.Integer(), nullable=True),
    sa.Column('product_name', sa.String(length=300), nullable=True),
    sa.Column('status', sa.String(length=20), server_default='new', nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quote_requests_reference'), 'quote_requests', ['reference'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_quote_requests_reference'), table_name='quote_requests')
    op.drop_table('quote_requests')
