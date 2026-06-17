import { Button, Input, Card } from '../../../components/index.js';
import './login-form.css';

/**
 * @param {Object} props
 * @param {string} props.email
 * @param {string} props.password
 * @param {boolean} props.loading
 * @param {{ email?: string, password?: string, form?: string }} props.errors
 * @param {function} props.onEmailChange
 * @param {function} props.onPasswordChange
 * @param {function} props.onSubmit
 */
export function LoginForm({
  email,
  password,
  loading,
  errors = {},
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <Card className="login-form">
      <header className="login-form__header">
        <h1 id="login-page-title" className="login-form__display-title">
          Welcome to Enderas
        </h1>
        <p className="login-form__helper">
          Sign in to access the Digital Auction Management System.
        </p>
      </header>

      <form className="login-form__fields" onSubmit={onSubmit} noValidate>
        {errors.form && (
          <p className="login-form__alert" role="alert">
            {errors.form}
          </p>
        )}

        <Input
          label="Email Address"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={onEmailChange}
          error={errors.email}
          disabled={loading}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={onPasswordChange}
          error={errors.password}
          disabled={loading}
          required
        />

        <div className="login-form__submit">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default LoginForm;
