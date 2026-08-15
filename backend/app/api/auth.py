"""Accounts: register, log in, and the current account (ticket #14).

Accounts are optional — guest checkout stays available. Registration creates
a User (email normalized to lowercase, password stored only as a PBKDF2 hash)
and both register and login return a signed JWT that the frontend keeps in an
httpOnly cookie and sends back as `Authorization: Bearer <token>`. Sessions
are stateless: logging out is the browser discarding the token. The auth
dependency (`get_current_user`) protects the account endpoints; an optional
variant lets checkout and quote submission attach the order/request to the
account when the customer is signed in, without requiring it.
"""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import AuthOut, LoginIn, RegisterIn, UserOut
from app.core.database import get_db
from app.core.security import (
    create_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def _user_from_request(
    request: Request, db: AsyncSession
) -> User | None:
    header = request.headers.get("authorization", "")
    if not header.startswith("Bearer "):
        return None
    claims = decode_token(header.removeprefix("Bearer ").strip())
    if claims is None or "sub" not in claims:
        return None
    try:
        return await db.get(User, int(claims["sub"]))
    except (TypeError, ValueError):
        return None


async def get_optional_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User | None:
    """The account from the `Authorization: Bearer` header, or None when the
    header is missing or the token invalid. Never raises."""
    return await _user_from_request(request, db)


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    """The account from the `Authorization: Bearer` header; 401 when absent
    or invalid."""
    user = await _user_from_request(request, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.post("/register", response_model=AuthOut, status_code=201)
async def register(payload: RegisterIn, db: AsyncSession = Depends(get_db)) -> AuthOut:
    user = User(
        email=payload.email.strip().lower(),
        password_hash=await asyncio.to_thread(hash_password, payload.password),
        name=payload.name.strip(),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail="That email is already registered"
        ) from None
    await db.refresh(user)
    return AuthOut(token=create_token(user.id, user.email), user=_user_out(user))


@router.post("/login", response_model=AuthOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)) -> AuthOut:
    email = payload.email.strip().lower()
    user = (
        await db.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    if user is None or not await asyncio.to_thread(
        verify_password, payload.password, user.password_hash
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthOut(token=create_token(user.id, user.email), user=_user_out(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return _user_out(current_user)


def _user_out(user: User) -> UserOut:
    return UserOut(id=user.id, email=user.email, name=user.name)
