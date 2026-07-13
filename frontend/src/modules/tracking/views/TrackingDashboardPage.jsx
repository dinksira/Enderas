import { useParams } from 'react-router-dom';
import { useTracking } from '../hooks/use-tracking.js';
import { LogoSpinner } from '@enderass/shared/ui';

function formatCurrency(amount, currency) {
  if (amount == null) return '\u2014';
  return `${Number(amount).toLocaleString()} ${currency || 'ETB'}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const config = {
    draft:           { cls: 'ts-badge--draft', label: 'Draft' },
    pending_approval:{ cls: 'ts-badge--pending', label: 'Pending Approval' },
    published:       { cls: 'ts-badge--active', label: 'Active' },
    suspended:       { cls: 'ts-badge--suspended', label: 'Suspended' },
    closed:          { cls: 'ts-badge--closed', label: 'Closed' },
    cancelled:       { cls: 'ts-badge--cancelled', label: 'Cancelled' },
  };
  const c = config[status] || { cls: '', label: status };
  return <span className={`ts-badge ${c.cls}`}>{c.label}</span>;
}

function Countdown({ endDate }) {
  if (!endDate) return null;
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;
  if (diff <= 0) return <span className="ts-countdown ts-countdown--ended">Ended</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return (
    <span className="ts-countdown">
      {d > 0 && <>{d}d </>}{h}h {m}m remaining
    </span>
  );
}

function Timeline({ auction }) {
  const steps = [
    { key: 'published', label: 'Published', date: auction.publishedAt || auction.startDate },
    { key: 'bidding', label: 'Bidding Open', date: auction.startDate },
    { key: 'closing', label: 'Closing', date: auction.endDate },
    { key: 'winner', label: 'Winner Announced', date: auction.closedAt },
  ];

  const statusOrder = ['draft', 'pending_approval', 'published', 'suspended', 'closed', 'cancelled'];
  const currentIdx = statusOrder.indexOf(auction.status);

  function isActive(idx) {
    if (auction.status === 'cancelled') return idx === 0;
    if (auction.status === 'suspended') return idx <= 2;
    return idx <= currentIdx;
  }

  return (
    <div className="ts-timeline">
      {steps.map((s, i) => (
        <div key={s.key} className={`ts-timeline__step ${isActive(i) ? 'ts-timeline__step--active' : ''} ${i < steps.length - 1 ? 'ts-timeline__step--conn' : ''}`}>
          <div className="ts-timeline__dot" />
          <div className="ts-timeline__content">
            <span className="ts-timeline__label">{s.label}</span>
            {s.date && <span className="ts-timeline__date">{formatDate(s.date)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, highlight, monospace }) {
  return (
    <div className={`ts-metric ${highlight ? 'ts-metric--hl' : ''}`}>
      <span className="ts-metric__label">{label}</span>
      <span className={`ts-metric__value ${monospace ? 'ts-metric__value--mono' : ''}`}>{value ?? '\u2014'}</span>
    </div>
  );
}

function TrackingDashboardPage() {
  const { token } = useParams();
  const { data, loading, error, logout } = useTracking(token);

  if (loading && !data) {
    return (
      <div className="ts-loading">
        <LogoSpinner size={32} />
        <p>Loading tracking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ts-error">
        <div className="ts-error__icon">!</div>
        <h2>Unable to load tracking data</h2>
        <p>{error}</p>
        <button className="ts-error__btn" onClick={logout}>Return to login</button>
      </div>
    );
  }

  if (!data) return null;

  const { auction, asset, tracking } = data;
  const imageUrl = asset?.imageUrls?.[0] || auction?.imageUrls?.[0] || null;

  return (
    <div className="ts-dash">
      {/* Header */}
      <div className="ts-dash__header">
        <div className="ts-dash__title-row">
          <h1 className="ts-dash__title">{auction.title}</h1>
          <StatusBadge status={auction.status} />
        </div>
        <div className="ts-dash__meta">
          <span className="ts-dash__meta-item">ID: {(auction.id || '').slice(0, 8).toUpperCase()}</span>
          {auction.category && <span className="ts-dash__meta-sep">|</span>}
          {auction.category && <span className="ts-dash__meta-item">{auction.category.replace(/_/g, ' ')}</span>}
          {auction.mode && <span className="ts-dash__meta-sep">|</span>}
          {auction.mode && <span className="ts-dash__meta-item">{auction.mode === 'multi' ? 'Multi-Lot Auction' : 'Single Auction'}</span>}
        </div>
      </div>

      {/* Description + Conditions */}
      {(auction.description || auction.auctionConditions) && (
        <div className="ts-card ts-card--body">
          {auction.description && <p className="ts-desc">{auction.description}</p>}
          {auction.auctionConditions && (
            <div className="ts-conditions">
              <span className="ts-conditions__label">Auction Conditions</span>
              <p className="ts-conditions__text">{auction.auctionConditions}</p>
            </div>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="ts-dash__grid">
        {/* Left column */}
        <div className="ts-dash__col">

          {/* Asset card */}
          {asset && (
            <div className="ts-card ts-card--asset">
              {imageUrl && (
                <div className="ts-asset__img-wrap">
                  <img src={imageUrl} alt={asset.title} className="ts-asset__img" />
                </div>
              )}
              <div className="ts-asset__info">
                <h2 className="ts-asset__title">{asset.title}</h2>
                <span className="ts-asset__type">{asset.assetType?.replace(/_/g, ' ') || 'Asset'}</span>
                {asset.description && <p className="ts-asset__desc">{asset.description}</p>}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="ts-metrics-grid">
            <MetricCard
              label="Current Highest Bid"
              value={formatCurrency(tracking.currentHighestBid, auction.currency)}
              highlight
              monospace
            />
            <MetricCard label="Total Bids" value={tracking.totalBids} monospace />
            <MetricCard label="Participants" value={tracking.participantCount} monospace />
            <MetricCard
              label="Reserve Price"
              value={formatCurrency(auction.reservePrice, auction.currency)}
              monospace
            />
            {auction.totalReservePrice != null && (
              <MetricCard
                label="Total Reserve"
                value={formatCurrency(auction.totalReservePrice, auction.currency)}
                monospace
              />
            )}
            <MetricCard
              label="Document Price"
              value={formatCurrency(auction.documentPrice, auction.currency)}
              monospace
            />
            <MetricCard label="CPO %" value={auction.cpoPercentage != null ? `${auction.cpoPercentage}%` : '\u2014'} />
            {asset?.desiredReservePrice != null && (
              <MetricCard
                label="Asset Reserve"
                value={formatCurrency(asset.desiredReservePrice, auction.currency)}
                monospace
              />
            )}
          </div>
        </div>

        {/* Right column — Timeline */}
        <div className="ts-dash__col ts-dash__col--side">
          <div className="ts-card ts-card--timeline">
            <h3 className="ts-card__title">Timeline</h3>
            <Countdown endDate={auction.endDate} />
            <Timeline auction={auction} />
          </div>
        </div>
      </div>

      {/* Winner card */}
      {tracking.winner && (
        <div className="ts-card ts-card--winner">
          <h3 className="ts-card__title">Winner</h3>
          <div className="ts-winner">
            <div className="ts-winner__org">{tracking.winner.organizationName || 'N/A'}</div>
            <div className="ts-winner__amount">{formatCurrency(tracking.winner.amount, auction.currency)}</div>
            <div className="ts-winner__date">Announced {formatDate(tracking.winner.announcedAt)}</div>
          </div>
        </div>
      )}

      {/* Documents */}
      {auction.documents && auction.documents.length > 0 && (
        <div className="ts-card ts-card--body">
          <h3 className="ts-card__title">Auction Documents</h3>
          <div className="ts-docs">
            {auction.documents.map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="ts-doc">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="ts-doc__name">{doc.name}</span>
                {doc.size > 0 && <span className="ts-doc__size">{(doc.size / 1024).toFixed(0)} KB</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Dates bar */}
      <div className="ts-dates">
        <div className="ts-date-item">
          <span className="ts-date-item__label">Published</span>
          <span className="ts-date-item__value">{formatDate(auction.publishedAt || auction.startDate)}</span>
        </div>
        <div className="ts-date-item">
          <span className="ts-date-item__label">Bidding Start</span>
          <span className="ts-date-item__value">{formatDate(auction.startDate)}</span>
        </div>
        <div className="ts-date-item">
          <span className="ts-date-item__label">Bidding End</span>
          <span className="ts-date-item__value">{formatDate(auction.endDate)}</span>
        </div>
        {auction.closedAt && (
          <div className="ts-date-item">
            <span className="ts-date-item__label">Closed</span>
            <span className="ts-date-item__value">{formatDate(auction.closedAt)}</span>
          </div>
        )}
      </div>

      <div className="ts-disclaimer">
        This is an automated tracking page for informational purposes only.
        No bidding or purchasing actions can be performed through this page.
        For inquiries, please contact the auction house directly.
      </div>
    </div>
  );
}

export default TrackingDashboardPage;
