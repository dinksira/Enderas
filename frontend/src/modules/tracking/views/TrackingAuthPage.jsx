import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracking } from '../hooks/use-tracking.js';
import logoUrl from '../../../assets/images/blue_logo.svg';

function TrackingAuthPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { authenticated, authenticate, error, loading } = useTracking(token);
  const [password, setPassword] = useState('');

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
    <div className="tracking-auth">
      <div className="tracking-auth__card">
        <div className="tracking-auth__eyebrow">
          <span>Private lot access</span>
          <span className="tracking-auth__eyebrow-dot" />
          <span>Secure link</span>
        </div>

        <div className="tracking-auth__logo-wrap">
          <img src={logoUrl} alt="Enderas" className="tracking-auth__logo" />
        </div>

        <h1 className="tracking-auth__title">Auction tracking access</h1>
        <p className="tracking-auth__desc">
          This link is password protected. Enter the code from your invitation to continue.
        </p>

        {error && (
          <div className="tracking-auth__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="track-password" className="tracking-auth__label">Password</label>
          <div className="tracking-auth__field">
            <svg className="tracking-auth__field-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3" y="7" width="10" height="7" rx="1.2" stroke="#6B5D4B" strokeWidth="1.3" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="#6B5D4B" strokeWidth="1.3" />
            </svg>
            <input
              id="track-password"
              type="password"
              className="tracking-auth__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="off"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="tracking-auth__submit"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Unlock access'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TrackingAuthPage;
