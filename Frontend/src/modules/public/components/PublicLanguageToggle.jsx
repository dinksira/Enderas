import { useTranslation } from 'react-i18next';

/**
 * @param {{ className?: string }} props
 */
export function PublicLanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const setLocale = (next) => {
    i18n.changeLanguage(next);
  };

  return (
    <div className={['pub-lang', className].filter(Boolean).join(' ')} role="group" aria-label="Language">
      <button
        type="button"
        className={`pub-lang__btn ${locale === 'en' ? 'pub-lang__btn--active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={`pub-lang__btn ${locale === 'am' ? 'pub-lang__btn--active' : ''}`}
        onClick={() => setLocale('am')}
        aria-pressed={locale === 'am'}
      >
        አማ
      </button>
    </div>
  );
}

export default PublicLanguageToggle;
