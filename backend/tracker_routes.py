"""
Job Tracker — SQLite-backed, auth-protected.
Endpoints: POST /track-job, GET /tracked-jobs, PUT /update-status/{job_id}
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User, TrackedJobDB
from auth_routes import get_current_user

router = APIRouter(tags=["Job Tracker"])

# ── Pydantic schemas ────────────────────────────────────

class TrackJobRequest(BaseModel):
    title: str
    company: str
    location: str = ""
    apply_link: str = ""

class TrackedJob(BaseModel):
    id: str
    title: str
    company: str
    location: str
    apply_link: str
    status: str = "Applied"
    applied_date: str = ""

class UpdateStatusRequest(BaseModel):
    status: str

# ── Routes (all require auth) ───────────────────────────

@router.post("/track-job", response_model=TrackedJob)
async def track_job(
    req: TrackJobRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a job to the tracker."""
    job = TrackedJobDB(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=req.title,
        company=req.company,
        location=req.location,
        apply_link=req.apply_link,
        status="Applied",
        applied_date=""
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/tracked-jobs", response_model=List[TrackedJob])
async def get_tracked_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return tracked jobs belonging to the logged-in user."""
    rows = db.query(TrackedJobDB).filter(TrackedJobDB.user_id == current_user.id).all()
    return rows


@router.put("/update-status/{job_id}", response_model=TrackedJob)
async def update_status(
    job_id: str,
    req: UpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the status of a tracked job (must belong to user)."""
    job = (
        db.query(TrackedJobDB)
        .filter(TrackedJobDB.id == job_id, TrackedJobDB.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    job.status = req.status
    db.commit()
    db.refresh(job)
    return job
