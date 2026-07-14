import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracking } from '../hooks/use-tracking.js';
import logoUrl from '../../../assets/images/frontend_logo.svg';

function TrackingAuthPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { authenticated, authenticate, error, loading } = useTracking(token);
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (authenticated) {
    navigate(`/track/${token}/dashboard`, { replace: true });
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await authenticate(password || undefined);
      navigate(`/track/${token}/dashboard`, { replace: true });
    } catch {
      // error displayed via hook
    }
  }

  return (
    <div className="ta">
      <div className="ta__card">
        <div className="ta__logo-wrap">
          <img src={logoUrl} alt="Enderas" className="ta__logo" />
        </div>

        <h1 className="ta__title">Auction Tracking</h1>
        <p className="ta__desc">
          This is a private tracking link. Enter your access code to view auction details.
        </p>

        {error && (
          <div className="ta__error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ta__form">
          <label htmlFor="track-password" className="ta__label">Access Code</label>
          <div className={`ta__field ${focused ? 'ta__field--focus' : ''} ${error ? 'ta__field--error' : ''}`}>
            <svg className="ta__field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="track-password"
              type={showPassword ? 'text' : 'password'}
              className="ta__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter password"
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              className="ta__toggle-vis"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            className="ta__submit"
            disabled={loading}
          >
            {loading ? (
              <span className="ta__submit-loading">
                <span className="ta__spinner" />
                Verifying...
              </span>
            ) : (
              <span className="ta__submit-content">
                Unlock Access
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            )}
          </button>
        </form>

        <div className="ta__footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Secured &amp; encrypted connection</span>
        </div>
      </div>
    </div>
  );
}

export default TrackingAuthPage;
