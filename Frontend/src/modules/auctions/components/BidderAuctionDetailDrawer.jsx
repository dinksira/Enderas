import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { AuctionParticipationPanel } from './AuctionParticipationPanel.jsx';
import { DocumentPaymentModal } from './DocumentPaymentModal.jsx';
import { CpoSubmitModal } from './CpoSubmitModal.jsx';
import { auctionService } from '../services/auction-service.js';
import {
  formatEtbAmount,
  normalizeAuctionStatus,
  statusPillClass,
} from '@enderass/shared/utils';
import {
  getParticipationStatusVariant,
  resolveParticipationStatus,
} from '../utils/participation-utils.js';

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
 * Read-only auction detail for bidders with participation flow.
 * @param {{ auctionId: string|null, open: boolean, onClose: () => void }} props
 */
export function BidderAuctionDetailDrawer({ auctionId, open, onClose }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [auction, setAuction] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [participationLoading, setParticipationLoading] = useState(false);
  const [participationError, setParticipationError] = useState('');
  const [error, setError] = useState(null);
  const [viewerSrc, setViewerSrc] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cpoModalOpen, setCpoModalOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const loadParticipation = useCallback(async () => {
    if (!auctionId) return;
    setParticipationLoading(true);
    setParticipationError('');
    try {
      const response = await auctionService.getParticipation(auctionId);
      setParticipation(response?.participation ?? response);
    } catch (err) {
      setParticipation(null);
      setParticipationError(
        err instanceof Error ? err.message : t('bidder.participation.loadFailed'),
      );
    } finally {
      setParticipationLoading(false);
    }
  }, [auctionId, t]);

  const loadAuction = useCallback(async () => {
    if (!auctionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await auctionService.browseById(auctionId);
      const detail = response?.auction ?? response;
      setAuction(normalizeAuctionDetail(detail));
    } catch (err) {
      setAuction(null);
      setError(err instanceof Error ? err.message : t('bidder.browse.detailError'));
    } finally {
      setLoading(false);
    }
  }, [auctionId, t]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadAuction(), loadParticipation()]);
  }, [loadAuction, loadParticipation]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !auctionId) {
      setAuction(null);
      setParticipation(null);
      setError(null);
      setViewerSrc(null);
      setPaymentModalOpen(false);
      setCpoModalOpen(false);
      return undefined;
    }

    refreshAll();
    return undefined;
  }, [open, auctionId, refreshAll]);

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    await refreshAll();
    showToast(t('bidder.participation.paymentModal.success'));
  };

  const handleCpoSuccess = async () => {
    setCpoModalOpen(false);
    await refreshAll();
    showToast(t('bidder.participation.cpoModal.success'));
  };

  const handleBidSuccess = async () => {
    await refreshAll();
    showToast(t('bidder.browse.placeBid.success'));
  };

  if (!open) {
    return null;
  }

  const displayStatus = normalizeAuctionStatus(auction?.status);
  const images = auction?.imageUrls ?? auction?.images ?? [];
  const documents = auction?.documents ?? [];
  const documentAccess = Boolean(
    auction?.documentAccess || participation?.gates?.documentAccess || participation?.isRegisteredBidder,
  );
  const participationStatus = resolveParticipationStatus(participation);
  const participationVariant = getParticipationStatusVariant(participationStatus);

  return (
    <>
      <div
        className={`auction-drawer-overlay${visible ? ' auction-drawer-overlay--visible' : ''}`}
        role="presentation"
        onClick={onClose}
      >
        <aside
          className={`auction-drawer auction-drawer--bidder${visible ? ' auction-drawer--visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bidder-auction-drawer-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="auction-drawer__header">
            <div className="auction-drawer__header-main">
              <p className="auction-drawer__eyebrow">{t('bidder.browse.detailEyebrow')}</p>
              <div className="auction-drawer__title-row">
                <h2 id="bidder-auction-drawer-title" className="auction-drawer__title">
                  {auction?.title || t('bidder.browse.detailTitle')}
                </h2>
                {!loading && auction && (
                  <StatusPill
                    label={t(`bidder.participation.status.${participationStatus}.label`, {
                      defaultValue: participationStatus,
                    })}
                    variant={participationVariant}
                  />
                )}
              </div>
              {auction && (
                <div className="auction-drawer__meta-row auction-drawer__meta-row--header">
                  <span className={`dashboard-status-pill ${statusPillClass(displayStatus)}`}>
                    {t(`dashboard.filters.${displayStatus.toLowerCase()}`, displayStatus)}
                  </span>
                  <span className="auction-drawer__meta-text">{auction.category}</span>
                </div>
              )}
            </div>
            <button type="button" className="auction-drawer__close" onClick={onClose} aria-label={t('common.close')}>
              ×
            </button>
          </header>

          <div className="auction-drawer__body auction-drawer__body--bidder">
            {loading && <p className="dashboard-table__empty">{t('dashboard.table.loading')}</p>}

            {!loading && error && (
              <p className="dashboard-table__empty" role="alert">
                {t('dashboard.table.error', { message: error })}
              </p>
            )}

            {!loading && !error && auction && (
              <>
                <dl className="auction-drawer__summary-grid">
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
                    <dt>{t('bidder.participation.documentFee')}</dt>
                    <dd>{formatEtbAmount(auction.documentFee)}</dd>
                  </div>
                </dl>

                <AuctionParticipationPanel
                  auction={auction}
                  participation={participation}
                  documents={documents}
                  documentAccess={documentAccess}
                  loading={participationLoading}
                  participationError={participationError}
                  onRetryParticipation={loadParticipation}
                  onPayDocumentFee={() => setPaymentModalOpen(true)}
                  onSubmitCpo={() => setCpoModalOpen(true)}
                  onBidSuccess={handleBidSuccess}
                />

                {images.length > 0 && (
                  <section className="auction-drawer__section">
                    <h3>{t('bidder.browse.photos')}</h3>
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
                  </section>
                )}

                {(auction.description || auction.auctionConditions) && (
                  <section className="auction-drawer__section auction-drawer__section--details">
                    <h3>{t('bidder.browse.auctionInfo')}</h3>
                    {auction.description && (
                      <div className="auction-drawer__text-block">
                        <h4>{t('bidder.browse.description')}</h4>
                        <p>{auction.description}</p>
                      </div>
                    )}
                    {auction.auctionConditions && (
                      <div className="auction-drawer__text-block">
                        <h4>{t('bidder.browse.conditions')}</h4>
                        <p>{auction.auctionConditions}</p>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <DocumentPaymentModal
        open={paymentModalOpen}
        auction={auction}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentSuccess}
      />

      <CpoSubmitModal
        open={cpoModalOpen}
        auction={auction}
        onClose={() => setCpoModalOpen(false)}
        onSubmit={handleCpoSuccess}
      />

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}

      <DashboardToast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </>
  );
}

export default BidderAuctionDetailDrawer;

