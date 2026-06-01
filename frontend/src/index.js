/**
 * index.js - App entry point
 * Import order matters: Bootstrap FIRST, then our CSS overrides
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. Bootstrap base styles (must come first)
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. Bootstrap JS (for dropdowns, modals etc)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// 3. Bootstrap icons
import 'bootstrap-icons/font/bootstrap-icons.css';
// 4. Toast notifications
import 'react-toastify/dist/ReactToastify.css';
// 5. Our custom styles (overrides Bootstrap — must be last)
import './index.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
