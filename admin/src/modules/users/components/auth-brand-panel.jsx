/**
 * Shared left brand panel — matches LoginView premium-login layout.
 */
export function AuthBrandPanel() {
  return (
    <div className="premium-login-view__left">
      <div className="premium-login-view__brand">
        <div className="premium-login-view__logo">
          <svg viewBox="0 0 370 390" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g transform="translate(185, 195)" fill="#ffffff" stroke="none">
              <path
                d="M-185,-95 L0,-190 L185,-95"
                fill="none"
                stroke="#ffffff"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0,-105 L-11,-103 L-13,-118 L-2,-120 L2,-120 L13,-118 L11,-103 L21,-99 L28,-112 L38,-107 L35,-93 L43,-86 L55,-95 L62,-86 L52,-76 L57,-66 L70,-70 L74,-60 L61,-54 L63,-43 L77,-42 L77,-31 L63,-30 L61,-19 L74,-13 L70,-3 L57,-7 L52,4 L62,14 L55,23 L43,14 L35,23 L38,37 L28,42 L21,29 L11,33 L13,48 L2,50 L-2,50 L-13,48 L-11,33 L-21,29 L-28,42 L-38,37 L-35,23 L-43,14 L-55,23 L-62,14 L-52,4 L-57,-7 L-70,-3 L-74,-13 L-61,-19 L-63,-30 L-77,-31 L-77,-42 L-63,-43 L-61,-54 L-74,-60 L-70,-70 L-57,-66 L-52,-76 L-62,-86 L-55,-95 L-43,-86 L-35,-93 L-38,-107 L-28,-112 L-21,-99 Z"
                fill="#ffffff"
              />
              <circle cx="0" cy="-28" r="60" fill="#06436a" />
              <circle cx="0" cy="-28" r="43" fill="#ffffff" />
              <circle cx="0" cy="-28" r="28" fill="#06436a" />
            </g>
          </svg>
        </div>
        <h1 className="premium-login-view__title">ENDERAS</h1>
        <p className="premium-login-view__subtitle">AUCTION MANAGEMENT SYSTEM</p>
      </div>
    </div>
  );
}

export default AuthBrandPanel;
