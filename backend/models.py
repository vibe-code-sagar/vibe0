from pydantic import BaseModel, Field
from typing import List, Optional

class CleanedJob(BaseModel):
    title: str
    company: str
    location: str
    description: str
    apply_link: str
    created: Optional[str] = None  # Add created field for filtering
    id: Optional[str] = None  # Add id field for unique identification

class AnalyzeResumeRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)

class AnalyzeResumeResponse(BaseModel):
    ats_score: float = Field(..., ge=0, le=100)
    missing_keywords: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.8, ge=0, le=1)  # Add confidence scoring

class JobForMatching(BaseModel):
    title: str
    description: str
    company: Optional[str] = None

class MatchJobsRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    jobs: List[JobForMatching] = Field(..., min_length=1)

class MatchJobResult(BaseModel):
    title: str
    company: str
    match_score: float = Field(..., ge=0, le=100)
    reasoning: str
    confidence: float = Field(default=0.8, ge=0, le=1)  # Add confidence scoring

class GenerateCoverLetterRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)

class GenerateCoverLetterResponse(BaseModel):
    cover_letter: str

class OptimizeResumeRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)

class OptimizeResumeResponse(BaseModel):
    optimized_resume: str
    original_score: float = Field(..., ge=0, le=100)
    new_score: float = Field(..., ge=0, le=100)
