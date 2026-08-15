"""Notification channels for quote requests (ticket #13).

A quote request must reach Theia by WhatsApp and email (PRD stories 22).
Each delivery channel is a small adapter behind a Protocol, wired by
configuration (see registry.py): nothing is sent when the channel's
credentials are not configured — the request is still stored and the
confirmation page offers the customer wa.me/mailto links as the fallback path.
Channels are unit-tested at the transport boundary (smtp client, httpx
transport), mirroring the payment providers.
"""

from dataclasses import dataclass
from typing import Protocol


class NotificationError(Exception):
    """The channel could not deliver the notification."""


@dataclass
class QuoteMessage:
    """The composed notification for one quote request, in Spanish (Theia's
    business language), ready for either channel."""

    whatsapp_text: str
    subject: str
    email_body: str


class NotificationChannel(Protocol):
    def notify(self, message: QuoteMessage) -> None: ...
