import './config/i18n.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { PermissionProvider } from './core/auth/PermissionProvider.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PermissionProvider>
        <App />
      </PermissionProvider>
    </BrowserRouter>
  </StrictMode>,
);
