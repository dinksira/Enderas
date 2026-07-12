import { Outlet } from 'react-router-dom';
import '../styles/tracking.css';
import logoUrl from '../assets/images/frontend_logo.svg';

function TrackingLayout() {
  return (
    <div className="tracking-shell">
      <nav className="tracking-shell__header">
        <a href="/" className="tracking-shell__brand">
          <img src={logoUrl} alt="Enderas" className="tracking-shell__logo" />
        </a>
      </nav>
      <main className="tracking-shell__main">
        <Outlet />
      </main>
      <footer className="tracking-shell__footer">
        Enderas &middot; Private auction network
      </footer>
    </div>
  );
}

export default TrackingLayout;
