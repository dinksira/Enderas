import { AdminDataTable, StatusPill, ApproveConfirmModal } from '@enderass/shared/ui-admin';
import { DashboardToast } from '@enderass/shared/ui';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { formatEtbAmount } from '@enderass/shared/utils';
import { PaymentDetailDrawer } from '../components/PaymentDetailDrawer.jsx';
import { PaymentRejectModal } from '../components/PaymentRejectModal.jsx';
import { usePayments } from '../hooks/use-payments.js';
import { paymentService } from '@enderass/shared/services';
import {
  formatDate,
  getPaymentStatusVariant,
  PAYMENT_PAGE_SIZE,
  PAYMENT_TAB_KEYS,
  PAYMENT_TABLE_COLUMNS,
} from '../utils/payment-management-utils.js';

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

export function PaymentManagementView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';

  const {
    activeTab,
    setActiveTab,
    page,
    search,
    setSearch,
    items: payments,
    pagination,
    stats,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = usePayments();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('payments.management.searchPlaceholder'),
  });

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const tabs = useMemo(
    () =>
      PAYMENT_TAB_KEYS.map((tabKey) => ({
        key: tabKey,
        label: t(`payments.management.tabs.${tabKey}`),
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

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await paymentService.approvePayment(approveTarget.id);
      setApproveTarget(null);
      closeDrawer();
      await refetch();
      showToast(t('payments.management.approveModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('payments.management.approveModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (rejectionReason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await paymentService.rejectPayment(rejectTarget.id, rejectionReason);
      setRejectTarget(null);
      closeDrawer();
      await refetch();
      showToast(t('payments.management.rejectModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('payments.management.rejectModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const footerSummary = t('payments.management.table.footer', {
    from: payments.length === 0 ? 0 : (page - 1) * PAYMENT_PAGE_SIZE + 1,
    to: (page - 1) * PAYMENT_PAGE_SIZE + payments.length,
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
        columns={PAYMENT_TABLE_COLUMNS}
        getColumnLabel={(key) => t(`payments.management.table.headers.${key}`)}
        emptyMessage={t('payments.management.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      >
        {payments.map((row) => (
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
            aria-label={t('payments.management.openDetail', { name: row.payerName })}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">{row.payerName || '—'}</td>
            <td className="dashboard-table__cell">{row.auctionTitle || '—'}</td>
            <td className="dashboard-table__cell dashboard-table__cell--strong">
              {formatEtbAmount(row.amount)}
            </td>
            <td className="dashboard-table__cell dashboard-table__cell--muted">
              {t(`payments.management.methods.${row.paymentMethod}`, { defaultValue: row.paymentMethod })}
            </td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`payments.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getPaymentStatusVariant(row.status)}
              />
            </td>
            <td className="dashboard-table__cell">{formatDate(row.paidAt || row.createdAt, locale)}</td>
            <td className="dashboard-table__cell">
              <div className="dashboard-actions">
                <ViewActionButton
                  label={t('payments.management.viewAction')}
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

      <PaymentDetailDrawer
        paymentId={selectedId}
        open={drawerOpen}
        actionLoading={actionLoading}
        onClose={closeDrawer}
        onApprove={(payment) => setApproveTarget(payment)}
        onReject={(payment) => setRejectTarget(payment)}
        onRefresh={refetch}
      />

      <ApproveConfirmModal
        open={Boolean(approveTarget)}
        title={t('payments.management.approveModal.title')}
        body={t('payments.management.approveModal.body', { name: approveTarget?.payerName })}
        confirmLabel={t('payments.management.approveModal.confirm')}
        loading={actionLoading}
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveTarget(null)}
      />

      <PaymentRejectModal
        open={Boolean(rejectTarget)}
        title={t('payments.management.rejectModal.title')}
        body={t('payments.management.rejectModal.body')}
        quickReasons={[
          t('payments.management.rejectModal.reasons.amountMismatch'),
          t('payments.management.rejectModal.reasons.invalidReceipt'),
          t('payments.management.rejectModal.reasons.duplicate'),
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

export default PaymentManagementView;
