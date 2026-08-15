"""Simulated gateway for development, tests, and CI.

In sandbox mode every payment is instantly "paid": the customer is sent straight
back to the return URL (whose `payment_ref` the confirmation page verifies
via the confirm endpoint) and `confirm` always succeeds. This lets the whole
checkout → pay → confirm loop run without merchant accounts.
"""

from decimal import Decimal

from app.payments.base import PaymentInfo, PaymentIntent, PaymentProvider


class SandboxPaymentProvider:
    """Pretends to be a gateway: created payments are immediately payable and
    confirmations always succeed."""

    def create_payment(
        self,
        *,
        shop_process_id: str,
        amount: Decimal,
        currency: str,
        description: str,
        return_url: str,
        cancel_url: str,
    ) -> PaymentIntent:
        return PaymentIntent(reference=shop_process_id, redirect_url=return_url)

    def confirm(self, payment: PaymentInfo) -> bool:
        return True
