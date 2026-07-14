import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/use-settings.js';

const SUPPORTED_LANGUAGE_OPTIONS = Object.freeze([
  { code: 'en', labelKey: 'settings.localization.languages.en' },
  { code: 'am', labelKey: 'settings.localization.languages.am' },
]);

const TABS = ['localization', 'auction', 'system'];

const TAB_ICONS = {
  localization: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  auction: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  system: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

/**
 * @param {{
 *   onSaved?: () => void,
 * }} props
 */
export function LocalizationConfigForm({ onSaved }) {
  const { t } = useTranslation();
  const { settings, loading, saving, error, saveError, saveSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('localization');
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
    return (
      <div className="settings-card">
        <div className="settings-spinner">
          <div className="settings-spinner__ring" />
          <span className="settings-spinner__text">{t('settings.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-card">
        <div className="settings-error" role="alert">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="settings-card" onSubmit={handleSubmit} aria-live="polite">
      <nav className="settings-tabs" role="tablist" aria-label={t('settings.pageTitle')}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`settings-tabs__item ${activeTab === tab ? 'settings-tabs__item--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className="settings-tabs__icon">{TAB_ICONS[tab]}</span>
            <span className="settings-tabs__label">{t(`settings.tabs.${tab}`)}</span>
          </button>
        ))}
      </nav>

      <div className="settings-card__body">
        {/* ── LOCALIZATION TAB ── */}
        {activeTab === 'localization' && (
          <div className="settings-section" role="tabpanel">
            <div className="settings-section__header">
              <div className="settings-section__icon settings-section__icon--blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="settings-section__title">{t('settings.localization.title')}</h3>
                <p className="settings-section__desc">{t('settings.localization.description')}</p>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-field__label" htmlFor="defaultLanguage">
                {t('settings.localization.defaultLanguage')}
              </label>
              <div className="settings-select-wrap">
                <select
                  id="defaultLanguage"
                  className="settings-select"
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  disabled={saving}
                >
                  {SUPPORTED_LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>{t(opt.labelKey)}</option>
                  ))}
                </select>
                <svg className="settings-select__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="settings-field">
              <span className="settings-field__label">{t('settings.localization.supportedLanguages')}</span>
              <div className="settings-toggle-group">
                {SUPPORTED_LANGUAGE_OPTIONS.map((opt) => {
                  const checked = supportedLanguages.includes(opt.code);
                  return (
                    <label key={opt.code} className={`settings-toggle ${checked ? 'settings-toggle--active' : ''}`}>
                      <input
                        type="checkbox"
                        className="settings-toggle__input"
                        checked={checked}
                        onChange={() => toggleLanguage(opt.code)}
                        disabled={saving}
                      />
                      <span className="settings-toggle__track">
                        <span className="settings-toggle__thumb" />
                      </span>
                      <span className="settings-toggle__text">{t(opt.labelKey)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── AUCTION TAB ── */}
        {activeTab === 'auction' && (
          <div className="settings-section" role="tabpanel">
            <div className="settings-section__header">
              <div className="settings-section__icon settings-section__icon--gold">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="settings-section__title">{t('settings.auction.title')}</h3>
                <p className="settings-section__desc">{t('settings.auction.description')}</p>
              </div>
            </div>

            <div className="settings-fields-grid">
              <div className="settings-field">
                <label className="settings-field__label" htmlFor="defaultCurrency">
                  {t('settings.auction.defaultCurrency')}
                </label>
                <input
                  id="defaultCurrency"
                  type="text"
                  className="settings-input"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  disabled={saving}
                  placeholder="ETB"
                />
                <span className="settings-field__hint">{t('settings.auction.currencyHint')}</span>
              </div>

              <div className="settings-field">
                <label className="settings-field__label" htmlFor="defaultCpoPercentage">
                  {t('settings.auction.defaultCpoPercentage')}
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="defaultCpoPercentage"
                    type="number"
                    className="settings-input settings-input--suffix"
                    min="0"
                    max="100"
                    step="0.1"
                    value={defaultCpoPercentage}
                    onChange={(e) => setDefaultCpoPercentage(e.target.value)}
                    disabled={saving}
                  />
                  <span className="settings-input__suffix">%</span>
                </div>
                <span className="settings-field__hint">{t('settings.auction.cpoHint')}</span>
              </div>

              <div className="settings-field">
                <label className="settings-field__label" htmlFor="minBidIncrement">
                  {t('settings.auction.minBidIncrement')}
                </label>
                <div className="settings-input-wrap">
                  <span className="settings-input__prefix">Br</span>
                  <input
                    id="minBidIncrement"
                    type="number"
                    className="settings-input settings-input--prefixed"
                    min="0"
                    value={minBidIncrement}
                    onChange={(e) => setMinBidIncrement(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <span className="settings-field__hint">{t('settings.auction.bidHint')}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SYSTEM TAB ── */}
        {activeTab === 'system' && (
          <div className="settings-section" role="tabpanel">
            <div className="settings-section__header">
              <div className="settings-section__icon settings-section__icon--green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="settings-section__title">{t('settings.system.title')}</h3>
                <p className="settings-section__desc">{t('settings.system.description')}</p>
              </div>
            </div>

            <div className="settings-fields-grid settings-fields-grid--2col">
              <div className="settings-field">
                <label className="settings-field__label" htmlFor="otpTtlSeconds">
                  {t('settings.system.otpTtlSeconds')}
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="otpTtlSeconds"
                    type="number"
                    className="settings-input settings-input--suffix"
                    min="60"
                    max="3600"
                    value={otpTtlSeconds}
                    onChange={(e) => setOtpTtlSeconds(e.target.value)}
                    disabled={saving}
                  />
                  <span className="settings-input__suffix">sec</span>
                </div>
                <span className="settings-field__hint">{t('settings.system.otpHint')}</span>
              </div>

              <div className="settings-field">
                <label className="settings-field__label" htmlFor="maxFileSize">
                  {t('settings.system.maxFileSize')}
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="maxFileSize"
                    type="number"
                    className="settings-input settings-input--suffix"
                    min="1"
                    value={maxFileSize}
                    onChange={(e) => setMaxFileSize(e.target.value)}
                    disabled={saving}
                  />
                  <span className="settings-input__suffix">B</span>
                </div>
                <span className="settings-field__hint">{t('settings.system.fileHint')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {saveError && (
        <div className="settings-error settings-error--inline" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span>{saveError}</span>
        </div>
      )}

      <div className="settings-card__footer">
        <button type="submit" className="settings-save-btn" disabled={saving}>
          {saving ? (
            <>
              <span className="settings-save-btn__spinner" />
              {t('settings.saving')}
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('settings.save')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default LocalizationConfigForm;
