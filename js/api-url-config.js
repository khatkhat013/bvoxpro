/**
 * API URL Configuration Override & Initialization
 * This script ensures that API_CONFIG is properly initialized and that
 * both apiurl and API_CONFIG.baseURL are set to the correct production/local URL
 * 
 * Should be loaded AFTER js/config.js (which defines API_CONFIG)
 * and AFTER any downloaded config.js files that set apiurl
 */

(function() {
    // First, ensure API_CONFIG exists and has baseURL defined
    if (typeof API_CONFIG === 'undefined') {
        window.API_CONFIG = {};
    }
    
    // Determine the correct API base URL
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let apiBase;
    
    if (isLocal) {
        apiBase = 'http://localhost:3000/api';
    } else {
        // Use protocol-relative or HTTPS on production
        apiBase = window.location.protocol + '//' + window.location.host + '/api';
    }
    
    // Set both window.apiurl and API_CONFIG.baseURL to the correct value
    window.apiurl = apiBase;
    window.API_CONFIG.baseURL = apiBase;
    
    console.log('[API Config Override] Set apiurl and API_CONFIG.baseURL to:', apiBase);
    console.log('[API Config Override] Hostname:', window.location.hostname, '| Is Local:', isLocal);
})();
