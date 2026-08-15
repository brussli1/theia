"""Email delivery of quote notifications via SMTP.

The recipient is Theia's contact inbox (`notification_email_to`, default
td.phakos@gmail.com). The SMTP client is injectable so tests can record the
message at the transport boundary instead of mocking smtplib.
"""

import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Callable, TypeAlias

from app.notifications.base import NotificationError, QuoteMessage

SmtpClientFactory: TypeAlias = Callable[[str, int], smtplib.SMTP]


class EmailNotifier:
    def __init__(
        self,
        *,
        host: str,
        port: int,
        user: str,
        password: str,
        from_name: str,
        from_addr: str,
        to_addr: str,
        client_factory: SmtpClientFactory | None = None,
    ) -> None:
        self._host = host
        self._port = port
        self._user = user
        self._password = password
        self._from_name = from_name
        self._from_addr = from_addr
        self._to_addr = to_addr
        self._client_factory = client_factory or smtplib.SMTP

    def notify(self, message: QuoteMessage) -> None:
        mail = MIMEText(message.email_body, "plain", "utf-8")
        mail["Subject"] = message.subject
        mail["From"] = formataddr((self._from_name, self._from_addr))
        mail["To"] = self._to_addr
        try:
            with self._client_factory(self._host, self._port, timeout=10) as client:
                client.starttls()
                if self._user:
                    client.login(self._user, self._password)
                client.sendmail(self._from_addr, [self._to_addr], mail.as_string())
        except (OSError, smtplib.SMTPException) as error:
            raise NotificationError(str(error)) from error
