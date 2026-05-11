"""Core domain models used across scraping, matching, and applying."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, HttpUrl, model_validator


class JobSource(str, Enum):
    """Supported job sources."""

    BOSS = "boss"


class ApplicationStatus(str, Enum):
    """Application states."""

    SUCCESS = "success"
    DRAFT = "draft"
    FAILED = "failed"


class SalaryRange(BaseModel):
    """Represents a salary range with currency."""

    min_annual: int | None = Field(default=None, ge=0)
    max_annual: int | None = Field(default=None, ge=0)
    currency: str = Field(default="CNY", min_length=3, max_length=3)

    @model_validator(mode="after")
    def validate_range(self) -> "SalaryRange":
        """Ensure max salary is not lower than min salary."""

        if self.min_annual is not None and self.max_annual is not None:
            if self.max_annual < self.min_annual:
                raise ValueError(
                    "max_annual must be greater than or equal to min_annual"
                )
        return self


class Job(BaseModel):
    """A normalized job listing from any source platform."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    source: JobSource
    title: str
    company: str
    location: str
    url: HttpUrl
    description: str
    salary: SalaryRange | None = None
    tags: list[str] = Field(default_factory=list)
    posted_at: datetime | None = None
    scraped_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: dict[str, Any] = Field(default_factory=dict)


class Match(BaseModel):
    """Match result between a profile and a job listing."""

    job_id: str
    score: float = Field(ge=0.0, le=1.0)
    reasoning: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Application(BaseModel):
    """Tracks application submission and follow-up details."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    job_id: str
    source: JobSource
    status: ApplicationStatus = ApplicationStatus.DRAFT
    applied_at: datetime | None = None
