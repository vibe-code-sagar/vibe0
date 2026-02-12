import requests
import json
import os
import re
from models import AnalyzeResumeResponse, MatchJobResult, GenerateCoverLetterResponse, OptimizeResumeResponse
from fastapi import HTTPException

# Ollama Configuration
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"
MAX_RETRIES = 2

def safe_json_parse(text: str, expect_array: bool = False):
    """Safely parse JSON with multiple fallback strategies."""
    try:
        # Try direct parsing first
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"[JSON Parse] Direct parse failed: {str(e)}")
        
        # Strategy 1: Remove markdown code blocks
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"[JSON Parse] Cleaned parse failed: {str(e)}")
            print(f"[JSON Parse] First 500 chars: {cleaned[:500]}")
            
            # Strategy 2: Extract JSON using regex
            if expect_array:
                match = re.search(r'\[.*\]', cleaned, re.DOTALL)
            else:
                match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            
            if match:
                extracted = match.group()
                print(f"[JSON Parse] Regex extracted {len(extracted)} chars")
                
                # Strategy 2.5: Sanitize escape characters
                # Remove invalid escape sequences that LLM might add
                sanitized = extracted
                # Replace common invalid escapes with safe versions
                # Keep valid escapes: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
                # Remove others by replacing \X with just X
                import re as regex_module
                # Find all backslashes not followed by valid escape chars
                sanitized = regex_module.sub(r'\\(?!["\\/bfnrtu])', '', sanitized)
                
                if sanitized != extracted:
                    print(f"[JSON Parse] Sanitized escape characters")
                
                try:
                    return json.loads(sanitized)
                except json.JSONDecodeError as e:
                    print(f"[JSON Parse] Sanitized parse failed: {str(e)}")
                    # Last resort: try to fix common issues
                    try:
                        # Remove ALL backslashes that aren't escaping quotes
                        desperate = sanitized.replace('\\', '')
                        desperate = desperate.replace('""', '"')  # Fix double quotes
                        return json.loads(desperate)
                    except:
                        print(f"[JSON Parse] Extracted parse failed: {str(e)}")
                        print(f"[JSON Parse] Extracted first 500 chars: {extracted[:500]}")
            else:
                print(f"[JSON Parse] No JSON pattern found in text")
            
            # Strategy 3: Return safe defaults
            if expect_array:
                print("[JSON Parse] Failed to parse, returning empty array")
                return []
            else:
                print("[JSON Parse] Failed to parse, returning empty object")
                return {}

