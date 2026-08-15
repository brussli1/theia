import email
import json
from datetime import datetime, timezone

import httpx
import pytest

from app.models.quote import QuoteRequest
from app.notifications import notify_quote
from app.notifications.base import NotificationError, QuoteMessage
from app.notifications.email import EmailNotifier
from app.notifications.messages import compose_quote_message
from app.notifications.registry import get_channels
from app.notifications.whatsapp import WhatsAppNotifier

QUOTE = QuoteRequest(
    id=1,
    reference="QT-ABC12345",
    kind="product",
    name="Juan Pérez",
    email="customer@example.com",
    phone="+595 981 123 456",
    message="¿Cuál es el precio?",
    product_id=2,
    product_name="HHOU 7040 Refraction Units",
    status="new",
    created_at=datetime(2026, 8, 15, tzinfo=timezone.utc),
)


def test_message_composition_covers_the_request(monkeypatch):
    message = compose_quote_message(QUOTE)
    assert message.subject == "Nueva solicitud de cotización QT-ABC12345"
    assert message.whatsapp_text.startswith("Nueva solicitud de cotización QT-ABC12345\n")
    for fragment in (
        "Tipo: Producto",
        "Referencia: QT-ABC12345",
        "Producto: HHOU 7040 Refraction Units",
        "Nombre: Juan Pérez",
        "Email: customer@example.com",
        "Teléfono: +595 981 123 456",
        "Mensaje: ¿Cuál es el precio?",
    ):
        assert fragment in message.whatsapp_text
        assert fragment in message.email_body


def test_message_composition_kind_labels_and_optional_message():
    for kind, label in (("used", "Equipamiento usado"), ("rental", "Alquiler")):
        quote = QuoteRequest(
            id=2, reference="QT-ZZZZZZZZ", kind=kind, name="A", email="a@b.com",
            phone="1", message=None, product_name=None, status="new",
            created_at=datetime(2026, 8, 15, tzinfo=timezone.utc),
        )
        message = compose_quote_message(quote)
        assert f"Tipo: {label}" in message.whatsapp_text
        assert "Mensaje:" not in message.whatsapp_text


class RecordingSmtp:
    def __init__(self, host, port, timeout=None):
        self.host = host
        self.port = port
        self.calls = {"starttls": 0, "login": None, "sent": None}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def starttls(self):
        self.calls["starttls"] += 1

    def login(self, user, password):
        self.calls["login"] = (user, password)

    def sendmail(self, from_addr, to_addrs, msg):
        self.calls["sent"] = (from_addr, to_addrs, msg)


def test_email_notifier_sends_the_message():
    recording = RecordingSmtp("smtp.example.com", 587)

    def factory(host, port, timeout=None):
        recording.host = host
        recording.port = port
        return recording

    notifier = EmailNotifier(
        host="smtp.example.com",
        port=587,
        user="theia",
        password="secret",
        from_name="Theia",
        from_addr="no-reply@theia.com.py",
        to_addr="td.phakos@gmail.com",
        client_factory=factory,
    )
    notifier.notify(compose_quote_message(QUOTE))

    assert (recording.host, recording.port) == ("smtp.example.com", 587)
    assert recording.calls["starttls"] == 1
    assert recording.calls["login"] == ("theia", "secret")
    from_addr, to_addrs, msg = recording.calls["sent"]
    assert from_addr == "no-reply@theia.com.py"
    assert to_addrs == ["td.phakos@gmail.com"]
    parsed = email.message_from_string(msg, policy=email.policy.default)
    assert parsed["Subject"] == "Nueva solicitud de cotización QT-ABC12345"
    assert parsed["To"] == "td.phakos@gmail.com"
    assert "Producto: HHOU 7040 Refraction Units" in parsed.get_payload(decode=True).decode()


def test_email_notifier_surfaces_transport_failure():
    def factory(host, port, timeout=None):
        raise OSError("connection refused")

    notifier = EmailNotifier(
        host="smtp.example.com", port=587, user="", password="",
        from_name="Theia", from_addr="noreply@theia.com.py", to_addr="td.phakos@gmail.com",
        client_factory=factory,
    )
    with pytest.raises(NotificationError):
        notifier.notify(compose_quote_message(QUOTE))


def test_whatsapp_notifier_posts_to_the_meta_api():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers.get("authorization")
        seen["body"] = json.loads(request.read())
        return httpx.Response(200, json={"messages": [{"id": "MSG-1"}]})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    notifier = WhatsAppNotifier(
        token="tok", phone_id="123456", to_number="595971282908", client=client
    )
    notifier.notify(compose_quote_message(QUOTE))

    assert seen["url"] == "https://graph.facebook.com/v21.0/123456/messages"
    assert seen["auth"] == "Bearer tok"
    assert seen["body"] == {
        "messaging_product": "whatsapp",
        "to": "595971282908",
        "type": "text",
        "text": {"body": compose_quote_message(QUOTE).whatsapp_text},
    }


def test_whatsapp_notifier_surfaces_http_failure():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "unauthorized"})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    notifier = WhatsAppNotifier(
        token="tok", phone_id="123456", to_number="595971282908", client=client
    )
    with pytest.raises(NotificationError):
        notifier.notify(compose_quote_message(QUOTE))


def test_whatsapp_notifier_surfaces_transport_failure():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused")

    client = httpx.Client(transport=httpx.MockTransport(handler))
    notifier = WhatsAppNotifier(
        token="tok", phone_id="123456", to_number="595971282908", client=client
    )
    with pytest.raises(NotificationError):
        notifier.notify(compose_quote_message(QUOTE))


def test_no_channels_configured_by_default():
    assert get_channels() == []


def test_channels_follow_credentials(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.smtp_host", "smtp.example.com")
    channels = get_channels()
    assert len(channels) == 1
    assert isinstance(channels[0], EmailNotifier)

    monkeypatch.setattr("app.core.config.settings.whatsapp_token", "tok")
    monkeypatch.setattr("app.core.config.settings.whatsapp_phone_id", "123456")
    channels = get_channels()
    assert len(channels) == 2
    assert isinstance(channels[0], EmailNotifier)
    assert isinstance(channels[1], WhatsAppNotifier)


def test_notify_quote_delivers_to_every_channel():
    delivered = []

    class Channel:
        def notify(self, message: QuoteMessage) -> None:
            delivered.append(message)

    notify_quote(QUOTE, channels=[Channel()])
    assert len(delivered) == 1
    assert delivered[0].subject == "Nueva solicitud de cotización QT-ABC12345"


def test_notify_quote_swallows_channel_failures(monkeypatch, caplog):
    class BrokenChannel:
        def notify(self, message: QuoteMessage) -> None:
            raise NotificationError("smtp down")

    with caplog.at_level("ERROR"):
        notify_quote(QUOTE, channels=[BrokenChannel()])
    assert "smtp down" in caplog.text
