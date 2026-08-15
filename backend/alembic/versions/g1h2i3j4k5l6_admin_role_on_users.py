"""users gain a role column (customer | admin)

Revision ID: g1h2i3j4k5l6
Revises: f6a7b8c9d0e1
Create Date: 2026-08-15 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'g1h2i3j4k5l6'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'role',
            sa.String(length=20),
            server_default='customer',
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'role')
