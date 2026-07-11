import { Outlet } from 'react-router-dom';
import '../styles/tracking.css';

function TrackingLayout() {
  return (
    <div className="tracking-shell">
      <header className="tracking-shell__header">
        <a href="/" className="tracking-shell__brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="7" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="tracking-shell__brand-text">Enderas Auction Tracking</span>
        </a>
      </header>
      <main className="tracking-shell__main">
        <Outlet />
      </main>
      <footer className="tracking-shell__footer">
        <span>Powered by <strong>Enderas Auction System</strong></span>
      </footer>
    </div>
  );
}

export default TrackingLayout;
