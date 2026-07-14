import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizationConfigForm } from '../components/localization-config-form.jsx';

export function SettingsView() {
  const { t } = useTranslation();
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });

  return (
    <section className="settings-page">
      <LocalizationConfigForm
        onSaved={() => {
          setToast({ open: true, message: t('settings.saveSuccess'), variant: 'success' });
        }}
      />

      {toast.open && (
        <div className={`settings-toast settings-toast--${toast.variant}`} role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {toast.variant === 'success' ? (
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
            )}
          </svg>
          <span>{toast.message}</span>
          <button type="button" className="settings-toast__close" onClick={() => setToast((c) => ({ ...c, open: false }))} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}
    </section>
  );
}

export default SettingsView;
