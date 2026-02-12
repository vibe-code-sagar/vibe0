import React from 'react';

export default function CoverLetter({ coverLetter }) {
  if (!coverLetter) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([coverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'cover_letter.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="card card--static">
      <div className="cardHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="cardTitle">Generated Cover Letter</h2>
          <p className="cardSubTitle">Ready to customize and send</p>
        </div>
        <div className="coverLetterActions">
          <button onClick={handleCopy} className="btn btnSecondary btn--sm" title="Copy to clipboard">
            📋 Copy
          </button>
          <button onClick={handleDownload} className="btn btnPrimary btn--sm" title="Download as .txt">
            ⬇️ Download
          </button>
        </div>
      </div>

      <div className="coverLetterPreview">
        {coverLetter}
      </div>
    </div>
  );
}
