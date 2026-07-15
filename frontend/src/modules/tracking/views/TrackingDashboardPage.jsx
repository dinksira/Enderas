import { useState } from 'react';
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
    draft:           { cls: 'ts-badge--draft', label: 'Draft', icon: '\u270D' },
    pending_approval:{ cls: 'ts-badge--pending', label: 'Pending', icon: '\u23F3' },
    published:       { cls: 'ts-badge--active', label: 'Active', icon: '\u25CF' },
    suspended:       { cls: 'ts-badge--suspended', label: 'Suspended', icon: '\u26A0' },
    closed:          { cls: 'ts-badge--closed', label: 'Closed', icon: '\u2714' },
    cancelled:       { cls: 'ts-badge--cancelled', label: 'Cancelled', icon: '\u2716' },
  };
  const c = config[status] || { cls: '', label: status, icon: '\u25CF' };
  return (
    <span className={`ts-badge ${c.cls}`}>
      <span className="ts-badge__dot" />
      {c.label}
    </span>
  );
}

function Countdown({ endDate }) {
  if (!endDate) return null;
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;
  if (diff <= 0) return <span className="ts-countdown ts-countdown--ended">Auction Ended</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return (
    <div className="ts-countdown-wrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="ts-countdown">
        {d > 0 && <>{d}d </>}{h}h {m}m remaining
      </span>
    </div>
  );
}

