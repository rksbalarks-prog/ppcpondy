import React from 'react';
import './LoadingOverlay.css';

export function ImageLoadingOverlay({ visible, progress = 0 }) {
  if (!visible) return null;
  return (
    <div className="loading-overlay" aria-hidden>
      <div className="loading-content">
        <div className="progress-circle-container">
          <svg className="progress-ring" viewBox="0 0 100 100">
            <circle
              className="progress-ring-bg"
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              className="progress-ring-fill"
              cx="50"
              cy="50"
              r="45"
              style={{
                strokeDashoffset: 283 - (283 * progress) / 100,
              }}
            />
          </svg>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
        <div className="loading-text">Compressing image...</div>
      </div>
    </div>
  );
}

export function VideoLoadingOverlay({ visible, progress = 0 }) {
  if (!visible) return null;
  return (
    <div className="loading-overlay" aria-hidden>
      <div className="loading-content">
        <div className="progress-circle-container">
          <svg className="progress-ring" viewBox="0 0 100 100">
            <circle
              className="progress-ring-bg"
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              className="progress-ring-fill"
              cx="50"
              cy="50"
              r="45"
              style={{
                strokeDashoffset: 283 - (283 * progress) / 100,
              }}
            />
          </svg>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
        <div className="loading-text">Compressing video...</div>
      </div>
    </div>
  );
}

export default ImageLoadingOverlay;
