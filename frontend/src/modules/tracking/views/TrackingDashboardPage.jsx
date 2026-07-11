import { useParams } from 'react-router-dom';
import { useTracking } from '../hooks/use-tracking.js';

function formatCurrency(amount) {
  if (amount == null) return '\u2014';
  return `${Number(amount).toLocaleString()} ETB`;
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const classes = {
    draft: 'tracking-badge--draft',
    pending_approval: 'tracking-badge--pending',
    published: 'tracking-badge--active',
    suspended: 'tracking-badge--suspended',
    closed: 'tracking-badge--closed',
    cancelled: 'tracking-badge--closed',
  };

  const labels = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    published: 'Active',
    suspended: 'Suspended',
    closed: 'Closed',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`tracking-badge ${classes[status] || ''}`}>
      {labels[status] || status}
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

  function isStepActive(stepIdx) {
    if (auction.status === 'cancelled') return stepIdx === 0;
    if (auction.status === 'suspended') return stepIdx <= 2;
    return stepIdx <= currentIdx;
  }

  return (
    <div className="tracking-timeline">
      {steps.map((step, i) => (
        <div
          key={step.key}
          className={`tracking-timeline__step ${isStepActive(i) ? 'tracking-timeline__step--active' : ''} ${i < steps.length - 1 ? 'tracking-timeline__step--connector' : ''}`}
        >
          <div className="tracking-timeline__dot" />
          <div className="tracking-timeline__content">
            <span className="tracking-timeline__label">{step.label}</span>
            {step.date && (
              <span className="tracking-timeline__date">{formatDate(step.date)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackingDashboardPage() {
  const { token } = useParams();
  const { data, loading, error, logout } = useTracking(token);

  if (loading && !data) {
    return (
      <div className="tracking-loading">
        <div className="tracking-loading__spinner" />
        <p>Loading tracking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-error">
        <h2>Unable to load tracking data</h2>
        <p>{error}</p>
        <button className="tracking-error__btn" onClick={logout}>
          Return to login
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { auction, asset, tracking } = data;
  const imageUrl = asset?.imageUrls?.[0] || null;

  return (
    <div className="tracking-dashboard">
      <div className="tracking-dashboard__header">
        <div className="tracking-dashboard__title-row">
          <h1 className="tracking-dashboard__title">{auction.title}</h1>
          <StatusBadge status={auction.status} />
        </div>
        <p className="tracking-dashboard__subtitle">
          Auction ID: {auction.id?.slice(0, 8).toUpperCase() || '\u2014'}
          {auction.category && ` \u00B7 ${auction.category.replace(/_/g, ' ')}`}
        </p>
      </div>

      <div className="tracking-dashboard__grid">
        <div className="tracking-dashboard__main-card">
          {asset && (
            <div className="tracking-asset">
              {imageUrl && (
                <div className="tracking-asset__image-wrap">
                  <img
                    src={imageUrl}
                    alt={asset.title}
                    className="tracking-asset__image"
                  />
                </div>
              )}
              <div className="tracking-asset__info">
                <h2 className="tracking-asset__title">{asset.title}</h2>
                <p className="tracking-asset__type">{asset.assetType?.replace(/_/g, ' ')}</p>
                {asset.description && (
                  <p className="tracking-asset__desc">{asset.description}</p>
                )}
              </div>
            </div>
          )}

          <div className="tracking-metrics">
            <div className="tracking-metric tracking-metric--highlight">
              <span className="tracking-metric__label">Current Highest Bid</span>
              <span className="tracking-metric__value">
                {formatCurrency(tracking.currentHighestBid)}
              </span>
            </div>
            <div className="tracking-metric">
              <span className="tracking-metric__label">Total Bids Placed</span>
              <span className="tracking-metric__value">{tracking.totalBids}</span>
            </div>
            <div className="tracking-metric">
              <span className="tracking-metric__label">Auction Mode</span>
              <span className="tracking-metric__value">
                {auction.mode === 'multi' ? 'Multi-Lot' : 'Single'}
              </span>
            </div>
            {asset?.desiredReservePrice != null && (
              <div className="tracking-metric">
                <span className="tracking-metric__label">Reserve Price</span>
                <span className="tracking-metric__value">
                  {formatCurrency(asset.desiredReservePrice)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="tracking-dashboard__side-card">
          <h3 className="tracking-section-title">Auction Timeline</h3>
          <Timeline auction={auction} />
        </div>
      </div>

      {tracking.winner && (
        <div className="tracking-winner-card">
          <h3 className="tracking-section-title">Winner Information</h3>
          <div className="tracking-winner-card__content">
            <div className="tracking-winner-card__org">
              {tracking.winner.organizationName || 'N/A'}
            </div>
            <div className="tracking-winner-card__amount">
              Final Amount: {formatCurrency(tracking.winner.amount)}
            </div>
            <div className="tracking-winner-card__date">
              Announced: {formatDate(tracking.winner.announcedAt)}
            </div>
          </div>
        </div>
      )}

      <div className="tracking-dashboard__dates">
        <div className="tracking-date-item">
          <span className="tracking-date-item__label">Published</span>
          <span className="tracking-date-item__value">{formatDate(auction.publishedAt || auction.startDate)}</span>
        </div>
        <div className="tracking-date-item">
          <span className="tracking-date-item__label">Bidding Start</span>
          <span className="tracking-date-item__value">{formatDate(auction.startDate)}</span>
        </div>
        <div className="tracking-date-item">
          <span className="tracking-date-item__label">Bidding End</span>
          <span className="tracking-date-item__value">{formatDate(auction.endDate)}</span>
        </div>
        {auction.closedAt && (
          <div className="tracking-date-item">
            <span className="tracking-date-item__label">Closed</span>
            <span className="tracking-date-item__value">{formatDate(auction.closedAt)}</span>
          </div>
        )}
      </div>

      <div className="tracking-dashboard__disclaimer">
        This is an automated tracking page for informational purposes only.
        No bidding or purchasing actions can be performed through this page.
        For inquiries, please contact the auction house directly.
      </div>
    </div>
  );
}

export default TrackingDashboardPage;
