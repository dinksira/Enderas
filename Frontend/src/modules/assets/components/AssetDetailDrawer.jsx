import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { assetService } from '../services/asset-service.js';
import {
  formatReserveAmount,
  normalizeAssetDetail,
  normalizeAssetStatus,
} from '../utils/asset-form-utils.js';
import { formatDate } from '../../users/utils/user-management-utils.js';

function MetaField({ label, value, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children ?? value ?? '—'}</dd>
    </>
  );
}

function assetStatusVariant(status) {
  const key = normalizeAssetStatus(status);
  if (key === 'REJECTED') return 'rejected';
  if (['EVALUATED', 'IN_AUCTION', 'SOLD'].includes(key)) return 'active';
  if (['PENDING_REVIEW', 'UNDER_EVALUATION', 'APPROVED'].includes(key)) return 'pending';
  return 'default';
}

/**
 * @param {{ assetId: string|null, open: boolean, onClose: () => void }} props
 */
export function AssetDetailDrawer({ assetId, open, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDetail = async () => {
    if (!assetId) return;
    setLoading(true);
    setError('');
    try {
      const response = await assetService.getById(assetId);
      setAsset(normalizeAssetDetail(response?.asset ?? response));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assets.my.drawer.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !assetId) {
      setAsset(null);
      setError('');
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [open, assetId]);

  const displayStatus = normalizeAssetStatus(asset?.status);

  const sections = asset
    ? [
        {
          key: 'details',
          title: t('assets.my.drawer.detailsSection'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('assets.form.fields.title')} value={asset.title} />
              <MetaField
                label={t('assets.form.fields.assetType')}
                value={t(`assets.types.${asset.assetType}`, { defaultValue: asset.assetType })}
              />
              <MetaField label={t('assets.form.fields.location')} value={asset.location} />
              <MetaField
                label={t('assets.form.fields.desiredReservePrice')}
                value={formatReserveAmount(asset.desiredReservePrice)}
              />
              <MetaField
                label={t('assets.table.headers.submitted')}
                value={formatDate(asset.submittedAt, locale)}
              />
              <MetaField label={t('assets.form.fields.description')} value={asset.description} />
              <MetaField label={t('assets.form.fields.conditionNotes')} value={asset.conditionNotes} />
            </dl>
          ),
        },
        ...(asset.auctionId
          ? [
              {
                key: 'live-auction',
                title: t('assets.my.drawer.liveAuctionSection'),
                children: (
                  <p className="auction-participation__hint auction-participation__hint--next">
                    {t('assets.my.drawer.liveAuctionCopy')}{' '}
                    <Link to={ROUTES.MARKETPLACE}>{t('assets.my.drawer.viewLiveAuction')}</Link>
                  </p>
                ),
              },
            ]
          : []),
        ...(asset.rejectionReason
          ? [
              {
                key: 'rejection',
                title: t('assets.my.drawer.rejectionSection'),
                children: (
                  <p className="evaluation-drawer__rejection-reason" role="status">
                    {asset.rejectionReason}
                  </p>
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
      title={asset?.title || t('assets.my.drawer.title')}
      status={
        asset ? (
          <StatusPill
            label={t(`assets.status.${displayStatus.toLowerCase()}`, {
              defaultValue: displayStatus.replace(/_/g, ' '),
            })}
            variant={assetStatusVariant(asset.status)}
          />
        ) : null
      }
      sections={sections}
      loading={loading}
      error={error}
      onRetry={loadDetail}
      width={480}
    />
  );
}

export default AssetDetailDrawer;
