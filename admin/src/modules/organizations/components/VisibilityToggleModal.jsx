import { useState, useEffect, useCallback } from 'react';

const VISIBILITY_OPTIONS = [
  {
    key: 'bidderCount',
    label: 'Bidder Count',
    description: 'Number of bidders and participation stats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'assetImages',
    label: 'Asset Images',
    description: 'Image gallery of auction assets',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    key: 'auctionDetails',
    label: 'Auction Details',
    description: 'Category, dates, reserve price, fees',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: 'lotDetails',
    label: 'Lot Details',
    description: 'Lot titles, descriptions, and order',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    key: 'lotImages',
    label: 'Lot Images',
    description: 'Per-lot image previews',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="8" height="8" rx="1" />
        <rect x="14" y="2" width="8" height="8" rx="1" />
        <rect x="2" y="14" width="8" height="8" rx="1" />
        <rect x="14" y="14" width="8" height="8" rx="1" />
      </svg>
    ),
  },
  {
    key: 'auctionDocuments',
    label: 'Auction Documents',
    description: 'Downloadable PDFs and files',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    ),
  },
  {
    key: 'winnerInfo',
    label: 'Winner Info',
    description: 'Final winner and announcement details',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
];

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      className={`vis-toggle ${enabled ? 'vis-toggle--on' : ''}`}
      onClick={onToggle}
      aria-pressed={enabled}
    >
      <span className="vis-toggle__thumb" />
    </button>
  );
}

export function VisibilityToggleModal({ open, onClose, onConfirm, auctionTitle }) {
  const [settings, setSettings] = useState(() =>
    Object.fromEntries(VISIBILITY_OPTIONS.map((o) => [o.key, true]))
  );

  useEffect(() => {
    if (open) {
      setSettings(Object.fromEntries(VISIBILITY_OPTIONS.map((o) => [o.key, true])));
    }
  }, [open]);

  const handleToggle = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const allOn = Object.values(settings).every(Boolean);
  const noneOn = Object.values(settings).every((v) => !v);

  const handleSelectAll = () => {
    const val = !allOn;
    setSettings(Object.fromEntries(VISIBILITY_OPTIONS.map((o) => [o.key, val])));
  };

  const handleConfirm = () => {
    onConfirm(settings);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="vis-overlay" onClick={onClose}>
      <div className="vis-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="vis-modal__header">
          <div className="vis-modal__header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h3 className="vis-modal__title">Link Visibility</h3>
            <p className="vis-modal__subtitle">
              Choose what viewers can see when tracking
              {auctionTitle && <strong> {auctionTitle}</strong>}
            </p>
          </div>
        </div>

        <div className="vis-modal__select-all" onClick={handleSelectAll}>
          <span className="vis-modal__select-all-text">
            {allOn ? 'Deselect All' : 'Select All'}
          </span>
          <span className="vis-modal__select-all-count">
            {Object.values(settings).filter(Boolean).length} / {VISIBILITY_OPTIONS.length}
          </span>
        </div>

        <div className="vis-modal__options">
          {VISIBILITY_OPTIONS.map((opt) => (
            <div key={opt.key} className="vis-option">
              <div className="vis-option__icon">{opt.icon}</div>
              <div className="vis-option__text">
                <span className="vis-option__label">{opt.label}</span>
                <span className="vis-option__desc">{opt.description}</span>
              </div>
              <Toggle
                enabled={settings[opt.key]}
                onToggle={() => handleToggle(opt.key)}
              />
            </div>
          ))}
        </div>

        <div className="vis-modal__footer">
          <button type="button" className="vis-modal__btn vis-modal__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="vis-modal__btn vis-modal__btn--primary"
            onClick={handleConfirm}
            disabled={noneOn}
          >
            Create Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default VisibilityToggleModal;
