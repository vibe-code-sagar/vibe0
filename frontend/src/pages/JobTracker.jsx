import { useState, useEffect } from 'react';
import { getTrackedJobs, updateTrackedJobStatus } from '../api';

const STATUS_OPTIONS = ['Applied', 'Interview', 'Rejected', 'Offer'];

const STATUS_COLORS = {
    Applied: 'statusBadge--blue',
    Interview: 'statusBadge--orange',
    Rejected: 'statusBadge--red',
    Offer: 'statusBadge--green',
};

export default function JobTracker() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        setLoading(true);
        setError('');
        try {
            const data = await getTrackedJobs();
            setJobs(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || 'Failed to load tracked jobs.');
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(jobId, newStatus) {
        try {
            const updated = await updateTrackedJobStatus(jobId, newStatus);
            setJobs((prev) =>
                prev.map((j) => (j.id === jobId ? { ...j, status: updated.status } : j)),
            );
        } catch (e) {
            setError(e.message || 'Failed to update status.');
        }
    }



    return (
        <div className="trackerPage">
            <div className="trackerHeader">
                <h2 className="trackerHeader__title">Job Tracker</h2>
                <p className="trackerHeader__subtitle">
                    Track your applications and their progress
                </p>
                <span className="matchHeader__badge">{jobs.length} Tracked</span>
            </div>

            {error && <div className="errorBanner">{error}</div>}

            {loading ? (
                <div className="emptyState">
                    <span className="spinner spinner--md spinner--primary" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="emptyState">
                    <span className="emptyState__icon">📋</span>
                    No tracked jobs yet. Click "Apply ↗" on a job to start tracking.
                </div>
            ) : (
                <div className="trackerGrid">
                    {jobs.map((job) => (
                        <div key={job.id} className="trackerCard">
                            <div className="trackerCard__top">
                                <div>
                                    <h3 className="trackerCard__title">{job.title}</h3>
                                    <p className="trackerCard__company">{job.company}</p>
                                </div>
                                <span className={`statusBadge ${STATUS_COLORS[job.status] || ''}`}>
                                    {job.status}
                                </span>
                            </div>

                            <div className="trackerCard__meta">
                                {job.location && (
                                    <span className="jobCard__location">📍 {job.location}</span>
                                )}
                            </div>

                            <div className="trackerCard__actions">
                                <select
                                    className="input trackerCard__select"
                                    value={job.status}
                                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>

                                {job.apply_link && (
                                    <a
                                        className="btn btnSecondary btn--sm"
                                        href={job.apply_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View ↗
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
