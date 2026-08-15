"""Provider adapter for gateway-backed payments (ticket #12).

A provider turns an order into a payment intent — a gateway-side reference
plus the URL the customer is sent to pay — and later confirms whether the
payment actually happened. Providers are swapped by configuration
(`app/payments/registry.py`): sandbox mode simulates the gateway; production
mode uses real gateways (Bancard vPOS for cards, PayPal REST for PayPal).
Charge currency is per gateway — PYG for cards, USD for PayPal (see
docs/adr/0001-payments.md).
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


class PaymentProviderError(Exception):
    """The gateway rejected or could not serve the payment request."""


@dataclass
class PaymentIntent:
    """Result of asking a gateway to start a payment."""

    reference: str  # gateway-side id of the charge (process_id, PayPal id, ...)
    redirect_url: str  # where the customer's browser is sent to pay


@dataclass
class PaymentInfo:
    """What a provider needs to confirm a stored payment."""

    shop_process_id: str  # our merchant reference for the charge (order number)
    gateway_reference: str | None  # gateway-side id, if any
    amount: Decimal
    currency: str


class PaymentProvider(Protocol):
    def create_payment(
        self,
        *,
        shop_process_id: str,
        amount: Decimal,
        currency: str,
        description: str,
        return_url: str,
        cancel_url: str,
    ) -> PaymentIntent: ...

    def confirm(self, payment: PaymentInfo) -> bool: ...
