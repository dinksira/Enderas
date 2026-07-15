import { Outlet } from 'react-router-dom';
import '../styles/tracking.css';
import logoUrl from '../assets/images/frontend_logo.svg';
import { ThemeProvider, useTheme } from '../modules/tracking/context/ThemeContext.jsx';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
      {theme === 'dark' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}

function TrackingLayout() {
  return (
    <ThemeProvider>
      <div className="tracking-shell">
        <nav className="tracking-shell__header">
          <a href="/" className="tracking-shell__brand">
            <img src={logoUrl} alt="Enderas" className="tracking-shell__logo" />
            <span className="tracking-shell__brand-text">Auction tracking</span>
          </a>
          <div className="tracking-shell__actions">
            <ThemeToggle />
          </div>
        </nav>
        <main className="tracking-shell__main">
          <Outlet />
        </main>
        <footer className="tracking-shell__footer">
          Enderas &middot; Private auction network
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default TrackingLayout;
