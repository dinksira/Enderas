import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RequestAuctionWizardModal } from '../components/RequestAuctionWizardModal.jsx';

export function SubmitAssetView() {
  const { t } = useTranslation();
  const [wizardOpen, setWizardOpen] = useState(true);

  return (
    <section className="asset-page">
      <header className="asset-page__header asset-page__header--row">
        <div>
          <h1 className="asset-page__title">{t('assets.submit.title')}</h1>
          <p className="asset-page__lead">{t('assets.submit.subtitle')}</p>
        </div>
        <button
          type="button"
          className="dashboard-filters__cta"
          onClick={() => setWizardOpen(true)}
        >
          {t('assets.requestWizard.toolbar.cta')}
        </button>
      </header>

      {!wizardOpen && (
        <div className="request-auction-wizard__landing">
          <p className="request-auction-wizard__landing-text">
            {t('assets.requestWizard.landingHint')}
          </p>
          <button
            type="button"
            className="dashboard-filters__cta"
            onClick={() => setWizardOpen(true)}
          >
            {t('assets.requestWizard.toolbar.cta')}
          </button>
        </div>
      )}

      <RequestAuctionWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </section>
  );
}

export default SubmitAssetView;
