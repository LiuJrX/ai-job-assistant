"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the agent."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    env: str = Field(default="development")
    log_level: str = Field(default="INFO")
    headless: bool = Field(default=True)
    max_jobs: int = Field(default=30, ge=1, le=500)
    request_timeout: int = Field(default=30, ge=5, le=300)

    openai_api_key: str | None = None
    llm_model: str = Field(default="gpt-4o-mini")

    boss_greeting: str | None = Field(
        default=None,
        description="Greeting template for Boss直聘. Supports {company}, {title}, {name}.",
    )
    boss_apply_delay_min: float = Field(default=3.0, ge=0.5)
    boss_apply_delay_max: float = Field(default=8.0, ge=1.0)
    boss_daily_limit: int = Field(default=100, ge=1, le=150)
    boss_skip_inactive_days: int = Field(default=7, ge=1)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