function Timeline({ auction }) {
  const steps = [
    { key: 'published', label: 'Published', date: auction.publishedAt || auction.startDate, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { key: 'bidding', label: 'Bidding Open', date: auction.startDate, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { key: 'closing', label: 'Closing', date: auction.endDate, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { key: 'winner', label: 'Winner Announced', date: auction.closedAt, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg> },
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
          <div className="ts-timeline__dot">
            {isActive(i) && <span className="ts-timeline__dot-ping" />}
          </div>
          <div className="ts-timeline__content">
            <span className="ts-timeline__label">{s.label}</span>
            {s.date && <span className="ts-timeline__date">{formatDate(s.date)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, highlight, monospace, icon }) {
  return (
    <div className={`ts-metric ${highlight ? 'ts-metric--hl' : ''}`}>
      {icon && <span className="ts-metric__icon">{icon}</span>}
      <span className="ts-metric__label">{label}</span>
      <span className={`ts-metric__value ${monospace ? 'ts-metric__value--mono' : ''}`}>{value ?? '\u2014'}</span>
    </div>
  );
}

function TrackingDashboardPage() {
  const { token } = useParams();
  const { data, loading, error, logout } = useTracking(token);
  const [selectedDoc, setSelectedDoc] = useState(null);

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
        <div className="ts-error__icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Unable to load tracking data</h2>
        <p>{error}</p>
        <button className="ts-error__btn" onClick={logout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Return to login
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { auction, asset, tracking, lots } = data;
  const imageUrls = asset?.imageUrls || auction?.imageUrls || [];
  const hasBidding = tracking.totalBids != null || tracking.currentHighestBid != null;

  return (
    <div className="ts-dash">
      {/* Header */}
      <div className="ts-dash__header">
        <div className="ts-dash__title-row">
          <h1 className="ts-dash__title">{auction.title}</h1>
          <StatusBadge status={auction.status} />
        </div>
        <div className="ts-dash__meta">
          <span className="ts-dash__meta-item ts-dash__meta-id">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {(auction.id || '').slice(0, 8).toUpperCase()}
          </span>
          {auction.category && (
            <>
              <span className="ts-dash__meta-sep" />
              <span className="ts-dash__meta-item">{auction.category.replace(/_/g, ' ')}</span>
            </>
          )}
          {auction.mode && (
            <>
              <span className="ts-dash__meta-sep" />
              <span className="ts-dash__meta-item">{auction.mode === 'multi' ? 'Multi-Lot' : 'Single'}</span>
            </>
          )}
        </div>
      </div>

      {/* Description + Conditions */}
      {(auction.description || auction.auctionConditions) && (
        <div className="ts-card ts-card--body">
          {auction.description && <p className="ts-desc">{auction.description}</p>}
          {auction.auctionConditions && (
            <div className="ts-conditions">
              <div className="ts-conditions__label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Auction Conditions
              </div>
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
              {imageUrls.length > 0 && (
                <div className="ts-asset__gallery" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="ts-asset__img-wrap" style={{ flex: '0 0 auto', width: '250px', height: '180px', position: 'relative' }}>
                      <img src={url} alt={`${asset.title || auction.title} - ${idx + 1}`} className="ts-asset__img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      <div className="ts-asset__img-overlay" style={{ position: 'absolute', inset: 0, borderRadius: '8px', background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                    </div>
                  ))}
                </div>
              )}
              <div className="ts-asset__info">
                <h2 className="ts-asset__title">{asset.title}</h2>
                <span className="ts-asset__type">{asset.assetType?.replace(/_/g, ' ') || 'Asset'}</span>
                {asset.description && <p className="ts-asset__desc">{asset.description}</p>}
              </div>
            </div>
          )}

          {/* Lots */}
          {lots && lots.length > 0 && (
            <div className="ts-card ts-card--lots" style={{ marginTop: '24px' }}>
              <h3 className="ts-card__title">Auction Lots</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {lots.map(lot => (
                  <div key={lot.id} style={{ border: '1px solid var(--ts-border)', borderRadius: '8px', padding: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '600' }}>{lot.title}</h4>
                    {lot.description && <p style={{ fontSize: '0.9rem', color: 'var(--ts-muted)', marginBottom: '12px' }}>{lot.description}</p>}
                    {lot.assets && lot.assets.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {lot.assets.map((lotAsset, index) => (
                          <div key={lotAsset.id || index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            {lotAsset.imageUrls && lotAsset.imageUrls.length > 0 && (
                              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: '0 0 auto', maxWidth: '300px', scrollbarWidth: 'thin' }}>
                                {lotAsset.imageUrls.map((url, i) => (
                                  <img key={i} src={url} alt={`${lotAsset.title} - ${i + 1}`} style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                                ))}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: '500' }}>{lotAsset.title}</div>
                              {lotAsset.reservePrice != null && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--ts-muted)', marginTop: '4px' }}>
                                  Reserve: {formatCurrency(lotAsset.reservePrice, auction.currency)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {hasBidding && (
            <div className="ts-metrics-grid">
              {tracking.currentHighestBid != null && (
                <MetricCard
                  label="Current Highest Bid"
                  value={formatCurrency(tracking.currentHighestBid, auction.currency)}
                  highlight
                  monospace
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
                />
              )}
              {tracking.totalBids != null && (
                <MetricCard label="Total Bids" value={tracking.totalBids} monospace icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>} />
              )}
              {tracking.participantCount != null && (
                <MetricCard label="Participants" value={tracking.participantCount} monospace icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
              )}
            </div>
          )}

          {/* Auction Details */}
          <div className="ts-metrics-grid">
            <MetricCard
              label="Reserve Price"
              value={formatCurrency(auction.reservePrice, auction.currency)}
              monospace
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />
            {auction.totalReservePrice != null && (
              <MetricCard
                label="Total Reserve"
                value={formatCurrency(auction.totalReservePrice, auction.currency)}
                monospace
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
              />
            )}
            <MetricCard
              label="Document Fee"
              value={formatCurrency(auction.documentPrice, auction.currency)}
              monospace
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
            />
            <MetricCard
              label="CPO %"
              value={auction.cpoPercentage != null ? `${auction.cpoPercentage}%` : '\u2014'}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8l-4 4-4-4"/></svg>}
            />
            {asset?.desiredReservePrice != null && (
              <MetricCard
                label="Asset Reserve"
                value={formatCurrency(asset.desiredReservePrice, auction.currency)}
                monospace
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>}
              />
            )}
          </div>
        </div>

        {/* Right column — Timeline */}
        <div className="ts-dash__col ts-dash__col--side">
          <div className="ts-card ts-card--timeline">
            <h3 className="ts-card__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Timeline
            </h3>
            <Countdown endDate={auction.endDate} />
            <Timeline auction={auction} />
          </div>
        </div>
      </div>

      {/* Winner card */}
      {tracking.winner && (
        <div className="ts-card ts-card--winner">
          <div className="ts-winner__ribbon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
          <h3 className="ts-card__title">Auction Winner</h3>
          <div className="ts-winner">
            <div className="ts-winner__main">
              <div className="ts-winner__org">{tracking.winner.organizationName || 'N/A'}</div>
              <div className="ts-winner__amount">{formatCurrency(tracking.winner.amount, auction.currency)}</div>
            </div>
            <div className="ts-winner__meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Announced {formatDate(tracking.winner.announcedAt)}
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {auction.documents && auction.documents.length > 0 && (
        <div className="ts-card ts-card--body">
          <h3 className="ts-card__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Auction Documents
          </h3>
          <div className="ts-docs">
            {auction.documents.map((doc, i) => (
              <button key={i} onClick={() => setSelectedDoc(doc)} className="ts-doc" style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                <div className="ts-doc__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span className="ts-doc__name">{doc.name}</span>
                {doc.size > 0 && <span className="ts-doc__size">{(doc.size / 1024).toFixed(0)} KB</span>}
                <svg className="ts-doc__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dates bar */}
      <div className="ts-dates">
        {auction.publishedAt && (
          <div className="ts-date-item">
            <span className="ts-date-item__label">Published</span>
            <span className="ts-date-item__value">{formatDate(auction.publishedAt || auction.startDate)}</span>
          </div>
        )}
        {auction.startDate && (
          <div className="ts-date-item">
            <span className="ts-date-item__label">Bidding Start</span>
            <span className="ts-date-item__value">{formatDate(auction.startDate)}</span>
          </div>
        )}
        {auction.endDate && (
          <div className="ts-date-item">
            <span className="ts-date-item__label">Bidding End</span>
            <span className="ts-date-item__value">{formatDate(auction.endDate)}</span>
          </div>
        )}
        {auction.closedAt && (
          <div className="ts-date-item">
            <span className="ts-date-item__label">Closed</span>
            <span className="ts-date-item__value">{formatDate(auction.closedAt)}</span>
          </div>
        )}
      </div>

      <div className="ts-disclaimer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        This is an automated tracking page for informational purposes only.
        No bidding or purchasing actions can be performed through this page.
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="ts-modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="ts-modal" onClick={e => e.stopPropagation()}>
            <div className="ts-modal__header">
              <h3 className="ts-modal__title">{selectedDoc.name}</h3>
              <div className="ts-modal__actions">
                <a
                  href={selectedDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ts-modal__btn ts-modal__btn--download"
                  title="Open in new tab"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="ts-modal__btn ts-modal__btn--close"
                  aria-label="Close modal"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="ts-modal__body">
              <iframe
                src={selectedDoc.url}
                title={selectedDoc.name}
                className="ts-modal__iframe"
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackingDashboardPage;
