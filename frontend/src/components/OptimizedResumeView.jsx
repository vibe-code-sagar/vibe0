import React from 'react';

export default function OptimizedResumeView({
    originalResume,
    optimizedResume,
    originalScore,
    estimatedNewScore,
    onClose
}) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(optimizedResume);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const scoreDiff = estimatedNewScore - originalScore;
    const scoreDiffClass = scoreDiff > 0 ? 'scoreDiff--positive' : 'scoreDiff--neutral';

    return (
        <div className="card card--static optimizedResumeView">
            <div className="cardHeader">
                <div>
                    <h2 className="cardTitle">Resume Optimization Results</h2>
                    <p className="cardSubTitle">AI-enhanced version of your resume</p>
                </div>
                <button className="btn btnGhost btn--sm" onClick={onClose}>
                    Close
                </button>
            </div>

            {/* Score Comparison Badge */}
            <div className="scoreComparison">
                <div className="scoreComparison__item">
                    <span className="scoreComparison__label">Original Score</span>
                    <span className="scoreComparison__value">{Math.round(originalScore)}%</span>
                </div>
                <div className={`scoreComparison__arrow ${scoreDiffClass}`}>
                    →
                </div>
                <div className="scoreComparison__item">
                    <span className="scoreComparison__label">Estimated New Score</span>
                    <span className="scoreComparison__value scoreComparison__value--new">
                        {Math.round(estimatedNewScore)}%
                    </span>
                </div>
                {scoreDiff > 0 && (
                    <div className="scoreComparison__diff">
                        +{Math.round(scoreDiff)}%
                    </div>
                )}
            </div>

            {/* Side-by-side comparison */}
            <div className="resumeComparison">
                <div className="resumeComparison__panel">
                    <h3 className="resumeComparison__title">Original Resume</h3>
                    <textarea
                        className="resumeComparison__textarea"
                        value={originalResume}
                        readOnly
                    />
                </div>

                <div className="resumeComparison__panel">
                    <h3 className="resumeComparison__title">Optimized Resume</h3>
                    <textarea
                        className="resumeComparison__textarea resumeComparison__textarea--optimized"
                        value={optimizedResume}
                        readOnly
                    />
                    <button
                        className="btn btnPrimary btn--full"
                        onClick={handleCopy}
                        style={{ marginTop: '1rem' }}
                    >
                        {copied ? '✓ Copied!' : 'Copy Optimized Resume'}
                    </button>
                </div>
            </div>
        </div>
    );
}
