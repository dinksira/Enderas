import { getPermissionActionLabel, getPermissionModuleLabel } from '../utils/staff-management-utils.js';

const STAFF_PERMISSION_MATRIX_STYLES = `
.staff-permission-matrix {
  display: flex;
  flex-direction: column;
  gap: var(--core-space-3);
}

.staff-permission-matrix__banner {
  padding: var(--core-space-3);
  border-left: 3px solid var(--semantic-color-warning);
  background: color-mix(in srgb, var(--semantic-color-warning) 10%, transparent);
  color: var(--dashboard-text-primary);
  font-size: 12px;
  line-height: var(--core-line-height-normal);
}

.staff-permission-matrix__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--dashboard-border);
}

.staff-permission-matrix__table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.staff-permission-matrix__table th,
.staff-permission-matrix__table td {
  padding: var(--core-space-3);
  border: 1px solid var(--dashboard-border);
  text-align: center;
  font-size: var(--core-font-size-body-sm);
}

.staff-permission-matrix__table th:first-child,
.staff-permission-matrix__table td:first-child {
  text-align: left;
  min-width: 180px;
}

.staff-permission-matrix__table th {
  background: var(--dashboard-surface-bg);
  color: var(--dashboard-text-primary);
  font-weight: var(--core-font-weight-semibold);
}

.staff-permission-matrix__module {
  color: var(--dashboard-text-primary);
  font-weight: var(--core-font-weight-semibold);
}

.staff-permission-matrix__grant {
  color: var(--semantic-color-status-success);
  font-weight: var(--core-font-weight-bold);
}

.staff-permission-matrix__deny {
  color: var(--dashboard-text-subtle);
}

.staff-permission-matrix__checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--semantic-color-status-success);
}

.staff-permission-matrix__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--core-space-3);
}

.staff-permission-matrix__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--core-space-3);
}
`;

/**
 * @param {{
 *   t: import('i18next').TFunction,
 *   catalog: { modules?: string[], actions?: string[] } | null,
 *   matrix: Array<{ module: string, actions: Record<string, boolean> }>,
 *   editable?: boolean,
 *   editMode?: boolean,
 *   draft?: Record<string, string[]>,
 *   onToggle?: (moduleName: string, actionName: string, checked: boolean) => void,
 *   headerAction?: import('react').ReactNode,
 *   warning?: import('react').ReactNode,
 * }} props
 */
export function StaffPermissionMatrix({
  t,
  catalog,
  matrix,
  editable = false,
  editMode = false,
  draft = {},
  onToggle,
  headerAction = null,
  warning = null,
}) {
  const modules = catalog?.modules ?? [];
  const actions = catalog?.actions ?? [];

  if (!modules.length || !actions.length) {
    return null;
  }

  const readDraftValue = (moduleName, actionName, fallback) => {
    if (!editMode) return fallback;
    const grantedActions = Array.isArray(draft?.[moduleName]) ? draft[moduleName] : [];
    return grantedActions.includes(actionName);
  };

  return (
    <div className="staff-permission-matrix">
      <style>{STAFF_PERMISSION_MATRIX_STYLES}</style>
      {(headerAction || warning) && (
        <div className="staff-permission-matrix__header">
          <div>{warning}</div>
          {headerAction}
        </div>
      )}

      <div className="staff-permission-matrix__table-wrap">
        <table className="staff-permission-matrix__table">
          <thead>
            <tr>
              <th>{t('staff.management.permissions.table.module')}</th>
              {actions.map((actionName) => (
                <th key={actionName}>{getPermissionActionLabel(t, actionName)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((moduleName) => {
              const row = matrix.find((item) => item.module === moduleName);
              return (
                <tr key={moduleName}>
                  <td className="staff-permission-matrix__module">
                    {getPermissionModuleLabel(t, moduleName)}
                  </td>
                  {actions.map((actionName) => {
                    const granted = readDraftValue(
                      moduleName,
                      actionName,
                      Boolean(row?.actions?.[actionName]),
                    );

                    return (
                      <td key={`${moduleName}-${actionName}`}>
                        {editable && editMode ? (
                          <input
                            type="checkbox"
                            className="staff-permission-matrix__checkbox"
                            checked={granted}
                            onChange={(event) =>
                              onToggle?.(moduleName, actionName, event.target.checked)}
                            aria-label={t('staff.management.permissions.togglePermission', {
                              module: getPermissionModuleLabel(t, moduleName),
                              action: getPermissionActionLabel(t, actionName),
                            })}
                          />
                        ) : granted ? (
                          <span className="staff-permission-matrix__grant" aria-label={t('staff.management.permissions.granted')}>
                            ✓
                          </span>
                        ) : (
                          <span className="staff-permission-matrix__deny" aria-label={t('staff.management.permissions.denied')}>
                            {t('common.empty')}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StaffPermissionMatrix;
