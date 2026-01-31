import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import SystemGuardian from './components/SystemGuardian';
import './assets/css/main.css';

// Carregamento defensivo do serviço de backup
try {
  import('./services/systemGuardianService').then(m => {
    m.performAutoBackup();
  }).catch(err => {
    console.warn("[System] Backup service failed to load, proceeding to UI.", err);
  });
} catch (e) {
  console.error("[System] Critical early boot error ignored.");
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <SystemGuardian>
      <App />
    </SystemGuardian>
  );
}