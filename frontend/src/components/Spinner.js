import React from 'react';

export const Spinner = ({ size = '50px', text = '' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5">
    <div style={{ width: size, height: size, border: '4px solid rgba(240,165,0,0.2)', borderTop: '4px solid #f0a500', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
    {text && <p className="mt-3 text-muted">{text}</p>}
  </div>
);

export const PageLoader = () => (
  <div className="loading-overlay">
    <div className="text-center">
      <div className="spinner-custom mx-auto mb-3"></div>
      <p style={{ color: '#f0a500', fontWeight: 600 }}>Loading EduLearn...</p>
    </div>
  </div>
);

export default Spinner;
