import { useState } from 'react';

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.8" />
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

/**
 * @param {{
 *   id: string,
 *   label: string,
 *   value: string,
 *   onChange: (event: import('react').ChangeEvent<HTMLInputElement>) => void,
 *   error?: string,
 *   disabled?: boolean,
 *   autoComplete?: string,
 *   showLabel?: string,
 *   hideLabel?: string,
 * }} props
 */
export function PublicPasswordField({
  id,
  label,
  value,
  onChange,
  error = '',
  disabled = false,
  autoComplete = 'new-password',
  showLabel = 'Show password',
  hideLabel = 'Hide password',
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`public-auth__field ${error ? 'public-auth__field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="public-auth__password-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
        />
        <button
          type="button"
          className="public-auth__password-toggle"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error && <p className="public-auth__error">{error}</p>}
    </div>
  );
}

export default PublicPasswordField;
