import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { ROUTES } from '../../../config/routes.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { formatEtbAmount } from '../../auctions/utils/auction-drawer-utils.js';
import { evaluationService } from '../services/evaluation-service.js';
import {
  formatAssetCategory,
  formatDate,
  getEvaluationStatusVariant,
} from '../utils/evaluation-management-utils.js';

function MetaField({ label, value, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children ?? value ?? '—'}</dd>
    </>
  );
}

/**
 * @param {{
 *   evaluationId: string|null,
 *   open: boolean,
 *   actionLoading?: boolean,
 *   refreshTrigger?: number,
 *   onClose: () => void,
 *   onStart: (evaluation: object) => void,
 *   onComplete: (evaluation: object) => void,
 *   onApprove: (evaluation: object) => void,
 *   onReject: (evaluation: object) => void,
 *   onReschedule: (evaluation: object, mode: 'update' | 'reschedule') => void,
 *   onCreateAuction?: (evaluation: object) => void,
 * }} props
 */
export function EvaluationDetailDrawer({
  evaluationId,
  open,
  actionLoading = false,
  refreshTrigger = 0,
  onClose,
  onStart,
  onComplete,
  onApprove,
  onReject,
  onReschedule,
  onCreateAuction,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);
  const roleCode = useAuthStore((state) => state.permissions?.roleCode ?? state.user?.roleCode);

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerSrc, setViewerSrc] = useState(null);

  const loadDetail = async () => {
    if (!evaluationId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await evaluationService.getEvaluationById(evaluationId);
      setEvaluation(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('evaluations.management.drawer.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !evaluationId) {
      setEvaluation(null);
      setError('');
      setViewerSrc(null);
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [open, evaluationId, refreshTrigger]);

  const canUpdate = can(MODULES.EVALUATIONS, ACTIONS.UPDATE);
  const canCreateAuction = can(MODULES.AUCTIONS, ACTIONS.CREATE);
  const canReviewEvaluation = roleCode === 'super_admin';
  const status = evaluation?.status;

  const showValuationSection = ['completed', 'approved', 'rejected'].includes(status);
  const showRejectionSection = status === 'rejected';

  const footer =
    !loading && !error && evaluation ? (
      <>
        {status === 'scheduled' && canUpdate && (
          <>
            <Button variant="primary" disabled={actionLoading} onClick={() => onStart(evaluation)}>
              {t('evaluations.management.actions.start')}
            </Button>
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={() => onReschedule(evaluation, 'update')}
            >
              {t('evaluations.management.actions.reschedule')}
            </Button>
          </>
        )}
        {status === 'in_progress' && canUpdate && (
          <Button variant="primary" disabled={actionLoading} onClick={() => onComplete(evaluation)}>
            {t('evaluations.management.actions.complete')}
          </Button>
        )}
        {status === 'completed' && (
          <>
            {canReviewEvaluation ? (
              <>
                <Button variant="primary" disabled={actionLoading} onClick={() => onApprove(evaluation)}>
                  {t('evaluations.management.actions.approve')}
                </Button>
                <Button variant="danger" disabled={actionLoading} onClick={() => onReject(evaluation)}>
                  {t('evaluations.management.actions.reject')}
                </Button>
              </>
            ) : (
              <p className="evaluation-drawer__pending-note" role="status">
                {t('evaluations.management.drawer.awaitingSuperAdmin')}
              </p>
            )}
          </>
        )}
        {status === 'approved' && (
          <>
            <StatusPill
              label={t('evaluations.management.status.approved')}
              variant={getEvaluationStatusVariant('approved')}
            />
            {canCreateAuction && evaluation?.assetId && onCreateAuction && (
              <Button
                variant="primary"
                disabled={actionLoading}
                onClick={() => onCreateAuction(evaluation)}
              >
                {t('evaluations.management.actions.createAuction')}
              </Button>
            )}
          </>
        )}
        {status === 'rejected' && canUpdate && (
          <Button
            variant="secondary"
            disabled={actionLoading}
            onClick={() => onReschedule(evaluation, 'reschedule')}
          >
            {t('evaluations.management.actions.reSchedule')}
          </Button>
        )}
      </>
    ) : null;

  const sections = evaluation
    ? [
        {
          key: 'asset',
          title: t('evaluations.management.drawer.assetSection'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('evaluations.management.drawer.assetTitle')} value={evaluation.assetTitle} />
              <MetaField
                label={t('assets.table.headers.status')}
                value={t(
                  `assets.status.${String(evaluation.asset?.status || evaluation.assetDbStatus || 'approved').toLowerCase()}`,
                  { defaultValue: evaluation.assetStatus || 'Ready for Evaluation' },
                )}
              />
              <MetaField
                label={t('evaluations.management.drawer.assetType')}
                value={formatAssetCategory(t, evaluation.assetType)}
              />
              <MetaField
                label={t('evaluations.management.drawer.location')}
                value={evaluation.asset?.location}
              />
              <MetaField label={t('evaluations.management.drawer.ownerName')}>
                {evaluation.ownerUserId ? (
                  <Link to={`${ROUTES.APP_USERS}?userId=${evaluation.ownerUserId}`}>
                    {evaluation.ownerName}
                  </Link>
                ) : (
                  evaluation.ownerName
                )}
              </MetaField>
              <MetaField
                label={t('evaluations.management.drawer.conditionNotes')}
                value={evaluation.asset?.conditionNotes}
              />
              {evaluation.asset?.ownershipDocumentUrl && (
                <MetaField label={t('evaluations.management.drawer.ownershipDocument')}>
                  <a href={evaluation.asset.ownershipDocumentUrl} target="_blank" rel="noreferrer">
                    {t('evaluations.management.drawer.viewOwnershipDocument')}
                  </a>
                </MetaField>
              )}
            </dl>
          ),
        },
        {
          key: 'evaluation',
          title: t('evaluations.management.drawer.evaluationSection'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField
                label={t('evaluations.management.drawer.scheduledAt')}
                value={formatDate(evaluation.scheduledAt, locale)}
              />
              <MetaField
                label={t('evaluations.management.drawer.startedAt')}
                value={formatDate(evaluation.startedAt, locale)}
              />
              <MetaField
                label={t('evaluations.management.drawer.completedAt')}
                value={formatDate(evaluation.completedAt, locale)}
              />
              <MetaField label={t('evaluations.management.drawer.evaluator')} value={evaluation.evaluatorName} />
              {status !== 'rejected' && (
                <MetaField label={t('evaluations.management.drawer.notes')} value={evaluation.notes} />
              )}
            </dl>
          ),
        },
        ...(showValuationSection
          ? [
              {
                key: 'valuation',
                title: t('evaluations.management.drawer.valuationSection'),
                children: (
                  <dl className="admin-drawer__meta-grid">
                    <MetaField
                      label={t('evaluations.management.drawer.valuation')}
                      value={
                        evaluation.valuationAmount != null
                          ? formatEtbAmount(evaluation.valuationAmount)
                          : '—'
                      }
                    />
                    <MetaField
                      label={t('evaluations.management.drawer.reserveRecommendation')}
                      value={
                        evaluation.reservePriceRecommendation != null
                          ? formatEtbAmount(evaluation.reservePriceRecommendation)
                          : '—'
                      }
                    />
                    {evaluation.reportUrl && (
                      <MetaField label={t('evaluations.management.drawer.report')}>
                        <a href={evaluation.reportUrl} target="_blank" rel="noreferrer">
                          {t('evaluations.management.drawer.viewReport')}
                        </a>
                      </MetaField>
                    )}
                  </dl>
                ),
              },
            ]
          : []),
        ...(evaluation.photoUrls?.length
          ? [
              {
                key: 'photos',
                title: t('evaluations.management.drawer.photos'),
                children: (
                  <div className="admin-drawer__thumbnails">
                    {evaluation.photoUrls.map((url) => (
                      <button
                        key={url}
                        type="button"
                        className="admin-drawer__thumbnail-btn"
                        onClick={() => setViewerSrc(url)}
                      >
                        <img src={url} alt="" className="admin-drawer__thumbnail" />
                      </button>
                    ))}
                  </div>
                ),
              },
            ]
          : []),
        ...(showRejectionSection
          ? [
              {
                key: 'rejection',
                title: t('evaluations.management.drawer.rejectionSection'),
                children: (
                  <p className="evaluation-drawer__rejection-reason" role="status">
                    {evaluation.notes}
                  </p>
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onClose={onClose}
        title={evaluation?.assetTitle || t('evaluations.management.drawer.title')}
        status={
          evaluation ? (
            <StatusPill
              label={t(`evaluations.management.status.${evaluation.status}`, {
                defaultValue: evaluation.status,
              })}
              variant={getEvaluationStatusVariant(evaluation.status)}
            />
          ) : null
        }
        sections={sections}
        footer={footer}
        loading={loading}
        error={error}
        onRetry={loadDetail}
        width={480}
      />
      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </>
  );
}

export default EvaluationDetailDrawer;
