"""Password hashing and JWT sessions (ticket #14).

Passwords are hashed with PBKDF2-SHA256 and a per-user random salt, encoded as
`pbkdf2_sha256$<iterations>$<salt_b64>$<hash_b64>` so the work factor can be
raised later without invalidating old hashes. Sessions are signed JWTs
(HS256) carrying the user id and email; the signing secret comes from
`jwt_secret`, which is empty by default like every credential in this repo —
outside production a fixed development secret is used so dev/test/CI work
without configuration, and production refuses to start signing until
`jwt_secret` is set (the same split payments and notifications use).
"""

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings

# PBKDF2-SHA256 with 600_000 iterations is the current OWASP recommendation
# for interactive logins.
_PBKDF2_ITERATIONS = 600_000
_ALGORITHM = "HS256"
# Dev/test signing secret, used only when `jwt_secret` is not configured.
_DEV_SECRET = "theia-dev-jwt-secret-change-me"


def _secret() -> str:
    if settings.jwt_secret:
        return settings.jwt_secret
    if settings.environment == "production":
        raise RuntimeError("JWT_SECRET must be set in production")
    return _DEV_SECRET


def hash_password(password: str) -> str:
    """PBKDF2-SHA256 hash with a random per-user salt, self-describing."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, _PBKDF2_ITERATIONS
    )
    return (
        f"pbkdf2_sha256${_PBKDF2_ITERATIONS}"
        f"${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"
    )


def verify_password(password: str, stored: str) -> bool:
    """Constant-time check of a password against a hash produced by
    hash_password; hashes in any other format are rejected."""
    parts = stored.split("$")
    if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
        return False
    try:
        iterations = int(parts[1])
        salt = base64.b64decode(parts[2])
        expected = base64.b64decode(parts[3])
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return hmac.compare_digest(digest, expected)


def create_token(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expires_minutes),
    }
    return jwt.encode(payload, _secret(), algorithm=_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """The token's claims, or None when it is invalid or expired."""
    try:
        return jwt.decode(token, _secret(), algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        return None
