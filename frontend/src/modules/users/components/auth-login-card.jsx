import { useState } from 'react';
import { Button, Input } from '../../../components/index.js';

function AuthFieldEyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M6.2 6.2C4.2 7.6 2.7 9.5 2 12c0 0 3.5 6 10 6 1.8 0 3.4-.5 4.8-1.2M9.9 5.1A10.7 10.7 0 0112 5c6.5 0 10 6 10 6a17.8 17.8 0 01-4.1 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AuthFieldClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} props.footer
 */
export function AuthLoginCard({ children, footer }) {
  return (
    <article className="auth-login-card">
      <div className="auth-login-card__content">{children}</div>
      {footer}
    </article>
  );
}

/**
 * @param {Object} props
 * @param {string} props.title
 */
export function AuthStepTitle({ title }) {
  return <h1 className="auth-login-card__title">{title}</h1>;
}

/**
 * @param {Object} props
 * @param {boolean} props.loading
 * @param {string} props.label
 * @param {string} [props.loadingLabel]
 * @param {boolean} [props.disabled]
 */
export function AuthSubmitButton({ loading, label, loadingLabel = 'Please Wait...', disabled = false }) {
  return (
    <div className="auth-login-card__submit">
      <Button
        type="submit"
        variant="primary"
        className="auth-login-card__button"
        disabled={loading || disabled}
      >
        {loading ? loadingLabel : label}
      </Button>
    </div>
  );
}

export function AuthFormAlert({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="auth-login-card__alert" role="alert">
      {message}
    </p>
  );
}

export function AuthInput({ className = '', ...rest }) {
  return <Input className={['auth-login-card__input', className].filter(Boolean).join(' ')} {...rest} />;
}

/**
 * Phone field with +251 prefix, clear control, and auth styling.
 */
export function AuthPhoneInput({
  label,
  name = 'phoneNumber',
  id,
  value,
  onChange,
  onClear,
  error,
  disabled = false,
  placeholder,
  hint,
  clearLabel = 'Clear',
  required = false,
}) {
  const inputId = id || name || 'auth-phone-input';
  const wrapClass = [
    'auth-login-card__phone-wrap',
    error ? 'auth-login-card__phone-wrap--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClear = () => {
    if (disabled) return;
    if (onClear) {
      onClear();
      return;
    }
    onChange?.({ target: { name, value: '' } });
  };

  return (
    <div className="input-field">
      <label className="input-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className={wrapClass}>
        <span className="auth-login-card__phone-prefix" aria-hidden="true">
          +251
        </span>
        <input
          id={inputId}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="auth-login-card__phone-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
        {value ? (
          <button
            type="button"
            className="auth-login-card__field-action"
            onClick={handleClear}
            disabled={disabled}
            aria-label={clearLabel}
          >
            <AuthFieldClearIcon />
          </button>
        ) : null}
      </div>
      {hint ? (
        <span id={`${inputId}-hint`} className="auth-login-card__field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${inputId}-error`} className="input-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Password field with show/hide toggle and auth styling.
 */
export function AuthPasswordInput({
  label,
  name = 'password',
  id,
  value,
  onChange,
  error,
  disabled = false,
  autoComplete = 'current-password',
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  required = false,
}) {
  const [visible, setVisible] = useState(false);
  const inputId = id || name || 'auth-password-input';

  return (
    <div className="input-field">
      <label className="input-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="auth-login-card__password-wrap">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={[
            'input-field__control',
            'auth-login-card__input',
            error ? 'input-field__control--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        <button
          type="button"
          className="auth-login-card__field-action auth-login-card__field-action--password"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={visible}
        >
          <AuthFieldEyeIcon open={visible} />
        </button>
      </div>
      {error ? (
        <span id={`${inputId}-error`} className="input-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default AuthLoginCard;
