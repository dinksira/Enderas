import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { kycService } from '../services/kyc.service.js';
import {
  formatDate,
  getApplicantName,
  getDisplayStatus,
  getDocumentEntries,
  getStaffDisplayName,
  getStatusPillClass,
  isPdfUrl,
} from '../utils/kyc-management-utils.js';

/**
 * @param {{
 *   kycId: string|null,
 *   open: boolean,
 *   actionLoading?: boolean,
 *   onClose: () => void,
 *   onApprove: (kyc: object) => void,
 *   onReject: (kyc: object) => void,
 *   onMarkUnderReview: (kyc: object) => void,
 *   onRefresh: () => void,
 * }} props
 */
export function KYCManagementDetailDrawer({
  kycId,
  open,
  actionLoading = false,
  onClose,
  onApprove,
  onReject,
  onMarkUnderReview,
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);
  const canApproveKyc = can(MODULES.KYC, ACTIONS.APPROVE);
  const canRejectKyc = can(MODULES.KYC, ACTIONS.REJECT);
  const canUpdateKyc = can(MODULES.KYC, ACTIONS.UPDATE);

  const [detail, setDetail] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerSrc, setViewerSrc] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    if (!open || !kycId) {
      setDetail(null);
      setAuditTrail([]);
      setError('');
      setReviewNotes('');
      return undefined;
    }

    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError('');

      try {
        const [detailResponse, auditResponse] = await Promise.all([
          kycService.getKYCById(kycId),
          kycService.getKYCAuditTrail(kycId),
        ]);

        if (cancelled) return;

        setDetail(detailResponse?.kyc || detailResponse);
        setAuditTrail(auditResponse?.auditTrail || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t('kyc.management.detailLoadFailed'));
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
  }, [open, kycId, t]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const displayStatus = getDisplayStatus(detail);
  const documents = getDocumentEntries(detail);
  const applicantName = getApplicantName(detail);

  const timelineSteps = [
    {
      key: 'submitted',
      label: t('kyc.management.timeline.submitted'),
      date: detail?.created_at,
      done: Boolean(detail?.created_at),
    },
    {
      key: 'under_review',
      label: t('kyc.management.timeline.underReview'),
      date: detail?.under_review_at,
      done: Boolean(detail?.under_review_at),
    },
    {
      key: 'decision',
      label: t('kyc.management.timeline.decision'),
      date: detail?.reviewed_at,
      done: detail?.status === 'approved' || detail?.status === 'rejected',
    },
  ];

  const handleMarkUnderReview = async () => {
    if (!detail) return;
    try {
      await kycService.markKYCUnderReview(detail.id, reviewNotes || null);
      onMarkUnderReview(detail);
      onRefresh();
      const refreshed = await kycService.getKYCById(detail.id);
      setDetail(refreshed?.kyc || refreshed);
      const auditResponse = await kycService.getKYCAuditTrail(detail.id);
      setAuditTrail(auditResponse?.auditTrail || []);
    } catch (err) {
      setError(err.message || t('kyc.management.markUnderReviewFailed'));
    }
  };

  return (
    <>
      <div className="kyc-drawer-overlay" role="presentation" onClick={onClose}>
        <aside
          className="kyc-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kyc-drawer-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="kyc-drawer__header">
            <div>
              <h2 id="kyc-drawer-title" className="kyc-drawer__title">
                {loading ? t('common.loading') : applicantName || t('kyc.unknownUser')}
              </h2>
              {detail && (
                <span className={getStatusPillClass(detail)}>
                  {t(`kyc.management.displayStatus.${displayStatus}`)}
                </span>
              )}
            </div>
            <button type="button" className="kyc-drawer__close" onClick={onClose} aria-label={t('common.close')}>
              ×
            </button>
          </header>

          <div className="kyc-drawer__body">
            {loading && <p className="kyc-drawer__message">{t('common.loading')}</p>}

            {error && (
              <p className="kyc-drawer__error" role="alert">
                {error}
              </p>
            )}

            {!loading && detail && (
              <>
                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('kyc.management.applicantInfo')}</h3>
                  <dl className="kyc-drawer__meta">
                    <div>
                      <dt>{t('kyc.management.applicantName')}</dt>
                      <dd>{applicantName || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('kyc.mobile')}</dt>
                      <dd>{detail.user?.mobile_number || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('kyc.management.email')}</dt>
                      <dd>{detail.user?.email || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('kyc.userType')}</dt>
                      <dd>{t(`kyc.management.userTypes.${detail.user?.user_type || 'individual'}`)}</dd>
                    </div>
                    <div>
                      <dt>{t('kyc.management.registrationDate')}</dt>
                      <dd>{formatDate(detail.user?.created_at, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t('kyc.management.submissionDate')}</dt>
                      <dd>{formatDate(detail.created_at, locale)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('kyc.management.timelineTitle')}</h3>
                  <ol className="kyc-timeline">
                    {timelineSteps.map((step, index) => (
                      <li
                        key={step.key}
                        className={`kyc-timeline__step ${step.done ? 'kyc-timeline__step--done' : ''} ${
                          index === timelineSteps.findIndex((s) => !s.done) ? 'kyc-timeline__step--current' : ''
                        }`}
                      >
                        <span className="kyc-timeline__label">{step.label}</span>
                        <span className="kyc-timeline__date">{formatDate(step.date, locale)}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                {detail.status === 'rejected' && detail.rejection_reason && (
                  <section className="kyc-drawer__section kyc-drawer__section--alert">
                    <h3 className="kyc-drawer__section-title">{t('kyc.rejectionReason')}</h3>
                    <p>{detail.rejection_reason}</p>
                  </section>
                )}

                {(detail.reviewed_at || detail.reviewedByStaff) && (
                  <section className="kyc-drawer__section">
                    <h3 className="kyc-drawer__section-title">{t('kyc.management.reviewInfo')}</h3>
                    <dl className="kyc-drawer__meta">
                      <div>
                        <dt>{t('kyc.management.reviewedBy')}</dt>
                        <dd>{getStaffDisplayName(detail.reviewedByStaff) || '—'}</dd>
                      </div>
                      <div>
                        <dt>{t('kyc.management.reviewedAt')}</dt>
                        <dd>{formatDate(detail.reviewed_at, locale)}</dd>
                      </div>
                      {detail.review_notes && (
                        <div>
                          <dt>{t('kyc.reviewNotes')}</dt>
                          <dd>{detail.review_notes}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('kyc.documents')}</h3>
                  {documents.length === 0 ? (
                    <p className="kyc-drawer__message">{t('kyc.management.noDocuments')}</p>
                  ) : (
                    <ul className="kyc-drawer__documents">
                      {documents.map((doc) => (
                        <li key={doc.key}>
                          <button
                            type="button"
                            className="kyc-drawer__doc-btn"
                            onClick={() => setViewerSrc(doc.url)}
                          >
                            {t(doc.labelKey)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="kyc-drawer__section">
                  <h3 className="kyc-drawer__section-title">{t('kyc.management.auditTrail')}</h3>
                  {auditTrail.length === 0 ? (
                    <p className="kyc-drawer__message">{t('kyc.management.noAuditTrail')}</p>
                  ) : (
                    <ul className="kyc-audit-trail">
                      {auditTrail.map((entry) => (
                        <li key={entry.id} className="kyc-audit-trail__item">
                          <div className="kyc-audit-trail__head">
                            <span className="kyc-audit-trail__action">{entry.action}</span>
                            <span className="kyc-audit-trail__date">
                              {formatDate(entry.created_at, locale)}
                            </span>
                          </div>
                          <p className="kyc-audit-trail__actor">
                            {getStaffDisplayName(entry.staff) || getApplicantName({ user: entry.user }) || '—'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {detail.status === 'pending' && (
                  <section className="kyc-drawer__section">
                    <label className="kyc-drawer__label" htmlFor="drawer-review-notes">
                      {t('kyc.reviewNotes')}
                    </label>
                    <textarea
                      id="drawer-review-notes"
                      className="kyc-drawer__textarea"
                      rows={3}
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                    />
                  </section>
                )}
              </>
            )}
          </div>

          {detail && (
            <footer className="kyc-drawer__footer">
              <Button variant="secondary" onClick={onClose} disabled={actionLoading}>
                {t('kyc.management.close')}
              </Button>

              {detail.status === 'pending' && !detail.under_review_at && canUpdateKyc && (
                <Button variant="secondary" onClick={handleMarkUnderReview} disabled={actionLoading || loading}>
                  {t('kyc.management.markUnderReview')}
                </Button>
              )}

              {detail.status === 'pending' && canRejectKyc && (
                <Button variant="secondary" onClick={() => onReject(detail)} disabled={actionLoading}>
                  {t('kyc.reject')}
                </Button>
              )}
              {detail.status === 'pending' && canApproveKyc && (
                <Button variant="primary" onClick={() => onApprove(detail)} disabled={actionLoading}>
                  {t('kyc.approve')}
                </Button>
              )}
            </footer>
          )}
        </aside>
      </div>

      {viewerSrc && !isPdfUrl(viewerSrc) && (
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      )}

      {viewerSrc && isPdfUrl(viewerSrc) && (
        <div className="kyc-modal-overlay" role="presentation" onClick={() => setViewerSrc(null)}>
          <div className="kyc-pdf-viewer" onClick={(event) => event.stopPropagation()}>
            <header className="kyc-pdf-viewer__header">
              <button type="button" className="kyc-drawer__close" onClick={() => setViewerSrc(null)}>
                ×
              </button>
            </header>
            <iframe title={t('kyc.management.documentPreview')} src={viewerSrc} className="kyc-pdf-viewer__frame" />
          </div>
        </div>
      )}
    </>
  );
}

export default KYCManagementDetailDrawer;
