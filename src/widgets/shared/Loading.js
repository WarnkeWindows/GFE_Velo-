import React from 'react';

const Loading = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeClass = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  }[size] || 'loading-medium';

  return (
    <div className={`loading-container ${sizeClass}`}>
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0070f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-small .loading-spinner {
          width: 20px;
          height: 20px;
          border-width: 2px;
        }
        
        .loading-large .loading-spinner {
          width: 60px;
          height: 60px;
          border-width: 6px;
        }
        
        .loading-message {
          margin-top: 10px;
          color: #666;
          font-size: 14px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading;