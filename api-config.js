window.MEDICARE_API_BASE = (function () {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:4000/api';
  }
  return 'https://YOUR-RAILWAY-URL.up.railway.app/api';
})();