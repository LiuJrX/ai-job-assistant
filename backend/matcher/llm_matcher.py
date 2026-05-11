"""LLM-based job-profile matching engine."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from langchain.chat_models import init_chat_model
from langchain.schema import HumanMessage, SystemMessage

from backend.models.config import get_settings
from backend.models import Job, Match

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a job matching assistant. Given a job listing, evaluate the match quality according to the scoring rules. Return a JSON object with:
- score: a float from 0.0 to 1.0, indicating how well the candidate matches the job
- reasoning: a list of strings explaining the reasons for the score
- matched_skills: skills the candidate has that are required by the job (can be empty)
- missing_skills: skills required by the job that the candidate lacks (can be empty)

Be objective. You must follow the scoring rules.
Return ONLY valid JSON, no markdown."""


def _resolve_llm_backend() -> tuple[str, str | None]:
    """
    Determine which LLM backend to use.
    """
    settings = get_settings()

    return "openai", settings.llm_model


class LLMMatcher:
    """
    Score job-profile fit using an LLM.
    """

    def __init__(self, model_name: str | None = None) -> None:
        self._backend, default_model = _resolve_llm_backend()
        self._model_name = model_name or default_model or "gpt-4o-mini"

        self._llm = init_chat_model(self._model_name)
        logger.info("Using OpenAI (%s)", self._model_name)

    async def match(self, job: Job, scoring_rules: list) -> Match:
        """
        Score a single job against a rules.
        """
        prompt = self._build_prompt(job, scoring_rules)

        try:
            response = await self._llm.ainvoke(
                [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=prompt),
                ]
            )
            raw = response.content

            result = json.loads(raw)

            return Match(
                job_id=job.id,
                score=max(0.0, min(1.0, float(result.get("score", 0.0)))),
                reasoning=result.get("reasoning", []),
                matched_skills=result.get("matched_skills", []),
                missing_skills=result.get("missing_skills", []),
            )
        except Exception as e:
            logger.error("LLM match failed for job %s: %s", job.id, e)
            return Match(
                job_id=job.id,
                score=0.0,
                reasoning=[f"Match evaluation failed: {e}"],
            )

    async def batch_match(
        self,
        jobs: list[Job],
        profile: Profile,
    ) -> list[Match]:
        """Score multiple jobs against a profile.

        Args:
            jobs: List of job listings.
            profile: The candidate profile.

        Returns:
            List of Match objects, one per job.
        """
        matches = []
        for job in jobs:
            match = await self.match(job, profile)
            matches.append(match)
            logger.info(
                "Matched %s @ %s → %.2f",
                job.title,
                job.company,
                match.score,
            )
        return matches

    @staticmethod
    def _build_prompt(job: Job, scoring_rules: list) -> str:
        """Build the matching prompt from job and profile data."""
        salary_info = ""
        if job.salary:
            salary_info = (
                f"Salary: {job.salary.min_annual}-{job.salary.max_annual} "
                f"{job.salary.currency}/year"
            )

        return f"""## Scoring Rules
{"\n".join(scoring_rules)}

## Job Listing
Title: {job.title}
Company: {job.company}
Location: {job.location}
{salary_info}
Tags: {', '.join(job.tags)}
Description: {job.description[:2000]}

Evaluate the match and return JSON."""
