"""User: a customer's optional registered identity (ticket #14).

Accounts are opt-in — guest checkout stays available. A User is a customer
with an email and password, used to see order and quote history. The email is
normalized to lowercase at registration and login, and the password is never
stored — only a hash (see app/core/security.py). Orders and quote requests
link to the account that placed them via a nullable `user_id`; rows created
before the account existed (or as a guest) have none.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
