import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { AuctionImageGallery } from './AuctionImageGallery.jsx';
import { AuctionParticipationPanel } from './AuctionParticipationPanel.jsx';
import { AuctionLotsPanel } from './AuctionLotsPanel.jsx';
import { toLoadableMediaUrl } from '../../public/utils/landing-utils.js';
import { DocumentPaymentModal } from './DocumentPaymentModal.jsx';
import { CpoFinancialWizard } from './CpoFinancialWizard.jsx';
import { auctionService } from '../services/auction-service.js';
import {
  formatEtbAmount,
  normalizeAuctionStatus,
  statusPillClass,
} from '@enderass/shared/utils';
import { isMultiLotAuction } from '../utils/auction-lot-utils.js';
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
    lots: toArray(auctionData.lots),
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
  const lots = auction?.lots ?? [];
  const isMultiLot = isMultiLotAuction(auction);
  const totalReserve = auction?.totalReservePrice ?? auction?.reservePrice;
  const documentAccess = Boolean(
    auction?.documentAccess || participation?.gates?.documentAccess || participation?.isRegisteredBidder,
  );
  const participationStatus = resolveParticipationStatus(participation);
  const participationVariant = getParticipationStatusVariant(participationStatus);
  const hasGallery = images.length > 0;

  return (
    <>
      <div
        className={`kyc-modal-overlay${visible ? ' auction-drawer-overlay--visible' : ''}`}
        role="presentation"
        onClick={onClose}
        style={{ zIndex: 1200 }}
      >
        <aside
          className={`kyc-modal bidder-detail-modal${visible ? ' auction-drawer--visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bidder-auction-drawer-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="bidder-detail__side">
            {hasGallery && (
              <div className="bidder-detail__hero" style={{ flexShrink: 0 }}>
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
              <p className="bidder-detail__eyebrow">{t('bidder.browse.detailEyebrow')}</p>
              <h2 id="bidder-auction-drawer-title" className="bidder-detail__title" style={{ marginTop: 8, marginBottom: 16 }}>
                {auction?.title || t('bidder.browse.detailTitle')}
              </h2>
              
              {!loading && auction && (
                <div className="bidder-detail__chips" style={{ marginBottom: 24 }}>
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

              {!loading && !error && auction && (
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
                  {totalReserve > 0 && (
                    <StatCard
                      icon={(
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      )}
                      label={isMultiLot ? t('bidder.browse.lots.totalReserve') : t('bidder.browse.placeBid.reservePrice')}
                      value={formatEtbAmount(totalReserve)}
                    />
                  )}
                  {auction.cpoPercentage > 0 && (
                    <StatCard
                      icon={(
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      )}
                      label={t('bidder.browse.placeBid.cpoPercentage')}
                      value={`${auction.cpoPercentage}%`}
                    />
                  )}
                </section>
              )}
            </div>
          </div>

          <div className="bidder-detail__main">
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
              <button
                type="button"
                className="bidder-detail__close"
                onClick={onClose}
                aria-label={t('common.close')}
                style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div className="bidder-detail__scroll" style={{ padding: 0 }}>
                {loading && <BidderDetailSkeleton withGallery={hasGallery} />}

                {!loading && error && (
                  <div className="bidder-detail__error" role="alert">
                    <span className="bidder-detail__error-icon" aria-hidden="true">!</span>
                    <p>{t('dashboard.table.error', { message: error })}</p>
                  </div>
                )}

                {!loading && !error && auction && (
                  <>
                    {lots.length > 0 && documentAccess && (
                      <AuctionLotsPanel
                        auction={auction}
                        lots={lots}
                        bidDrafts={participation?.bidDrafts}
                      />
                    )}

                    {lots.length > 0 && !documentAccess && (
                      <section style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                        padding: '10px 14px', marginBottom: 12,
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                          {t('bidder.browse.lots.gatedBody', 'Pay the document fee to view the full asset breakdown and prepare your bids.')}
                        </span>
                      </section>
                    )}

                    <section className="bidder-detail__journey" style={{ marginTop: 12 }}>
                      <AuctionParticipationPanel
                        auction={auction}
                        participation={participation}
                        documents={documents}
                        documentAccess={documentAccess}
                        loading={participationLoading}
                        participationError={participationError}
                        onRetryParticipation={loadParticipation}
                        onPayDocumentFee={() => setPaymentModalOpen(true)}
                        onSubmitCpo={(data) => setCpoModalOpen(data || true)}
                        onBidSuccess={handleBidSuccess}
                      />
                    </section>
                    
                    {(auction.description || auction.auctionConditions) && (
                      <section className="bidder-detail__info" style={{ marginTop: 32 }}>
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
          </div>
        </aside>
      </div>

      <DocumentPaymentModal
        open={paymentModalOpen}
        auction={auction}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentSuccess}
      />

      <CpoFinancialWizard
        open={cpoModalOpen}
        auction={auction}
        bidDrafts={participation?.bidDrafts ?? []}
        onClose={() => setCpoModalOpen(false)}
        onSuccess={handleCpoSuccess}
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
