from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Zenvyra AI API"
    api_v1_prefix: str = "/api/v1"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    max_upload_mb: int = 20
    temp_dir: Path = Path("./tmp_uploads")
    file_retention_hours: int = 24
    default_bg_model: str = "birefnet-general"
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.temp_dir.mkdir(parents=True, exist_ok=True)
    return settings
