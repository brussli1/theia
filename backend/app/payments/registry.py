"""Provider selection by configuration.

`payment_mode=sandbox` (the default, used in dev/test/CI) simulates both
gateways so the whole checkout → pay → confirm loop runs without merchant
accounts. `payment_mode=production` wires the real gateways: Bancard vPOS for
cards and PayPal REST for PayPal.
"""

from app.core.config import settings
from app.models.order import PAYMENT_METHOD_CARD, PAYMENT_METHOD_PAYPAL
from app.payments.bancard import BancardPaymentProvider
from app.payments.base import PaymentProvider, PaymentProviderError
from app.payments.paypal import PayPalPaymentProvider
from app.payments.sandbox import SandboxPaymentProvider

_PRODUCTION_PROVIDERS: dict[str, type[PaymentProvider]] = {
    PAYMENT_METHOD_CARD: BancardPaymentProvider,
    PAYMENT_METHOD_PAYPAL: PayPalPaymentProvider,
}


def get_provider(method: str) -> PaymentProvider:
    if settings.payment_mode == "production":
        provider_class = _PRODUCTION_PROVIDERS.get(method)
        if provider_class is None:
            raise PaymentProviderError(f"No production provider for {method}")
        return provider_class()
    return SandboxPaymentProvider()
