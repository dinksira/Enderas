import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { NAVIGATION_BRAND } from '../config/navigation.js';
import { useAuth } from '../hooks/use-auth.js';
import { ROUTES } from '../config/routes.js';

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, clearSession } = useAuth();

  const handleLogout = () => {
    clearSession();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to={isAuthenticated ? ROUTES.APP_DASHBOARD : NAVIGATION_BRAND.homePath} className="navbar__brand">
          <span className="navbar__brand-mark" aria-hidden="true">
            E
          </span>
          <span className="navbar__brand-text">Enderas</span>
        </NavLink>

        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <span className="navbar__user">{user?.displayName ?? user?.mobileNumber}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
