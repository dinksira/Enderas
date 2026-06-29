import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth-store.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuctions } from '../../auctions/hooks/use-auctions.js';
import { CreateAuctionModal } from '../../auctions/components/CreateAuctionModal.jsx';
import { AuctionDetailDrawer } from '../../auctions/components/AuctionDetailDrawer.jsx';
import { AuctionSuspendConfirmModal } from '../../auctions/components/AuctionSuspendConfirmModal.jsx';
import { AuctionDeleteConfirmModal } from '../../auctions/components/AuctionDeleteConfirmModal.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { auctionService } from '../../auctions/services/auction-service.js';
import { normalizeAuctionStatus, statusPillClass } from '../../auctions/utils/auction-drawer-utils.js';

const FILTER_KEYS = ['all', 'active', 'pending', 'closed', 'suspended'];

const TABLE_HEADER_KEYS = [
  'auction_title',
  'category',
  'status',
  'starting_date',
  'ending_date',
  'bids',
  'reserve_etb',
  'actions',
];

const FILTER_STATUS_MAP = Object.freeze({
  active: 'ACTIVE',
  pending: 'PENDING',
  closed: 'CLOSED',
  suspended: 'SUSPENDED',
});

function toCategoryKey(value) {
  return String(value || 'other_assets')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function mapRecord(record) {
  const rawCategory = record.categoryKey ?? record.category ?? 'other_assets';

  return {
    id: record.id,
    title: record.title ?? 'Untitled Auction',
    categoryKey: toCategoryKey(rawCategory),
    status: normalizeAuctionStatus(record.status),
    startingDate: record.startingDate ?? '—',
    endingDate: record.endingDate ?? '—',
    bids: record.bids ?? record.bidCount ?? 0,
    reserve: record.reserve ?? record.reservePrice ?? 0,
  };
}

function formatReserve(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-ET').format(amount);
}

export function SuperAdminDashboardView() {
  const { t } = useTranslation();
  const canCreate = useAuthStore((state) => state.can(MODULES.AUCTIONS, ACTIONS.CREATE));

  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const apiStatus = activeFilter === 'all' ? undefined : FILTER_STATUS_MAP[activeFilter];
  const { records, loading, error, refetch } = useAuctions({
    status: apiStatus,
    search: search.trim() || undefined,
  });

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('auctions.management.searchPlaceholder'),
  });

  const normalizedRecords = useMemo(() => records.map(mapRecord), [records]);

  const filteredRecords = useMemo(() => {
    return normalizedRecords.filter((record) => {
      return activeFilter === 'all' || record.status === activeFilter.toUpperCase();
    });
  }, [normalizedRecords, activeFilter]);

  const handleCreateSuccess = (auction) => {
    setToast({
      open: true,
      message: t('auctions.create.success'),
      variant: 'success',
    });
    refetch();
    setCreateModalOpen(false);
    if (auction?.id) {
      setSelectedAuctionId(auction.id);
      setDrawerOpen(true);
    }
  };

  const handleRowClick = (record) => {
    setSelectedAuctionId(record.id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedAuctionId(null);
  };

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const openSuspendModal = (event, record) => {
    event.stopPropagation();
    setModalError('');
    setSuspendTarget(record);
  };

  const openDeleteModal = (event, record) => {
    event.stopPropagation();
    setModalError('');
    setDeleteTarget(record);
  };

  const closeSuspendModal = () => {
    if (actionLoading) return;
    setSuspendTarget(null);
    setModalError('');
  };

  const closeDeleteModal = () => {
    if (actionLoading) return;
    setDeleteTarget(null);
    setModalError('');
  };

  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;

    setActionLoading(true);
    setModalError('');

    try {
      await auctionService.suspend(suspendTarget.id);
      setSuspendTarget(null);
      showToast(t('auctions.drawer.suspendSuccess'), 'success');
      refetch();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : t('auctions.confirmModals.actionFailed'),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setActionLoading(true);
    setModalError('');

    try {
      await auctionService.remove(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t('auctions.drawer.deleteSuccess'), 'success');
      refetch();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : t('auctions.confirmModals.actionFailed'),
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <section className="dashboard-filters" aria-label={t('dashboard.a11y.auction_filters')}>
        <div className="dashboard-filters__tabs" role="tablist" aria-label={t('dashboard.a11y.status_filters')}>
          {FILTER_KEYS.map((filterKey) => {
            const isActive = activeFilter === filterKey;
            return (
              <button
                key={filterKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'dashboard-filters__tab',
                  isActive ? 'dashboard-filters__tab--active' : '',
                  filterKey !== 'all' ? 'dashboard-filters__tab--uppercase' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setActiveFilter(filterKey)}
              >
                {t(`dashboard.filters.${filterKey}`)}
              </button>
            );
          })}
        </div>
        {canCreate && (
          <button
            type="button"
            className="dashboard-filters__cta"
            onClick={() => setCreateModalOpen(true)}
          >
            {t('dashboard.buttons.create_auction')}
          </button>
        )}
      </section>

      <section className="dashboard-table-panel" aria-live="polite">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                {TABLE_HEADER_KEYS.map((headerKey) => (
                  <th key={headerKey} scope="col" className="dashboard-table__head-cell">
                    {t(`dashboard.table.headers.${headerKey}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty">
                    {t('dashboard.table.loading')}
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={TABLE_HEADER_KEYS.length}
                    className="dashboard-table__empty"
                    role="alert"
                  >
                    {t('dashboard.table.error', { message: error })}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty">
                    {t('dashboard.table.no_results')}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="dashboard-table__row dashboard-table__row--clickable"
                    onClick={() => handleRowClick(record)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleRowClick(record);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={t('auctions.drawer.openRow', { title: record.title })}
                  >
                    <td className="dashboard-table__cell dashboard-table__cell--strong">
                      {record.title}
                    </td>
                    <td className="dashboard-table__cell dashboard-table__cell--muted">
                      {t(`category.${record.categoryKey}`, { defaultValue: record.categoryKey })}
                    </td>
                    <td className="dashboard-table__cell">
                      <span
                        className={`dashboard-status-pill ${statusPillClass(record.status)}`}
                      >
                        {t(`status.${record.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="dashboard-table__cell">{record.startingDate}</td>
                    <td className="dashboard-table__cell">{record.endingDate}</td>
                    <td className="dashboard-table__cell dashboard-table__cell--strong">
                      {record.bids}
                    </td>
                    <td className="dashboard-table__cell dashboard-table__cell--strong">
                      {formatReserve(record.reserve)}
                    </td>
                    <td className="dashboard-table__cell">
                      <div
                        className="dashboard-actions"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="dashboard-actions__btn"
                          aria-label={t('dashboard.actions.pause', { title: record.title })}
                          onClick={(event) => openSuspendModal(event, record)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M9 7h2v10H9V7zm4 0h2v10h-2V7z" fill="currentColor" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="dashboard-actions__btn dashboard-actions__btn--danger"
                          aria-label={t('dashboard.actions.delete', { title: record.title })}
                          onClick={(event) => openDeleteModal(event, record)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="dashboard-table__footer">
            {t('dashboard.table.footer_displayed', { count: filteredRecords.length })}
            {records.length > 0
              ? t('dashboard.table.footer_total_loaded', { count: records.length })
              : ''}
          </div>
        )}
      </section>

      <CreateAuctionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <AuctionDetailDrawer
        auctionId={selectedAuctionId}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onRefresh={refetch}
        onToast={showToast}
      />

      <AuctionSuspendConfirmModal
        open={Boolean(suspendTarget)}
        loading={actionLoading}
        error={modalError}
        auctionTitle={suspendTarget?.title ?? ''}
        onConfirm={handleSuspendConfirm}
        onCancel={closeSuspendModal}
      />

      <AuctionDeleteConfirmModal
        open={Boolean(deleteTarget)}
        loading={actionLoading}
        error={modalError}
        auctionTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteModal}
      />

      <DashboardToast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </>
  );
}

export default SuperAdminDashboardView;

