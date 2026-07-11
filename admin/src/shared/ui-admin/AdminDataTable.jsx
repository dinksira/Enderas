import { useTranslation } from 'react-i18next';
import { LogoSpinner } from '../ui/index.js';
import { PaginationBar } from './PaginationBar.jsx';

/**
 * @param {{
 *   tabs?: Array<{ key: string, label: string, count?: number, uppercase?: boolean }>,
 *   activeTab?: string,
 *   onTabChange?: (key: string) => void,
 *   tabCounts?: Record<string, number>,
 *   searchValue?: string,
 *   onSearchChange?: (value: string) => void,
 *   searchPlaceholder?: string,
 *   toolbarExtra?: import('react').ReactNode,
 *   loading?: boolean,
 *   error?: string,
 *   onRetry?: () => void,
 *   columns: string[],
 *   getColumnLabel?: (key: string) => string,
 *   children?: import('react').ReactNode,
 *   emptyIcon?: import('react').ReactNode,
 *   emptyMessage?: string,
 *   footerSummary?: string,
 *   page?: number,
 *   pages?: number,
 *   onPrevPage?: () => void,
 *   onNextPage?: () => void,
 *   showPagination?: boolean,
 *   className?: string,
 * }} props
 */
export function AdminDataTable({
  tabs,
  activeTab,
  onTabChange,
  tabCounts,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  toolbarExtra,
  loading = false,
  error = '',
  onRetry,
  columns,
  getColumnLabel,
  children,
  emptyIcon,
  emptyMessage,
  footerSummary,
  page = 1,
  pages = 1,
  onPrevPage,
  onNextPage,
  showPagination = true,
  className = '',
}) {
  const { t } = useTranslation();
  const hasTabs = Boolean(tabs?.length);
  const hasSearch = typeof onSearchChange === 'function';
  const hasToolbar = hasTabs || hasSearch || toolbarExtra;
  const colSpan = columns.length;

  const resolveLabel = (key) => {
    if (getColumnLabel) {
      return getColumnLabel(key);
    }
    return key;
  };

  return (
    <section className={['admin-data-table', className].filter(Boolean).join(' ')} aria-live="polite">
      {error && (
        <div className="admin-data-table__alert" role="alert">
          <span>{error}</span>
          {onRetry && (
            <button type="button" className="admin-data-table__retry" onClick={onRetry}>
              {t('admin.retry')}
            </button>
          )}
        </div>
      )}

      {hasToolbar && (
        <div className="admin-data-table__toolbar">
          {hasTabs && (
            <div className="dashboard-filters__tabs" role="tablist">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const count = tab.count ?? tabCounts?.[tab.key];
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={[
                      'dashboard-filters__tab',
                      isActive ? 'dashboard-filters__tab--active' : '',
                      tab.uppercase ? 'dashboard-filters__tab--uppercase' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onTabChange?.(tab.key)}
                  >
                    {tab.label}
                    {typeof count === 'number' ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          )}

          {(hasSearch || toolbarExtra) && (
            <div className="admin-data-table__toolbar-row">
              {hasSearch && (
                <input
                  type="search"
                  className="admin-data-table__search"
                  value={searchValue ?? ''}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder || t('admin.searchPlaceholder')}
                  aria-label={searchPlaceholder || t('admin.searchPlaceholder')}
                />
              )}
              {toolbarExtra}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-table-panel admin-data-table__panel">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                {columns.map((columnKey) => (
                  <th key={columnKey} scope="col" className="dashboard-table__head-cell">
                    {resolveLabel(columnKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={colSpan} className="dashboard-table__empty">
                    <LogoSpinner size={24} />
                  </td>
                </tr>
              )}

              {!loading && !children && (
                <tr>
                  <td colSpan={colSpan} className="dashboard-table__empty">
                    <div className="admin-data-table__empty">
                      {emptyIcon}
                      <span>{emptyMessage || t('admin.emptyDefault')}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && children}
            </tbody>
          </table>
        </div>

        {(footerSummary || showPagination) && (
          <div className="dashboard-table__footer admin-data-table__footer">
            {footerSummary && <span>{footerSummary}</span>}
            {showPagination && onPrevPage && onNextPage && (
              <PaginationBar
                page={page}
                pages={pages}
                loading={loading}
                onPrev={onPrevPage}
                onNext={onNextPage}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminDataTable;
