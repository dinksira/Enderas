import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable } from '../../../components/admin/AdminDataTable.jsx';
import { ApproveConfirmModal } from '../../../components/admin/ApproveConfirmModal.jsx';
import { RejectReasonModal } from '../../../components/admin/RejectReasonModal.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { Button } from '../../../components/Button.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { EvaluationCompleteModal } from '../components/EvaluationCompleteModal.jsx';
import { EvaluationDetailDrawer } from '../components/EvaluationDetailDrawer.jsx';
import { RescheduleEvaluationModal } from '../components/RescheduleEvaluationModal.jsx';
import { ScheduleEvaluationModal } from '../components/ScheduleEvaluationModal.jsx';
import { useEvaluations } from '../hooks/use-evaluations.js';
import { evaluationService } from '../services/evaluation-service.js';
import {
  EVALUATION_PAGE_SIZE,
  EVALUATION_TAB_KEYS,
  EVALUATION_TABLE_COLUMNS,
  formatAssetCategory,
  formatDate,
  getEvaluationStatusVariant,
} from '../utils/evaluation-management-utils.js';

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

export function EvaluationManagementView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';
  const can = useAuthStore((state) => state.can);

  const {
    activeTab,
    setActiveTab,
    page,
    search,
    setSearch,
    items: evaluations,
    pagination,
    stats,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useEvaluations();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('evaluations.management.searchPlaceholder'),
  });

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRefreshTrigger, setDrawerRefreshTrigger] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleMode, setRescheduleMode] = useState('update');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const canCreate = can(MODULES.EVALUATIONS, ACTIONS.CREATE);

  const tabs = useMemo(
    () =>
      EVALUATION_TAB_KEYS.map((tabKey) => ({
        key: tabKey,
        label: t(`evaluations.management.tabs.${tabKey}`),
        count: tabKey === 'all' ? stats?.all : stats?.[tabKey],
        uppercase: tabKey !== 'all',
      })),
    [stats, t],
  );

  const refreshViews = async () => {
    await refetch();
    setDrawerRefreshTrigger((current) => current + 1);
  };

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

  const handleSchedule = async (payload) => {
    setActionLoading(true);
    try {
      await evaluationService.scheduleEvaluation(payload);
      setScheduleOpen(false);
      await refreshViews();
      showToast(t('evaluations.management.scheduleModal.success'));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t('evaluations.management.scheduleModal.failed'),
        'error',
      );
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (evaluation) => {
    setActionLoading(true);
    try {
      await evaluationService.startEvaluation(evaluation.id);
      await refreshViews();
      showToast(t('evaluations.management.drawer.startSuccess'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('evaluations.management.drawer.startFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (payload) => {
    if (!completeTarget) return;
    setActionLoading(true);
    try {
      await evaluationService.completeEvaluation(completeTarget.id, payload);
      setCompleteTarget(null);
      await refreshViews();
      showToast(t('evaluations.management.completeModal.success'));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t('evaluations.management.completeModal.failed'),
        'error',
      );
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await evaluationService.approveEvaluation(approveTarget.id);
      setApproveTarget(null);
      await refreshViews();
      showToast(t('evaluations.management.approveModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('evaluations.management.approveModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (rejectionReason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await evaluationService.rejectEvaluation(rejectTarget.id, rejectionReason);
      setRejectTarget(null);
      await refreshViews();
      showToast(t('evaluations.management.rejectModal.success'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('evaluations.management.rejectModal.failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = (evaluation, mode) => {
    setRescheduleTarget(evaluation);
    setRescheduleMode(mode);
  };

  const handleRescheduleSubmit = async (payload) => {
    if (!rescheduleTarget) return;
    setActionLoading(true);
    try {
      if (rescheduleMode === 'reschedule') {
        await evaluationService.rescheduleEvaluation(rescheduleTarget.id, payload);
      } else {
        await evaluationService.updateEvaluation(rescheduleTarget.id, payload);
      }
      setRescheduleTarget(null);
      await refreshViews();
      showToast(t('evaluations.management.rescheduleModal.success'));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t('evaluations.management.rescheduleModal.failed'),
        'error',
      );
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const footerSummary = t('evaluations.management.table.footer', {
    from: evaluations.length === 0 ? 0 : (page - 1) * EVALUATION_PAGE_SIZE + 1,
    to: (page - 1) * EVALUATION_PAGE_SIZE + evaluations.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      {canCreate && (
        <header className="kyc-management-page__header">
          <Button variant="primary" onClick={() => setScheduleOpen(true)}>
            {t('evaluations.management.schedule')}
          </Button>
        </header>
      )}

      <AdminDataTable
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={loading}
        error={error}
        onRetry={refetch}
        columns={EVALUATION_TABLE_COLUMNS}
        getColumnLabel={(key) => t(`evaluations.management.table.headers.${key}`)}
        emptyMessage={t('evaluations.management.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      >
        {evaluations.map((row) => (
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
            aria-label={t('evaluations.management.openDetail', { name: row.assetTitle })}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">{row.assetTitle || '—'}</td>
            <td className="dashboard-table__cell dashboard-table__cell--muted">
              {formatAssetCategory(t, row.assetType)}
            </td>
            <td className="dashboard-table__cell">{row.ownerName || '—'}</td>
            <td className="dashboard-table__cell">{formatDate(row.scheduledAt, locale)}</td>
            <td className="dashboard-table__cell dashboard-table__cell--muted">
              {row.evaluatorName || '—'}
            </td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`evaluations.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getEvaluationStatusVariant(row.status)}
              />
            </td>
            <td className="dashboard-table__cell">
              <div className="dashboard-actions">
                <ViewActionButton
                  label={t('evaluations.management.viewAction')}
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

      <EvaluationDetailDrawer
        evaluationId={selectedId}
        open={drawerOpen}
        actionLoading={actionLoading}
        refreshTrigger={drawerRefreshTrigger}
        onClose={closeDrawer}
        onStart={handleStart}
        onComplete={(evaluation) => setCompleteTarget(evaluation)}
        onApprove={(evaluation) => setApproveTarget(evaluation)}
        onReject={(evaluation) => setRejectTarget(evaluation)}
        onReschedule={handleReschedule}
      />

      <ScheduleEvaluationModal
        open={scheduleOpen}
        loading={actionLoading}
        onClose={() => setScheduleOpen(false)}
        onSubmit={handleSchedule}
      />

      <RescheduleEvaluationModal
        open={Boolean(rescheduleTarget)}
        loading={actionLoading}
        evaluation={rescheduleTarget}
        mode={rescheduleMode}
        onClose={() => setRescheduleTarget(null)}
        onSubmit={handleRescheduleSubmit}
      />

      <EvaluationCompleteModal
        open={Boolean(completeTarget)}
        loading={actionLoading}
        evaluation={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onSubmit={handleCompleteSubmit}
      />

      <ApproveConfirmModal
        open={Boolean(approveTarget)}
        title={t('evaluations.management.approveModal.title')}
        body={t('evaluations.management.approveModal.body')}
        confirmLabel={t('evaluations.management.approveModal.confirm')}
        loading={actionLoading}
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveTarget(null)}
      />

      <RejectReasonModal
        open={Boolean(rejectTarget)}
        title={t('evaluations.management.rejectModal.title')}
        body={t('evaluations.management.rejectModal.body')}
        quickReasons={[
          t('evaluations.management.rejectModal.reasons.lowValuation'),
          t('evaluations.management.rejectModal.reasons.incomplete'),
          t('evaluations.management.rejectModal.reasons.condition'),
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

export default EvaluationManagementView;
