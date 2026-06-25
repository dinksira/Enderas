import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApproveConfirmModal } from '../../../components/admin/ApproveConfirmModal.jsx';
import { AdminDataTable } from '../../../components/admin/AdminDataTable.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { Button } from '../../../components/Button.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { userService } from '../services/user-service.js';
import { UserCreateModal } from '../components/UserCreateModal.jsx';
import { UserDeleteConfirmModal } from '../components/UserDeleteConfirmModal.jsx';
import { UserDetailDrawer } from '../components/UserDetailDrawer.jsx';
import { UserEditModal } from '../components/UserEditModal.jsx';
import { UserStatusModal } from '../components/UserStatusModal.jsx';
import { useUsers } from '../hooks/use-users.js';
import {
  formatDate,
  formatDisplayValue,
  getUserDisplayName,
  getUserStatusVariant,
  USER_PAGE_SIZE,
  USER_TAB_KEYS,
  USER_TABLE_COLUMNS,
} from '../utils/user-management-utils.js';

function ViewActionButton({ label, onClick }) {
  return (
    <button
      type="button"
      className="dashboard-actions__btn"
      aria-label={label}
      onClick={onClick}
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
  );
}

export function UserManagementView() {
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
    items: users,
    pagination,
    stats,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useUsers();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('users.management.searchPlaceholder'),
  });

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRefreshTrigger, setDrawerRefreshTrigger] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [activateTarget, setActivateTarget] = useState(null);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const canCreate = can(MODULES.USERS, ACTIONS.CREATE);

  const tabs = useMemo(
    () =>
      USER_TAB_KEYS.map((tabKey) => ({
        key: tabKey,
        label: t(`users.management.tabs.${tabKey}`),
        count: stats?.[tabKey],
        uppercase: tabKey !== 'all',
      })),
    [stats, t],
  );

  const refreshDrawerAndTable = async () => {
    setDrawerRefreshTrigger((current) => current + 1);
    await refetch();
  };

  const openDrawer = (userId) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUserId(null);
  };

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const showErrorToast = (err, fallbackKey) => {
    const message = err instanceof Error ? err.message : t(fallbackKey);
    showToast(message, 'error');
    return message;
  };

  const handleStatusRequest = (user, status) => {
    setStatusTarget(user);
    setStatusAction(status);
    setStatusModalOpen(true);
    setModalError('');
  };

  const handleStatusConfirm = async (reason) => {
    if (!statusTarget || !statusAction) return;

    setActionLoading(true);
    setModalError('');

    try {
      await userService.updateUserStatus(statusTarget.id, {
        status: statusAction,
        reason,
      });
      setStatusModalOpen(false);
      setStatusTarget(null);
      setStatusAction(null);
      await refreshDrawerAndTable();
      showToast(t('users.management.statusModal.success'), 'success');
    } catch (err) {
      const message = showErrorToast(err, 'users.management.statusModal.failed');
      setModalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateRequest = (user) => {
    setActivateTarget(user);
    setActivateModalOpen(true);
    setModalError('');
  };

  const handleActivateConfirm = async () => {
    if (!activateTarget) return;

    setActionLoading(true);
    setModalError('');

    try {
      await userService.updateUserStatus(activateTarget.id, { status: 'active' });
      setActivateModalOpen(false);
      setActivateTarget(null);
      await refreshDrawerAndTable();
      showToast(t('users.management.drawer.activateSuccess'), 'success');
    } catch (err) {
      const message = showErrorToast(err, 'users.management.statusModal.failed');
      setModalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (userId, payload) => {
    setActionLoading(true);

    try {
      await userService.updateUser(userId, payload);
      setEditUser(null);
      await refreshDrawerAndTable();
      showToast(t('users.management.editModal.success'), 'success');
    } catch (err) {
      showErrorToast(err, 'users.management.editModal.failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;

    setActionLoading(true);
    setModalError('');

    try {
      await userService.deleteUser(deleteUser.id);
      setDeleteUser(null);
      closeDrawer();
      await refetch();
      showToast(t('users.management.deleteModal.success'), 'success');
    } catch (err) {
      const message = showErrorToast(err, 'users.management.deleteModal.failed');
      setModalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    setActionLoading(true);

    try {
      await userService.createUser(payload);
      setCreateOpen(false);
      await refetch();
      showToast(t('users.management.createModal.success'), 'success');
    } catch (err) {
      showErrorToast(err, 'users.management.createModal.failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const emptyLabel = t('common.empty');
  const footerSummary = t('users.management.table.footer', {
    from: users.length === 0 ? 0 : (page - 1) * USER_PAGE_SIZE + 1,
    to: (page - 1) * USER_PAGE_SIZE + users.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      {canCreate && (
        <header className="kyc-management-page__header">
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            {t('users.management.createUser')}
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
        columns={USER_TABLE_COLUMNS}
        getColumnLabel={(key) => t(`users.management.table.headers.${key}`)}
        emptyMessage={t('users.management.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      >
        {users.map((user) => (
          <tr
            key={user.id}
            className="dashboard-table__row kyc-management-page__row"
            onClick={() => openDrawer(user.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDrawer(user.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('users.management.openDetail', { name: getUserDisplayName(user) })}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">
              {formatDisplayValue(getUserDisplayName(user), emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              {formatDisplayValue(user.mobileNumber, emptyLabel)}
            </td>
            <td className="dashboard-table__cell dashboard-table__cell--muted">
              {t(`users.management.userTypes.${user.userType || 'individual'}`)}
            </td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`users.management.status.${user.status}`, { defaultValue: user.status })}
                variant={getUserStatusVariant(user.status)}
              />
            </td>
            <td className="dashboard-table__cell">
              {formatDate(user.registeredAt, locale, emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              <div className="dashboard-actions">
                <ViewActionButton
                  label={t('users.management.viewAction')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openDrawer(user.id);
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <UserDetailDrawer
        userId={selectedUserId}
        open={drawerOpen}
        actionLoading={actionLoading}
        refreshTrigger={drawerRefreshTrigger}
        onClose={closeDrawer}
        onEdit={(user) => setEditUser(user)}
        onDelete={(user) => {
          setDeleteUser(user);
          setModalError('');
        }}
        onSuspend={(user) => handleStatusRequest(user, 'suspended')}
        onDeactivate={(user) => handleStatusRequest(user, 'deactivated')}
        onActivate={handleActivateRequest}
        onRefreshTable={refetch}
      />

      <UserStatusModal
        open={statusModalOpen}
        statusTarget={statusAction}
        userName={getUserDisplayName(statusTarget)}
        loading={actionLoading}
        error={modalError}
        onConfirm={handleStatusConfirm}
        onCancel={() => {
          setStatusModalOpen(false);
          setStatusTarget(null);
          setStatusAction(null);
          setModalError('');
        }}
      />

      <ApproveConfirmModal
        open={activateModalOpen}
        title={t('users.management.reactivateModal.title')}
        body={t('users.management.reactivateModal.body')}
        confirmLabel={t('users.management.reactivateModal.confirm')}
        loading={actionLoading}
        onConfirm={handleActivateConfirm}
        onCancel={() => {
          setActivateModalOpen(false);
          setActivateTarget(null);
          setModalError('');
        }}
        titleId="user-reactivate-modal-title"
      />

      <UserEditModal
        open={Boolean(editUser)}
        user={editUser}
        loading={actionLoading}
        onClose={() => setEditUser(null)}
        onSubmit={handleEdit}
      />

      <UserDeleteConfirmModal
        open={Boolean(deleteUser)}
        loading={actionLoading}
        error={modalError}
        userName={getUserDisplayName(deleteUser)}
        mobileNumber={deleteUser?.mobileNumber || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteUser(null);
          setModalError('');
        }}
      />

      <UserCreateModal
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

export default UserManagementView;
