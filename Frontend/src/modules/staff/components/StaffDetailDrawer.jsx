import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Can } from '../../../components/Can.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { ApproveConfirmModal } from '../../../components/admin/ApproveConfirmModal.jsx';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { staffService } from '../services/staff-service.js';
import { StaffPermissionMatrix } from './StaffPermissionMatrix.jsx';
import {
  formatDate,
  formatDisplayValue,
  formatStaffLanguage,
  getStaffDisplayName,
  getStaffRoleDescription,
  getStaffRoleLabel,
} from '../utils/staff-management-utils.js';

function MetaField({ label, value }) {
  const { t } = useTranslation();

  return (
    <>
      <dt>{label}</dt>
      <dd>{formatDisplayValue(value, t('common.empty'))}</dd>
    </>
  );
}

/**
 * @param {{
 *   staffId: string|null,
 *   open: boolean,
 *   actionLoading?: boolean,
 *   refreshTrigger?: number,
 *   onClose: () => void,
 *   onEdit: (staff: object) => void,
 *   onDeactivate: (staff: object) => void,
 *   onReactivate: (staff: object) => void,
 *   onDelete: (staff: object) => void,
 *   onRefreshTable: () => void,
 * }} props
 */
export function StaffDetailDrawer({
  staffId,
  open,
  actionLoading = false,
  refreshTrigger = 0,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
  onRefreshTable,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);
  const roleCode = useAuthStore((state) => state.permissions?.roleCode);
  const ownRoleId = useAuthStore((state) => state.user?.roleId);

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionEditMode, setPermissionEditMode] = useState(false);
  const [permissionDraft, setPermissionDraft] = useState({});
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [permissionConfirmOpen, setPermissionConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const emptyLabel = t('common.empty');

  const loadStaff = useCallback(async () => {
    if (!staffId) return;

    setLoading(true);
    setError('');

    try {
      const detail = await staffService.getStaffById(staffId);
      setStaff(detail);
      setPermissionEditMode(false);
      setPermissionDraft(detail?.rolePermissions?.moduleActions ?? {});
      setPermissionError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('staff.management.drawer.loadFailed'));
      setStaff(null);
    } finally {
      setLoading(false);
    }
  }, [staffId, t]);

  useEffect(() => {
    if (!open || !staffId) {
      setStaff(null);
      setError('');
      return undefined;
    }

    loadStaff();

    return undefined;
  }, [open, staffId, refreshTrigger, loadStaff]);

  const canUpdate = can(MODULES.STAFF, ACTIONS.UPDATE);
  const canDelete = can(MODULES.STAFF, ACTIONS.DELETE) && roleCode === 'super_admin';
  const displayName = getStaffDisplayName(staff);
  const staffRoleCode = staff?.roleCode;
  const canManageRolePermissions =
    roleCode === 'super_admin'
    && can(MODULES.ROLES, ACTIONS.UPDATE)
    && staff?.roleId
    && ownRoleId !== staff.roleId
    && staff.roleCode !== 'super_admin';

  const permissionCatalog = staff?.permissionCatalog;
  const permissionMatrix = staff?.rolePermissionMatrix ?? [];
  const roleLabel = getStaffRoleLabel(t, staffRoleCode) || staff?.roleName;

  const handlePermissionToggle = (moduleName, actionName, checked) => {
    setPermissionDraft((current) => {
      const nextActions = new Set(Array.isArray(current[moduleName]) ? current[moduleName] : []);
      if (checked) nextActions.add(actionName);
      else nextActions.delete(actionName);

      const next = { ...current };
      if (nextActions.size > 0) {
        next[moduleName] = [...nextActions];
      } else {
        delete next[moduleName];
      }
      return next;
    });
  };

  const handleRefresh = async () => {
    await loadStaff();
    onRefreshTable();
  };

  const handlePermissionEditStart = () => {
    setPermissionDraft(staff?.rolePermissions?.moduleActions ?? {});
    setPermissionError('');
    setPermissionEditMode(true);
  };

  const handlePermissionSave = async () => {
    if (!staff?.roleId) return;

    setPermissionSaving(true);
    setPermissionError('');

    try {
      await staffService.updateRolePermissions(staff.roleId, {
        summary: staff.roleSummary,
        moduleActions: permissionDraft,
      });
      setPermissionConfirmOpen(false);
      setPermissionEditMode(false);
      await handleRefresh();
      setToast({
        open: true,
        message: t('staff.management.permissions.updateSuccess'),
        variant: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('staff.management.permissions.updateFailed');
      setPermissionError(message);
      setToast({ open: true, message, variant: 'error' });
    } finally {
      setPermissionSaving(false);
    }
  };

  const headerActions =
    staff && staff.id && canUpdate && staff.isActive && !loading && !error ? (
      <button
        type="button"
        className="admin-drawer__edit-btn"
        onClick={() => onEdit(staff)}
        disabled={actionLoading}
      >
        {t('staff.management.drawer.edit')}
      </button>
    ) : null;

  const permissionHeaderAction = canManageRolePermissions ? (
    <Button
      variant={permissionEditMode ? 'secondary' : 'primary'}
      disabled={permissionSaving || actionLoading}
      onClick={() => {
        if (permissionEditMode) {
          setPermissionEditMode(false);
          setPermissionDraft(staff?.rolePermissions?.moduleActions ?? {});
          setPermissionError('');
        } else {
          handlePermissionEditStart();
        }
      }}
    >
      {permissionEditMode
        ? t('staff.management.permissions.cancelEdit')
        : t('staff.management.permissions.edit')}
    </Button>
  ) : null;

  const permissionWarning = permissionEditMode ? (
    <div className="staff-permission-warning" role="alert">
      {t('staff.management.permissions.warning')}
    </div>
  ) : null;

  const footer =
    !loading && !error && staff ? (
      <>
        {canUpdate && staff.isActive && (
          <>
            <Button variant="secondary" disabled={actionLoading} onClick={() => onEdit(staff)}>
              {t('staff.management.drawer.edit')}
            </Button>
            <Button variant="secondary" disabled={actionLoading} onClick={() => onDeactivate(staff)}>
              {t('staff.management.drawer.deactivate')}
            </Button>
          </>
        )}
        {canUpdate && !staff.isActive && (
          <Button variant="primary" disabled={actionLoading} onClick={() => onReactivate(staff)}>
            {t('staff.management.drawer.reactivate')}
          </Button>
        )}
        {canDelete && (
          <Button variant="secondary" disabled={actionLoading} onClick={() => onDelete(staff)}>
            {t('staff.management.drawer.delete')}
          </Button>
        )}
        {canManageRolePermissions && permissionEditMode && (
          <Button
            variant="primary"
            disabled={permissionSaving || actionLoading}
            onClick={() => setPermissionConfirmOpen(true)}
          >
            {permissionSaving
              ? t('staff.management.permissions.saving')
              : t('staff.management.permissions.save')}
          </Button>
        )}
        <Button variant="secondary" disabled={loading || actionLoading} onClick={handleRefresh}>
          {t('staff.management.drawer.refresh')}
        </Button>
      </>
    ) : null;

  const sections = staff
    ? [
        {
          key: 'profile',
          title: t('staff.management.drawer.profileSection'),
          children: (
            <dl className="kyc-drawer__meta">
              <MetaField label={t('staff.management.drawer.firstName')} value={staff.user?.firstName} />
              <MetaField label={t('staff.management.drawer.lastName')} value={staff.user?.lastName} />
              <MetaField label={t('staff.management.drawer.mobile')} value={staff.user?.mobileNumber} />
              <MetaField label={t('staff.management.drawer.email')} value={staff.user?.email} />
              <MetaField label={t('staff.management.drawer.employeeId')} value={staff.employeeId} />
              <MetaField label={t('staff.management.drawer.department')} value={staff.department} />
              <MetaField
                label={t('staff.management.drawer.preferredLanguage')}
                value={formatStaffLanguage(t, staff.user?.preferredLanguage)}
              />
              <MetaField
                label={t('staff.management.drawer.createdAt')}
                value={formatDate(staff.createdAt, locale, emptyLabel)}
              />
              <MetaField label={t('staff.management.drawer.createdBy')} value={staff.createdByName} />
              {staff.activatedAt && (
                <MetaField
                  label={t('staff.management.drawer.activatedAt')}
                  value={formatDate(staff.activatedAt, locale, emptyLabel)}
                />
              )}
              {staff.deactivatedAt && (
                <MetaField
                  label={t('staff.management.drawer.deactivatedAt')}
                  value={formatDate(staff.deactivatedAt, locale, emptyLabel)}
                />
              )}
            </dl>
          ),
        },
        {
          key: 'role',
          title: t('staff.management.drawer.roleSection'),
          children: (
            <dl className="kyc-drawer__meta">
              <MetaField
                label={t('staff.management.drawer.role')}
                value={getStaffRoleLabel(t, staffRoleCode) || staff.roleName}
              />
              <MetaField
                label={t('staff.management.drawer.roleDescription')}
                value={getStaffRoleDescription(t, staffRoleCode)}
              />
              <MetaField
                label={t('staff.management.drawer.roleAssignedAt')}
                value={formatDate(staff.createdAt, locale, emptyLabel)}
              />
            </dl>
          ),
        },
        {
          key: 'permissions',
          title: t('staff.management.permissions.sectionTitle'),
          children: (
            <>
              <style>{`
                .staff-permission-warning {
                  padding: var(--core-space-3);
                  border-left: 3px solid var(--semantic-color-warning);
                  background: color-mix(in srgb, var(--semantic-color-warning) 10%, transparent);
                  color: var(--dashboard-text-primary);
                  font-size: 12px;
                  line-height: var(--core-line-height-normal);
                }

                .staff-permission-note {
                  margin: 0 0 var(--core-space-3);
                  color: var(--dashboard-text-subtle);
                  font-size: 12px;
                }

                .staff-permission-error {
                  margin-top: var(--core-space-3);
                  color: var(--component-input-error-color);
                  font-size: var(--component-input-error-font-size);
                }
              `}</style>
              <p className="staff-permission-note">
                {staff.roleIsWildcard
                  ? t('staff.management.permissions.superAdmin')
                  : t('staff.management.permissions.readOnly')}
              </p>
              <Can module={MODULES.ROLES} action={ACTIONS.UPDATE} fallback={null}>
                <StaffPermissionMatrix
                  t={t}
                  catalog={permissionCatalog}
                  matrix={permissionMatrix}
                  editable={Boolean(canManageRolePermissions)}
                  editMode={permissionEditMode}
                  draft={permissionDraft}
                  onToggle={handlePermissionToggle}
                  headerAction={permissionHeaderAction}
                  warning={permissionWarning}
                />
              </Can>
              {!can(MODULES.ROLES, ACTIONS.UPDATE) && (
                <StaffPermissionMatrix
                  t={t}
                  catalog={permissionCatalog}
                  matrix={permissionMatrix}
                />
              )}
              {permissionError && (
                <p className="staff-permission-error" role="alert">
                  {permissionError}
                </p>
              )}
            </>
          ),
        },
      ]
    : [];

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onClose={onClose}
        title={displayName || t('staff.management.drawer.title')}
        subtitle={formatDisplayValue(staff?.employeeId, emptyLabel)}
        loading={loading}
        error={error}
        onRetry={loadStaff}
        headerActions={headerActions}
        status={
          staff ? (
            <StatusPill
              label={
                staff.isActive
                  ? t('staff.management.status.active')
                  : t('staff.management.status.inactive')
              }
              variant={staff.isActive ? 'active' : 'inactive'}
            />
          ) : null
        }
        sections={sections}
        footer={footer}
        titleId="staff-detail-drawer-title"
        width={520}
      />
      <ApproveConfirmModal
        open={permissionConfirmOpen}
        title={t('staff.management.permissions.confirmTitle')}
        body={t('staff.management.permissions.confirmBody', {
          role: roleLabel,
          count: staff?.roleAffectedStaffCount ?? 0,
        })}
        confirmLabel={t('staff.management.permissions.confirm')}
        loading={permissionSaving}
        onConfirm={handlePermissionSave}
        onCancel={() => {
          if (!permissionSaving) {
            setPermissionConfirmOpen(false);
          }
        }}
        titleId="staff-permission-save-modal-title"
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

export default StaffDetailDrawer;
