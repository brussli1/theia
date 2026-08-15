"""PayPal REST v2 gateway for the PayPal payment method.

Standard PayPal checkout: create an order with intent CAPTURE, send the customer
to the approve link, and capture the payment when they return. Client id and
secret come from configuration; the API base follows the environment.
"""

import base64
from decimal import Decimal

import httpx

from app.core.config import settings
from app.payments.base import (
    PaymentInfo,
    PaymentIntent,
    PaymentProvider,
    PaymentProviderError,
)

PAYPAL_API_BASES = {
    "sandbox": "https://api-m.sandbox.paypal.com",
    "production": "https://api-m.paypal.com",
}


def _error_message(response: httpx.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return f"PayPal returned {response.status_code}"
    message = data.get("message") or data.get("error")
    if not message:
        details = [
            d.get("description") or d.get("issue") for d in data.get("details", []) if d
        ]
        message = "; ".join(d for d in details if d) or None
    return message or f"PayPal returned {response.status_code}"


class PayPalPaymentProvider:
    """Gateway for the PayPal payment method (PayPal REST v2)."""

    def __init__(
        self,
        client_id: str | None = None,
        secret: str | None = None,
        environment: str | None = None,
        client: httpx.Client | None = None,
    ):
        self.client_id = client_id if client_id is not None else settings.paypal_client_id
        self.secret = secret if secret is not None else settings.paypal_client_secret
        self.environment = environment if environment is not None else settings.payment_mode
        self.base_url = PAYPAL_API_BASES[self.environment]
        self._client = client if client is not None else httpx.Client(timeout=30)
        self._auth = base64.b64encode(f"{self.client_id}:{self.secret}".encode()).decode()

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
        body = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": shop_process_id,
                    "description": description,
                    "amount": {"currency_code": currency, "value": f"{amount:.2f}"},
                }
            ],
            "application_context": {
                "brand_name": "Theia",
                "return_url": return_url,
                "cancel_url": cancel_url,
                "user_action": "PAY_NOW",
            },
        }
        response = self._client.post(
            f"{self.base_url}/v2/checkout/orders",
            headers={"Authorization": f"Basic {self._auth}"},
            json=body,
        )
        if response.status_code != 201:
            raise PaymentProviderError(_error_message(response))
        data = response.json()
        approve = next(
            (link["href"] for link in data.get("links", []) if link.get("rel") == "approve"),
            None,
        )
        if approve is None:
            raise PaymentProviderError("PayPal did not return an approve link")
        return PaymentIntent(reference=data["id"], redirect_url=approve)

    def confirm(self, payment: PaymentInfo) -> bool:
        if not payment.gateway_reference:
            return False
        response = self._client.post(
            f"{self.base_url}/v2/checkout/orders/{payment.gateway_reference}/capture",
            headers={"Authorization": f"Basic {self._auth}"},
        )
        if response.status_code == 201:
            return response.json().get("status") == "COMPLETED"
        # Capturing an already-captured order (e.g. a duplicated confirm) means
        # the payment went through — treat it as paid rather than an error.
        details = _error_message(response)
        if "ORDER_ALREADY_CAPTURED" in details:
            return True
        raise PaymentProviderError(details)
