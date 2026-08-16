"""product structured description and image alt

Revision ID: b1b725df5eaa
Revises: g1h2i3j4k5l6
Create Date: 2026-08-16 20:32:03.894357

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b1b725df5eaa'
down_revision: Union[str, None] = 'g1h2i3j4k5l6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'products',
        sa.Column('description_html', sa.Text(), nullable=False, server_default=''),
    )
    op.add_column(
        'products',
        sa.Column(
            'image_alt',
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
    )


def downgrade() -> None:
    op.drop_column('products', 'image_alt')
    op.drop_column('products', 'description_html')
