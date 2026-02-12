import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { analyzeResume, generateCoverLetter, matchJobs, searchJobs, optimizeResume } from './api';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import JobSearch from './components/JobSearch';
import JobList from './components/JobList';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import ATSResult from './components/ATSResult';
import MatchResults from './components/MatchResults';
import CoverLetter from './components/CoverLetter';
import OptimizedResumeView from './components/OptimizedResumeView';
import Spinner from './components/Spinner';
import JobTracker from './pages/JobTracker';
import Login from './pages/Login';
import Register from './pages/Register';

/* ──────────────────────────────────────────────────────── */
/*  Home Page — the original dashboard (logic untouched)   */
/* ──────────────────────────────────────────────────────── */
function HomePage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [last24, setLast24] = useState(false);
  const [jobs, setJobs] = useState([]);

  // ✅ Restore cached jobs and search filters on mount
  useEffect(() => {
    const cachedJobs = localStorage.getItem('cachedJobs');
    const lastSearch = localStorage.getItem('lastSearch');

    if (cachedJobs) {
      try {
        const parsedJobs = JSON.parse(cachedJobs);
        setJobs(parsedJobs);
        setHasSearched(true);
      } catch (e) {
        console.error('Failed to parse cached jobs:', e);
      }
    }

    if (lastSearch) {
      try {
        const { role, location: loc, experienceLevel: exp, last24: l24 } = JSON.parse(lastSearch);
        if (role) setQuery(role);
        if (loc) setLocation(loc);
        if (exp) setExperienceLevel(exp);
        if (l24 !== undefined) setLast24(l24);
      } catch (e) {
        console.error('Failed to parse last search:', e);
      }
    }
  }, []);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resume, setResume] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [coverLetter, setCoverLetter] = useState('');

  const [loading, setLoading] = useState({
    search: false,
    analyze: false,
    match: false,
    coverLetter: false,
    optimize: false,
  });

  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [optimizedResumeResult, setOptimizedResumeResult] = useState(null);

  const anyLoading = loading.search || loading.analyze || loading.match || loading.coverLetter || loading.optimize;

  async function onSearch() {
    const role = query.trim();
    const loc = location.trim();
    if (!role) return;

    setError('');
    setLoading((p) => ({ ...p, search: true }));
    setHasSearched(true);
    setJobs([]);
    setSelectedJob(null);
    setAtsResult(null);
    setMatchResults([]);
    setCoverLetter('');
    setOptimizedResumeResult(null);

    try {
      const data = await searchJobs(role, loc, {
        last_24: last24,
        experience_level: experienceLevel,
      });
      const jobsData = Array.isArray(data) ? data : [];
      setJobs(jobsData);

      // ✅ Save jobs and search parameters to localStorage
      localStorage.setItem('cachedJobs', JSON.stringify(jobsData));
      localStorage.setItem('lastSearch', JSON.stringify({
        role,
        location: loc,
        experienceLevel,
        last24
      }));
    } catch (e) {
      setError(e.message || 'Failed to search jobs.');
    } finally {
      setLoading((p) => ({ ...p, search: false }));
    }
  }

  function onSelectJob(job) {
    setSelectedJob(job);
  }

  /* 
   * Unified Analysis Logic 
   * analyzeResume request now maps to the same structure as matchJobs 
   */
  async function onAnalyze() {
    if (!selectedJob) return;
    const text = resume.trim();
    if (!text) return;

    setError('');
    setLoading((p) => ({ ...p, analyze: true }));

    try {
      const data = await analyzeResume(text, selectedJob.description);

      // Update centralized matches state
      setAtsResult(data);
      setOptimizedResumeResult(null); // Clear optimization when new analysis is run
    } catch (e) {
      setError(e.message || 'Failed to analyze resume.');
    } finally {
      setLoading((p) => ({ ...p, analyze: false }));
    }
  }

  async function onMatchAllJobs() {
    const text = resume.trim();
    if (!text || !jobs.length) return;

    setError('');
    setLoading((p) => ({ ...p, match: true }));

    try {
      const jobsForMatching = jobs.map((j) => ({
        title: j.title,
        company: j.company || 'Unknown',
        description: j.description || 'No description available',
      }));

      const data = await matchJobs(text, jobsForMatching);
      const results = Array.isArray(data) ? data : [];

      setMatchResults(results);

      const normalize = (s) => (s || '').trim().toLowerCase();

      setJobs(prevJobs => prevJobs.map(job => {
        const match = results.find(
          r => normalize(r.title) === normalize(job.title)
            && normalize(r.company) === normalize(job.company)
        );

        const score = match
          ? (match.match_score ?? match.match_percentage ?? null)
          : null;

        return {
          ...job,
          match_score: score,
          match_percentage: score,
          reasoning: match ? match.reasoning : null,
          confidence: match ? match.confidence : null,
        };
      }));

    } catch (e) {
      setError(e.message || 'Failed to match jobs.');
    } finally {
      setLoading((p) => ({ ...p, match: false }));
    }
  }

  async function onGenerateCoverLetter() {
    const text = resume.trim();
    if (!text || !selectedJob) return;

    setError('');
    setLoading((p) => ({ ...p, coverLetter: true }));
    setCoverLetter('');

    try {
      const data = await generateCoverLetter(text, selectedJob.description, selectedJob.company);
      setCoverLetter(data?.cover_letter || '');
    } catch (e) {
      setError(e.message || 'Failed to generate cover letter.');
    } finally {
      setLoading((p) => ({ ...p, coverLetter: false }));
    }
  }

  async function onOptimizeResume() {
    const text = resume.trim();
    if (!text || !selectedJob || !atsResult) return;

    setError('');
    setLoading((p) => ({ ...p, optimize: true }));

    try {
      const data = await optimizeResume(text, selectedJob.description);
      setOptimizedResumeResult({
        optimized_resume: data.optimized_resume,
        original_score: data.original_score,
        new_score: data.new_score,
        original_resume: text,
      });
    } catch (e) {
      setError(e.message || 'Failed to optimize resume.');
    } finally {
      setLoading((p) => ({ ...p, optimize: false }));
    }
  }

  const canMatchAll = Boolean(resume.trim()) && jobs.length > 0 && !loading.match && !anyLoading;
  const canAnalyze = Boolean(resume.trim()) && Boolean(selectedJob) && !loading.analyze && !anyLoading;
  const canGenerateCoverLetter =
    Boolean(resume.trim()) && Boolean(selectedJob) && !loading.coverLetter && !anyLoading;
  const canOptimize = Boolean(resume.trim()) && Boolean(selectedJob) && Boolean(atsResult) && !loading.optimize && !anyLoading;

  return (
    <main className="dashboard">
      {/* ─── Left Column: Search & Job List ─── */}
      <div className="col-left">
        <div className="searchArea">
          <JobSearch
            query={query}
            location={location}
            onChangeQuery={setQuery}
            onChangeLocation={setLocation}
            onSearch={onSearch}
            loading={loading.search}
            disabled={anyLoading && !loading.search}
            experienceLevel={experienceLevel}
            onChangeExperienceLevel={setExperienceLevel}
            last24={last24}
            onChangeLast24={setLast24}
          />
          {error && <div className="errorBanner">{error}</div>}
        </div>

        <div className="jobListContainer">
          <JobList
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={onSelectJob}
            loading={loading.search}
            hasSearched={hasSearched}
          />
        </div>
      </div>

      {/* ─── Right Column: Analysis Panel ─── */}
      <div className="col-right">
        <ResumeAnalyzer
          resume={resume}
          onChangeResume={setResume}
          selectedJob={selectedJob}
          onAnalyze={onAnalyze}
          loading={loading.analyze}
          disabled={anyLoading && !loading.analyze}
        />

        <section className="card card--static">
          <div className="cardHeader">
            <h2 className="cardTitle">Actions</h2>
            <p className="cardSubTitle">AI-powered tools for your job search</p>
          </div>

          <div className="actionsGrid">
            <div className="actionsGroup">
              <h3 className="actionsGroup__title">Detailed Analysis</h3>
              <button
                className="btn btnPrimary btn--full"
                onClick={onAnalyze}
                disabled={!canAnalyze}
              >
                <span>Analyze Match</span>
                {loading.analyze && <Spinner size="small" color="white" />}
              </button>
              <button
                className="btn btnSecondary btn--full"
                onClick={onGenerateCoverLetter}
                disabled={!canGenerateCoverLetter}
              >
                <span>Generate Cover Letter</span>
                {loading.coverLetter && <Spinner size="small" />}
              </button>
              <p className="actionsGroup__hint">Requires selected job & resume</p>
            </div>

            <div className="actionsGroup">
              <h3 className="actionsGroup__title">Bulk Actions</h3>
              <button
                className="btn btnSecondary btn--full"
                onClick={onMatchAllJobs}
                disabled={!canMatchAll}
              >
                <span>Match All Jobs</span>
                {loading.match && <Spinner size="small" />}
              </button>
              <p className="actionsGroup__hint">Scores all jobs against resume</p>
            </div>
          </div>
        </section>

        {atsResult && (
          <ATSResult
            atsResult={atsResult}
            onOptimize={onOptimizeResume}
            optimizing={loading.optimize}
            canOptimize={canOptimize}
          />
        )}
        {optimizedResumeResult && (
          <OptimizedResumeView
            originalResume={optimizedResumeResult.original_resume}
            optimizedResume={optimizedResumeResult.optimized_resume}
            originalScore={optimizedResumeResult.original_score}
            newScore={optimizedResumeResult.new_score}
            onClose={() => setOptimizedResumeResult(null)}
          />
        )}
        {matchResults.length > 0 && <MatchResults matchResults={matchResults} />}
        {coverLetter && <CoverLetter coverLetter={coverLetter} />}
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────── */
/*  App Shell — Header + Router                            */
/* ──────────────────────────────────────────────────────── */
export default function App() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const isAuthPage = loc.pathname === '/login' || loc.pathname === '/register';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="page">
      {/* Hide header on login/register pages for a cleaner look */}
      {!isAuthPage && (
        <header className="appHeader">
          <div className="brand">
            <div className="brandMark" aria-hidden="true">AI</div>
            <div>
              <h1 className="appTitle">Job Intelligence Platform</h1>
              <p className="appTagline">Smart matching & resume optimization</p>
            </div>

            <nav className="navLinks">
              <Link
                to="/"
                className={`navLink${loc.pathname === '/' ? ' navLink--active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/tracker"
                className={`navLink${loc.pathname === '/tracker' ? ' navLink--active' : ''}`}
              >
                Job Tracker
              </Link>
            </nav>

            <div className="headerAuth">
              {isAuthenticated ? (
                <>
                  <span className="headerAuth__email">{user?.email}</span>
                  <button className="btn btnGhost btn--sm" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btnGhost btn--sm">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <JobTracker />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
