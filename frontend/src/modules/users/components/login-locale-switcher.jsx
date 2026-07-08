
/**
 * @param {Object} props
 * @param {'en' | 'am'} props.locale
 * @param {function} props.onLocaleChange
 */
export function LoginLocaleSwitcher({ locale, onLocaleChange }) {
  return (
    <nav className="login-locale-switcher" aria-label="Language selection">
      <button
        type="button"
        className={[
          'login-locale-switcher__option',
          'login-locale-switcher__option--en',
          locale === 'en' ? 'login-locale-switcher__option--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onLocaleChange('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <span className="login-locale-switcher__divider" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        className={[
          'login-locale-switcher__option',
          'login-locale-switcher__option--am',
          locale === 'am' ? 'login-locale-switcher__option--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onLocaleChange('am')}
        aria-pressed={locale === 'am'}
      >
        አማርኛ
      </button>
    </nav>
  );
}

export default LoginLocaleSwitcher;
