"""Abstract base class for job scrapers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Self

from backend.models import Job, JobSource


class BaseScraper(ABC):
    """Base scraper that all platform scrapers must implement."""

    source: JobSource

    @abstractmethod
    async def scrape_jobs(
        self,
        query: str,
        city: str,
        experience: str | None = None,
        salary: str | None = None,
        limit: int = 20,
    ) -> list[Job]:
        """
        Scrape job listings matching the query.
        """
        ...

    async def __aenter__(self) -> Self:
        """Set up browser/login resources."""
        return self

    async def __aexit__(self, *args: object) -> None:
        """exit"""
