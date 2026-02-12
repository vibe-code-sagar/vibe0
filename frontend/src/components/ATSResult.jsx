import React from 'react';

export default function ATSResult({ atsResult, onOptimize, optimizing, canOptimize }) {
  if (!atsResult) return null;

  const { ats_score, missing_keywords, strengths, improvements } = atsResult;

  // Score color
  let scoreClass = 'atsScore--red';
  let barClass = 'progressBar__fill--red';
  if (ats_score >= 80) {
    scoreClass = 'atsScore--green';
    barClass = 'progressBar__fill--green';
  } else if (ats_score >= 60) {
    scoreClass = 'atsScore--blue';
    barClass = 'progressBar__fill--blue';
  } else if (ats_score >= 30) {
    scoreClass = 'atsScore--orange';
    barClass = 'progressBar__fill--orange';
  }

  // Normalize missing_keywords — backend may return a flat string or array
  let keywords = [];
  if (Array.isArray(missing_keywords)) {
    keywords = missing_keywords.flatMap((kw) => {
      if (typeof kw === 'string' && kw.includes(',')) {
        return kw.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [kw];
    });
  } else if (typeof missing_keywords === 'string') {
    keywords = missing_keywords.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return (
    <div className="card card--static">
      <div className="cardHeader">
        <h2 className="cardTitle">ATS Analysis Results</h2>
        <p className="cardSubTitle">How well your resume matches this job description</p>
      </div>

      {/* Score */}
      <div className="atsScore">
        <div className={`atsScore__value ${scoreClass}`}>{Math.round(ats_score)}%</div>
        <div className="atsScore__label">Match Score</div>
        <div className="progressBar">
          <div
            className={`progressBar__fill ${barClass}`}
            style={{ width: `${ats_score}%` }}
          />
        </div>
      </div>

      {/* Strengths + Missing Keywords */}
      <div className="atsGrid">
        <div>
          <h3 className="atsSection__title">✅ Strengths</h3>
          <ul className="atsSection__list">
            {(strengths || []).map((str, i) => (
              <li key={`strength-${i}`} className="atsSection__listItem">{str}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="atsSection__title">🔑 Missing Keywords</h3>
          <div className="keywordPills">
            {keywords.length > 0 ? (
              keywords.map((kw, i) => (
                <span key={`kw-${i}`} className="keywordPill">{kw}</span>
              ))
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>None — great job!</span>
            )}
          </div>
        </div>
      </div>

      {/* Improvements */}
      <div className="atsImprovements">
        <h3 className="atsSection__title">📈 Improvements</h3>
        <ul className="atsSection__list">
          {(improvements || []).map((imp, i) => (
            <li key={`imp-${i}`} className="atsSection__listItem">{imp}</li>
          ))}
        </ul>
      </div>

      {/* Improve Resume Button */}
      {onOptimize && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            className="btn btnPrimary btn--full"
            onClick={onOptimize}
            disabled={!canOptimize || optimizing}
          >
            <span>{optimizing ? 'Optimizing Resume...' : '✨ Improve Resume'}</span>
            {optimizing && <span className="spinner" style={{ marginLeft: '0.5rem' }}>⏳</span>}
          </button>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.5rem', textAlign: 'center' }}>
            AI will enhance your resume to better match this job
          </p>
        </div>
      )}
    </div>
  );
}
