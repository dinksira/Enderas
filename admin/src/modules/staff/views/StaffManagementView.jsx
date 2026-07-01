import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable, StatusPill } from '@enderass/shared/ui-admin';
import { Button, DashboardToast } from '@enderass/shared/ui';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { staffService } from '@enderass/shared/services';
import { StaffCreateModal } from '../components/StaffCreateModal.jsx';
import { StaffDeactivateConfirmModal } from '../components/StaffDeactivateConfirmModal.jsx';
import { StaffDeleteConfirmModal } from '../components/StaffDeleteConfirmModal.jsx';
import { StaffDetailDrawer } from '../components/StaffDetailDrawer.jsx';
import { StaffEditModal } from '../components/StaffEditModal.jsx';
import { StaffReactivateConfirmModal } from '../components/StaffReactivateConfirmModal.jsx';
import {
  STAFF_TAB_KEYS,
  STAFF_TABLE_COLUMNS,
  useStaff,
} from '../hooks/use-staff.js';
import {
  formatDate,
  formatDisplayValue,
  getStaffDisplayName,
  getStaffRoleLabel,
} from '../utils/staff-management-utils.js';

const PAGE_SIZE = 20;

export function StaffManagementView() {
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
    items: staffMembers,
    pagination,
    stats,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useStaff();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('staff.management.searchPlaceholder'),
  });

  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRefreshTrigger, setDrawerRefreshTrigger] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [deleteStaff, setDeleteStaff] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const canCreate = can(MODULES.STAFF, ACTIONS.CREATE);
  const emptyLabel = t('common.empty');

  const tabs = useMemo(
    () =>
      STAFF_TAB_KEYS.map((tabKey) => ({
        key: tabKey,
        label: t(`staff.management.tabs.${tabKey}`),
        count:
          tabKey === 'all'
            ? stats?.all
            : tabKey === 'active'
              ? stats?.active
              : stats?.inactive,
        uppercase: tabKey !== 'all',
      })),
    [stats, t],
  );

  const refreshDrawerAndTable = async () => {
    setDrawerRefreshTrigger((current) => current + 1);
    await refetch();
  };

  const openDrawer = (staffId) => {
    setSelectedStaffId(staffId);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedStaffId(null);
  };

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const showErrorToast = (err, fallbackKey) => {
    const message = err instanceof Error ? err.message : t(fallbackKey);
    showToast(message, 'error');
    return message;
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;

    setActionLoading(true);
    setModalError('');

    try {
      await staffService.deactivateStaff(deactivateTarget.id);
      setDeactivateTarget(null);
      await refreshDrawerAndTable();
      showToast(t('staff.management.deactivateModal.success'), 'success');
    } catch (err) {
      showErrorToast(err, 'staff.management.deactivateModal.failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateConfirm = async () => {
    if (!reactivateTarget) return;

    setActionLoading(true);
    setModalError('');

    try {
      await staffService.updateStaff(reactivateTarget.id, { isActive: true });
      setReactivateTarget(null);
      await refreshDrawerAndTable();
      showToast(t('staff.management.reactivateModal.success'), 'success');
    } catch (err) {
      showErrorToast(err, 'staff.management.reactivateModal.failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (staffId, payload) => {
    setActionLoading(true);

    try {
      await staffService.updateStaff(staffId, payload);
      setEditStaff(null);
      await refreshDrawerAndTable();
      showToast(t('staff.management.editModal.success'), 'success');
    } catch (err) {
      showErrorToast(err, 'staff.management.editModal.failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteStaff) return;

    setActionLoading(true);
    setModalError('');

    try {
      await staffService.deleteStaff(deleteStaff.id);
      setDeleteStaff(null);
      closeDrawer();
      await refetch();
      showToast(t('staff.management.deleteModal.success'), 'success');
    } catch (err) {
      const message = showErrorToast(err, 'staff.management.deleteModal.failed');
      setModalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    setActionLoading(true);

    try {
      await staffService.createStaff(payload);
      setCreateOpen(false);
      await refetch();
      showToast(t('staff.management.createModal.success'), 'success');
    } catch (err) {
      showErrorToast(err, 'staff.management.createModal.failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const footerSummary = t('staff.management.table.footer', {
    from: staffMembers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: (page - 1) * PAGE_SIZE + staffMembers.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      {canCreate && (
        <header className="kyc-management-page__header">
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            {t('staff.management.createStaff')}
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
        columns={STAFF_TABLE_COLUMNS}
        getColumnLabel={(key) => t(`staff.management.table.headers.${key}`)}
        emptyMessage={t('staff.management.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      >
        {staffMembers.map((member) => (
          <tr
            key={member.id}
            className="dashboard-table__row kyc-management-page__row"
            onClick={() => openDrawer(member.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDrawer(member.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('staff.management.openDetail', {
              name: getStaffDisplayName(member) || emptyLabel,
            })}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">
              {formatDisplayValue(getStaffDisplayName(member), emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              {formatDisplayValue(
                getStaffRoleLabel(t, member.roleCode) || member.roleName,
                emptyLabel,
              )}
            </td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={
                  member.isActive
                    ? t('staff.management.status.active')
                    : t('staff.management.status.inactive')
                }
                variant={member.isActive ? 'active' : 'inactive'}
              />
            </td>
            <td className="dashboard-table__cell">
              {formatDate(member.createdAt, locale, emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              <div className="dashboard-actions">
                <button
                  type="button"
                  className="dashboard-actions__btn"
                  aria-label={t('staff.management.viewAction')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openDrawer(member.id);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <StaffDetailDrawer
        staffId={selectedStaffId}
        open={drawerOpen}
        actionLoading={actionLoading}
        refreshTrigger={drawerRefreshTrigger}
        onClose={closeDrawer}
        onEdit={(staff) => setEditStaff(staff)}
        onDeactivate={(staff) => {
          setDeactivateTarget(staff);
          setModalError('');
        }}
        onReactivate={(staff) => {
          setReactivateTarget(staff);
          setModalError('');
        }}
        onDelete={(staff) => {
          setDeleteStaff(staff);
          setModalError('');
        }}
        onRefreshTable={refetch}
      />

      <StaffDeactivateConfirmModal
        open={Boolean(deactivateTarget)}
        staffName={getStaffDisplayName(deactivateTarget)}
        loading={actionLoading}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateTarget(null)}
      />

      <StaffReactivateConfirmModal
        open={Boolean(reactivateTarget)}
        staffName={getStaffDisplayName(reactivateTarget)}
        loading={actionLoading}
        onConfirm={handleReactivateConfirm}
        onCancel={() => setReactivateTarget(null)}
      />

      <StaffEditModal
        open={Boolean(editStaff)}
        staff={editStaff}
        loading={actionLoading}
        onClose={() => setEditStaff(null)}
        onSubmit={handleEdit}
      />

      <StaffDeleteConfirmModal
        open={Boolean(deleteStaff)}
        loading={actionLoading}
        error={modalError}
        staffName={getStaffDisplayName(deleteStaff)}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteStaff(null);
          setModalError('');
        }}
      />

      <StaffCreateModal
        open={createOpen}
        loading={actionLoading}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
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

export default StaffManagementView;
