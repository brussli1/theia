from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Theia API"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://theia:theia@localhost:5432/theia"
    database_url_sync: str = "postgresql://theia:theia@localhost:5432/theia"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    @property
    def debug(self) -> bool:
        return self.environment == "development"


settings = Settings()
