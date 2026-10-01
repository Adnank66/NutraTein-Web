/**
 * PROTEINX — Unified Environment & API Configuration
 * Single source of truth for API endpoints across VS Code Live Server, Antigravity, and Express
 */
(function () {
  'use strict';

  function resolveApiBase() {
    if (typeof window === 'undefined') return 'http://localhost:5000/api';
    if (window.CUSTOM_API_BASE) return window.CUSTOM_API_BASE;

    // If served directly from Express on port 5000
    if (window.location.port === '5000') {
      return '/api';
    }

    // If running under VS Code Live Server (port 5500), Vite (5173), Next.js (3000), or Antigravity preview
    // Forward API requests to the active Express backend on port 5000
    const hostname = (window.location.hostname && window.location.hostname !== '') 
      ? window.location.hostname 
      : 'localhost';
    return 'http://' + hostname + ':5000/api';
  }

  window.API_BASE = resolveApiBase();
  window.APP_CONFIG = {
    appName: 'NUTRATEIN',
    currencySymbol: '₹',
    apiBase: window.API_BASE,
    supportEmail: 'kaziadnan275@gmail.com',
    supportPhone: '+91 98765 43210'
  };
})();
