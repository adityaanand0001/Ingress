import React from 'react';

const ExportProgress = ({ progress }) => {
  return (
    <div className="export-progress-overlay">
      <div className="export-progress">
        <h3>Exporting Data</h3>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
        <p>{progress}% Complete</p>
      </div>
    </div>
  );
};

export default ExportProgress;

