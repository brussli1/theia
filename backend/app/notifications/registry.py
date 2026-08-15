"""Channel selection by configuration.

Channels are enabled by their credentials being present: SMTP when
`smtp_host` is set, WhatsApp when `whatsapp_token` and `whatsapp_phone_id`
are set. With nothing configured (dev/test/CI) no channel is registered and
`notify_quote` logs the composed message instead — the request is still
stored and the confirmation page surfaces the wa.me/mailto fallback links.
See docs/adr/0002-quotes.md.
"""

from app.core.config import settings
from app.notifications.base import NotificationChannel
from app.notifications.email import EmailNotifier
from app.notifications.whatsapp import WhatsAppNotifier


def get_channels() -> list[NotificationChannel]:
    channels: list[NotificationChannel] = []
    if settings.smtp_host:
        channels.append(
            EmailNotifier(
                host=settings.smtp_host,
                port=settings.smtp_port,
                user=settings.smtp_user,
                password=settings.smtp_password,
                from_name=settings.app_name,
                # Most providers require the authenticated user as the From
                # address; fall back so a bare smtp_host config is valid.
                from_addr=settings.smtp_from or settings.smtp_user,
                to_addr=settings.notification_email_to,
            )
        )
    if settings.whatsapp_token and settings.whatsapp_phone_id:
        channels.append(
            WhatsAppNotifier(
                token=settings.whatsapp_token,
                phone_id=settings.whatsapp_phone_id,
                to_number=settings.notification_whatsapp_to,
            )
        )
    return channels
