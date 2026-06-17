import { NavLink } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { ROUTES } from '../routes/index.js';
import './Navbar.css';

const NAV_ITEMS = [
  { label: 'Marketplace', path: ROUTES.MARKETPLACE },
  { label: 'My Bids', path: ROUTES.BIDDER_DASHBOARD },
  { label: 'Operations', path: ROUTES.OPERATIONAL_PANEL },
];

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a href={ROUTES.HOME} className="navbar__brand" aria-label="Enderas Auction Management">
          <span className="navbar__brand-mark" aria-hidden="true">
            E
          </span>
          <span className="navbar__brand-text">Enderas</span>
        </a>

        <nav className="navbar__nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                ['navbar__link', isActive ? 'navbar__link--active' : ''].filter(Boolean).join(' ')
              }
            >
              {item.label}
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
