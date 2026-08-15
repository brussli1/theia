"""Notifications: deliver a stored QuoteRequest to Theia (ticket #13).

`notify_quote` runs after the request is committed — a failing channel must
never lose the customer's request. Each channel is tried independently and a
failure is logged (the confirmation page also offers the customer direct
wa.me/mailto links as the fallback path); with no channel configured the
composed message is logged instead, so dev/CI still exercises the flow.
"""

import logging

from app.models.quote import QuoteRequest
from app.notifications.base import NotificationChannel, NotificationError
from app.notifications.messages import compose_quote_message
from app.notifications.registry import get_channels

logger = logging.getLogger(__name__)


def notify_quote(quote: QuoteRequest, channels: list[NotificationChannel] | None = None) -> None:
    message = compose_quote_message(quote)
    channels = get_channels() if channels is None else channels
    if not channels:
        logger.info(
            "Quote %s: no notification channel configured; would notify Theia: %s",
            quote.reference,
            message.whatsapp_text.replace("\n", " | "),
        )
        return
    for channel in channels:
        try:
            channel.notify(message)
        except NotificationError as error:
            logger.error("Quote %s: notification channel failed: %s", quote.reference, error)
