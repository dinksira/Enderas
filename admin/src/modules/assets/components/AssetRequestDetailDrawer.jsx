import { ImageViewer } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@enderass/shared/auth';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { auctionService } from '@enderass/shared/services';
import { assetService } from '@enderass/shared/services';
import { normalizeAssetStatus, statusPillClass, normalizeAssetDetail, formatReserveAmount } from '../utils/asset-form-utils.js';

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {{
 *   assetId: string|null,
 *   open: boolean,
 *   onClose: () => void,
 *   onApprove: (asset: object) => void,
 *   onReject: (asset: object) => void,
 *   onCreateAuction?: (asset: object) => void,
 *   actionLoading?: boolean,
 * }} props
 */
export function AssetRequestDetailDrawer({
  assetId,
  open,
  onClose,
  onApprove,
  onReject,
  onCreateAuction,
  actionLoading = false,
}) {
  const { t } = useTranslation();
  const can = useAuthStore((state) => state.can);

  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerSrc, setViewerSrc] = useState(null);
  const [eligibleAsset, setEligibleAsset] = useState(null);
  const [eligibleLoading, setEligibleLoading] = useState(false);

  const canApprove = can(MODULES.ASSETS, ACTIONS.APPROVE);
  const canReject = can(MODULES.ASSETS, ACTIONS.REJECT);
  const canCreateAuction = can(MODULES.AUCTIONS, ACTIONS.CREATE);
  const displayStatus = detail ? normalizeAssetStatus(detail.status) : '';
  const isPending = detail?.dbStatus === 'pending_review';
  const isEvaluated = detail?.dbStatus === 'evaluated';
  const isInAuction = detail?.dbStatus === 'in_auction';
  const showCreateAuction = Boolean(isEvaluated && canCreateAuction && eligibleAsset && onCreateAuction);
  const showFooter = Boolean(
    (detail && isPending && (canApprove || canReject)) || showCreateAuction,
  );

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !assetId) {
      setDetail(null);
      setError('');
      setViewerSrc(null);
      return undefined;
    }

    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await assetService.getById(assetId);
        if (!cancelled) {
          setDetail(normalizeAssetDetail(response?.asset || response));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('assets.review.loadFailed'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, assetId, t]);

  useEffect(() => {
    if (!open || !assetId || !isEvaluated || !canCreateAuction) {
      setEligibleAsset(null);
      setEligibleLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadEligibleAsset = async () => {
      setEligibleLoading(true);
      try {
        const asset = await auctionService.getEligibleAssetById(assetId);
        if (!cancelled) {
          setEligibleAsset(asset);
        }
      } catch {
        if (!cancelled) {
          setEligibleAsset(null);
        }
      } finally {
        if (!cancelled) {
          setEligibleLoading(false);
        }
      }
    };

    loadEligibleAsset();

    return () => {
      cancelled = true;
    };
  }, [open, assetId, isEvaluated, canCreateAuction]);

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

  if (!open) {
    return null;
  }

  return (
    <div
      className={`auction-drawer-overlay${visible ? ' auction-drawer-overlay--visible' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <aside
        className={`auction-drawer${visible ? ' auction-drawer--visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="auction-drawer__header">
          <div className="auction-drawer__header-main">
            <div className="auction-drawer__title-row">
              <h2 id="asset-drawer-title" className="auction-drawer__title">
                {loading ? t('common.loading') : detail?.title || t('assets.review.drawerTitle')}
              </h2>
              {detail && (
                <span className={`asset-status-pill ${statusPillClass(detail.status)}`}>
                  {t(`assets.status.${displayStatus.toLowerCase()}`, {
                    defaultValue: displayStatus.replace(/_/g, ' '),
                  })}
                </span>
              )}
            </div>
            {detail && (
              <p className="auction-drawer__auction-id">
                {t('assets.review.requestId', { id: detail.id })}
              </p>
            )}
          </div>
          <button
            type="button"
            className="auction-drawer__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </header>

        <div className={`auction-drawer__body${showFooter ? ' auction-drawer__body--with-footer' : ''}`}>
          {loading && <p className="dashboard-table__empty">{t('common.loading')}</p>}

          {error && (
            <p className="kyc-drawer__error" role="alert">
              {error}
            </p>
          )}

          {!loading && detail && (
            <>
              <section className="kyc-drawer__section">
                <dl className="kyc-drawer__meta">
                  <div>
                    <dt>{t('assets.table.headers.type')}</dt>
                    <dd>{t(`assets.types.${detail.assetType}`, { defaultValue: detail.assetType })}</dd>
                  </div>
                  <div>
                    <dt>{t('assets.review.owner')}</dt>
                    <dd>{detail.ownerName || '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('assets.review.ownerMobile')}</dt>
                    <dd>{detail.ownerMobile || '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('assets.table.headers.submitted')}</dt>
                    <dd>{detail.submittedAtFormatted || '—'}</dd>
                  </div>
                  {detail.location && (
                    <div>
                      <dt>{t('assets.form.fields.location')}</dt>
                      <dd>{detail.location}</dd>
                    </div>
                  )}
                  {detail.address && (
                    <div>
                      <dt>{t('assets.form.fields.address')}</dt>
                      <dd>{detail.address}</dd>
                    </div>
                  )}
                  {detail.reviewedAtFormatted && detail.reviewedAtFormatted !== '—' && (
                    <div>
                      <dt>{t('assets.review.reviewedAt')}</dt>
                      <dd>{detail.reviewedAtFormatted}</dd>
                    </div>
                  )}
                  {detail.reviewedByName && (
                    <div>
                      <dt>{t('assets.review.reviewedBy')}</dt>
                      <dd>{detail.reviewedByName}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {detail.description && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.form.fields.description')}</h3>
                  <p className="auction-drawer__text-block">{detail.description}</p>
                </section>
              )}

              {detail.conditionNotes && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.form.fields.conditionNotes')}</h3>
                  <p className="auction-drawer__text-block">{detail.conditionNotes}</p>
                </section>
              )}

              {detail.desiredReservePrice != null && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.form.fields.desiredReservePrice')}</h3>
                  <p className="auction-drawer__text-block">
                    {new Intl.NumberFormat('en-ET').format(detail.desiredReservePrice)} ETB
                  </p>
                </section>
              )}

              {detail.auctionConditions && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.form.fields.auctionConditions')}</h3>
                  <p className="auction-drawer__text-block">{detail.auctionConditions}</p>
                </section>
              )}

              {isEvaluated && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.review.evaluationSection')}</h3>
                  {eligibleLoading && (
                    <p className="auction-drawer__text-block">{t('common.loading')}</p>
                  )}
                  {!eligibleLoading && eligibleAsset?.evaluation && (
                    <dl className="kyc-drawer__meta">
                      <div>
                        <dt>{t('assets.review.valuation')}</dt>
                        <dd>{formatReserveAmount(eligibleAsset.evaluation.valuationAmount)}</dd>
                      </div>
                      <div>
                        <dt>{t('assets.review.reserveRecommendation')}</dt>
                        <dd>{formatReserveAmount(eligibleAsset.evaluation.reservePriceRecommendation)}</dd>
                      </div>
                      {eligibleAsset.evaluation.reportUrl && (
                        <div>
                          <dt>{t('assets.review.evaluationReport')}</dt>
                          <dd>
                            <a
                              href={eligibleAsset.evaluation.reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('assets.review.viewEvaluationReport')}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}
                  {!eligibleLoading && !eligibleAsset && canCreateAuction && (
                    <p className="auction-drawer__text-block" role="status">
                      {t('assets.review.notEligibleForAuction')}
                    </p>
                  )}
                </section>
              )}

              {isInAuction && (
                <section className="kyc-drawer__section">
                  <p className="auction-drawer__text-block" role="status">
                    {t('assets.review.alreadyInAuction')}
                  </p>
                </section>
              )}

              {Array.isArray(detail.imageUrls) && detail.imageUrls.length > 0 && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.form.fields.photos')}</h3>
                  <div className="auction-drawer__thumbnails">
                    {detail.imageUrls.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        className="auction-drawer__thumbnail"
                        onClick={() => setViewerSrc(url)}
                        aria-label={t('assets.review.viewPhoto', {
                          title: detail.title,
                          index: index + 1,
                        })}
                      >
                        <img src={url} alt={detail.title} />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {detail.rejectionReason && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.review.rejectionReason')}</h3>
                  <p className="auction-drawer__text-block">{detail.rejectionReason}</p>
                </section>
              )}

              {detail.ownershipDocumentUrl && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.form.fields.ownershipDocument')}</h3>
                  <div className="auction-drawer__document-item">
                    <div>
                      <p className="auction-drawer__document-name">
                        {decodeURIComponent(detail.ownershipDocumentUrl.split('/').pop() || 'ownership-document')}
                      </p>
                    </div>
                    <a
                      href={detail.ownershipDocumentUrl}
                      className="auction-drawer__download-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('assets.review.viewOwnershipDoc')}
                    </a>
                  </div>
                </section>
              )}

              {Array.isArray(detail.additionalDocuments) && detail.additionalDocuments.length > 0 && (
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('assets.form.fields.additionalDocuments')}</h3>
                  <ul className="auction-drawer__documents">
                    {detail.additionalDocuments.map((doc, index) => (
                      <li key={`${doc.url}-${index}`} className="auction-drawer__document-item">
                        <div>
                          <p className="auction-drawer__document-name">{doc.name}</p>
                          <p className="auction-drawer__document-size">{formatFileSize(doc.size)}</p>
                        </div>
                        <a
                          href={doc.url}
                          className="auction-drawer__download-btn"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('auctions.drawer.download')}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {detail && isPending && (canApprove || canReject) && (
          <footer className="auction-drawer__footer">
            {canReject && (
              <button
                type="button"
                className="btn btn--secondary btn--danger"
                onClick={() => onReject(detail)}
                disabled={actionLoading}
              >
                {t('assets.review.reject')}
              </button>
            )}
            {canApprove && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => onApprove(detail)}
                disabled={actionLoading}
              >
                {t('assets.review.approve')}
              </button>
            )}
          </footer>
        )}

        {showCreateAuction && (
          <footer className="auction-drawer__footer">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onCreateAuction(detail)}
              disabled={actionLoading || eligibleLoading}
            >
              {t('assets.review.createAuction')}
            </button>
          </footer>
        )}
      </aside>

      {viewerSrc && (
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      )}
    </div>
  );
}

export default AssetRequestDetailDrawer;
