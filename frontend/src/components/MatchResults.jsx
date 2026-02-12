import React, { useState } from 'react';

function MatchCard({ result }) {
  const [expanded, setExpanded] = useState(false);
  const { title, company, match_score, match_percentage, reasoning, confidence } = result;

  const score = Math.round(match_score ?? match_percentage ?? 0);

  let barClass = 'progressBar__fill--red';
  let scoreColorClass = 'matchScore--red';
  if (score >= 70) {
    barClass = 'progressBar__fill--green';
    scoreColorClass = 'matchScore--green';
  } else if (score >= 40) {
    barClass = 'progressBar__fill--orange';
    scoreColorClass = 'matchScore--orange';
  }

  return (
    <div className="matchCard" onClick={() => setExpanded(!expanded)}>
      <div className="matchCard__top">
        <div>
          <h3 className="matchCard__title">{title}</h3>
          <p className="matchCard__company">{company}</p>
          {confidence !== undefined && (
            <div style={{ 
              fontSize: '0.7rem', 
              color: confidence >= 0.8 ? '#10b981' : confidence >= 0.6 ? '#f59e0b' : '#ef4444',
              marginTop: '0.25rem'
            }}>
              AI Confidence: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
        <span className={`matchCard__score ${scoreColorClass}`}>{score}%</span>
      </div>

      {/* Progress Bar */}
      <div className="progressBar">
        <div
          className={`progressBar__fill ${barClass}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {expanded && (
        <div className="matchCard__reasoning">
          <strong>AI Reasoning</strong>
          {reasoning}
        </div>
      )}

      <button
        className="matchCard__toggle"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        {expanded ? '▲ Hide Details' : '▼ View Reasoning'}
      </button>
    </div>
  );
}

export default function MatchResults({ matchResults }) {
  if (!matchResults || matchResults.length === 0) return null;

  return (
    <div>
      <div className="matchHeader">
        <h2 className="matchHeader__title">Match Analysis</h2>
        <span className="matchHeader__badge">{matchResults.length} Jobs Scanned</span>
      </div>
      <div className="matchList">
        {matchResults.map((result, index) => (
          <MatchCard key={`${result.title}-${result.company}-${index}`} result={result} />
        ))}
      </div>
    </div>
  );
}
