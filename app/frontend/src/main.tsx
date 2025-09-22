import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

declare global {
  const __APP_CONFIG__: {
    name: string;
    backendUrl: string;
    wsPath: string;
    enableSimulate: boolean;
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
