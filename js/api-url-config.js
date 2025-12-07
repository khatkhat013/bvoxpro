// Lightweight API URL config for local development
(function(){
  if (typeof window === 'undefined') return;
  window.API_CONFIG = window.API_CONFIG || {};
  // Default to localhost when served from localhost, otherwise use production
  var host = (location && location.hostname) ? location.hostname : '';
  if (host.indexOf('localhost') !== -1 || host.indexOf('127.0.0.1') !== -1) {
    window.API_CONFIG.baseURL = 'http://localhost:3000/api';
  } else {
    window.API_CONFIG.baseURL = window.API_CONFIG.baseURL || 'https://bvoxpro.tech/api';
  }
})();
