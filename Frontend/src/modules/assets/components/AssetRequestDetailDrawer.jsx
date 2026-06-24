import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { useAuthStore } from '../../../stores/auth-store.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { assetService } from '../services/asset-service.js';
import { normalizeAssetStatus, statusPillClass, normalizeAssetDetail } from '../utils/asset-form-utils.js';

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
 *   actionLoading?: boolean,
 * }} props
 */
export function AssetRequestDetailDrawer({
  assetId,
  open,
  onClose,
  onApprove,
  onReject,
  actionLoading = false,
}) {
  const { t } = useTranslation();
  const can = useAuthStore((state) => state.can);

  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerSrc, setViewerSrc] = useState(null);

  const canApprove = can(MODULES.ASSETS, ACTIONS.APPROVE);
  const canReject = can(MODULES.ASSETS, ACTIONS.REJECT);
  const displayStatus = detail ? normalizeAssetStatus(detail.status) : '';
  const isPending = detail?.dbStatus === 'pending_review';

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

        <div className={`auction-drawer__body${detail && isPending && (canApprove || canReject) ? ' auction-drawer__body--with-footer' : ''}`}>
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
      </aside>

      {viewerSrc && (
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      )}
    </div>
  );
}

export default AssetRequestDetailDrawer;
