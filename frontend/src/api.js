import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
});

// ── Interceptor: attach Bearer token to every request ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔐 TOKEN BEING SENT:', token.substring(0, 20) + '...');
  } else {
    console.log('⚠️ NO TOKEN FOUND IN LOCALSTORAGE');
  }

  return config;
});

function getErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.error && typeof detail.error === 'string') return detail.error;
  if (typeof err?.message === 'string') return err.message;
  return 'Something went wrong. Please try again.';
}

// ── Auth endpoints ─────────────────────────────────────

export async function registerUser(email, password) {
  try {
    const res = await api.post('/register', { email, password });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function loginUser(email, password) {
  try {
    const res = await api.post('/login', { email, password });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

// ── Job endpoints (unchanged) ──────────────────────────

export async function searchJobs(role, location, { last_24 = false, experience_level = '' } = {}) {
  try {
    const res = await api.get('/jobs', {
      params: {
        role,
        location: location || undefined,
        last_24: last_24 || undefined,
        experience_level: experience_level || undefined,
      },
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function analyzeResume(resumeText, jobDescription) {
  try {
    const res = await api.post('/analyze-resume', {
      resume_text: resumeText,
      job_description: jobDescription,
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function matchJobs(resumeText, jobs) {
  try {
    const res = await api.post('/match-jobs', {
      resume_text: resumeText,
      jobs,
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function generateCoverLetter(resumeText, jobDescription, company) {
  try {
    const res = await api.post('/generate-cover-letter', {
      resume_text: resumeText,
      job_description: jobDescription,
      company,
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

// ── Tracker endpoints ──────────────────────────────────

export async function trackJob(job) {
  try {
    const res = await api.post('/track-job', {
      title: job.title,
      company: job.company,
      location: job.location || '',
      apply_link: job.apply_link || '',
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function getTrackedJobs() {
  try {
    const res = await api.get('/tracked-jobs');
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function updateTrackedJobStatus(jobId, status) {
  try {
    const res = await api.put(`/update-status/${jobId}`, { status });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function optimizeResume(resumeText, jobDescription) {
  try {
    const res = await api.post('/generate-optimized-resume', {
      resume_text: resumeText,
      job_description: jobDescription,
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}
