/**
 * Maps API error codes to i18n-backed user messages.
 * @param {Error & { code?: string }} err
 * @param {(key: string) => string} t
 */
export function resolveAuthError(err, t) {
  if (!err) {
    return t('auth.genericError');
  }

  switch (err.code) {
    case 'DUPLICATE_MOBILE':
      return t('auth.duplicatePhone');
    case 'INVALID_OTP':
      return t('auth.invalidOtp');
    case 'INVALID_CREDENTIALS':
      return t('auth.invalidCredentials');
    case 'NETWORK_ERROR':
      return err.message || t('auth.networkError');
    case 'VALIDATION_ERROR':
      return err.message || t('auth.validationError');
    default:
      return err.message || t('auth.genericError');
  }
}

export default resolveAuthError;
