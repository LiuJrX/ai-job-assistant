import asyncio
from typing import List
from .base import BasePlatform, JobInfo

class ZhipinPlatform(BasePlatform):
    async def search_jobs(self, keywords: List[str], cities: List[str]):
        page = await self.context.new_page()
        for city in cities:
            for keyword in keywords:
                print(f"[智联招聘] 正在 {city} 搜索 {keyword}...")
                await asyncio.sleep(1)
        await page.close()

    async def apply_job(self, job_info: JobInfo) -> bool:
        print(f"[智联招聘] 正在投递职位: {job_info.title} @ {job_info.company}")
        await asyncio.sleep(1)
        return True
