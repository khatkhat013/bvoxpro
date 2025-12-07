// Minimal compatibility stub for pages that include `./js/config.js`.
(function(){
  if (typeof window === 'undefined') return;
  window.CONFIG = window.CONFIG || {};
  // Avoid overwriting API_CONFIG if api-url-config loaded earlier
  window.API_CONFIG = window.API_CONFIG || { baseURL: (location.hostname.indexOf('localhost') !== -1 ? 'http://localhost:3000/api' : 'https://bvoxpro.tech/api') };
  console.log('[js/config.js] loaded, API base =', window.API_CONFIG.baseURL);
})();
