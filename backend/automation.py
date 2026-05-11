import os
import asyncio
from typing import List, Optional
from playwright.async_api import async_playwright
from pydantic import BaseModel
import google.generativeai as genai

# Support both `python backend/main.py` and package-style imports.
try:
    from .platforms.boss import BossPlatform
    from .platforms.liepin import LiepinPlatform
    from .platforms.zhipin import ZhipinPlatform
except ImportError:
    from platforms.boss import BossPlatform
    from platforms.liepin import LiepinPlatform
    from platforms.zhipin import ZhipinPlatform

class JobConfig(BaseModel):
    keywords: List[str]
    cities: List[str]
    salary_range: Optional[str] = None
    platforms: List[str] = ["boss", "liepin", "zhipin"]
    ai_filtering: bool = True

class AIService:
    def __init__(self, api_key: str):
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    async def analyze_jd(self, jd_text: str, candidate_profile: str) -> bool:
        if not self.model:
            return True # Default to true if no AI key
            
        prompt = f"""
        Role: Efficient Job Matching Assistant
        Candidate Profile: {candidate_profile}
        Job Description Score: {jd_text}
        
        Analyze if the job description matches the candidate profile. 
        Return ONLY a boolean: 'True' if it's a good match, 'False' otherwise.
        """
        response = await self.model.generate_content_async(prompt)
        return "true" in response.text.lower()

class JobBot:
    def __init__(self, config: JobConfig, ai_service: AIService):
        self.config = config
        self.ai_service = ai_service

    async def run(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            
            platform_map = {
                "boss": BossPlatform(context),
                "liepin": LiepinPlatform(context),
                "zhipin": ZhipinPlatform(context)
            }
            
            tasks = []
            for platform_id in self.config.platforms:
                if platform_id in platform_map:
                    p_instance = platform_map[platform_id]
                    tasks.append(p_instance.search_jobs(self.config.keywords, self.config.cities))
            
            if tasks:
                await asyncio.gather(*tasks)
            
            await browser.close()
