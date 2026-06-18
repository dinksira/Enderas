import { Button, Input } from '../../../components/index.js';

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
 */
export function AuthSubmitButton({ loading, label, loadingLabel = 'Please Wait...' }) {
  return (
    <div className="auth-login-card__submit">
      <Button type="submit" variant="primary" className="auth-login-card__button" disabled={loading}>
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

export default AuthLoginCard;
