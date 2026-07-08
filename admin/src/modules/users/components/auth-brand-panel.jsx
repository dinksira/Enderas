/**
 * Shared left brand panel — matches LoginView premium-login layout.
 */
import logoImg from '../../../assets/images/frontend_logo.svg';

export function AuthBrandPanel() {
  return (
    <div className="premium-login-view__left">
      <div className="premium-login-view__brand">
        <div className="premium-login-view__logo">
          <img src={logoImg} alt="Enderas Icon" />
        </div>
        <h1 className="premium-login-view__title">ENDERAS</h1>
        <p className="premium-login-view__subtitle">AUCTION MANAGEMENT SYSTEM</p>
      </div>
    </div>
  );
}

export default AuthBrandPanel;
