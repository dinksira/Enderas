import { Outlet } from 'react-router-dom';
import '../styles/tracking.css';

function TrackingLayout() {
  return (
    <div className="tracking-shell">
      <nav className="tracking-shell__header">
        <a href="/" className="tracking-shell__brand">
          <svg className="tracking-shell__brand-mark" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path d="M6 9L13 3L20 9" stroke="#B08D4F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="5" y="9" width="16" height="13" rx="1.5" stroke="#B08D4F" strokeWidth="1.4" />
            <path d="M9 13V19M13 13V19M17 13V19" stroke="#6E2430" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <div className="tracking-shell__brand-word">
            <span className="tracking-shell__brand-name">Enderas</span>
            <span className="tracking-shell__brand-sub">Auction tracking</span>
          </div>
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
