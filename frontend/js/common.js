/**
 * PROTEINX — Common Utilities & Compatibility Bridge
 * Ensures theme, toast notifications, and auth helper continuity across all pages
 */

// Safe API Base URL determination
window.API_BASE = window.API_BASE || ((typeof window !== 'undefined' && window.location && window.location.port === '5000') 
  ? '/api' 
  : 'http://localhost:5000/api');
var API_BASE = window.API_BASE;

// Dynamically ensure siteContent.js is loaded if not already present
if (typeof document !== 'undefined' && typeof window !== 'undefined' && !window.SITE_CONTENT) {
  const inAdmin = window.location.pathname.includes('/admin');
  const scriptPath = inAdmin ? '../config/siteContent.js' : 'config/siteContent.js';
  const script = document.createElement('script');
  script.src = scriptPath;
  script.defer = true;
  document.head.appendChild(script);
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('proteinx_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('proteinx_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = theme === 'dark' 
      ? '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
      : '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>';
  }
}

// Toast Notifications
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Unified Auth Helpers (supports both proteinx_ and standard keys)
function getToken() {
  return localStorage.getItem('proteinx_token') || localStorage.getItem('token') || '';
}

function getUser() {
  const raw = localStorage.getItem('proteinx_user') || localStorage.getItem('user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem('proteinx_token', token);
  localStorage.setItem('proteinx_user', JSON.stringify(user));
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (typeof updateNavAuth === 'function') {
    updateNavAuth();
  }
}

function logout() {
  localStorage.removeItem('proteinx_token');
  localStorage.removeItem('proteinx_user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    const inAdmin = window.location.pathname.includes('/admin');
    window.location.href = inAdmin ? 'login.html' : 'login.html';
  }, 500);
}

// User-friendly Session Expired Modal Handler (Requirement 10)
function handleSessionExpired() {
  if (document.getElementById('session-expired-modal')) return;

  const inAdmin = window.location.pathname.includes('/admin');
  const loginUrl = inAdmin ? 'login.html' : 'login.html';

  const modal = document.createElement('div');
  modal.id = 'session-expired-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;';

  modal.innerHTML = `
    <div style="background:var(--card-bg, #ffffff);border-radius:16px;padding:32px 28px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.25);border:1px solid var(--border, #e2e8f0);">
      <div style="width:56px;height:56px;margin:0 auto 16px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;">🔒</div>
      <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:8px;color:var(--text-primary, #0f172a);">Session Expired</h3>
      <p style="color:var(--text-secondary, #475569);font-size:0.9rem;line-height:1.5;margin-bottom:24px;">Your admin session has expired. Please log in again.</p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button onclick="localStorage.removeItem('proteinx_token');localStorage.removeItem('token');window.location.href='${loginUrl}';" style="background:var(--brand, #EB5E28);color:white;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:0.9rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(235,94,40,0.3);">
          🔑 Login Again
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
window.handleSessionExpired = handleSessionExpired;

// Safe authenticated fetch wrapper with automatic 401 handling
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  options.headers = options.headers || {};
  if (token && !options.headers['Authorization']) {
    options.headers['Authorization'] = 'Bearer ' + token;
  }
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      handleSessionExpired();
    }
    return res;
  } catch (err) {
    throw err;
  }
}
window.fetchWithAuth = fetchWithAuth;

// Auto-initialize theme if on page load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
  });
}
