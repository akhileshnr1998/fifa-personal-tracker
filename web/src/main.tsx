import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { warmupPush } from './features/settings/push';
import './index.css';

// Start SW registration and VAPID key fetch eagerly so the Settings save path
// has no extra API round-trips waiting at click time.
warmupPush();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
