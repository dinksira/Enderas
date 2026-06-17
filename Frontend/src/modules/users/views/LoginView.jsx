import { useState } from 'react';
import { LoginForm } from '../components/login-form.jsx';
import { authApi } from '../services/authApi.js';
import './login-view.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(email, password) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (errors.email || errors.form) {
      setErrors((current) => ({ ...current, email: undefined, form: undefined }));
    }
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    if (errors.password || errors.form) {
      setErrors((current) => ({ ...current, password: undefined, form: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authApi.login({
        email: email.trim(),
        password,
      });
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Unable to sign in. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-view" aria-labelledby="login-page-title">
      <div className="login-view__container">
        <LoginForm
          email={email}
          password={password}
          loading={loading}
          errors={errors}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}

export default LoginView;
