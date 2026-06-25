import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RequestAuctionWizardModal } from '../components/RequestAuctionWizardModal.jsx';
import { AssetDetailDrawer } from '../components/AssetDetailDrawer.jsx';
import { useMyAssets } from '../hooks/use-my-assets.js';
import { normalizeAssetStatus, statusPillClass } from '../utils/asset-form-utils.js';

export function MyAssetsView() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { records, loading, error, refetch } = useMyAssets();
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setWizardOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    [records],
  );

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleWizardSuccess = () => {
    setWizardOpen(false);
    refetch();
  };

  return (
    <section className="asset-page">
      <header className="asset-page__header asset-page__header--row">
        <div>
          <h1 className="asset-page__title">{t('assets.my.title')}</h1>
          <p className="asset-page__lead">{t('assets.my.subtitle')}</p>
        </div>
        <button
          type="button"
          className="dashboard-filters__cta"
          onClick={() => setWizardOpen(true)}
        >
          {t('assets.my.submitNew')}
        </button>
      </header>

      <section className="dashboard-table-panel" aria-live="polite">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                <th scope="col" className="dashboard-table__head-cell">
                  {t('assets.table.headers.title')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('assets.table.headers.type')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('assets.table.headers.submitted')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('assets.table.headers.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="dashboard-table__empty">
                    {t('dashboard.table.loading')}
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={4} className="dashboard-table__empty" role="alert">
                    {t('dashboard.table.error', { message: error })}
                  </td>
                </tr>
              )}

              {!loading && !error && sortedRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="dashboard-table__empty">
                    {t('assets.my.empty')}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                sortedRecords.map((record) => {
                  const displayStatus = normalizeAssetStatus(record.status);
                  return (
                    <tr
                      key={record.id}
                      className="dashboard-table__row kyc-management-page__row"
                      onClick={() => openDrawer(record.id)}
                      tabIndex={0}
                      role="button"
                    >
                      <td className="dashboard-table__cell dashboard-table__cell--strong">
                        {record.title}
                        {displayStatus === 'REJECTED' && record.rejectionReason && (
                          <p className="asset-page__rejection-reason" role="note">
                            {t('assets.my.rejectionReason', { reason: record.rejectionReason })}
                          </p>
                        )}
                      </td>
                      <td className="dashboard-table__cell dashboard-table__cell--muted">
                        {t(`assets.types.${record.assetType}`, { defaultValue: record.assetType })}
                      </td>
                      <td className="dashboard-table__cell">
                        {record.submittedAtFormatted || '—'}
                      </td>
                      <td className="dashboard-table__cell">
                        <span className={`asset-status-pill ${statusPillClass(record.status)}`}>
                          {t(`assets.status.${displayStatus.toLowerCase()}`, {
                            defaultValue: displayStatus.replace(/_/g, ' '),
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="dashboard-table__footer">
            {t('dashboard.table.footer_displayed', { count: sortedRecords.length })}
            <button type="button" className="asset-page__refresh" onClick={refetch}>
              {t('assets.my.refresh')}
            </button>
          </div>
        )}
      </section>

      <AssetDetailDrawer
        assetId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <RequestAuctionWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
    </section>
  );
}

export default MyAssetsView;
