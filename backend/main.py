from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from dotenv import load_dotenv

from adzuna_service import fetch_jobs
from llm_service import analyze_resume, match_jobs, generate_cover_letter, optimize_resume
from tracker_routes import router as tracker_router
from auth_routes import router as auth_router
from models import (
    CleanedJob,
    AnalyzeResumeRequest,
    AnalyzeResumeResponse,
    MatchJobsRequest,
    MatchJobResult,
    GenerateCoverLetterRequest,
    GenerateCoverLetterResponse,
    OptimizeResumeRequest,
    OptimizeResumeResponse,
)

load_dotenv()

app = FastAPI(
    title="AI Job Search API",
    description="AI-powered job search, resume analysis, and cover letter generation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(tracker_router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Job Intelligence & Career Readiness Platform"}

@app.get("/jobs", response_model=List[CleanedJob])
async def get_jobs(
    role: str,
    location: str = "",
    last_24: bool = False,
    experience_level: str = "",
    posted_within: Optional[str] = None,  # ✅ "24h", "7d", or None
):
    print(f"[GET /jobs] role={role}, location={location}, last_24={last_24}, experience_level={experience_level}, posted_within={posted_within}")
    try:
        from datetime import datetime, timedelta, timezone
        
        # Fetch jobs from Adzuna
        jobs = await fetch_jobs(role, location, last_24, experience_level)
        print(f"[GET /jobs] Fetched {len(jobs)} jobs from Adzuna")
        
        # 🔥 LinkedIn-style Last 24 Hours filtering (strict)
        if last_24:
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(hours=24)
            filtered_jobs = []
            
            print(f"[GET /jobs] 🔥 Applying strict 24-hour filter (cutoff: {cutoff})")
            
            for job in jobs:
                # Include jobs without 'created' field by default
                if "created" not in job or not job["created"]:
                    filtered_jobs.append(job)
                    continue
                
                try:
                    # Parse ISO timestamp (e.g., "2026-02-10T12:45:30Z")
                    created_str = job["created"].replace("Z", "+00:00")
                    created_dt = datetime.fromisoformat(created_str)
                    
                    # Ensure timezone-aware comparison
                    if created_dt.tzinfo is None:
                        created_dt = created_dt.replace(tzinfo=timezone.utc)
                    
                    # Only include if posted in last 24 hours
                    if created_dt >= cutoff:
                        filtered_jobs.append(job)
                except (ValueError, AttributeError) as e:
                    # Include jobs with invalid timestamps by default
                    print(f"[GET /jobs] Warning: Failed to parse created date: {e}")
                    filtered_jobs.append(job)
            
            jobs = filtered_jobs
            print(f"[GET /jobs] After 24h filter: {len(jobs)} jobs remain")
        
        # ✅ Filter by posted_within if specified (7d option)
        elif posted_within:
            now = datetime.now(timezone.utc)
            cutoff = None
            
            if posted_within == "24h":
                cutoff = now - timedelta(hours=24)
                print(f"[GET /jobs] Filtering for jobs posted in last 24 hours (cutoff: {cutoff})")
            elif posted_within == "7d":
                cutoff = now - timedelta(days=7)
                print(f"[GET /jobs] Filtering for jobs posted in last 7 days (cutoff: {cutoff})")
            
            if cutoff:
                filtered_jobs = []
                for job in jobs:
                    # Include jobs without 'created' field by default
                    if "created" not in job or not job["created"]:
                        filtered_jobs.append(job)
                        continue
                    
                    try:
                        # Parse ISO timestamp (e.g., "2026-02-10T12:45:30Z")
                        created_str = job["created"].replace("Z", "+00:00")
                        created_dt = datetime.fromisoformat(created_str)
                        
                        if created_dt >= cutoff:
                            filtered_jobs.append(job)
                    except (ValueError, AttributeError) as e:
                        # Include jobs with invalid timestamps by default
                        print(f"[GET /jobs] Warning: Failed to parse created date for job: {e}")
                        filtered_jobs.append(job)
                
                jobs = filtered_jobs
                print(f"[GET /jobs] After filtering: {len(jobs)} jobs remain")
        
        print(f"[GET /jobs] Successfully returning {len(jobs)} jobs")
        return jobs
    except Exception as e:
        print(f"[GET /jobs] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-resume", response_model=AnalyzeResumeResponse)
async def post_analyze_resume(request: AnalyzeResumeRequest):
    print(f"[POST /analyze-resume] Starting analysis")
    try:
        result = await analyze_resume(request.resume_text, request.job_description)
        print(f"[POST /analyze-resume] ATS Score: {result.ats_score}")
        return result
    except Exception as e:
        print(f"[POST /analyze-resume] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-jobs", response_model=List[MatchJobResult])
async def post_match_jobs(request: MatchJobsRequest):
    print(f"[POST /match-jobs] Matching {len(request.jobs)} jobs")
    try:
        jobs_dicts = [{"title": job.title, "description": job.description, "company": job.company} for job in request.jobs]
        results = await match_jobs(request.resume_text, jobs_dicts)
        print(f"[POST /match-jobs] Matched {len(results)} jobs")
        return results
    except Exception as e:
        print(f"[POST /match-jobs] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-cover-letter", response_model=GenerateCoverLetterResponse)
async def post_generate_cover_letter(request: GenerateCoverLetterRequest):
    print(f"[POST /generate-cover-letter] Generating for {request.company}")
    try:
        result = await generate_cover_letter(
            request.resume_text,
            request.job_description,
            request.company
        )
        print(f"[POST /generate-cover-letter] Generated {len(result.cover_letter)} chars")
        return result
    except Exception as e:
        print(f"[POST /generate-cover-letter] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-optimized-resume", response_model=OptimizeResumeResponse)
async def post_generate_optimized_resume(request: OptimizeResumeRequest):
    print(f"[POST /generate-optimized-resume] Starting optimization")
    try:
        result = await optimize_resume(request.resume_text, request.job_description)
        print(f"[POST /generate-optimized-resume] Optimized resume: {len(result.optimized_resume)} chars, Score: {result.estimated_new_score}")
        return result
    except Exception as e:
        print(f"[POST /generate-optimized-resume] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
