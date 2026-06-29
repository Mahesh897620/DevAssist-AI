import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// ---------------------------------------------------------------------------
// Auto-unregister any stale service workers (e.g. from a previously deployed
// PWA on this port) so they never intercept our dev requests.
// ---------------------------------------------------------------------------
async function unregisterServiceWorkers() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      await Promise.all(registrations.map((r) => r.unregister()));
      // Reload once so the page loads fresh without SW interference
      window.location.reload();
      return; // abort mount — reload will re-run this and find no SWs
    }
  }
  mountApp();
}

function mountApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

unregisterServiceWorkers();
