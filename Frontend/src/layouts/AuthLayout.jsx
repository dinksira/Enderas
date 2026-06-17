import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <a href="#main-content" className="auth-layout__skip-link">
        Skip to main content
      </a>
      <main id="main-content" className="auth-layout__main">
        <div className="auth-layout__container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
