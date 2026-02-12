import React from 'react';

const ResumeAnalyzer = ({
  resume,
  onChangeResume,
  selectedJob,
  onAnalyze,
  loading,
  disabled,
}) => {
  const handleAnalyze = () => {
    if (!selectedJob) {
      alert('Please select a job first.');
      return;
    }
    if (!resume.trim()) {
      alert('Please enter your resume text.');
      return;
    }
    onAnalyze();
  };

  const isAnalyzing = loading || disabled;

  return (
    <section className="card card--static">
      <div className="cardHeader">
        <h2 className="cardTitle">Resume Analyzer</h2>
        <p className="cardSubTitle">Paste your resume to analyze it against a selected job.</p>
      </div>

      <textarea
        id="resume"
        className="textarea"
        placeholder="Paste your resume content here..."
        value={resume}
        onChange={(e) => onChangeResume(e.target.value)}
        disabled={isAnalyzing}
      />

      <div className="selectedJobBar" style={{ marginTop: 16 }}>
        <span className="selectedJobBar__label">Target Job</span>
        {selectedJob ? (
          <span className="selectedJobBar__value">
            {selectedJob.title} — {selectedJob.company}
          </span>
        ) : (
          <span className="selectedJobBar__empty">None selected</span>
        )}
      </div>

      <button
        className="btn btnPrimary btn--full"
        type="button"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
      >
        {loading ? (
          <>
            <span className="spinner spinner--sm spinner--white" />
            Analyzing…
          </>
        ) : (
          'Analyze Resume'
        )}
      </button>
    </section>
  );
};

export default ResumeAnalyzer;
