from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Theia API"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://theia:theia@localhost:5432/theia"
    database_url_sync: str = "postgresql://theia:theia@localhost:5432/theia"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # Payments (#12): `sandbox` simulates the gateways so checkout works in
    # dev/test/CI without merchant accounts; `production` wires the real
    # gateways (Bancard vPOS for cards, PayPal REST). The charge currency is
    # per gateway — PYG for cards/Western Union, USD for PayPal — see
    # docs/adr/0001-payments.md.
    payment_mode: str = "sandbox"
    frontend_url: str = "http://localhost:3000"
    bancard_public_key: str = ""
    bancard_private_key: str = ""
    paypal_client_id: str = ""
    paypal_client_secret: str = ""

    # Quote notifications (#13): a channel is enabled by its credentials
    # being present — SMTP when `smtp_host` is set, WhatsApp when both
    # `whatsapp_token` and `whatsapp_phone_id` are set. With nothing
    # configured (dev/test/CI) the composed message is logged instead, and
    # the confirmation page offers wa.me/mailto links as the fallback path.
    # See docs/adr/0002-quotes.md.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    notification_email_to: str = "td.phakos@gmail.com"
    whatsapp_token: str = ""
    whatsapp_phone_id: str = ""
    notification_whatsapp_to: str = "595971282908"

    # Accounts (#14): `jwt_secret` signs session tokens. Empty by default —
    # dev/test/CI fall back to a fixed development secret, production refuses
    # to sign until it is set (see app/core/security.py).
    jwt_secret: str = ""
    jwt_expires_minutes: int = 60 * 24 * 30

    # Admin panel (#15): when both `admin_email` and `admin_password` are set,
    # the app bootstraps (or refreshes) that account with the `admin` role at
    # startup. Empty by default like every credential in this repo.
    admin_email: str = ""
    admin_password: str = ""

    # Product image uploads (#15): files are stored under `media_dir` and
    # served by the backend at `/media/<file>`; `media_url` is the base the
    # stored URLs are built from (the browser must be able to reach it).
    media_dir: str = "media"
    media_url: str = "http://localhost:8000"

    @property
    def debug(self) -> bool:
        return self.environment == "development"


settings = Settings()
