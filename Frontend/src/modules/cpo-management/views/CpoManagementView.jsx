import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable } from '../../../components/admin/AdminDataTable.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { CpoApproveModal } from '../components/CpoApproveModal.jsx';
import { CpoDetailDrawer } from '../components/CpoDetailDrawer.jsx';
import { CpoRejectModal } from '../components/CpoRejectModal.jsx';
import { useCpoRecords } from '../hooks/use-cpo-records.js';
import { cpoService } from '../services/cpo-service.js';
import {
  CPO_PAGE_SIZE,
  CPO_TAB_KEYS,
  CPO_TABLE_COLUMNS,
  formatDate,
  getCpoStatusVariant,
} from '../utils/cpo-management-utils.js';

function ViewActionButton({ label, onClick }) {
  return (
    <button type="button" className="dashboard-actions__btn" aria-label={label} onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}

export function CpoManagementView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';

  const {
    activeTab,
    setActiveTab,
    page,
    search,
    setSearch,
    items: cpos,
    pagination,
    stats,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useCpoRecords();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('cpo.management.searchPlaceholder'),
  });

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const tabs = useMemo(
    () =>
      CPO_TAB_KEYS.map((tabKey) => ({
        key: tabKey,
        label: t(`cpo.management.tabs.${tabKey}`),
        count: tabKey === 'all' ? undefined : stats?.[tabKey],
        uppercase: tabKey !== 'all',
      })),
    [stats, t],
  );

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

  const handleApproveConfirm = async (expiryDate) => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await cpoService.approveCpo(approveTarget.id, expiryDate);
      setApproveTarget(null);
      closeDrawer();
      await refetch();
      showToast(t('cpo.management.approveModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('cpo.management.approveModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (rejectionReason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await cpoService.rejectCpo(rejectTarget.id, rejectionReason);
      setRejectTarget(null);
      closeDrawer();
      await refetch();
      showToast(t('cpo.management.rejectModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('cpo.management.rejectModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const footerSummary = t('cpo.management.table.footer', {
    from: cpos.length === 0 ? 0 : (page - 1) * CPO_PAGE_SIZE + 1,
    to: (page - 1) * CPO_PAGE_SIZE + cpos.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      <AdminDataTable
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={loading}
        error={error}
        onRetry={refetch}
        columns={CPO_TABLE_COLUMNS}
        getColumnLabel={(key) => t(`cpo.management.table.headers.${key}`)}
        emptyMessage={t('cpo.management.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      >
        {cpos.map((row) => (
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
            aria-label={t('cpo.management.openDetail', { name: row.bidderName })}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">{row.bidderName || '—'}</td>
            <td className="dashboard-table__cell">{row.auctionTitle || '—'}</td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`cpo.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getCpoStatusVariant(row.status)}
              />
            </td>
            <td className="dashboard-table__cell">{formatDate(row.expiryDate, locale)}</td>
            <td className="dashboard-table__cell">{formatDate(row.createdAt, locale)}</td>
            <td className="dashboard-table__cell">
              <div className="dashboard-actions">
                <ViewActionButton
                  label={t('cpo.management.viewAction')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openDrawer(row.id);
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <CpoDetailDrawer
        cpoId={selectedId}
        open={drawerOpen}
        actionLoading={actionLoading}
        onClose={closeDrawer}
        onApprove={(cpo) => setApproveTarget(cpo)}
        onReject={(cpo) => setRejectTarget(cpo)}
        onRefresh={refetch}
      />

      <CpoApproveModal
        open={Boolean(approveTarget)}
        loading={actionLoading}
        bidderName={approveTarget?.bidderName}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
      />

      <CpoRejectModal
        open={Boolean(rejectTarget)}
        title={t('cpo.management.rejectModal.title')}
        body={t('cpo.management.rejectModal.body')}
        quickReasons={[
          t('cpo.management.rejectModal.reasons.invalidDocument'),
          t('cpo.management.rejectModal.reasons.expired'),
          t('cpo.management.rejectModal.reasons.mismatch'),
        ]}
        loading={actionLoading}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />

      <DashboardToast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}

export default CpoManagementView;
