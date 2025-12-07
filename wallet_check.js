// Minimal walletAuth stub to satisfy pages that include `./js/walletAuth.js`.
// Full implementation may be added later; this stub prevents 404s and logs usage.
(function(){
  if (typeof window === 'undefined') return;
  window.walletAuth = window.walletAuth || {
    init: function() { console.log('[walletAuth stub] init'); },
    isLoggedIn: function(){ return !!(window.localStorage && window.localStorage.getItem('userid')); }
  };
  console.log('[js/walletAuth.js] stub loaded');
})();
