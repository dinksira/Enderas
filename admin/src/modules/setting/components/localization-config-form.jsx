import { Button, Input } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/use-settings.js';

const SUPPORTED_LANGUAGE_OPTIONS = Object.freeze([
  { code: 'en', labelKey: 'settings.localization.languages.en' },
  { code: 'am', labelKey: 'settings.localization.languages.am' },
]);

/**
 * @param {{
 *   onSaved?: () => void,
 * }} props
 */
export function LocalizationConfigForm({ onSaved }) {
  const { t } = useTranslation();
  const { settings, loading, saving, error, saveError, saveSettings } = useSettings();

  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [supportedLanguages, setSupportedLanguages] = useState(['en', 'am']);
  const [defaultCurrency, setDefaultCurrency] = useState('ETB');
  const [defaultCpoPercentage, setDefaultCpoPercentage] = useState('1');
  const [minBidIncrement, setMinBidIncrement] = useState('1000');
  const [otpTtlSeconds, setOtpTtlSeconds] = useState('300');
  const [maxFileSize, setMaxFileSize] = useState('5242880');

  useEffect(() => {
    if (!settings) return;

    setDefaultLanguage(settings['localization.default_language'] ?? 'en');
    setSupportedLanguages(settings['localization.supported_languages'] ?? ['en', 'am']);
    setDefaultCurrency(settings['auction.default_currency'] ?? 'ETB');
    setDefaultCpoPercentage(String(settings['auction.default_cpo_percentage'] ?? 1));
    setMinBidIncrement(String(settings['auction.min_bid_increment'] ?? 1000));
    setOtpTtlSeconds(String(settings['otp.ttl_seconds'] ?? 300));
    setMaxFileSize(String(settings['storage.max_file_size'] ?? 5242880));
  }, [settings]);

  const toggleLanguage = (code) => {
    setSupportedLanguages((current) => {
      if (current.includes(code)) {
        const next = current.filter((item) => item !== code);
        return next.length > 0 ? next : current;
      }
      return [...current, code];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const saved = await saveSettings({
      'localization.default_language': defaultLanguage,
      'localization.supported_languages': supportedLanguages,
      'auction.default_currency': defaultCurrency.trim(),
      'auction.default_cpo_percentage': Number(defaultCpoPercentage),
      'auction.min_bid_increment': Number(minBidIncrement),
      'otp.ttl_seconds': Number(otpTtlSeconds),
      'storage.max_file_size': Number(maxFileSize),
    });

    if (saved) {
      onSaved?.();
    }
  };

  if (loading) {
    return <p className="setting-view__status">{t('settings.loading')}</p>;
  }

  if (error) {
    return (
      <p className="setting-view__status setting-view__status--error" role="alert">
        {error}
      </p>
    );
  }

  return (
    <form className="localization-config-form" onSubmit={handleSubmit} aria-live="polite">
      <section className="localization-config-form__section">
        <h3 className="localization-config-form__title">{t('settings.localization.title')}</h3>
        <p className="localization-config-form__body">{t('settings.localization.description')}</p>

        <label className="input-field">
          <span className="input-field__label">{t('settings.localization.defaultLanguage')}</span>
          <select
            className="input-field__control"
            value={defaultLanguage}
            onChange={(event) => setDefaultLanguage(event.target.value)}
            disabled={saving}
          >
            {SUPPORTED_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="localization-config-form__fieldset">
          <legend className="input-field__label">{t('settings.localization.supportedLanguages')}</legend>
          {SUPPORTED_LANGUAGE_OPTIONS.map((option) => (
            <label key={option.code} className="localization-config-form__checkbox">
              <input
                type="checkbox"
                checked={supportedLanguages.includes(option.code)}
                onChange={() => toggleLanguage(option.code)}
                disabled={saving}
              />
              <span>{t(option.labelKey)}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="localization-config-form__section">
        <h3 className="localization-config-form__title">{t('settings.auction.title')}</h3>
        <div className="kyc-modal__form-grid">
          <Input
            label={t('settings.auction.defaultCurrency')}
            value={defaultCurrency}
            onChange={(event) => setDefaultCurrency(event.target.value)}
            disabled={saving}
          />
          <Input
            label={t('settings.auction.defaultCpoPercentage')}
            type="number"
            min="0"
            step="0.1"
            value={defaultCpoPercentage}
            onChange={(event) => setDefaultCpoPercentage(event.target.value)}
            disabled={saving}
          />
          <Input
            label={t('settings.auction.minBidIncrement')}
            type="number"
            min="0"
            value={minBidIncrement}
            onChange={(event) => setMinBidIncrement(event.target.value)}
            disabled={saving}
          />
        </div>
      </section>

      <section className="localization-config-form__section">
        <h3 className="localization-config-form__title">{t('settings.system.title')}</h3>
        <div className="kyc-modal__form-grid">
          <Input
            label={t('settings.system.otpTtlSeconds')}
            type="number"
            min="60"
            value={otpTtlSeconds}
            onChange={(event) => setOtpTtlSeconds(event.target.value)}
            disabled={saving}
          />
          <Input
            label={t('settings.system.maxFileSize')}
            type="number"
            min="1"
            value={maxFileSize}
            onChange={(event) => setMaxFileSize(event.target.value)}
            disabled={saving}
          />
        </div>
      </section>

      {saveError && (
        <p className="setting-view__status setting-view__status--error" role="alert">
          {saveError}
        </p>
      )}

      <div className="localization-config-form__actions">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </form>
  );
}

export default LocalizationConfigForm;
