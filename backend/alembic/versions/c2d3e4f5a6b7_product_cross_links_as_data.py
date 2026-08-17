"""product cross-links as data

Revision ID: c2d3e4f5a6b7
Revises: b1b725df5eaa
Create Date: 2026-08-16 21:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c2d3e4f5a6b7'
down_revision: Union[str, None] = 'b1b725df5eaa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'products',
        sa.Column('cross_links', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('products', 'cross_links')
