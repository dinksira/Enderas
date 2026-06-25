import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth-store.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { assetService } from '../services/asset-service.js';
import { useAssets } from '../hooks/use-assets.js';
import { normalizeAssetStatus, resolveApiStatus, statusPillClass } from '../utils/asset-form-utils.js';
import { AssetRequestDetailDrawer } from '../components/AssetRequestDetailDrawer.jsx';
import { AssetApproveConfirmModal } from '../components/AssetApproveConfirmModal.jsx';
import { AssetRejectModal } from '../components/AssetRejectModal.jsx';

const STATUS_FILTERS = ['all', 'pending_review', 'under_evaluation', 'approved', 'rejected'];

const TABLE_HEADER_KEYS = [
  'request_id',
  'asset',
  'category',
  'owner',
  'submitted_date',
  'status',
  'actions',
];

export function AssetRequestsView() {
  const { t } = useTranslation();
  const can = useAuthStore((state) => state.can);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const apiStatus = resolveApiStatus(activeFilter);
  const { records, stats, loading, error, refetch } = useAssets({
    status: apiStatus,
    search: searchQuery.trim() || undefined,
    includeStats: true,
  });

  useRegisterPageSearch({
    value: searchQuery,
    onChange: setSearchQuery,
    placeholder: t('assets.review.searchPlaceholder'),
  });

  const canApprove = can(MODULES.ASSETS, ACTIONS.APPROVE);
  const canReject = can(MODULES.ASSETS, ACTIONS.REJECT);

  const countByStatus = useMemo(() => {
    if (!stats) {
      return STATUS_FILTERS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    }
    return {
      all: records.length,
      pending_review: stats.pending_review ?? 0,
      under_evaluation: stats.under_evaluation ?? 0,
      approved: stats.approved ?? 0,
      rejected: stats.rejected ?? 0,
    };
  }, [stats, records.length]);

  const openDrawer = (record, event) => {
    event?.stopPropagation?.();
    setSelectedAssetId(record.id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedAssetId(null);
  };

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;

    setActionLoading(true);
    setModalError('');

    try {
      await assetService.approve(approveTarget.id);
      setApproveTarget(null);
      closeDrawer();
      refetch();
      showToast(t('assets.review.approveSuccess'), 'success');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : t('assets.review.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (rejectionReason) => {
    if (!rejectTarget) return;

    setActionLoading(true);
    setModalError('');

    try {
      await assetService.reject(rejectTarget.id, rejectionReason);
      setRejectTarget(null);
      closeDrawer();
      refetch();
      showToast(t('assets.review.rejectSuccess'), 'success');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : t('assets.review.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <section className="dashboard-filters" aria-label={t('assets.review.filtersLabel')}>
        <div className="dashboard-filters__tabs" role="tablist" aria-label={t('dashboard.a11y.status_filters')}>
          {STATUS_FILTERS.map((filterKey) => {
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
                {t(`assets.filters.${filterKey}`)}
                {filterKey !== 'all' && ` (${countByStatus[filterKey] ?? 0})`}
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-table-panel" aria-live="polite">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                {TABLE_HEADER_KEYS.map((headerKey) => (
                  <th key={headerKey} scope="col" className="dashboard-table__head-cell">
                    {t(`assets.table.headers.${headerKey}`)}
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
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty" role="alert">
                    {t('dashboard.table.error', { message: error })}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                records.map((record) => {
                  const displayStatus = normalizeAssetStatus(record.status);
                  const isPending = record.dbStatus === 'pending_review';

                  return (
                    <tr
                      key={record.id}
                      className="dashboard-table__row dashboard-table__row--clickable"
                      onClick={(event) => openDrawer(record, event)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openDrawer(record, event);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={t('assets.review.openRow', { title: record.title })}
                    >
                      <td className="dashboard-table__cell dashboard-table__cell--strong">
                        {record.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="dashboard-table__cell dashboard-table__cell--strong">
                        {record.title}
                      </td>
                      <td className="dashboard-table__cell dashboard-table__cell--muted">
                        {t(`assets.types.${record.assetType}`, { defaultValue: record.assetType })}
                      </td>
                      <td className="dashboard-table__cell">{record.ownerName || '—'}</td>
                      <td className="dashboard-table__cell">
                        {record.submittedAtFormatted || '—'}
                      </td>
                      <td className="dashboard-table__cell">
                        <span className={`asset-status-pill ${statusPillClass(record.status)}`}>
                          {t(`assets.status.${displayStatus.toLowerCase()}`, {
                            defaultValue: displayStatus.replace(/_/g, ' '),
                          })}
                        </span>
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
                            aria-label={t('assets.review.viewAction', { title: record.title })}
                            onClick={(event) => openDrawer(record, event)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z" stroke="currentColor" strokeWidth="1.8" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                          </button>
                          {isPending && canApprove && (
                            <button
                              type="button"
                              className="dashboard-actions__btn dashboard-actions__btn--success"
                              aria-label={t('assets.review.approveAction', { title: record.title })}
                              onClick={(event) => {
                                event.stopPropagation();
                                setModalError('');
                                setApproveTarget(record);
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                          {isPending && canReject && (
                            <button
                              type="button"
                              className="dashboard-actions__btn dashboard-actions__btn--danger"
                              aria-label={t('assets.review.rejectAction', { title: record.title })}
                              onClick={(event) => {
                                event.stopPropagation();
                                setModalError('');
                                setRejectTarget(record);
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && !error && records.length === 0 && (
                <tr>
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty">
                    {t('assets.review.noResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="dashboard-table__footer">
            {t('dashboard.table.footer_displayed', { count: records.length })}
          </div>
        )}
      </section>

      <AssetRequestDetailDrawer
        assetId={selectedAssetId}
        open={drawerOpen}
        onClose={closeDrawer}
        onApprove={(asset) => {
          setModalError('');
          setApproveTarget(asset);
        }}
        onReject={(asset) => {
          setModalError('');
          setRejectTarget(asset);
        }}
        actionLoading={actionLoading}
      />

      <AssetApproveConfirmModal
        open={Boolean(approveTarget)}
        loading={actionLoading}
        assetTitle={approveTarget?.title ?? ''}
        onConfirm={handleApproveConfirm}
        onCancel={() => {
          if (!actionLoading) setApproveTarget(null);
        }}
      />

      <AssetRejectModal
        open={Boolean(rejectTarget)}
        loading={actionLoading}
        error={modalError}
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          if (!actionLoading) {
            setRejectTarget(null);
            setModalError('');
          }
        }}
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

export default AssetRequestsView;
