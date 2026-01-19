import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import SystemGuardian from './components/SystemGuardian';
import { performAutoBackup } from './services/systemGuardianService';

// CRITICAL: Perform a backup immediately on boot before any render logic runs.
// This ensures that even if the new version breaks, we have the state from the previous second.
performAutoBackup();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SystemGuardian>
      <App />
    </SystemGuardian>
  </React.StrictMode>
);
