"""WhatsApp delivery of quote notifications via the Meta Cloud API.

Sends a plain-text message to Theia's WhatsApp business number
(`notification_whatsapp_to`, default 595971282908). The HTTP client is
injectable (httpx) so tests can record the request at the transport boundary,
mirroring the payment providers.
"""

import httpx

from app.notifications.base import NotificationError, QuoteMessage

GRAPH_URL = "https://graph.facebook.com/v21.0/{phone_id}/messages"


class WhatsAppNotifier:
    def __init__(
        self,
        *,
        token: str,
        phone_id: str,
        to_number: str,
        client: httpx.Client | None = None,
    ) -> None:
        self._token = token
        self._phone_id = phone_id
        self._to_number = to_number
        self._client = client or httpx.Client()

    def notify(self, message: QuoteMessage) -> None:
        try:
            response = self._client.post(
                GRAPH_URL.format(phone_id=self._phone_id),
                headers={"Authorization": f"Bearer {self._token}"},
                json={
                    "messaging_product": "whatsapp",
                    "to": self._to_number,
                    "type": "text",
                    "text": {"body": message.whatsapp_text},
                },
                timeout=10,
            )
        except httpx.RequestError as error:
            raise NotificationError(f"WhatsApp API unreachable: {error}") from error
        if response.status_code >= 400:
            raise NotificationError(
                f"WhatsApp API returned {response.status_code}: {response.text[:200]}"
            )
