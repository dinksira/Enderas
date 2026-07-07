import { Button, DashboardToast } from '@enderass/shared/ui';
import { AdminDataTable, StatusPill, ApproveConfirmModal, RejectReasonModal } from '@enderass/shared/ui-admin';
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { SelectReplacementModal } from '../components/SelectReplacementModal.jsx';
import { SelectWinnerModal } from '../components/SelectWinnerModal.jsx';
import { WinnerDetailDrawer } from '../components/WinnerDetailDrawer.jsx';
import { useWinners } from '../hooks/use-winners.js';
import { winnerService, auctionService } from '@enderass/shared/services';
import {
  formatDate,
  formatWinnerAmount,
  getWinnerStatusVariant,
  WINNER_PAGE_SIZE,
  WINNER_TAB_KEYS,
  WINNER_TABLE_COLUMNS,
} from '../utils/winner-management-utils.js';

function ViewActionButton({ label, onClick }) {
  return (
    <button type="button" className="dashboard-actions__btn" aria-label={label} onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}

function LotAccordion({ lotTitle, assets, formatWinnerAmount, roleCode, t, locale, onViewWinner }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="winner-lot-accordion">
      <button type="button" className="winner-lot-accordion__header" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
        <span className="winner-lot-accordion__title">{lotTitle}</span>
        <span className="winner-lot-accordion__toggle">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <table className="dashboard-table winner-lot-accordion__table">
          <thead>
            <tr>
              <th>{t('winners.management.table.headers.asset', 'Asset')}</th>
              <th>{t('winners.management.table.headers.winner')}</th>
              <th>{t('winners.management.table.headers.bidAmount', 'Bid Amount')}</th>
              <th>{t('winners.management.table.headers.status')}</th>
              <th>{t('winners.management.table.headers.selectedAt', 'Selected')}</th>
              <th>{t('winners.management.table.headers.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((row) => (
              <tr key={row.id || row.assetId} className="dashboard-table__row" onClick={() => onViewWinner?.(row)}>
                <td className="dashboard-table__cell">{row.assetTitle || row.assetName || '—'}</td>
                <td className="dashboard-table__cell dashboard-table__cell--strong">{row.winnerName || '—'}</td>
                <td className="dashboard-table__cell">{formatWinnerAmount(row.bidAmount, roleCode, t)}</td>
                <td className="dashboard-table__cell">
                  <StatusPill label={t(`winners.management.status.${row.status}`, { defaultValue: row.status })} variant={getWinnerStatusVariant(row.status)} />
                </td>
                <td className="dashboard-table__cell">{formatDate(row.selectedAt, locale)}</td>
                <td className="dashboard-table__cell">
                  <ViewActionButton label={t('winners.management.viewAction')} onClick={(e) => { e.stopPropagation(); onViewWinner?.(row); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function WinnerManagementView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';
  const can = useAuthStore((state) => state.can);
  const roleCode = useAuthStore((state) => state.permissions?.roleCode ?? state.user?.roleCode);

  const {
    activeTab,
    setActiveTab,
    page,
    search,
    setSearch,
    items: winners,
    pagination,
    stats,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useWinners();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('winners.management.searchPlaceholder'),
  });

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });
  const [viewMode, setViewMode] = useState('flat');
  const [groupedWinners, setGroupedWinners] = useState([]);
  const [groupedAuctionId, setGroupedAuctionId] = useState('');
  const [closedAuctions, setClosedAuctions] = useState([]);

  const canCreate = can(MODULES.WINNERS, ACTIONS.CREATE);

  const tabs = useMemo(
    () => [
      ...WINNER_TAB_KEYS.map((tabKey) => ({
        key: tabKey,
        label: t(`winners.management.tabs.${tabKey}`),
        count: tabKey === 'all' ? undefined : stats?.[tabKey],
        uppercase: tabKey !== 'all',
      })),
      {
        key: 'grouped',
        label: t('winners.management.tabs.grouped', 'Grouped by Lot'),
        uppercase: true,
      },
    ],
    [stats, t],
  );

  const handleTabChange = (key) => {
    if (key === 'grouped') {
      setViewMode('grouped');
      setActiveTab('all');
    } else {
      setViewMode('flat');
      setActiveTab(key);
    }
  };

  useEffect(() => {
    if (viewMode === 'grouped') {
      auctionService
        .getAll({ limit: 100 })
        .then((response) => {
          const list = response?.auctions ?? response?.items ?? [];
          setClosedAuctions(Array.isArray(list) ? list : []);
          if (list.length > 0 && !groupedAuctionId) {
            setGroupedAuctionId(list[0].id);
          }
        })
        .catch(() => setClosedAuctions([]));
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'grouped' || !groupedAuctionId) {
      setGroupedWinners([]);
      return;
    }
    (async () => {
      try {
        const grouped = await winnerService.getWinnersForAuctionGrouped(groupedAuctionId);
        setGroupedWinners(Array.isArray(grouped) ? grouped : []);
      } catch { setGroupedWinners([]); }
    })();
  }, [viewMode, groupedAuctionId]);

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
  };

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const handleSelectWinner = async (payload) => {
    setActionLoading(true);
    try {
      await winnerService.selectWinner(payload);
      setSelectOpen(false);
      await refetch();
      showToast(t('winners.management.selectModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('winners.management.selectModal.failed'), 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceWinner = async (bidId) => {
    if (!replaceTarget) return;
    setActionLoading(true);
    try {
      const created = await winnerService.replaceWinner(replaceTarget.id, bidId);
      setReplaceTarget(null);
      setSelectedId(created?.id ?? null);
      setDrawerOpen(Boolean(created?.id));
      await refetch();
      showToast(t('winners.management.replaceModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('winners.management.replaceModal.failed'), 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmWinner = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      await winnerService.confirmWinner(confirmTarget.id);
      setConfirmTarget(null);
      closeDrawer();
      await refetch();
      showToast(t('winners.management.confirmModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('winners.management.confirmModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineConfirm = async (declineReason) => {
    if (!declineTarget) return;
    setActionLoading(true);
    try {
      await winnerService.declineWinner(declineTarget.id, declineReason);
      setDeclineTarget(null);
      closeDrawer();
      await refetch();
      showToast(t('winners.management.declineModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('winners.management.declineModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const footerSummary = t('winners.management.table.footer', {
    from: winners.length === 0 ? 0 : (page - 1) * WINNER_PAGE_SIZE + 1,
    to: (page - 1) * WINNER_PAGE_SIZE + winners.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      {canCreate && viewMode !== 'grouped' && (
        <header className="kyc-management-page__header">
          <Button variant="primary" onClick={() => setSelectOpen(true)}>
            {t('winners.management.selectWinner')}
          </Button>
        </header>
      )}

      {viewMode === 'grouped' ? (
        <>
          <div className="kyc-management-page__tabs" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button type="button" className="kyc-modal__step kyc-modal__step--done" onClick={() => { setViewMode('flat'); setActiveTab('all'); }}>
              {t('winners.management.tabs.grouped', 'Grouped by Lot')}
            </button>
            <select
              className="input-field__control"
              style={{ maxWidth: '300px', margin: 0 }}
              value={groupedAuctionId}
              onChange={(e) => setGroupedAuctionId(e.target.value)}
            >
              <option value="">{t('winners.management.selectAuction', 'Select Auction')}</option>
              {closedAuctions.map(a => (
                <option key={a.id} value={a.id}>{a.title || a.id}</option>
              ))}
            </select>
          </div>
          <div className="winner-lot-accordions">
            {groupedWinners.length === 0 && !loading && (
              <p className="kyc-modal__hint">{t('winners.management.empty')}</p>
            )}
            {groupedWinners.map((group) => (
              <LotAccordion
                key={group.lotId || group.lotTitle}
                lotTitle={group.lotTitle || t('winners.management.uncategorized', 'Uncategorized')}
                assets={group.assets ?? group.winners ?? []}
                formatWinnerAmount={formatWinnerAmount}
                roleCode={roleCode}
                t={t}
                locale={locale}
                onViewWinner={(row) => openDrawer(row.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <AdminDataTable
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          loading={loading}
          error={error}
          onRetry={refetch}
          columns={WINNER_TABLE_COLUMNS}
          getColumnLabel={(key) => t(`winners.management.table.headers.${key}`)}
          emptyMessage={t('winners.management.empty')}
          footerSummary={footerSummary}
          page={page}
          pages={pagination.pages || 1}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
        >
          {winners.map((row) => (
            <tr
              key={row.id}
              className="dashboard-table__row kyc-management-page__row"
              onClick={() => openDrawer(row.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDrawer(row.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={t('winners.management.openDetail', { name: row.winnerName })}
            >
              <td className="dashboard-table__cell dashboard-table__cell--strong">
                {row.auctionId ? (
                  <Link to={ROUTES.APP_AUCTIONS} onClick={(event) => event.stopPropagation()}>
                    {row.auctionTitle || '—'}
                  </Link>
                ) : (
                  row.auctionTitle || '—'
                )}
              </td>
              <td className="dashboard-table__cell">{row.auctionCategory || '—'}</td>
              <td className="dashboard-table__cell">{row.winnerName || '—'}</td>
              <td className="dashboard-table__cell dashboard-table__cell--muted">{row.winnerMobile || '—'}</td>
              <td className="dashboard-table__cell">{formatWinnerAmount(row.bidAmount, roleCode, t)}</td>
              <td className="dashboard-table__cell">{formatDate(row.selectedAt, locale)}</td>
              <td className="dashboard-table__cell">
                <StatusPill label={t(`winners.management.status.${row.status}`, { defaultValue: row.status })} variant={getWinnerStatusVariant(row.status)} />
              </td>
              <td className="dashboard-table__cell">
                <div className="dashboard-actions">
                  <ViewActionButton label={t('winners.management.viewAction')} onClick={(event) => { event.stopPropagation(); openDrawer(row.id); }} />
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      )}

      <WinnerDetailDrawer
        winnerId={selectedId}
        open={drawerOpen}
        actionLoading={actionLoading}
        onClose={closeDrawer}
        onConfirm={(winner) => setConfirmTarget(winner)}
        onDecline={(winner) => setDeclineTarget(winner)}
        onReplace={(winner) => setReplaceTarget(winner)}
        onRefresh={refetch}
      />

      <SelectWinnerModal open={selectOpen} loading={actionLoading} onClose={() => setSelectOpen(false)} onSubmit={handleSelectWinner} />
      <SelectReplacementModal open={Boolean(replaceTarget)} loading={actionLoading} winner={replaceTarget} onClose={() => setReplaceTarget(null)} onSubmit={handleReplaceWinner} />

      <ApproveConfirmModal
        open={Boolean(confirmTarget)}
        title={t('winners.management.confirmModal.title')}
        body={t('winners.management.confirmModal.body', { name: confirmTarget?.winnerName, auction: confirmTarget?.auctionTitle })}
        confirmLabel={t('winners.management.confirmModal.confirm')}
        loading={actionLoading}
        onConfirm={handleConfirmWinner}
        onCancel={() => setConfirmTarget(null)}
      />

      <RejectReasonModal
        open={Boolean(declineTarget)}
        title={t('winners.management.declineModal.title')}
        body={t('winners.management.declineModal.body')}
        reasonLabel={t('winners.management.declineModal.reasonLabel')}
        confirmLabel={t('winners.management.declineModal.confirm')}
        loading={actionLoading}
        onConfirm={handleDeclineConfirm}
        onCancel={() => setDeclineTarget(null)}
      />

      <DashboardToast open={toast.open} message={toast.message} variant={toast.variant} onClose={() => setToast((current) => ({ ...current, open: false }))} />
    </div>
  );
}

export default WinnerManagementView;
