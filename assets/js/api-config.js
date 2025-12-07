// Centralized API config (single source of truth)
(function(){
  if (typeof window === 'undefined') return;
  window.API_CONFIG = window.API_CONFIG || {};
  var host = (location && location.hostname) ? location.hostname : '';
  // Default rules: prefer env (set by other tooling) -> localhost -> production
  if (!window.API_CONFIG.baseURL) {
    if (host.indexOf('localhost') !== -1 || host.indexOf('127.0.0.1') !== -1) {
      window.API_CONFIG.baseURL = 'http://localhost:3000/api';
    } else {
      window.API_CONFIG.baseURL = 'https://bvoxpro.tech/api';
    }
  }
  // Backwards-compat alias used throughout the codebase
  if (typeof window.apiurl === 'undefined') {
    window.apiurl = window.API_CONFIG.baseURL;
  }
  console.log('[api-config] API base =', window.API_CONFIG.baseURL);
})();
