"""Payments: confirmation of gateway-backed payments.

The customer is sent to the gateway's payment page after checkout (the
`payment_redirect_url` returned by `POST /api/orders`). When they come back
on the return URL — which carries the order number as `payment_ref` — the
confirmation page calls `POST /api/payments/confirm`, which asks the gateway
whether the payment actually happened (Bancard confirmations web service,
PayPal capture, or the sandbox simulation). Confirming is idempotent: a
payment that is already `paid` is never charged again.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.orders import order_out
from app.api.schemas import ConfirmIn, OrderOut
from app.core.database import get_db
from app.models.order import (
    ORDER_STATUS_PAID,
    PAYMENT_STATUS_PAID,
    Order,
    Payment,
)
from app.payments.base import PaymentInfo, PaymentProviderError
from app.payments.registry import get_provider

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/confirm", response_model=OrderOut)
async def confirm_payment(
    payload: ConfirmIn,
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    payment = (
        await db.execute(select(Payment).where(Payment.shop_process_id == payload.payment_ref))
    ).scalar_one_or_none()
    order = await db.get(Order, payment.order_id) if payment is not None else None
    if (
        order is None
        or order.order_number != payload.order_number.upper()
        or payment.gateway_reference is None
    ):
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status != PAYMENT_STATUS_PAID:
        try:
            provider = get_provider(payment.method)
            confirmed = provider.confirm(
                PaymentInfo(
                    shop_process_id=payment.shop_process_id,
                    gateway_reference=payment.gateway_reference,
                    amount=payment.amount,
                    currency=payment.currency,
                )
            )
        except PaymentProviderError as error:
            raise HTTPException(status_code=502, detail=str(error)) from error
        if confirmed:
            payment.status = PAYMENT_STATUS_PAID
            order.status = ORDER_STATUS_PAID
            await db.commit()

    return await order_out(db, order)
