import { StatusPill, AdminDetailDrawer } from '@enderass/shared/ui-admin';
import { Button } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { cpoService } from '@enderass/shared/services';
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
  onProcessRefund,
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
  const canRefund = cpo?.refundStatus === 'pending' && can(MODULES.CPO, ACTIONS.UPDATE);

  const footer =
    !loading && !error && cpo ? (
      <>
        {isPending && canApprove && (
          <Button variant="primary" disabled={actionLoading} onClick={() => onApprove(cpo)}>
            {t('cpo.management.drawer.approve')}
          </Button>
        )}
        {isPending && canReject && (
          <Button variant="secondary" disabled={actionLoading} onClick={() => onReject(cpo)}>
            {t('cpo.management.drawer.reject')}
          </Button>
        )}
        {canRefund && onProcessRefund && (
          <Button variant="secondary" disabled={actionLoading} onClick={() => onProcessRefund(cpo)}>
            {t('cpo.management.drawer.processRefund', { defaultValue: 'Process Refund' })}
          </Button>
        )}
        <Button variant="secondary" onClick={onRefresh}>
          {t('cpo.management.drawer.refresh')}
        </Button>
      </>
    ) : null;

  const backingInfo =
    cpo?.depositAmount != null && cpo?.proposedBids?.length > 0 ? (
      <div className="admin-drawer__info-box" style={{ background: '#f0f7ff', border: '1px solid #b3d4ff', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          {t('cpo.management.drawer.backingInfo', 'This CPO deposit is backing a bid of {{amount}} ETB for {{count}} asset(s).', {
            amount: Number(cpo.depositAmount).toLocaleString(),
            count: cpo.proposedBids.length,
          })}
        </p>
        {cpo.proposedBids.slice(0, 3).map((bid, i) => (
          <p key={i} style={{ margin: '4px 0 0 16px', fontSize: 13, color: '#555' }}>
            • {bid.auctionAssetId ? `${t('cpo.management.drawer.assetId', 'Asset')}: ${bid.auctionAssetId}` : ''}
            {bid.amount ? ` — ${Number(bid.amount).toLocaleString()} ETB` : ''}
            {bid.lotTitle ? ` (${bid.lotTitle})` : ''}
          </p>
        ))}
        {cpo.proposedBids.length > 3 && (
          <p style={{ margin: '4px 0 0 16px', fontSize: 13, color: '#888' }}>
            {t('cpo.management.drawer.moreBids', '+{{n}} more', { n: cpo.proposedBids.length - 3 })}
          </p>
        )}
      </div>
    ) : null;

  const sections = cpo
    ? [
        {
          key: 'cpo',
          title: t('cpo.management.drawer.cpoSection'),
          children: (
            <>
              {backingInfo}
              <dl className="admin-drawer__meta-grid">
              <MetaField label={t('cpo.management.drawer.bidder')} value={cpo.bidderName} />
              <MetaField label={t('cpo.management.drawer.auction')} value={cpo.auctionTitle} />
              <MetaField
                label={t('cpo.management.drawer.depositAmount', { defaultValue: 'Deposit' })}
                value={cpo.depositAmount != null ? `${Number(cpo.depositAmount).toLocaleString()} ETB` : '—'}
              />
              <MetaField
                label={t('cpo.management.drawer.refundStatus', { defaultValue: 'Refund' })}
                value={cpo.refundStatus || 'none'}
              />
              {cpo.refundProcessedAt && (
                <MetaField
                  label={t('cpo.management.drawer.refundProcessedAt', { defaultValue: 'Refund Processed' })}
                  value={formatDate(cpo.refundProcessedAt, locale)}
                />
              )}
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
            </>
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
