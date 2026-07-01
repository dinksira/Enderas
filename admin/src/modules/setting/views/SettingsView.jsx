import { DashboardToast } from '@enderass/shared/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizationConfigForm } from '../components/localization-config-form.jsx';

export function SettingsView() {
  const { t } = useTranslation();
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  return (
    <section className="setting-view">
      <LocalizationConfigForm
        onSaved={() => {
          setToast({ open: true, message: t('settings.saveSuccess'), variant: 'success' });
        }}
      />

      <DashboardToast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </section>
  );
}

export default SettingsView;
