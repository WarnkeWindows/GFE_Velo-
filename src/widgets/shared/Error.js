import React from 'react';

const Error = ({ message, onClose, type = 'error' }) => {
  const typeClass = {
    error: 'error-danger',
    warning: 'error-warning',
    info: 'error-info'
  }[type] || 'error-danger';

  return (
    <div className={`error-container ${typeClass}`}>
      <div className="error-content">
        <div className="error-icon">
          {type === 'error' && '⚠️'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
        </div>
        <div className="error-message">
          {message}
        </div>
        {onClose && (
          <button className="error-close" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      <style>{`
        .error-container {
          border-radius: 4px;
          padding: 16px;
          margin: 16px 0;
          border: 1px solid;
        }
        
        .error-danger {
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }
        
        .error-warning {
          background-color: #fffbeb;
          border-color: #fed7aa;
          color: #d97706;
        }
        
        .error-info {
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
        }
        
        .error-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .error-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .error-message {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .error-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 2px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .error-close:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Error;