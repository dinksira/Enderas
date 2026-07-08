import { StatusPill, AdminDetailDrawer } from '@enderass/shared/ui-admin';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEtbAmount } from '@enderass/shared/utils';
import { bidService } from '@enderass/shared/services';
import { formatDate, getBidStatusVariant } from '../utils/bid-management-utils.js';

function MetaField({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  );
}

export function BidDetailDrawer({ bidId, open, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDetail = async () => {
    if (!bidId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await bidService.getBidById(bidId);
      setBid(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bids.myBids.drawer.loadFailed', { defaultValue: t('bids.management.drawer.loadFailed') }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !bidId) {
      setBid(null);
      setError('');
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [open, bidId]);

  const sections = bid
    ? [
        {
          key: 'bid',
          title: t('bids.myBids.drawer.section', { defaultValue: t('bids.management.drawer.bidSection') }),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('bids.management.drawer.auction')} value={bid.auctionTitle} />
              <MetaField label={t('bids.management.drawer.amount')} value={formatEtbAmount(bid.amount)} />
              <MetaField
                label={t('bids.management.drawer.submittedAt')}
                value={formatDate(bid.submittedAt, locale)}
              />
              <MetaField
                label={t('bids.management.drawer.isValid')}
                value={bid.isValid ? t('bids.management.drawer.valid') : t('bids.management.drawer.invalid')}
              />
              {bid.invalidReason && (
                <MetaField label={t('bids.management.drawer.invalidReason')} value={bid.invalidReason} />
              )}
            </dl>
          ),
        },
      ]
    : [];

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      title={bid?.auctionTitle || t('bids.myBids.drawer.title', { defaultValue: t('bids.management.drawer.title') })}
      subtitle={bid ? formatEtbAmount(bid.amount) : undefined}
      status={
        bid ? (
          <StatusPill
            label={t(`bids.management.status.${bid.status}`, { defaultValue: bid.status })}
            variant={getBidStatusVariant(bid.status)}
          />
        ) : null
      }
      sections={sections}
      loading={loading}
      error={error}
      onRetry={loadDetail}
    />
  );
}

export default BidDetailDrawer;
