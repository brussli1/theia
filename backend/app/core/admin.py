"""Admin bootstrap (ticket #15).

The admin panel is gated by the `admin` role on a User, but registration
never grants it — the first admin is created here from the `admin_email` /
`admin_password` settings, idempotently, at application startup (or by tests
promoting a row directly). Re-running with the same credentials refreshes the
password hash and re-asserts the role, so rotating the password is just
restarting with new settings.
"""

import asyncio
import logging

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User

logger = logging.getLogger(__name__)


async def ensure_admin(session_factory=async_session_factory) -> User | None:
    """Upsert the configured admin account; returns None when no admin is
    configured. Never creates a customer. The session factory is injectable
    so tests can run it against their own engine."""
    if not (settings.admin_email and settings.admin_password):
        return None
    email = settings.admin_email.strip().lower()
    async with session_factory() as session:
        user = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        password_hash = await asyncio.to_thread(hash_password, settings.admin_password)
        if user is None:
            user = User(
                email=email,
                name="Administrator",
                role="admin",
                password_hash=password_hash,
            )
            session.add(user)
            logger.info("Bootstrapped admin account %s", email)
        else:
            user.role = "admin"
            user.password_hash = password_hash
        await session.commit()
        await session.refresh(user)
        return user
