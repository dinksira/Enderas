import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { ROUTES } from '../../../config/routes.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { formatEtbAmount } from '../../auctions/utils/auction-drawer-utils.js';
import { winnerService } from '../services/winner-service.js';
import {
  canViewBidAmounts,
  formatDate,
  formatWinnerAmount,
  getWinnerStatusVariant,
} from '../utils/winner-management-utils.js';

function MetaField({ label, value, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children ?? value ?? '—'}</dd>
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
  onReplace,
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);
  const roleCode = useAuthStore((state) => state.permissions?.roleCode ?? state.user?.roleCode);
  const canViewAmounts = canViewBidAmounts(roleCode);

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
        {status === 'confirmed' && (
          <Button variant="secondary" disabled={actionLoading} onClick={() => onDecline(winner)}>
            {t('winners.management.drawer.decline')}
          </Button>
        )}
        {status === 'declined' && (
          <Button variant="primary" disabled={actionLoading} onClick={() => onReplace(winner)}>
            {t('winners.management.drawer.selectReplacement')}
          </Button>
        )}
        <Button variant="secondary" onClick={onRefresh}>
          {t('winners.management.drawer.refresh')}
        </Button>
      </>
    ) : null;

  const sections = winner
    ? [
        {
          key: 'auction',
          title: t('winners.management.auctionSection.title'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('winners.management.auctionSection.auctionTitle')}>
                {winner.auction?.id ? (
                  <Link to={ROUTES.APP_AUCTIONS}>{winner.auction.title}</Link>
                ) : (
                  winner.auctionTitle
                )}
              </MetaField>
              <MetaField
                label={t('winners.management.auctionSection.category')}
                value={winner.auction?.category || winner.auctionCategory}
              />
              <MetaField
                label={t('winners.management.auctionSection.closingDate')}
                value={formatDate(winner.auction?.endDate, locale)}
              />
              <MetaField
                label={t('winners.management.auctionSection.reservePrice')}
                value={
                  winner.auction?.reservePrice != null
                    ? formatEtbAmount(winner.auction.reservePrice)
                    : '—'
                }
              />
            </dl>
          ),
        },
        {
          key: 'winner-info',
          title: t('winners.management.winnerSection.title'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField
                label={t('winners.management.winnerSection.fullName')}
                value={winner.winner?.name || winner.winnerName}
              />
              <MetaField
                label={t('winners.management.winnerSection.mobile')}
                value={winner.winner?.mobileNumber || winner.winnerMobile}
              />
              <MetaField
                label={t('winners.management.winnerSection.userType')}
                value={winner.winner?.userType}
              />
              {winner.winner?.organizationName && (
                <MetaField
                  label={t('winners.management.winnerSection.organization')}
                  value={winner.winner.organizationName}
                />
              )}
            </dl>
          ),
        },
        {
          key: 'bid',
          title: t('winners.management.bidSection.title'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('winners.management.bidSection.amount')}>
                {canViewAmounts ? (
                  formatWinnerAmount(winner.bidAmount, roleCode, t)
                ) : (
                  <span className="winner-amount-restricted">
                    {t('winners.management.bidSection.restricted')}
                  </span>
                )}
              </MetaField>
              <MetaField
                label={t('winners.management.bidSection.submittedAt')}
                value={formatDate(winner.bid?.submittedAt, locale)}
              />
              <MetaField
                label={t('winners.management.bidSection.validationStatus')}
                value={
                  winner.bid?.isValid
                    ? t('winners.management.bidSection.valid')
                    : t('winners.management.bidSection.invalid')
                }
              />
            </dl>
          ),
        },
        {
          key: 'selection',
          title: t('winners.management.drawer.selectionSection'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField
                label={t('winners.management.drawer.selectedBy')}
                value={winner.selectedByName}
              />
              <MetaField
                label={t('winners.management.drawer.selectedAt')}
                value={formatDate(winner.selectedAt, locale)}
              />
              <MetaField
                label={t('winners.management.drawer.selectionMethod')}
                value={t(
                  `winners.management.drawer.selectionMethodValues.${winner.selectionMethod || 'manual'}`,
                )}
              />
              <MetaField
                label={t('winners.management.drawer.notificationSentAt')}
                value={formatDate(winner.notificationSentAt, locale)}
              />
            </dl>
          ),
        },
        ...(canViewAmounts && winner.bidSummary
          ? [
              {
                key: 'bid-history',
                title: t('winners.management.bidSection.historyTitle'),
                children: (
                  <dl className="admin-drawer__meta-grid">
                    <MetaField
                      label={t('winners.management.bidSection.totalValidBids')}
                      value={String(winner.bidSummary.totalValidBids ?? 0)}
                    />
                    <MetaField
                      label={t('winners.management.bidSection.secondHighest')}
                      value={
                        winner.bidSummary.secondHighestBidAmount != null
                          ? formatEtbAmount(winner.bidSummary.secondHighestBidAmount)
                          : '—'
                      }
                    />
                  </dl>
                ),
              },
            ]
          : []),
        ...(winner.status === 'declined'
          ? [
              {
                key: 'decline',
                title: t('winners.management.drawer.declineSection'),
                children: (
                  <div className="asset-page__rejection-reason" role="status">
                    <p>{winner.declineReason}</p>
                    <p className="auction-participation__hint">
                      {t('winners.management.drawer.declinedAt', {
                        date: formatDate(winner.declinedAt, locale),
                      })}
                    </p>
                  </div>
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
      title={t('winners.management.drawer.title')}
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
      width={480}
    />
  );
}

export default WinnerDetailDrawer;
