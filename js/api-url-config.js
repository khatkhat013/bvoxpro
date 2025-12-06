/**
 * API URL Configuration Override
 * This script overrides the hardcoded `apiurl` variable from downloaded config.js files
 * to use the dynamic API_CONFIG.baseURL for environment-aware API calls.
 * 
 * Should be loaded AFTER downloaded config.js and AFTER js/config.js
 */

(function() {
    // Override apiurl if API_CONFIG is available
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.baseURL) {
        window.apiurl = API_CONFIG.baseURL;
        console.log('[API Config] apiurl overridden to:', window.apiurl);
    } else {
        // Fallback: construct apiurl based on environment
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        window.apiurl = isLocal 
            ? 'http://localhost:3000/api' 
            : (window.location.protocol + '//' + window.location.host + '/api');
        console.log('[API Config] apiurl set to fallback:', window.apiurl);
    }
})();
