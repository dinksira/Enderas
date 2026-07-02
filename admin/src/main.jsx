import '@enderass/shared/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { PermissionProvider } from '@enderass/shared/auth';
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
