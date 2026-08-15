"""Quotes: submit and look up quote requests (ticket #13).

One endpoint covers the PRD's three contact paths — quote-only product, used
equipment, rental — selected by `kind`. Product quotes require the product's
slug and snapshot its name so the request survives catalog changes (like
OrderItem); orderable products are refused — those belong in the cart.
After the request is stored, Theia is notified by WhatsApp and email via the
notification seam (best-effort, see app/notifications). Requests are looked
up by reference plus the email used to submit, mirroring order lookup; #14
adds "past quotes" per account.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import QuoteIn, QuoteOut
from app.core.database import get_db
from app.models.catalog import Product
from app.models.quote import (
    QUOTE_KIND_PRODUCT,
    QUOTE_STATUS_NEW,
    QuoteRequest,
    new_quote_reference,
)
from app.notifications import notify_quote

router = APIRouter(prefix="/api/quotes", tags=["quotes"])


@router.post("", response_model=QuoteOut, status_code=201)
async def submit_quote(
    payload: QuoteIn,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> QuoteOut:
    product = None
    if payload.kind == QUOTE_KIND_PRODUCT:
        if not payload.product_slug:
            raise HTTPException(
                status_code=422, detail="product_slug is required for product quotes"
            )
        product = (
            await db.execute(select(Product).where(Product.slug == payload.product_slug))
        ).scalar_one_or_none()
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        if product.orderable:
            raise HTTPException(
                status_code=400,
                detail="That product is available for purchase — add it to your cart instead",
            )

    quote = QuoteRequest(
        reference=new_quote_reference(),
        kind=payload.kind,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        message=payload.message,
        product_id=product.id if product else None,
        product_name=product.name if product else None,
        status=QUOTE_STATUS_NEW,
    )
    db.add(quote)
    await db.commit()
    await db.refresh(quote)

    # The request is stored first; notification is best-effort, after the
    # response (a down channel must never lose the customer's request or
    # block the confirmation — see docs/adr/0002-quotes.md).
    background_tasks.add_task(notify_quote, quote)

    return _quote_out(quote)


@router.get("/{reference}", response_model=QuoteOut)
async def get_quote(
    reference: str,
    email: str = Query(min_length=1),
    db: AsyncSession = Depends(get_db),
) -> QuoteOut:
    quote = (
        await db.execute(
            select(QuoteRequest).where(
                QuoteRequest.reference == reference.upper(),
                func.lower(QuoteRequest.email) == email.lower(),
            )
        )
    ).scalar_one_or_none()
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote request not found")
    return _quote_out(quote)


def _quote_out(quote: QuoteRequest) -> QuoteOut:
    return QuoteOut(
        reference=quote.reference,
        kind=quote.kind,
        product_name=quote.product_name,
        name=quote.name,
        email=quote.email,
        phone=quote.phone,
        message=quote.message,
        status=quote.status,
        created_at=quote.created_at,
    )
