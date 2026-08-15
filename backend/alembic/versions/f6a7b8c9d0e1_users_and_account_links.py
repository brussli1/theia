"""users table and account links on orders and quote_requests

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-15 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.add_column('orders', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_orders_user_id'), 'orders', ['user_id'])
    op.create_foreign_key('fk_orders_user_id_users', 'orders', 'users', ['user_id'], ['id'], ondelete='SET NULL')

    op.add_column('quote_requests', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_quote_requests_user_id'), 'quote_requests', ['user_id'])
    op.create_foreign_key('fk_quote_requests_user_id_users', 'quote_requests', 'users', ['user_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_quote_requests_user_id_users', 'quote_requests', type_='foreignkey')
    op.drop_index(op.f('ix_quote_requests_user_id'), table_name='quote_requests')
    op.drop_column('quote_requests', 'user_id')

    op.drop_constraint('fk_orders_user_id_users', 'orders', type_='foreignkey')
    op.drop_index(op.f('ix_orders_user_id'), table_name='orders')
    op.drop_column('orders', 'user_id')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
