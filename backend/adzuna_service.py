import os
import asyncio
import requests
from typing import List
from models import CleanedJob

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs/in/search/1"

def _truncate_text(text: str, max_length: int = 300) -> str:
    if not text:
        return ""
    text = str(text).strip()
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."

EXPERIENCE_MAP = {
    "entry": "junior",
    "mid": "mid level",
    "senior": "senior",
}

def _fetch_jobs_sync(
    role: str,
    location: str = "",
    last_24: bool = False,
    experience_level: str = "",
) -> List[CleanedJob]:
    print(f"[Adzuna] Fetching jobs: role='{role}', location='{location}', last_24={last_24}, exp='{experience_level}'")
    
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        error_msg = "ADZUNA_APP_ID and ADZUNA_APP_KEY must be set in .env"
        print(f"[Adzuna] ERROR: {error_msg}")
        raise Exception(error_msg)
    
    # Build search query — optionally append experience keyword
    search_query = role
    exp_keyword = EXPERIENCE_MAP.get(experience_level.lower().strip(), "")
    if exp_keyword:
        search_query = f"{role} {exp_keyword}"
    
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": search_query,
        "results_per_page": 10,
    }
    
    if location:
        params["where"] = location
    
    if last_24:
        params["max_days_old"] = 1
    
    print(f"[Adzuna] Calling API: {ADZUNA_BASE_URL}")
    
    try:
        response = requests.get(ADZUNA_BASE_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        print(f"[Adzuna] Received {len(results)} results from API")
        
        jobs = []
        
        for idx, item in enumerate(results):
            try:
                # Safely extract location
                location_obj = item.get("location", {})
                if isinstance(location_obj, dict):
                    location_str = location_obj.get("display_name", "Unknown")
                else:
                    location_str = "Unknown"
                
                # Safely extract company
                company_obj = item.get("company", {})
                if isinstance(company_obj, dict):
                    company_str = company_obj.get("display_name", "Unknown")
                else:
                    company_str = str(company_obj) if company_obj else "Unknown"
                
                # Extract other fields with defaults
                title = item.get("title", "Unknown Role")
                description = item.get("description", "")
                apply_link = item.get("redirect_url") or item.get("url") or "#"
                
                job = CleanedJob(
                    title=str(title),
                    company=str(company_str),
                    location=str(location_str),
                    description=_truncate_text(description, 300),
                    apply_link=str(apply_link)
                )
                jobs.append(job)
                
            except Exception as e:
                print(f"[Adzuna] Error parsing job {idx}: {str(e)}")
                continue
        
        print(f"[Adzuna] Successfully parsed {len(jobs)} jobs")
        return jobs
        
    except requests.RequestException as e:
        error_msg = f"Adzuna API request failed: {str(e)}"
        print(f"[Adzuna] ERROR: {error_msg}")
        raise Exception(error_msg)
    except ValueError as e:
        error_msg = f"Adzuna API returned invalid JSON: {str(e)}"
        print(f"[Adzuna] ERROR: {error_msg}")
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Unexpected Adzuna error: {str(e)}"
        print(f"[Adzuna] ERROR: {error_msg}")
        raise Exception(error_msg)

async def fetch_jobs(
    role: str,
    location: str = "",
    last_24: bool = False,
    experience_level: str = "",
) -> List[CleanedJob]:
    return await asyncio.to_thread(_fetch_jobs_sync, role, location, last_24, experience_level)
