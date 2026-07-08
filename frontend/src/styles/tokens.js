/**
 * Immutable design token map — runtime references to CSS custom properties.
 * Layer 3: JavaScript consumption layer atop variables.css primitives.
 */
export const tokens = Object.freeze({
  core: Object.freeze({
    color: Object.freeze({
      navy500: 'var(--core-color-navy-500)',
      navy700: 'var(--core-color-navy-700)',
      navy900: 'var(--core-color-navy-900)',
      blueHover: 'var(--core-color-blue-hover)',
      overlayBlue: 'var(--core-color-overlay-blue)',
      neutral900: 'var(--core-color-neutral-900)',
      neutral600: 'var(--core-color-neutral-600)',
      neutral400: 'var(--core-color-neutral-400)',
      neutral200: 'var(--core-color-neutral-200)',
      neutral100: 'var(--core-color-neutral-100)',
      neutral0: 'var(--core-color-neutral-0)',
      success500: 'var(--core-color-success-500)',
      warning500: 'var(--core-color-warning-500)',
      danger500: 'var(--core-color-danger-500)',
      info500: 'var(--core-color-info-500)',
    }),
    radius: Object.freeze({
      sharp: 'var(--core-radius-sharp)',
      progress: 'var(--core-radius-progress)',
      circle: 'var(--core-radius-circle)',
    }),
    font: Object.freeze({
      family: Object.freeze({
        display: 'var(--core-font-family-display)',
        ui: 'var(--core-font-family-ui)',
        body: 'var(--core-font-family-body)',
        amharic: 'var(--core-font-family-amharic)',
      }),
      size: Object.freeze({
        caption: 'var(--core-font-size-caption)',
        body: 'var(--core-font-size-body)',
        bodySm: 'var(--core-font-size-body-sm)',
        ui: 'var(--core-font-size-ui)',
        subheading: 'var(--core-font-size-subheading)',
        cardTitle: 'var(--core-font-size-card-title)',
        section: 'var(--core-font-size-section)',
        pageTitle: 'var(--core-font-size-page-title)',
        hero: 'var(--core-font-size-hero)',
      }),
      weight: Object.freeze({
        regular: 'var(--core-font-weight-regular)',
        medium: 'var(--core-font-weight-medium)',
        semibold: 'var(--core-font-weight-semibold)',
        bold: 'var(--core-font-weight-bold)',
      }),
    }),
    space: Object.freeze({
      1: 'var(--core-space-1)',
      2: 'var(--core-space-2)',
      3: 'var(--core-space-3)',
      4: 'var(--core-space-4)',
      5: 'var(--core-space-5)',
      6: 'var(--core-space-6)',
      7: 'var(--core-space-7)',
      8: 'var(--core-space-8)',
      9: 'var(--core-space-9)',
      10: 'var(--core-space-10)',
    }),
    shadow: Object.freeze({
      none: 'var(--core-shadow-none)',
      low: 'var(--core-shadow-low)',
      medium: 'var(--core-shadow-medium)',
      high: 'var(--core-shadow-high)',
      overlay: 'var(--core-shadow-overlay)',
      navbar: 'var(--core-shadow-navbar)',
    }),
    focus: Object.freeze({
      ring: 'var(--core-focus-ring)',
    }),
    layout: Object.freeze({
      maxWidth: 'var(--core-layout-max-width)',
      gutter: 'var(--core-layout-gutter)',
      navbarHeight: 'var(--core-layout-navbar-height)',
      gridMin: 'var(--core-layout-grid-min)',
    }),
  }),

  semantic: Object.freeze({
    color: Object.freeze({
      brand: Object.freeze({
        primary: 'var(--semantic-color-brand-primary)',
        primaryHover: 'var(--semantic-color-brand-primary-hover)',
        deep: 'var(--semantic-color-brand-deep)',
        accent: 'var(--semantic-color-brand-accent)',
        overlay: 'var(--semantic-color-brand-overlay)',
      }),
      text: Object.freeze({
        primary: 'var(--semantic-color-text-primary)',
        secondary: 'var(--semantic-color-text-secondary)',
        muted: 'var(--semantic-color-text-muted)',
        inverse: 'var(--semantic-color-text-inverse)',
        onWarning: 'var(--semantic-color-text-on-warning)',
      }),
      background: Object.freeze({
        primary: 'var(--semantic-color-background-primary)',
        secondary: 'var(--semantic-color-background-secondary)',
        inverse: 'var(--semantic-color-background-inverse)',
      }),
      border: Object.freeze({
        default: 'var(--semantic-color-border-default)',
        focus: 'var(--semantic-color-border-focus)',
        hover: 'var(--semantic-color-border-hover)',
      }),
      status: Object.freeze({
        success: 'var(--semantic-color-status-success)',
        warning: 'var(--semantic-color-status-warning)',
        danger: 'var(--semantic-color-status-danger)',
        info: 'var(--semantic-color-status-info)',
      }),
      surface: Object.freeze({
        hover: 'var(--semantic-color-surface-hover)',
        disabled: 'var(--semantic-color-surface-disabled)',
      }),
    }),
    radius: Object.freeze({
      default: 'var(--semantic-radius-default)',
      indicator: 'var(--semantic-radius-indicator)',
      progress: 'var(--semantic-radius-progress)',
    }),
    font: Object.freeze({
      display: 'var(--semantic-font-display)',
      ui: 'var(--semantic-font-ui)',
      body: 'var(--semantic-font-body)',
      amharic: 'var(--semantic-font-amharic)',
    }),
    shadow: Object.freeze({
      surface: 'var(--semantic-shadow-surface)',
      elevated: 'var(--semantic-shadow-elevated)',
      navigation: 'var(--semantic-shadow-navigation)',
    }),
    focus: Object.freeze({
      ring: 'var(--semantic-focus-ring)',
    }),
  }),

  component: Object.freeze({
    button: Object.freeze({
      fontFamily: 'var(--component-button-font-family)',
      fontSize: 'var(--component-button-font-size)',
      fontWeight: 'var(--component-button-font-weight)',
      letterSpacing: 'var(--component-button-letter-spacing)',
      radius: 'var(--component-button-radius)',
      transition: 'var(--component-button-transition)',
      primary: Object.freeze({
        bg: 'var(--component-button-primary-bg)',
        bgHover: 'var(--component-button-primary-bg-hover)',
        text: 'var(--component-button-primary-text)',
        border: 'var(--component-button-primary-border)',
      }),
      secondary: Object.freeze({
        bg: 'var(--component-button-secondary-bg)',
        bgHover: 'var(--component-button-secondary-bg-hover)',
        text: 'var(--component-button-secondary-text)',
        textHover: 'var(--component-button-secondary-text-hover)',
        border: 'var(--component-button-secondary-border)',
      }),
    }),
    input: Object.freeze({
      height: 'var(--component-input-height)',
      bg: 'var(--component-input-bg)',
      border: 'var(--component-input-border)',
      borderFocus: 'var(--component-input-border-focus)',
      borderError: 'var(--component-input-border-error)',
      text: 'var(--component-input-text)',
      placeholder: 'var(--component-input-placeholder)',
      focusRing: 'var(--component-input-focus-ring)',
      labelColor: 'var(--component-input-label-color)',
      errorColor: 'var(--component-input-error-color)',
    }),
    card: Object.freeze({
      bg: 'var(--component-card-bg)',
      border: 'var(--component-card-border)',
      borderHover: 'var(--component-card-border-hover)',
      shadow: 'var(--component-card-shadow)',
      shadowHover: 'var(--component-card-shadow-hover)',
      radius: 'var(--component-card-radius)',
      padding: 'var(--component-card-padding)',
    }),
    table: Object.freeze({
      headerBg: 'var(--component-table-header-bg)',
      headerText: 'var(--component-table-header-text)',
      rowBgOdd: 'var(--component-table-row-bg-odd)',
      rowBgEven: 'var(--component-table-row-bg-even)',
      rowBgHover: 'var(--component-table-row-bg-hover)',
      rowText: 'var(--component-table-row-text)',
      border: 'var(--component-table-border)',
    }),
    navbar: Object.freeze({
      height: 'var(--component-navbar-height)',
      bg: 'var(--component-navbar-bg)',
      text: 'var(--component-navbar-text)',
      textHover: 'var(--component-navbar-text-hover)',
      textActive: 'var(--component-navbar-text-active)',
      shadow: 'var(--component-navbar-shadow)',
      zIndex: 'var(--component-navbar-z-index)',
    }),
    footer: Object.freeze({
      bg: 'var(--component-footer-bg)',
      text: 'var(--component-footer-text)',
    }),
  }),
});

export default tokens;
