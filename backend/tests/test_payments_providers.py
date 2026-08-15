import json
from decimal import Decimal

import httpx
import pytest

from app.payments.bancard import BancardPaymentProvider
from app.payments.base import PaymentInfo, PaymentProviderError
from app.payments.paypal import PayPalPaymentProvider
from app.payments.registry import get_provider
from app.payments.sandbox import SandboxPaymentProvider

CREATE_ARGS = dict(
    shop_process_id="TH-ABC12345",
    amount=Decimal("1000000"),
    currency="PYG",
    description="TH-ABC12345",
    return_url="http://front/pedido/TH-ABC12345?email=c%40x.com&payment_ref=TH-ABC12345",
    cancel_url="http://front/pedido/TH-ABC12345?email=c%40x.com",
)

PAID_INFO = PaymentInfo(
    shop_process_id="TH-ABC12345",
    gateway_reference="PROC-1",
    amount=Decimal("1000000"),
    currency="PYG",
)

# PayPal REST cannot charge PYG, so PayPal charges the order's USD snapshot.
PAYPAL_ARGS = {
    **CREATE_ARGS,
    "amount": Decimal("142.86"),
    "currency": "USD",
}


def test_bancard_creates_payment_at_single_buy():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.read())
        return httpx.Response(200, json={"status": "success", "process_id": "PROC-1"})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = BancardPaymentProvider(
        public_key="pub", private_key="priv", environment="sandbox", client=client
    )
    intent = provider.create_payment(**CREATE_ARGS)

    assert intent.reference == "PROC-1"
    assert (
        intent.redirect_url
        == "https://vpos.infonet.com.py:8888/payment/single_buy?process_id=PROC-1"
    )
    assert seen["url"] == "https://vpos.infonet.com.py:8888/vpos/api/0.3/single_buy"
    assert seen["body"] == {
        "public_key": "pub",
        "operation": {
            # md5("priv" + shop_process_id + "1000000.00" + "PYG") — known literal
            "token": "47d127db1fced29c971d1c9e5a21a0e0",
            "shop_process_id": "TH-ABC12345",
            "currency": "PYG",
            "amount": "1000000.00",
            "additional_data": "",
            "description": "TH-ABC12345",
            "return_url": CREATE_ARGS["return_url"],
            "cancel_url": CREATE_ARGS["cancel_url"],
        },
    }


def test_bancard_rejected_charge_raises():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "status": "error",
                "messages": [
                    {"key": "InvalidOperationError", "dsc": "process has already been taken"}
                ],
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = BancardPaymentProvider(
        public_key="pub", private_key="priv", environment="sandbox", client=client
    )
    with pytest.raises(PaymentProviderError):
        provider.create_payment(**CREATE_ARGS)


def test_bancard_confirm_reports_paid():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.read())
        return httpx.Response(
            200,
            json={
                "status": "success",
                "confirmation": {"response_code": "00", "authorization_number": "A-1"},
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = BancardPaymentProvider(
        public_key="pub", private_key="priv", environment="sandbox", client=client
    )
    assert provider.confirm(PAID_INFO) is True
    assert (
        seen["url"]
        == "https://vpos.infonet.com.py:8888/vpos/api/0.3/single_buy/confirmations"
    )
    assert seen["body"] == {
        "public_key": "pub",
        "operation": {
            # md5("priv" + shop_process_id + "get_confirmation") — known literal
            "token": "28b1713ac462634705b4f5893063ef6c",
            "shop_process_id": "TH-ABC12345",
        },
    }


def test_bancard_confirm_pending_when_charge_not_found():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "status": "error",
                "messages": [{"key": "PaymentNotFoundError", "dsc": "not found"}],
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = BancardPaymentProvider(
        public_key="pub", private_key="priv", environment="sandbox", client=client
    )
    assert provider.confirm(PAID_INFO) is False


def test_paypal_creates_order_with_approve_link():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers.get("authorization")
        seen["body"] = json.loads(request.read())
        return httpx.Response(
            201,
            json={
                "id": "PAYPAL-1",
                "links": [
                    {"href": "https://paypal.com/approve/PAYPAL-1", "rel": "approve"},
                    {"href": "https://paypal.com/self/PAYPAL-1", "rel": "self"},
                ],
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = PayPalPaymentProvider(
        client_id="cid", secret="secret", environment="sandbox", client=client
    )
    intent = provider.create_payment(**PAYPAL_ARGS)

    assert intent.reference == "PAYPAL-1"
    assert intent.redirect_url == "https://paypal.com/approve/PAYPAL-1"
    assert seen["url"] == "https://api-m.sandbox.paypal.com/v2/checkout/orders"
    assert seen["auth"] == "Basic Y2lkOnNlY3JldA=="
    assert seen["body"]["intent"] == "CAPTURE"
    assert seen["body"]["purchase_units"] == [
        {
            "reference_id": "TH-ABC12345",
            "description": "TH-ABC12345",
            "amount": {"currency_code": "USD", "value": "142.86"},
        }
    ]
    assert seen["body"]["application_context"]["return_url"] == CREATE_ARGS["return_url"]
    assert seen["body"]["application_context"]["cancel_url"] == CREATE_ARGS["cancel_url"]


def test_paypal_create_without_approve_link_raises():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(201, json={"id": "PAYPAL-1", "links": []})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = PayPalPaymentProvider(
        client_id="cid", secret="secret", environment="sandbox", client=client
    )
    with pytest.raises(PaymentProviderError):
        provider.create_payment(**PAYPAL_ARGS)


def test_paypal_confirm_captures_the_order():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        return httpx.Response(201, json={"status": "COMPLETED"})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = PayPalPaymentProvider(
        client_id="cid", secret="secret", environment="sandbox", client=client
    )
    assert provider.confirm(PAID_INFO) is True
    assert seen["url"] == "https://api-m.sandbox.paypal.com/v2/checkout/orders/PROC-1/capture"


def test_paypal_confirm_treats_already_captured_as_paid():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            422,
            json={
                "name": "UNPROCESSABLE_ENTITY",
                "details": [{"issue": "ORDER_ALREADY_CAPTURED"}],
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = PayPalPaymentProvider(
        client_id="cid", secret="secret", environment="sandbox", client=client
    )
    assert provider.confirm(PAID_INFO) is True


def test_registry_uses_sandbox_providers_by_default():
    assert isinstance(get_provider("card"), SandboxPaymentProvider)
    assert isinstance(get_provider("paypal"), SandboxPaymentProvider)
    assert isinstance(get_provider("western_union"), SandboxPaymentProvider)


def test_registry_wires_real_providers_in_production(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.payment_mode", "production")
    assert isinstance(get_provider("card"), BancardPaymentProvider)
    assert isinstance(get_provider("paypal"), PayPalPaymentProvider)
