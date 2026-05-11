"""Abstract base class for job application adapters."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Self

from backend.models import Application, Job


class BaseApplier(ABC):
    """Base applier that platform-specific appliers must implement."""

    @abstractmethod
    async def apply(self, job: Job, scoring_rules: list) -> Application: ...

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *args: object) -> None:
        pass
