from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel
from playwright.async_api import BrowserContext

class JobInfo(BaseModel):
    title: str
    company: str
    location: str
    salary: str
    description: str
    link: str

class BasePlatform(ABC):
    def __init__(self, context: BrowserContext):
        self.context = context

    @abstractmethod
    async def search_jobs(self, keywords: List[str], cities: List[str]):
        pass

    @abstractmethod
    async def apply_job(self, job_info: JobInfo) -> bool:
        pass
