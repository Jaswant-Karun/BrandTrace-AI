import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastContext';
import './index.css';

// Automatically reload stale deployment chunks to prevent 'Failed to fetch dynamically imported module'
window.addEventListener('vite:preloadError', (event) => {
  console.warn('New deployment detected, reloading to fetch latest bundle...', event);
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
