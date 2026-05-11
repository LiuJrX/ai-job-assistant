from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from automation import JobConfig, JobBot, AIService
import os

app = FastAPI()

class StartRequest(BaseModel):
    keywords: List[str]
    cities: List[str]
    platforms: List[str]
    candidate_profile: str = ""

@app.get("/")
def read_root():
    return {"status": "AI Job Assistant Backend Running"}

@app.post("/start")
async def start_bot(request: StartRequest):
    config = JobConfig(
        keywords=request.keywords,
        cities=request.cities,
        platforms=request.platforms
    )
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not found")
        
    ai = AIService(api_key=api_key)
    bot = JobBot(config, ai)
    
    # Run in background
    asyncio.create_task(bot.run())
    
    return {"message": "Bot started successfully", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
