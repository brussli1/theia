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

    @property
    def debug(self) -> bool:
        return self.environment == "development"


settings = Settings()
