import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { Button } from '../../../components/Button.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { DashboardToast } from '../../../components/DashboardToast.jsx';
import { usePaginatedResource } from '../../../hooks/use-paginated-resource.js';
import { formatDate } from '@enderass/shared/utils';
import { notificationService } from '@enderass/shared/services';

const PAGE_SIZE = 20;

const FILTER_TABS = Object.freeze([
  { key: 'all', status: undefined },
  { key: 'unread', status: 'sent' },
  { key: 'read', status: 'read' },
]);

export function NotificationCenterView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';

  const [filterTab, setFilterTab] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const statusFilter = FILTER_TABS.find((tab) => tab.key === filterTab)?.status;

  const fetchFn = useCallback(
    async (params) => {
      const response = await notificationService.listNotifications({
        ...params,
        status: statusFilter,
      });
      return {
        items: response?.notifications ?? [],
        pagination: response?.pagination,
      };
    },
    [statusFilter],
  );

  const {
    page,
    setPage,
    search,
    setSearch,
    items: notifications,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = usePaginatedResource({
    fetchFn,
    pageSize: PAGE_SIZE,
    itemsKey: 'items',
    initialTab: 'all',
  });

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('notifications.center.searchPlaceholder'),
  });

  useEffect(() => {
    setPage(1);
  }, [filterTab, setPage]);

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const handleMarkRead = async (id) => {
    setActionLoading(true);
    try {
      await notificationService.markAsRead(id);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('notifications.center.markReadFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await notificationService.markAllRead();
      await refetch();
      showToast(t('notifications.center.markAllSuccess'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('notifications.center.markAllFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const footerSummary = t('notifications.center.table.footer', {
    from: notifications.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: (page - 1) * PAGE_SIZE + notifications.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      <header className="kyc-management-page__header">
        <Button variant="secondary" disabled={actionLoading} onClick={handleMarkAllRead}>
          {t('notifications.center.markAllRead')}
        </Button>
      </header>

      <section className="dashboard-filters kyc-management-page__filters" aria-label={t('notifications.center.filters')}>
        <div className="dashboard-filters__tabs" role="tablist">
          {FILTER_TABS.map((tab) => {
            const isActive = filterTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'dashboard-filters__tab',
                  isActive ? 'dashboard-filters__tab--active' : '',
                  'dashboard-filters__tab--uppercase',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setFilterTab(tab.key)}
              >
                {t(`notifications.center.tabs.${tab.key}`)}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="kyc-management-page__alert" role="alert">
          {error}
        </p>
      )}

      <section className="dashboard-table-panel" aria-live="polite">
        {loading && <p className="dashboard-table__empty">{t('admin.loading')}</p>}

        {!loading && notifications.length === 0 && (
          <p className="dashboard-table__empty">{t('notifications.center.empty')}</p>
        )}

        {!loading && notifications.length > 0 && (
          <ul className="notification-center-list">
            {notifications.map((notification) => {
              const isUnread = !notification.readAt && notification.status !== 'read';
              return (
                <li
                  key={notification.id}
                  className={`notification-center-list__item${isUnread ? ' notification-center-list__item--unread' : ''}`}
                >
                  <div className="notification-center-list__main">
                    <div className="notification-center-list__header">
                      <strong>{notification.title}</strong>
                      <StatusPill
                        label={t(`notifications.center.status.${isUnread ? 'unread' : 'read'}`)}
                        variant={isUnread ? 'pending' : 'default'}
                      />
                    </div>
                    <p className="notification-center-list__message">{notification.message}</p>
                    <span className="notification-center-list__meta">
                      {formatDate(notification.sentAt || notification.createdAt, locale)}
                    </span>
                  </div>
                  {isUnread && (
                    <Button
                      variant="secondary"
                      disabled={actionLoading}
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      {t('notifications.center.markRead')}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="dashboard-table__footer kyc-management-page__footer">
          <span>{footerSummary}</span>
          <div className="kyc-pagination">
            <button
              type="button"
              className="kyc-pagination__btn"
              disabled={page <= 1 || loading}
              onClick={goToPrevPage}
            >
              {t('admin.pagination.prev')}
            </button>
            <span className="kyc-pagination__info">
              {t('admin.pagination.page', { page, pages: pagination.pages || 1 })}
            </span>
            <button
              type="button"
              className="kyc-pagination__btn"
              disabled={page >= (pagination.pages || 1) || loading}
              onClick={goToNextPage}
            >
              {t('admin.pagination.next')}
            </button>
          </div>
        </div>
      </section>

      <DashboardToast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}

export default NotificationCenterView;
