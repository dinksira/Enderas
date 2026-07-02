import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { cpoService } from '../services/cpo-service.js';
import { formatDate, getCpoStatusVariant } from '../utils/cpo-management-utils.js';

function MetaField({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  );
}

export function CpoDetailDrawer({
  cpoId,
  open,
  actionLoading = false,
  onClose,
  onApprove,
  onReject,
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);

  const [cpo, setCpo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDetail = async () => {
    if (!cpoId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await cpoService.getCpoById(cpoId);
      setCpo(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cpo.management.drawer.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !cpoId) {
      setCpo(null);
      setError('');
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [open, cpoId]);

  const canApprove = can(MODULES.CPO, ACTIONS.APPROVE);
  const canReject = can(MODULES.CPO, ACTIONS.REJECT);
  const isPending = cpo?.status === 'pending';

  const footer =
    !loading && !error && cpo && isPending && (canApprove || canReject) ? (
      <>
        {canApprove && (
          <Button variant="primary" disabled={actionLoading} onClick={() => onApprove(cpo)}>
            {t('cpo.management.drawer.approve')}
          </Button>
        )}
        {canReject && (
          <Button variant="secondary" disabled={actionLoading} onClick={() => onReject(cpo)}>
            {t('cpo.management.drawer.reject')}
          </Button>
        )}
        <Button variant="secondary" onClick={onRefresh}>
          {t('cpo.management.drawer.refresh')}
        </Button>
      </>
    ) : null;

  const sections = cpo
    ? [
        {
          key: 'cpo',
          title: t('cpo.management.drawer.cpoSection'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('cpo.management.drawer.bidder')} value={cpo.bidderName} />
              <MetaField label={t('cpo.management.drawer.auction')} value={cpo.auctionTitle} />
              <MetaField
                label={t('cpo.management.drawer.expiryDate')}
                value={formatDate(cpo.expiryDate, locale)}
              />
              <MetaField
                label={t('cpo.management.drawer.reviewedBy')}
                value={cpo.reviewedByName}
              />
              <MetaField
                label={t('cpo.management.drawer.reviewedAt')}
                value={formatDate(cpo.reviewedAt, locale)}
              />
              {cpo.rejectionReason && (
                <MetaField
                  label={t('cpo.management.drawer.rejectionReason')}
                  value={cpo.rejectionReason}
                />
              )}
            </dl>
          ),
        },
        ...(cpo.documentUrl
          ? [
              {
                key: 'document',
                title: t('cpo.management.drawer.document'),
                children: (
                  <a href={cpo.documentUrl} target="_blank" rel="noreferrer">
                    {t('cpo.management.drawer.viewDocument')}
                  </a>
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      title={cpo?.bidderName || t('cpo.management.drawer.title')}
      subtitle={cpo?.auctionTitle}
      status={
        cpo ? (
          <StatusPill
            label={t(`cpo.management.status.${cpo.status}`, { defaultValue: cpo.status })}
            variant={getCpoStatusVariant(cpo.status)}
          />
        ) : null
      }
      sections={sections}
      footer={footer}
      loading={loading}
      error={error}
      onRetry={loadDetail}
    />
  );
}

export default CpoDetailDrawer;
