import {
  countGrantedPermissions,
  getModuleAccessSummary,
  getModuleCatalogActions,
  toggleModuleDraft,
  togglePermissionDraft,
} from '../utils/staff-permission-utils.js';
import { getPermissionActionLabel, getPermissionModuleLabel } from '../utils/staff-management-utils.js';

const STAFF_PERMISSION_MATRIX_STYLES = `
.staff-permission-matrix {
  display: flex;
  flex-direction: column;
  gap: var(--core-space-4);
}

.staff-permission-matrix__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--core-space-3);
  padding: var(--core-space-3) var(--core-space-4);
  border: 1px solid var(--dashboard-border);
  border-radius: var(--core-radius-md);
  background: var(--dashboard-surface-bg);
}

.staff-permission-matrix__summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.staff-permission-matrix__summary-title {
  margin: 0;
  color: var(--dashboard-text-primary);
  font-size: var(--core-font-size-body-sm);
  font-weight: var(--core-font-weight-semibold);
}

.staff-permission-matrix__summary-meta {
  margin: 0;
  color: var(--dashboard-text-subtle);
  font-size: 12px;
}

.staff-permission-matrix__banner {
  padding: var(--core-space-3);
  border-left: 3px solid var(--semantic-color-warning);
  border-radius: var(--core-radius-sm);
  background: color-mix(in srgb, var(--semantic-color-warning) 10%, transparent);
  color: var(--dashboard-text-primary);
  font-size: 12px;
  line-height: var(--core-line-height-normal);
}

.staff-permission-matrix__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--core-space-3);
}

.staff-permission-matrix__card {
  display: flex;
  flex-direction: column;
  gap: var(--core-space-3);
  padding: var(--core-space-4);
  border: 1px solid var(--dashboard-border);
  border-radius: var(--core-radius-md);
  background: var(--dashboard-panel-bg, #fff);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.staff-permission-matrix__card--enabled {
  border-color: color-mix(in srgb, var(--semantic-color-status-success) 35%, var(--dashboard-border));
  box-shadow: 0 1px 0 color-mix(in srgb, var(--semantic-color-status-success) 12%, transparent);
}

.staff-permission-matrix__card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--core-space-3);
}

.staff-permission-matrix__module {
  margin: 0;
  color: var(--dashboard-text-primary);
  font-size: var(--core-font-size-body-sm);
  font-weight: var(--core-font-weight-semibold);
}

.staff-permission-matrix__module-meta {
  margin: 4px 0 0;
  color: var(--dashboard-text-subtle);
  font-size: 11px;
}

.staff-permission-matrix__module-toggle {
  flex-shrink: 0;
  width: 42px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: var(--dashboard-border);
  cursor: pointer;
  position: relative;
  transition: background 0.15s ease;
}

.staff-permission-matrix__module-toggle:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.staff-permission-matrix__module-toggle--on {
  background: var(--semantic-color-status-success);
}

.staff-permission-matrix__module-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}

.staff-permission-matrix__module-toggle--on .staff-permission-matrix__module-toggle-thumb {
  transform: translateX(18px);
}

.staff-permission-matrix__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--core-space-2);
}

.staff-permission-matrix__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--dashboard-border);
  border-radius: 999px;
  background: var(--dashboard-surface-bg);
  color: var(--dashboard-text-subtle);
  font-size: 11px;
  line-height: 1;
}

.staff-permission-matrix__chip--granted {
  border-color: color-mix(in srgb, var(--semantic-color-status-success) 35%, var(--dashboard-border));
  background: color-mix(in srgb, var(--semantic-color-status-success) 10%, transparent);
  color: var(--dashboard-text-primary);
  font-weight: var(--core-font-weight-semibold);
}

.staff-permission-matrix__chip input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--semantic-color-status-success);
}

.staff-permission-matrix__chip--readonly {
  padding-inline: 12px;
}

.staff-permission-matrix__empty {
  color: var(--dashboard-text-subtle);
  font-size: 12px;
  font-style: italic;
}
`;

/**
 * @param {{
 *   t: import('i18next').TFunction,
 *   catalog: { modules?: string[], actions?: string[], moduleActions?: Record<string, string[]> } | null,
 *   matrix: Array<{ module: string, actions: Record<string, boolean> }>,
 *   editable?: boolean,
 *   editMode?: boolean,
 *   draft?: Record<string, string[]>,
 *   onDraftChange?: (nextDraft: Record<string, string[]>) => void,
 *   headerAction?: import('react').ReactNode,
 *   warning?: import('react').ReactNode,
 *   roleLabel?: string|null,
 *   affectedStaffCount?: number,
 * }} props
 */