def _call_ollama(prompt: str) -> str:
    """Helper to call Ollama API."""
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        print(f"[Ollama] Sending request to {OLLAMA_API_URL}")
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        return result.get("response", "")
        
    except requests.exceptions.ConnectionError:
        print("[Ollama] ERROR: Could not connect to Ollama. Is it running?")
        raise HTTPException(status_code=503, detail="Ollama is not running. Please start Ollama.")
    except Exception as e:
        print(f"[Ollama] ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def _call_ollama_with_retry(prompt: str, max_retries: int = MAX_RETRIES) -> str:
    """Call Ollama with retry mechanism for stability."""
    last_error = None
    
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                print(f"[Ollama] Retry attempt {attempt + 1}/{max_retries}")
            return _call_ollama(prompt)
        except HTTPException as e:
            # Don't retry connection errors or service unavailable
            if e.status_code in [503]:
                raise
            last_error = e
        except Exception as e:
            last_error = e
    
    # If all retries failed, raise the last error
    if last_error:
        raise last_error
    return ""

async def analyze_resume(resume_text: str, job_description: str) -> AnalyzeResumeResponse:
    print("[Ollama] Starting resume analysis")
    
    prompt = f"""You are an ATS (Applicant Tracking System) expert. Analyze the resume against the job description.

Resume:
{resume_text}

Job Description:
{job_description}

Provide a JSON response with exactly these fields:
- ats_score: number between 0-100
- missing_keywords: array of strings
- strengths: array of strings
- improvements: array of strings

Return ONLY valid JSON, no markdown formatting."""

    response_text = _call_ollama_with_retry(prompt)
    print(f"[Ollama] Raw analyze response length: {len(response_text)}")
    
    # Use safe JSON parsing
    try:
        data = safe_json_parse(response_text, expect_array=False)
        
        return AnalyzeResumeResponse(
            ats_score=float(data.get("ats_score", 0)),
            missing_keywords=data.get("missing_keywords", []),
            strengths=data.get("strengths", []),
            improvements=data.get("improvements", [])
        )
    except Exception as e:
        print(f"[Ollama] Error creating response: {str(e)}")
        # Return safe defaults instead of crashing
        return AnalyzeResumeResponse(
            ats_score=0.0,
            missing_keywords=[],
            strengths=[],
            improvements=["Unable to analyze resume. Please try again."]
        )

async def match_jobs(resume_text: str, jobs: list) -> list:
    print(f"[Ollama] Matching {len(jobs)} jobs in one request")
    
    jobs_text = ""
    for i, job in enumerate(jobs):
        jobs_text += f"Job {i+1}:\nTitle: {job['title']}\nCompany: {job.get('company', 'Unknown')}\nDescription: {job['description']}\n\n"
    
    prompt = f"""You are a job matching expert. Analyze the resume against the following list of jobs and return ONLY a JSON array.

Resume:
{resume_text}

Jobs List:
{jobs_text}

IMPORTANT: You MUST return ONLY a JSON array. No explanations, no markdown, no text before or after.

For each job, create an object with these EXACT keys:
- title: string (exact job title from list)
- company: string (exact company name from list)
- match_score: number (0-100)
- reasoning: string (2-3 sentences, NO quotes inside, NO backslashes)

JSON FORMATTING RULES:
1. Return ONLY the JSON array, nothing else
2. Start with [ and end with ]
3. No markdown code blocks (no ```)
4. No comments
5. No trailing commas
6. Use double quotes for strings
7. Do NOT use backslash characters
8. Do NOT escape quotes in reasoning text
9. Keep reasoning simple and plain

EXAMPLE FORMAT:
[
  {{
    "title": "Software Engineer",
    "company": "Tech Corp",
    "match_score": 85,
    "reasoning": "Strong match with required Python and React skills. Has 3 years experience."
  }},
  {{
    "title": "Data Analyst",
    "company": "Data Inc",
    "match_score": 60,
    "reasoning": "Some relevant skills but lacks SQL experience. Good analytical background."
  }}
]

Return ONLY the JSON array for all {len(jobs)} jobs. Start your response with [ and end with ]."""

    response_text = _call_ollama_with_retry(prompt)
    print(f"[Ollama] Raw match response length: {len(response_text)}")
    
    # Use safe JSON parsing with array expectation
    try:
        data = safe_json_parse(response_text, expect_array=True)
        
        if not isinstance(data, list):
            print(f"[Ollama] Warning: Expected array but got {type(data)}")
            return []
        
        results = []
        for item in data:
            try:
                results.append(MatchJobResult(
                    title=str(item.get("title", "Unknown")),
                    company=str(item.get("company", "Unknown")),
                    match_score=float(item.get("match_score", 0)),
                    reasoning=str(item.get("reasoning", ""))
                ))
            except Exception as e:
                print(f"[Ollama] Error parsing job result: {str(e)}")
                continue
        
        return results
        
    except Exception as e:
        print(f"[Ollama] Match jobs error: {str(e)}")
        # Return empty list instead of crashing
        return []

async def generate_cover_letter(resume_text: str, job_description: str, company: str) -> GenerateCoverLetterResponse:
    print(f"[Ollama] Generating cover letter for {company}")
    
    prompt = f"""Write a professional cover letter based on this resume and job.

Resume:
{resume_text}

Job Description:
{job_description}

Company: {company}

Write a compelling, personalized cover letter in professional business format. Include:
- Proper greeting
- Strong opening paragraph
- 2-3 body paragraphs highlighting relevant experience
- Strong closing
- Professional sign-off

Return ONLY the cover letter text, no JSON or markdown formatting."""

    response_text = _call_ollama(prompt)
    
    print(f"[Ollama] Cover letter generated: {len(response_text)} chars")
    
    return GenerateCoverLetterResponse(cover_letter=response_text.strip())

async def optimize_resume(resume_text: str, job_description: str) -> OptimizeResumeResponse:
    print("[Ollama] Starting resume optimization")
    
    # Step 1: Generate optimized resume
    optimize_prompt = f"""You are an expert resume writer and ATS optimization specialist. Your task is to improve the following resume to better match the job description while maintaining complete honesty and factual accuracy.

Resume:
{resume_text}

Job Description:
{job_description}

IMPORTANT RULES:
1. DO NOT invent or fabricate any experience, skills, or qualifications
2. Only enhance and reframe existing information
3. Naturally incorporate missing keywords from the job description into existing experience
4. Improve bullet points for clarity and impact using action verbs
5. Enhance the professional summary to align with job requirements
6. Maintain the original resume structure and formatting
7. Keep the tone professional and authentic
8. Use quantifiable achievements where they already exist

OPTIMIZATION TASKS:
- Analyze the job description for key requirements and keywords
- Identify gaps in the current resume
- Rewrite resume sections to naturally incorporate relevant keywords
- Improve bullet point clarity (use strong action verbs, be specific)
- Enhance the professional summary to highlight relevant experience
- Ensure all improvements are based on existing information only

Return ONLY the complete optimized resume text. Do not include any explanations, markdown formatting, or JSON."""

    optimized_text = _call_ollama_with_retry(optimize_prompt)
    print(f"[Ollama] Optimized resume generated: {len(optimized_text)} chars")
    
    # Step 2: Use real ATS analysis for consistent scoring
    print("[Ollama] Calculating new ATS score using analyze_resume")
    try:
        analysis_result = await analyze_resume(optimized_text, job_description)
        estimated_score = analysis_result.ats_score
        print(f"[Ollama] Estimated new ATS score: {estimated_score}")
    except Exception as e:
        print(f"[Ollama] Score estimation error: {str(e)}, using default score of 75")
        estimated_score = 75.0
    
    return OptimizeResumeResponse(
        optimized_resume=optimized_text.strip(),
        estimated_new_score=estimated_score
    )
