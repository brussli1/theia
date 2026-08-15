"""Bancard vPOS 2.0 card gateway (https://bancard.com.py/vpos).

Wire contract verified against Bancard's official connector source
(Bancard/bancard-connectors, vpos/sdk/python): charge tokens are created at
`/vpos/api/0.3/single_buy` with an MD5-signed operation, the payer is sent to
`/payment/single_buy?process_id=...`, and the charge status is polled at
`/vpos/api/0.3/single_buy/confirmations`. Currency is PYG only. Keys and
environment come from configuration; exact API details are distributed to
enabled merchants via the Portal de Comercios — confirm against them during
onboarding.
"""

import hashlib
from decimal import Decimal

import httpx

from app.core.config import settings
from app.payments.base import (
    PaymentInfo,
    PaymentIntent,
    PaymentProvider,
    PaymentProviderError,
)

BANCARD_BASE_URLS = {
    "sandbox": "https://vpos.infonet.com.py:8888",
    "production": "https://vpos.infonet.com.py",
}


def _md5(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest()


def _amount_str(amount: Decimal) -> str:
    return f"{amount:.2f}"


def _error_message(data: dict) -> str:
    messages = data.get("messages") or []
    if messages:
        return messages[0].get("dsc", str(messages[0]))
    return "Bancard did not return a success status"


class BancardPaymentProvider:
    """Card provider backed by Bancard vPOS 2.0."""

    def __init__(
        self,
        public_key: str | None = None,
        private_key: str | None = None,
        environment: str | None = None,
        client: httpx.Client | None = None,
    ):
        self.public_key = public_key if public_key is not None else settings.bancard_public_key
        self.private_key = private_key if private_key is not None else settings.bancard_private_key
        self.environment = environment if environment is not None else settings.payment_mode
        self.base_url = BANCARD_BASE_URLS[self.environment]
        self._client = client if client is not None else httpx.Client(timeout=30)

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
        amount_str = _amount_str(amount)
        token = _md5(f"{self.private_key}{shop_process_id}{amount_str}{currency}")
        body = {
            "public_key": self.public_key,
            "operation": {
                "token": token,
                "shop_process_id": shop_process_id,
                "currency": currency,
                "amount": amount_str,
                "additional_data": "",
                "description": description,
                "return_url": return_url,
                "cancel_url": cancel_url,
            },
        }
        response = self._client.post(f"{self.base_url}/vpos/api/0.3/single_buy", json=body)
        data = response.json() if response.content else {}
        if data.get("status") != "success":
            raise PaymentProviderError(_error_message(data))
        process_id = str(data["process_id"])
        return PaymentIntent(
            reference=process_id,
            redirect_url=f"{self.base_url}/payment/single_buy?process_id={process_id}",
        )

    def confirm(self, payment: PaymentInfo) -> bool:
        token = _md5(f"{self.private_key}{payment.shop_process_id}get_confirmation")
        body = {
            "public_key": self.public_key,
            "operation": {"token": token, "shop_process_id": payment.shop_process_id},
        }
        response = self._client.post(
            f"{self.base_url}/vpos/api/0.3/single_buy/confirmations", json=body
        )
        data = response.json() if response.content else {}
        if data.get("status") == "success":
            return data.get("confirmation", {}).get("response_code") == "00"
        messages = data.get("messages") or []
        if messages and messages[0].get("key") == "PaymentNotFoundError":
            return False
        raise PaymentProviderError(_error_message(data))