export function StaffPermissionMatrix({
  t,
  catalog,
  matrix,
  editable = false,
  editMode = false,
  draft = {},
  onDraftChange,
  headerAction = null,
  warning = null,
  roleLabel = null,
  affectedStaffCount = 0,
}) {
  const modules = catalog?.modules ?? [];
  const hasCatalog = modules.length > 0 && (
    Object.keys(catalog?.moduleActions ?? {}).length > 0 || (catalog?.actions ?? []).length > 0
  );

  if (!hasCatalog) {
    return null;
  }

  const sourceActions = editMode
    ? draft
    : Object.fromEntries(
        matrix
          .filter((row) => Object.values(row.actions || {}).some(Boolean))
          .map((row) => [
            row.module,
            getModuleCatalogActions(catalog, row.module).filter((actionName) =>
              Boolean(row.actions?.[actionName])),
          ]),
      );

  const { granted, total } = countGrantedPermissions(sourceActions, modules, catalog);

  const readDraftValue = (moduleName, actionName, fallback) => {
    if (!editMode) return fallback;
    const grantedActions = Array.isArray(draft?.[moduleName]) ? draft[moduleName] : [];
    return grantedActions.includes(actionName);
  };

  const handleToggle = (moduleName, actionName, checked) => {
    if (!onDraftChange) return;
    onDraftChange(togglePermissionDraft(draft, moduleName, actionName, checked));
  };

  const handleModuleToggle = (moduleName, checked) => {
    if (!onDraftChange) return;
    onDraftChange(
      toggleModuleDraft(draft, moduleName, getModuleCatalogActions(catalog, moduleName), checked),
    );
  };

  return (
    <div className="staff-permission-matrix">
      <style>{STAFF_PERMISSION_MATRIX_STYLES}</style>

      <div className="staff-permission-matrix__toolbar">
        <div className="staff-permission-matrix__summary">
          <p className="staff-permission-matrix__summary-title">
            {roleLabel
              ? t('staff.management.permissions.roleSummary', { role: roleLabel })
              : t('staff.management.permissions.sectionTitle')}
          </p>
          <p className="staff-permission-matrix__summary-meta">
            {t('staff.management.permissions.grantedSummary', { granted, total })}
            {affectedStaffCount > 0
              ? ` · ${t('staff.management.permissions.affectedStaff', { count: affectedStaffCount })}`
              : ''}
          </p>
        </div>
        {headerAction}
      </div>

      {warning && <div className="staff-permission-matrix__banner">{warning}</div>}

      <div className="staff-permission-matrix__grid">
        {modules.map((moduleName) => {
          const row = matrix.find((item) => item.module === moduleName);
          const moduleCatalogActions = getModuleCatalogActions(catalog, moduleName);
          const moduleSummary = getModuleAccessSummary(
            editMode ? draft : sourceActions,
            moduleName,
            catalog,
          );
          const moduleEnabled = moduleSummary !== 'none';
          const grantedActionCount = moduleCatalogActions.filter((actionName) =>
            readDraftValue(moduleName, actionName, Boolean(row?.actions?.[actionName]))).length;

          if (moduleCatalogActions.length === 0) {
            return null;
          }

          return (
            <article
              key={moduleName}
              className={`staff-permission-matrix__card${moduleEnabled ? ' staff-permission-matrix__card--enabled' : ''}`}
            >
              <div className="staff-permission-matrix__card-header">
                <div>
                  <h4 className="staff-permission-matrix__module">
                    {getPermissionModuleLabel(t, moduleName)}
                  </h4>
                  <p className="staff-permission-matrix__module-meta">
                    {moduleSummary === 'full'
                      ? t('staff.management.permissions.fullAccess')
                      : moduleSummary === 'partial'
                        ? t('staff.management.permissions.partialAccess', { count: grantedActionCount })
                        : t('staff.management.permissions.noAccess')}
                  </p>
                </div>

                {editable && editMode ? (
                  <button
                    type="button"
                    className={`staff-permission-matrix__module-toggle${moduleEnabled ? ' staff-permission-matrix__module-toggle--on' : ''}`}
                    onClick={() => handleModuleToggle(moduleName, !moduleEnabled)}
                    aria-pressed={moduleEnabled}
                    aria-label={t('staff.management.permissions.toggleModule', {
                      module: getPermissionModuleLabel(t, moduleName),
                    })}
                  >
                    <span className="staff-permission-matrix__module-toggle-thumb" />
                  </button>
                ) : null}
              </div>

              <div className="staff-permission-matrix__actions">
                {moduleCatalogActions.map((actionName) => {
                  const granted = readDraftValue(
                    moduleName,
                    actionName,
                    Boolean(row?.actions?.[actionName]),
                  );

                  if (editable && editMode) {
                    return (
                      <label
                        key={`${moduleName}-${actionName}`}
                        className={`staff-permission-matrix__chip${granted ? ' staff-permission-matrix__chip--granted' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={granted}
                          onChange={(event) =>
                            handleToggle(moduleName, actionName, event.target.checked)}
                        />
                        <span>{getPermissionActionLabel(t, actionName)}</span>
                      </label>
                    );
                  }

                  if (!granted) {
                    return null;
                  }

                  return (
                    <span
                      key={`${moduleName}-${actionName}`}
                      className="staff-permission-matrix__chip staff-permission-matrix__chip--granted staff-permission-matrix__chip--readonly"
                    >
                      {getPermissionActionLabel(t, actionName)}
                    </span>
                  );
                })}

                {!editMode && grantedActionCount === 0 ? (
                  <span className="staff-permission-matrix__empty">
                    {t('staff.management.permissions.none')}
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default StaffPermissionMatrix;
