import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { formatEtbAmount } from '../../auctions/utils/auction-drawer-utils.js';
import { winnerService } from '../services/winner-service.js';
import { formatDate, getWinnerStatusVariant } from '../utils/winner-management-utils.js';

function MetaField({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  );
}

export function WinnerDetailDrawer({
  winnerId,
  open,
  actionLoading = false,
  onClose,
  onConfirm,
  onDecline,
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);

  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDetail = async () => {
    if (!winnerId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await winnerService.getWinnerById(winnerId);
      setWinner(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('winners.management.drawer.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !winnerId) {
      setWinner(null);
      setError('');
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [open, winnerId]);

  const canUpdate = can(MODULES.WINNERS, ACTIONS.UPDATE);
  const status = winner?.status;

  const footer =
    !loading && !error && winner && canUpdate ? (
      <>
        {status === 'pending_confirmation' && (
          <>
            <Button variant="primary" disabled={actionLoading} onClick={() => onConfirm(winner)}>
              {t('winners.management.drawer.confirm')}
            </Button>
            <Button variant="secondary" disabled={actionLoading} onClick={() => onDecline(winner)}>
              {t('winners.management.drawer.decline')}
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={onRefresh}>
          {t('winners.management.drawer.refresh')}
        </Button>
      </>
    ) : null;

  const sections = winner
    ? [
        {
          key: 'winner',
          title: t('winners.management.drawer.winnerSection'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('winners.management.drawer.auction')} value={winner.auctionTitle} />
              <MetaField label={t('winners.management.drawer.winner')} value={winner.winnerName} />
              <MetaField
                label={t('winners.management.drawer.bidAmount')}
                value={winner.bidAmount != null ? formatEtbAmount(winner.bidAmount) : '—'}
              />
              <MetaField
                label={t('winners.management.drawer.selectedAt')}
                value={formatDate(winner.selectedAt, locale)}
              />
              <MetaField label={t('winners.management.drawer.selectedBy')} value={winner.selectedByName} />
              {winner.declineReason && (
                <MetaField
                  label={t('winners.management.drawer.declineReason')}
                  value={winner.declineReason}
                />
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
      title={winner?.winnerName || t('winners.management.drawer.title')}
      subtitle={winner?.auctionTitle}
      status={
        winner ? (
          <StatusPill
            label={t(`winners.management.status.${winner.status}`, { defaultValue: winner.status })}
            variant={getWinnerStatusVariant(winner.status)}
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

export default WinnerDetailDrawer;
