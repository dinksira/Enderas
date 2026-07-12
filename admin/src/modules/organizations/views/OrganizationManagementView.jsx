import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable, StatusPill } from '@enderass/shared/ui-admin';
import { Button, DashboardToast } from '@enderass/shared/ui';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { organizationService } from '@enderass/shared/services';
import { OrganizationCreateModal } from '../components/OrganizationCreateModal.jsx';
import { OrganizationDetailModal } from '../components/OrganizationDetailModal.jsx';
import { useOrganizations } from '../hooks/use-organizations.js';
import {
  ORG_TAB_KEYS,
  ORG_TABLE_COLUMNS,
  ORG_PAGE_SIZE,
  formatDate,
  formatDisplayValue,
  getOrgDisplayName,
  getOrgStatusVariant,
} from '../utils/organization-utils.js';

export function OrganizationManagementView() {
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
    items: organizations,
    pagination,
    stats,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useOrganizations();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('organizations.management.searchPlaceholder'),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRefreshTrigger, setModalRefreshTrigger] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  const openModal = (orgId) => {
    setSelectedOrgId(orgId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrgId(null);
  };

  const refreshModalAndTable = async () => {
    setModalRefreshTrigger((current) => current + 1);
    await refetch();
  };

  const canCreate = can(MODULES.ORGANIZATIONS, ACTIONS.CREATE);
  const emptyLabel = t('common.empty');

  const tabs = useMemo(
    () =>
      ORG_TAB_KEYS.map((tabKey) => ({
        key: tabKey,
        label: t(`organizations.management.tabs.${tabKey}`),
        count:
          tabKey === 'all'
            ? stats?.all
            : tabKey === 'active'
              ? stats?.active
              : tabKey === 'kyc_pending'
                ? stats?.kyc_pending
                : stats?.suspended,
        uppercase: tabKey !== 'all',
      })),
    [stats, t],
  );

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
  };

  const handleCreate = async (payload) => {
    setActionLoading(true);

    try {
      await organizationService.createOrganization(payload);
      setCreateOpen(false);
      await refetch();
      showToast(t('organizations.management.createModal.success'), 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('organizations.management.createModal.failed');
      showToast(message, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const footerSummary = t('organizations.management.table.footer', {
    from: organizations.length === 0 ? 0 : (page - 1) * ORG_PAGE_SIZE + 1,
    to: (page - 1) * ORG_PAGE_SIZE + organizations.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      {canCreate && (
        <header className="kyc-management-page__header">
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            {t('organizations.management.createOrg')}
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
        columns={ORG_TABLE_COLUMNS}
        getColumnLabel={(key) => t(`organizations.management.table.headers.${key}`)}
        emptyMessage={t('organizations.management.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      >
        {organizations.map((org) => (
          <tr
            key={org.id}
            className="dashboard-table__row kyc-management-page__row"
            tabIndex={0}
            role="button"
            onClick={() => openModal(org.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(org.id); } }}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">
              {formatDisplayValue(getOrgDisplayName(org), emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              {formatDisplayValue(org.tinNumber, emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              {formatDisplayValue(org.mobileNumber, emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              {formatDisplayValue(org.email, emptyLabel)}
            </td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`organizations.management.status.${org.status}`, org.status)}
                variant={getOrgStatusVariant(org.status)}
              />
            </td>
            <td className="dashboard-table__cell">
              {formatDate(org.createdAt, locale, emptyLabel)}
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <OrganizationDetailModal
        orgId={selectedOrgId}
        open={modalOpen}
        actionLoading={actionLoading}
        refreshTrigger={modalRefreshTrigger}
        onClose={closeModal}
        onRefreshTable={refetch}
      />

      <OrganizationCreateModal
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

export default OrganizationManagementView;
