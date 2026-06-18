import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import logoSrc from '../../../assets/images/logo.svg';
import { ADMIN_FONTS, ADMIN_LAYOUT, ADMIN_PALETTE } from './auction-admin-tokens.js';

const NAV_ITEMS = [
  { label: 'Auctions', path: ROUTES.AUCTIONS, icon: 'auctions' },
  { label: 'Asset Request', path: ROUTES.ASSET_REQUEST, icon: 'asset' },
  { label: 'Users', path: ROUTES.USERS, icon: 'users' },
  { label: 'Staff & Roles', path: ROUTES.STAFF_ROLES, icon: 'staff' },
  { label: 'Payments', path: ROUTES.PAYMENTS, icon: 'payments' },
  { label: 'CPO Management', path: ROUTES.CPO_MANAGEMENT, icon: 'cpo' },
  { label: 'Bid Management', path: ROUTES.BID_MANAGEMENT, icon: 'bid' },
  { label: 'Analytics & Report', path: ROUTES.ANALYTICS_REPORT, icon: 'analytics' },
  { label: 'Setting', path: ROUTES.SETTING, icon: 'setting' },
];

function NavIcon({ name, color = ADMIN_PALETTE.textWhite }) {
  const stroke = color;
  const icons = {
    auctions: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16M6 7v12h12V7M9 11h6M9 15h4" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    asset: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 19h14V9l-7-5-7 5v10z" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    users: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="8" r="3" stroke={stroke} strokeWidth="1.8" />
        <path d="M4 19c0-3 2.5-5 5-5s5 2 5 5" stroke={stroke} strokeWidth="1.8" />
        <circle cx="17" cy="9" r="2.5" stroke={stroke} strokeWidth="1.8" />
        <path d="M15 19c.3-2 1.8-3.5 4-3.5" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    staff: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    payments: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="0" stroke={stroke} strokeWidth="1.8" />
        <path d="M3 10h18" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    cpo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    bid: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 18l8-8 4 4 4-6 4 4" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    analytics: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 19V9M12 19V5M19 19v-7" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    setting: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="1.8" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
  };

  return icons[name] || icons.auctions;
}

/**
 * @param {Object} props
 * @param {'en' | 'am'} props.locale
 * @param {function} props.onLocaleChange
 * @param {string} props.searchQuery
 * @param {function} props.onSearchChange
 */
export function AuctionAdminHeader({ locale, onLocaleChange, searchQuery, onSearchChange }) {
  return (
    <header
      style={{
        height: ADMIN_LAYOUT.headerHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        background: ADMIN_PALETTE.textWhite,
        borderBottom: `1px solid ${ADMIN_PALETTE.border}`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 280 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: ADMIN_FONTS.montserrat,
            fontSize: 26,
            fontWeight: 700,
            color: ADMIN_PALETTE.textPrimary,
            lineHeight: 1.2,
          }}
        >
          Auctions
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: ADMIN_FONTS.roboto,
            fontSize: 14,
            color: ADMIN_PALETTE.textSubtle,
          }}
        >
          Manage all auction listings across categories
        </p>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 520,
          margin: '0 32px',
          position: 'relative',
        }}
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search auctions, users, assets"
          style={{
            width: '100%',
            height: 40,
            padding: '0 44px 0 16px',
            border: 'none',
            borderRadius: 999,
            background: ADMIN_PALETTE.searchBg,
            fontFamily: ADMIN_FONTS.roboto,
            fontSize: 14,
            color: ADMIN_PALETTE.textPrimary,
            outline: 'none',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: ADMIN_PALETTE.textSubtle,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: `1px solid ${ADMIN_PALETTE.border}`,
            borderRadius: 0,
            overflow: 'hidden',
          }}
          role="group"
          aria-label="Language selection"
        >
          {['en', 'am'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onLocaleChange(code)}
              style={{
                border: 'none',
                padding: '8px 14px',
                cursor: 'pointer',
                fontFamily: code === 'am' ? ADMIN_FONTS.amharic : ADMIN_FONTS.montserrat,
                fontSize: code === 'am' ? 15 : 14,
                fontWeight: 600,
                textTransform: 'uppercase',
                background: locale === code ? ADMIN_PALETTE.accent : ADMIN_PALETTE.textWhite,
                color: locale === code ? ADMIN_PALETTE.textWhite : ADMIN_PALETTE.textPrimary,
                borderRadius: 0,
              }}
            >
              {code}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Notifications"
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: ADMIN_PALETTE.searchBg,
            borderRadius: 0,
            cursor: 'pointer',
            color: ADMIN_PALETTE.textPrimary,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4a5 5 0 00-5 5v3l-2 2h14l-2-2V9a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 20h4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export function AuctionAdminSidebar() {
  return (
    <aside
      style={{
        width: ADMIN_LAYOUT.sidebarWidth,
        minWidth: ADMIN_LAYOUT.sidebarWidth,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: ADMIN_PALETTE.sidebarBg,
        borderRight: `1px solid ${ADMIN_PALETTE.accent}`,
        borderRadius: 0,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '24px 20px',
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        <img src={logoSrc} alt="Enderas" style={{ width: 36, height: 36, display: 'block' }} />
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: ADMIN_FONTS.montserrat,
              fontSize: 18,
              fontWeight: 700,
              color: ADMIN_PALETTE.textWhite,
              lineHeight: 1.2,
            }}
          >
            Enderas
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: ADMIN_FONTS.roboto,
              fontSize: 12,
              color: ADMIN_PALETTE.textMuted,
            }}
          >
            Auction Management
          </p>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }} aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              textDecoration: 'none',
              fontFamily: ADMIN_FONTS.roboto,
              fontSize: 14,
              color: ADMIN_PALETTE.textWhite,
              background: isActive ? ADMIN_PALETTE.accent : 'transparent',
              borderRadius: 0,
              borderLeft: isActive ? `3px solid ${ADMIN_PALETTE.textWhite}` : '3px solid transparent',
            })}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: '20px',
          borderTop: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: ADMIN_PALETTE.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: ADMIN_FONTS.montserrat,
              fontSize: 14,
              fontWeight: 700,
              color: ADMIN_PALETTE.textWhite,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            SA
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: ADMIN_FONTS.montserrat,
                fontSize: 14,
                fontWeight: 600,
                color: ADMIN_PALETTE.textWhite,
              }}
            >
              Super Admin
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: ADMIN_FONTS.roboto,
                fontSize: 12,
                color: ADMIN_PALETTE.gold,
              }}
            >
              Full Access
            </p>
          </div>
        </div>

        <button
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            border: `1px solid rgba(255,255,255,0.35)`,
            background: 'transparent',
            color: ADMIN_PALETTE.textWhite,
            fontFamily: ADMIN_FONTS.montserrat,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l-6 6 6 6M3 12h14" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AuctionAdminSidebar;
