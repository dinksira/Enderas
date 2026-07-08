
export function Input({
  label,
  error,
  id,
  name,
  type = 'text',
  className = '',
  ...rest
}) {
  const inputId = id || name || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const controlClasses = [
    'input-field__control',
    error ? 'input-field__control--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-field">
      <label className="input-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        name={name || inputId}
        type={type}
        className={controlClasses}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} className="input-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
