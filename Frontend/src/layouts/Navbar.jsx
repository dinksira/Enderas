import { NavLink } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { NAVIGATION_BRAND, NAVIGATION_LINKS } from '../config/navigation.js';

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a
          href={NAVIGATION_BRAND.homePath}
          className="navbar__brand"
          aria-label={NAVIGATION_BRAND.label}
        >
          <span className="navbar__brand-mark" aria-hidden="true">
            E
          </span>
          <span className="navbar__brand-text">Enderas</span>
        </a>

        <nav className="navbar__nav" aria-label="Primary navigation">
          {NAVIGATION_LINKS.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                ['navbar__link', isActive ? 'navbar__link--active' : ''].filter(Boolean).join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <Button variant="primary">Place Bid</Button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
