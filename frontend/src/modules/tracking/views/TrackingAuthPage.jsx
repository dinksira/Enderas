import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracking } from '../hooks/use-tracking.js';

function TrackingAuthPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { authenticated, authenticate, error, loading } = useTracking(token);
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (authenticated) {
    navigate(`/track/${token}/dashboard`, { replace: true });
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    try {
      await authenticate(password || undefined);
      navigate(`/track/${token}/dashboard`, { replace: true });
    } catch {
      // error displayed via hook
    }
  }

  const isError = error || submitted;

  return (
    <div className="tracking-auth">
      <div className="tracking-auth__card">
        <div className="tracking-auth__icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="tracking-auth__title">Auction Tracking Access</h1>
        <p className="tracking-auth__desc">
          This link requires authentication. Enter the password provided by the sender to continue.
        </p>

        {error && (
          <div className="tracking-auth__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="tracking-auth__form">
          <div className="tracking-auth__field">
            <label htmlFor="track-password" className="tracking-auth__label">Password</label>
            <input
              id="track-password"
              type="password"
              className="tracking-auth__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access password"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="tracking-auth__submit"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Access Tracking Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TrackingAuthPage;
