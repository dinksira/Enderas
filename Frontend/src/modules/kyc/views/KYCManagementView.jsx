import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth-store.js';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { kycService } from '../services/kyc.service.js';
import { KYCApproveConfirmModal } from '../components/KYCApproveConfirmModal.jsx';
import { KYCRejectModal } from '../components/KYCRejectModal.jsx';
import { KYCManagementDetailDrawer } from '../components/KYCManagementDetailDrawer.jsx';
import {
  countDocuments,
  formatDate,
  getApplicantName,
  getDisplayStatus,
  getStatusPillClass,
  KYC_MANAGEMENT_ROLES,
  KYC_TAB_KEYS,
} from '../utils/kyc-management-utils.js';

const TABLE_HEADER_KEYS = [
  'applicant_name',
  'user_type',
  'mobile_number',
  'submission_date',
  'documents_count',
  'status',
  'actions',
];

const PAGE_SIZE = 20;

export function KYCManagementView() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';

  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [kycs, setKycs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedKycId, setSelectedKycId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const loadKYCs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await kycService.listKYCs({
        page,
        limit: PAGE_SIZE,
        tab: activeTab === 'all' ? undefined : activeTab,
        search: search.trim() || undefined,
        includeStats: true,
      });

      setKycs(response?.kycs || []);
      setPagination(response?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
      if (response?.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      setError(err.message || t('kyc.loadFailed'));
      setKycs([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, t]);

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('kyc.management.searchPlaceholder'),
  });

  useEffect(() => {
    loadKYCs();
  }, [loadKYCs]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const tabCounts = useMemo(() => {
    if (!stats) {
      return { pending: 0, under_review: 0, approved: 0, rejected: 0 };
    }
    return {
      pending: stats.pending ?? 0,
      under_review: stats.under_review ?? 0,
      approved: stats.approved ?? 0,
      rejected: stats.rejected ?? 0,
    };
  }, [stats]);

  const openDrawer = (kycId) => {
    setSelectedKycId(kycId);
    setDrawerOpen(true);
  };

  useEffect(() => {
    const kycId = searchParams.get('kycId');
    if (!kycId) return;

    openDrawer(kycId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('kycId');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedKycId(null);
    setReviewNotes('');
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;

    setActionLoading(true);
    setError('');

    try {
      await kycService.approveKYC(approveTarget.id, reviewNotes || null);
      setApproveTarget(null);
      setReviewNotes('');
      closeDrawer();
      await loadKYCs();
    } catch (err) {
      setError(err.message || t('kyc.approveFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (rejectionReason) => {
    if (!rejectTarget) return;

    setActionLoading(true);
    setError('');

    try {
      await kycService.rejectKYC(rejectTarget.id, rejectionReason, reviewNotes || null);
      setRejectTarget(null);
      setReviewNotes('');
      closeDrawer();
      await loadKYCs();
    } catch (err) {
      setError(err.message || t('kyc.rejectFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  if (!KYC_MANAGEMENT_ROLES.includes(user?.roleCode)) {
    return <Navigate to="/app/access-denied" replace />;
  }

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      <section className="dashboard-filters kyc-management-page__filters" aria-label={t('kyc.statusFilters')}>
        <div className="dashboard-filters__tabs" role="tablist" aria-label={t('kyc.statusFilters')}>
          {KYC_TAB_KEYS.map((tabKey) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'dashboard-filters__tab',
                  isActive ? 'dashboard-filters__tab--active' : '',
                  tabKey !== 'all' ? 'dashboard-filters__tab--uppercase' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setActiveTab(tabKey)}
              >
                {t(`kyc.management.tabs.${tabKey}`)}
                {stats && tabKey !== 'all' && ` (${tabCounts[tabKey]})`}
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
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                {TABLE_HEADER_KEYS.map((headerKey) => (
                  <th key={headerKey} scope="col" className="dashboard-table__head-cell">
                    {t(`kyc.management.table.headers.${headerKey}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty">
                    {t('kyc.management.table.loading')}
                  </td>
                </tr>
              )}

              {!loading && kycs.length === 0 && (
                <tr>
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty">
                    {t('kyc.noSubmissions')}
                  </td>
                </tr>
              )}

              {!loading &&
                kycs.map((kyc) => {
                  const displayStatus = getDisplayStatus(kyc);
                  return (
                    <tr
                      key={kyc.id}
                      className="dashboard-table__row kyc-management-page__row"
                      onClick={() => openDrawer(kyc.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openDrawer(kyc.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={t('kyc.management.openDetail', { name: getApplicantName(kyc) })}
                    >
                      <td className="dashboard-table__cell dashboard-table__cell--strong">
                        {getApplicantName(kyc) || t('kyc.unknownUser')}
                      </td>
                      <td className="dashboard-table__cell dashboard-table__cell--muted">
                        {t(`kyc.management.userTypes.${kyc.user?.user_type || 'individual'}`)}
                      </td>
                      <td className="dashboard-table__cell">{kyc.user?.mobile_number || '—'}</td>
                      <td className="dashboard-table__cell">{formatDate(kyc.created_at, locale)}</td>
                      <td className="dashboard-table__cell dashboard-table__cell--strong">
                        {countDocuments(kyc)}
                      </td>
                      <td className="dashboard-table__cell">
                        <span className={getStatusPillClass(kyc)}>
                          {t(`kyc.management.displayStatus.${displayStatus}`)}
                        </span>
                      </td>
                      <td className="dashboard-table__cell">
                        <div className="dashboard-actions">
                          <button
                            type="button"
                            className="dashboard-actions__btn"
                            aria-label={t('kyc.management.viewAction')}
                            onClick={(event) => {
                              event.stopPropagation();
                              openDrawer(kyc.id);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z" stroke="currentColor" strokeWidth="1.8" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="dashboard-table__footer kyc-management-page__footer">
          <span>
            {t('kyc.management.table.footer', {
              from: kycs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
              to: (page - 1) * PAGE_SIZE + kycs.length,
              total: pagination.total,
            })}
          </span>
          <div className="kyc-pagination">
            <button
              type="button"
              className="kyc-pagination__btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t('kyc.management.pagination.prev')}
            </button>
            <span className="kyc-pagination__info">
              {t('kyc.management.pagination.page', { page, pages: pagination.pages || 1 })}
            </span>
            <button
              type="button"
              className="kyc-pagination__btn"
              disabled={page >= (pagination.pages || 1) || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('kyc.management.pagination.next')}
            </button>
          </div>
        </div>
      </section>

      <KYCManagementDetailDrawer
        kycId={selectedKycId}
        open={drawerOpen}
        actionLoading={actionLoading}
        onClose={closeDrawer}
        onApprove={(kyc) => setApproveTarget(kyc)}
        onReject={(kyc) => setRejectTarget(kyc)}
        onMarkUnderReview={() => loadKYCs()}
        onRefresh={loadKYCs}
      />

      <KYCApproveConfirmModal
        open={Boolean(approveTarget)}
        loading={actionLoading}
        applicantName={getApplicantName(approveTarget)}
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveTarget(null)}
      />

      <KYCRejectModal
        open={Boolean(rejectTarget)}
        loading={actionLoading}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}

export default KYCManagementView;
