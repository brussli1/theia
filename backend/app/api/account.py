"""Account history: a signed-in customer's orders and quote requests (#14).

Both endpoints require a valid `Authorization: Bearer` token and return only
what belongs to that account — orders and quote requests that were placed as
a guest (no account link) never appear here. Lists are newest first.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.api.orders import order_out
from app.api.quotes import quote_out
from app.api.schemas import OrderOut, QuoteOut
from app.core.database import get_db
from app.models.order import Order
from app.models.quote import QuoteRequest
from app.models.user import User

router = APIRouter(prefix="/api/account", tags=["account"])


@router.get("/orders", response_model=list[OrderOut])
async def account_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrderOut]:
    orders = (
        (
            await db.execute(
                select(Order)
                .where(Order.user_id == current_user.id)
                .order_by(Order.created_at.desc(), Order.id.desc())
            )
        ).scalars()
    ).all()
    return [await order_out(db, order) for order in orders]


@router.get("/quotes", response_model=list[QuoteOut])
async def account_quotes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[QuoteOut]:
    quotes = (
        (
            await db.execute(
                select(QuoteRequest)
                .where(QuoteRequest.user_id == current_user.id)
                .order_by(QuoteRequest.created_at.desc(), QuoteRequest.id.desc())
            )
        ).scalars()
    ).all()
    return [quote_out(quote) for quote in quotes]
