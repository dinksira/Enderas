import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { auctionService } from '../services/auction-service.js';
import {
  formatEtbAmount,
  normalizeAuctionStatus,
  statusPillClass,
} from '../utils/auction-drawer-utils.js';

const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
};

function normalizeAuctionDetail(auctionData) {
  if (!auctionData || typeof auctionData !== 'object') {
    return auctionData;
  }

  return {
    ...auctionData,
    images: toArray(auctionData.images ?? auctionData.imageUrls ?? auctionData.image_urls),
    imageUrls: toArray(auctionData.images ?? auctionData.imageUrls ?? auctionData.image_urls),
    documents: toArray(auctionData.documents ?? auctionData.document_files ?? auctionData.documentFiles),
  };
}

/**
 * Read-only auction detail for bidders.
 * @param {{ auctionId: string|null, open: boolean, onClose: () => void }} props
 */
export function BidderAuctionDetailDrawer({ auctionId, open, onClose }) {
  const { t } = useTranslation();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerSrc, setViewerSrc] = useState(null);

  useEffect(() => {
    if (!open || !auctionId) {
      setAuction(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    auctionService
      .browseById(auctionId)
      .then((response) => {
        if (cancelled) return;
        const detail = response?.auction ?? response;
        setAuction(normalizeAuctionDetail(detail));
      })
      .catch((err) => {
        if (cancelled) return;
        setAuction(null);
        setError(err instanceof Error ? err.message : t('bidder.browse.detailError'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, auctionId, t]);

  if (!open) {
    return null;
  }

  const displayStatus = normalizeAuctionStatus(auction?.status);
  const images = auction?.imageUrls ?? auction?.images ?? [];

  return (
    <div className="auction-drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="auction-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bidder-auction-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="auction-drawer__header">
          <div>
            <p className="auction-drawer__eyebrow">{t('bidder.browse.detailEyebrow')}</p>
            <h2 id="bidder-auction-drawer-title" className="auction-drawer__title">
              {auction?.title || t('bidder.browse.detailTitle')}
            </h2>
          </div>
          <button type="button" className="auction-drawer__close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </header>

        <div className="auction-drawer__body">
          {loading && <p className="dashboard-table__empty">{t('dashboard.table.loading')}</p>}

          {!loading && error && (
            <p className="dashboard-table__empty" role="alert">
              {t('dashboard.table.error', { message: error })}
            </p>
          )}

          {!loading && !error && auction && (
            <>
              <div className="auction-drawer__meta-row">
                <span className={`dashboard-status-pill ${statusPillClass(displayStatus)}`}>
                  {t(`dashboard.filters.${displayStatus.toLowerCase()}`, displayStatus)}
                </span>
                <span className="auction-drawer__meta-text">{auction.category}</span>
              </div>

              {images.length > 0 && (
                <div className="auction-drawer__thumbnails">
                  {images.map((imageUrl) => (
                    <button
                      key={imageUrl}
                      type="button"
                      className="auction-drawer__thumbnail"
                      onClick={() => setViewerSrc(imageUrl)}
                    >
                      <img src={imageUrl} alt={auction.title} />
                    </button>
                  ))}
                </div>
              )}

              <dl className="auction-drawer__grid">
                <div>
                  <dt>{t('dashboard.table.headers.starting_date')}</dt>
                  <dd>{auction.startDateFormatted || auction.startingDate || '—'}</dd>
                </div>
                <div>
                  <dt>{t('dashboard.table.headers.ending_date')}</dt>
                  <dd>{auction.endDateFormatted || auction.endingDate || '—'}</dd>
                </div>
                <div>
                  <dt>{t('dashboard.table.headers.reserve_etb')}</dt>
                  <dd>{formatEtbAmount(auction.reservePrice ?? auction.reserve)}</dd>
                </div>
                <div>
                  <dt>{t('dashboard.table.headers.bids')}</dt>
                  <dd>{auction.bidCount ?? auction.bids ?? 0}</dd>
                </div>
              </dl>

              {auction.description && (
                <section className="auction-drawer__section">
                  <h3>{t('bidder.browse.description')}</h3>
                  <p>{auction.description}</p>
                </section>
              )}

              {auction.auctionConditions && (
                <section className="auction-drawer__section">
                  <h3>{t('bidder.browse.conditions')}</h3>
                  <p>{auction.auctionConditions}</p>
                </section>
              )}

              <p className="auction-drawer__hint">{t('bidder.browse.bidComingSoon')}</p>
            </>
          )}
        </div>
      </aside>

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </div>
  );
}

export default BidderAuctionDetailDrawer;
