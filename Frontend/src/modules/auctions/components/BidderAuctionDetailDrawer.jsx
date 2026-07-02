import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { AuctionImageGallery } from './AuctionImageGallery.jsx';
import { AuctionParticipationPanel } from './AuctionParticipationPanel.jsx';
import { toLoadableMediaUrl } from '../../public/utils/landing-utils.js';
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

function BidderDetailSkeleton({ withGallery }) {
  return (
    <div className="bidder-detail__skeleton">
      {withGallery && <div className="bidder-detail__skeleton-hero" />}
      <div className="bidder-detail__skeleton-main">
        <div className="bidder-detail__skeleton-stats">
          <div className="bidder-detail__skeleton-stat" />
          <div className="bidder-detail__skeleton-stat" />
          <div className="bidder-detail__skeleton-stat" />
        </div>
        <div className="bidder-detail__skeleton-panel" />
        <div className="bidder-detail__skeleton-block" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bidder-detail__stat">
      <span className="bidder-detail__stat-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="bidder-detail__stat-copy">
        <span className="bidder-detail__stat-label">{label}</span>
        <span className="bidder-detail__stat-value">{value}</span>
      </div>
    </div>
  );
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
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(null);
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
      if (event.key === 'Escape' && viewerIndex === null) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose, viewerIndex]);

  useEffect(() => {
    if (!open || !auctionId) {
      setAuction(null);
      setParticipation(null);
      setError(null);
      setGalleryIndex(0);
      setViewerIndex(null);
      setPaymentModalOpen(false);
      setCpoModalOpen(false);
      return undefined;
    }

    setGalleryIndex(0);
    setViewerIndex(null);
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

  const rawImages = auction?.imageUrls ?? auction?.images ?? [];
  const images = useMemo(
    () => rawImages.map((url) => toLoadableMediaUrl(url) || url).filter(Boolean),
    [rawImages],
  );

  if (!open) {
    return null;
  }

  const displayStatus = normalizeAuctionStatus(auction?.status);
  const documents = auction?.documents ?? [];
  const documentAccess = Boolean(
    auction?.documentAccess || participation?.gates?.documentAccess || participation?.isRegisteredBidder,
  );
  const participationStatus = resolveParticipationStatus(participation);
  const participationVariant = getParticipationStatusVariant(participationStatus);
  const hasGallery = images.length > 0;

  return (
    <>
      <div
        className={`auction-drawer-overlay auction-drawer-overlay--bidder${visible ? ' auction-drawer-overlay--visible' : ''}`}
        role="presentation"
        onClick={onClose}
      >
        <aside
          className={`auction-drawer auction-drawer--bidder bidder-detail${visible ? ' auction-drawer--visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bidder-auction-drawer-title"
          onClick={(event) => event.stopPropagation()}
        >
          {hasGallery && (
            <div className="bidder-detail__hero">
              {!loading && !error && auction ? (
                <AuctionImageGallery
                  images={images}
                  title={auction.title}
                  activeIndex={galleryIndex}
                  onActiveIndexChange={setGalleryIndex}
                  onOpenViewer={setViewerIndex}
                />
              ) : (
                <div className="bidder-detail__hero-placeholder" aria-hidden="true" />
              )}
            </div>
          )}

          <div className="bidder-detail__below">
          <header className="bidder-detail__header">
            <div className="bidder-detail__header-top">
              <p className="bidder-detail__eyebrow">{t('bidder.browse.detailEyebrow')}</p>
              <button
                type="button"
                className="bidder-detail__close"
                onClick={onClose}
                aria-label={t('common.close')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <h2 id="bidder-auction-drawer-title" className="bidder-detail__title">
              {auction?.title || t('bidder.browse.detailTitle')}
            </h2>

            {!loading && auction && (
              <div className="bidder-detail__chips">
                <StatusPill
                  label={t(`bidder.participation.status.${participationStatus}.label`, {
                    defaultValue: participationStatus,
                  })}
                  variant={participationVariant}
                />
                <span className={`bidder-detail__chip bidder-detail__chip--status dashboard-status-pill ${statusPillClass(displayStatus)}`}>
                  {t(`dashboard.filters.${displayStatus.toLowerCase()}`, displayStatus)}
                </span>
                {auction.category && (
                  <span className="bidder-detail__chip bidder-detail__chip--category">{auction.category}</span>
                )}
              </div>
            )}
          </header>

          <div className="bidder-detail__scroll">
            {loading && <BidderDetailSkeleton withGallery={hasGallery} />}

            {!loading && error && (
              <div className="bidder-detail__error" role="alert">
                <span className="bidder-detail__error-icon" aria-hidden="true">!</span>
                <p>{t('dashboard.table.error', { message: error })}</p>
              </div>
            )}

            {!loading && !error && auction && (
              <>
                <section className="bidder-detail__stats" aria-label={t('bidder.browse.auctionInfo')}>
                    <StatCard
                      icon={(
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      )}
                      label={t('dashboard.table.headers.starting_date')}
                      value={auction.startDateFormatted || auction.startingDate || '—'}
                    />
                    <StatCard
                      icon={(
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                      label={t('dashboard.table.headers.ending_date')}
                      value={auction.endDateFormatted || auction.endingDate || '—'}
                    />
                    <StatCard
                      icon={(
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      )}
                      label={t('bidder.participation.documentFee')}
                      value={formatEtbAmount(auction.documentFee)}
                    />
                  </section>

                  <section className="bidder-detail__journey">
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
                  </section>

                  {(auction.description || auction.auctionConditions) && (
                    <section className="bidder-detail__info">
                      <h3 className="bidder-detail__info-title">{t('bidder.browse.auctionInfo')}</h3>
                      {auction.description && (
                        <article className="bidder-detail__info-card">
                          <h4>{t('bidder.browse.description')}</h4>
                          <p>{auction.description}</p>
                        </article>
                      )}
                      {auction.auctionConditions && (
                        <article className="bidder-detail__info-card">
                          <h4>{t('bidder.browse.conditions')}</h4>
                          <p>{auction.auctionConditions}</p>
                        </article>
                      )}
                    </section>
                  )}
                </>
              )}
          </div>
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

      {viewerIndex !== null && images.length > 0 && (
        <ImageViewer
          images={images}
          index={viewerIndex}
          onIndexChange={(nextIndex) => {
            setViewerIndex(nextIndex);
            setGalleryIndex(nextIndex);
          }}
          onClose={() => setViewerIndex(null)}
          alt={auction?.title || t('bidder.browse.photos')}
          previousLabel={t('bidder.browse.gallery.previous')}
          nextLabel={t('bidder.browse.gallery.next')}
          closeLabel={t('common.close')}
        />
      )}

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
