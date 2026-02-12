import React from 'react';
import SkeletonJob from './SkeletonJob';
import { trackJob } from '../api';
import { getRelativeTime, isPostedInLast24Hours } from '../utils/timeUtils';

export default function JobList({ jobs, selectedJob, onSelectJob, loading, hasSearched }) {
  if (loading) {
    return (
      <>
        <SkeletonJob />
        <SkeletonJob />
        <SkeletonJob />
      </>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="emptyState">
        <span className="emptyState__icon">🔍</span>
        {hasSearched ? 'No jobs found. Try different keywords.' : 'Search for jobs to get started.'}
      </div>
    );
  }

  async function handleApply(e, job) {
    e.stopPropagation();
    // Open apply link in new tab
    if (job.apply_link) {
      window.open(job.apply_link, '_blank');
    }
    // Track the job in the backend
    try {
      await trackJob(job);
    } catch (err) {
      console.error('Failed to track job:', err);
    }
  }

  return (
    <>
      {jobs.map((job, index) => {
        const isSelected = selectedJob?.id === job.id;

        const score = job.match_score ?? job.match_percentage ?? null;

        const relativeTime = getRelativeTime(job.created);
        const isRecent = isPostedInLast24Hours(job.created);

        let pillClass = 'pill-red';
        if (score >= 70) pillClass = 'pill-green';
        else if (score >= 40) pillClass = 'pill-orange';

        return (
          <div
            key={job.id || `${job.title}-${job.company}-${index}`}
            className={`jobCard${isSelected ? ' selected' : ''}`}
            onClick={() => onSelectJob(job)}
          >
            <div className="jobCard__top">
              <div className="jobCard__info">
                <h3 className="jobCard__title">{job.title}</h3>
                <p className="jobCard__company">{job.company}</p>
              </div>
              {score != null && (
                <span className={`match-pill ${pillClass}`}>
                  {Math.round(score)}%
                </span>
              )}
            </div>

            <div className="jobCard__bottom">
              <div className="jobCard__metadata">
                <span className="jobCard__location">
                  📍 {job.location || 'Remote'}
                </span>
                {relativeTime && (
                  <span className="jobCard__time">
                    🕒 {relativeTime}
                  </span>
                )}
                {isRecent && (
                  <span className="jobCard__badge jobCard__badge--hot">
                    🔥 Posted in last 24h
                  </span>
                )}
              </div>

              <button
                className="btn btnPrimary btn--apply"
                onClick={(e) => handleApply(e, job)}
                disabled={!job.apply_link}
                title={!job.apply_link ? 'Apply link not available' : 'Apply & Track'}
              >
                Apply ↗
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
