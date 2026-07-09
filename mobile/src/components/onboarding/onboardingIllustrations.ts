import type { ThemeColors } from '@/lib/theme';

export interface OnboardingIllustrations {
  steps: string;
  building: string;
  trophy: string;
}

/** Theme-aware onboarding SVG illustrations (brand blue palette). */
export function createOnboardingIllustrations(c: ThemeColors): OnboardingIllustrations {
  const deep = c.goldDeep;
  const mid = c.gold;
  const bright = c.goldBright;
  const champagne = c.goldChampagne;
  const shine = c.glassTopHighlight;
  const ink = c.cream;
  const surfaceTop = c.baseElevated;
  const surfaceBottom = c.baseDeep;

  const steps = `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sb1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bright}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <linearGradient id="sb2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${champagne}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="glow2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${bright}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${bright}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="80" r="72" fill="url(#glow2)"/>
  <rect x="40" y="98" width="36" height="32" rx="6" fill="url(#sb1)" opacity="0.45"/>
  <rect x="82" y="78" width="36" height="52" rx="6" fill="url(#sb1)" opacity="0.7"/>
  <rect x="124" y="56" width="36" height="74" rx="6" fill="url(#sb2)" stroke="${deep}" stroke-width="0.8"/>
  <rect x="124" y="56" width="36" height="3" rx="1.5" fill="${champagne}"/>
  <circle cx="172" cy="64" r="15" fill="url(#sb2)" stroke="${deep}" stroke-width="0.8"/>
  <path d="M165 64 L170 69 L179 59" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="38" cy="42" r="2" fill="${bright}"/>
  <circle cx="196" cy="100" r="1.5" fill="${bright}"/>
  <circle cx="48" cy="120" r="1" fill="${bright}"/>
</svg>`;

  const building = `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${surfaceTop}"/>
      <stop offset="1" stop-color="${surfaceBottom}"/>
    </linearGradient>
    <linearGradient id="rr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${champagne}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <linearGradient id="ww" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bright}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="glow3" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${bright}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${bright}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="80" r="72" fill="url(#glow3)"/>
  <polygon points="60,52 110,30 160,52" fill="url(#rr)" stroke="${deep}" stroke-width="1"/>
  <polygon points="60,52 110,30 110,38 70,54" fill="${champagne}" opacity="0.55"/>
  <rect x="62" y="52" width="96" height="78" rx="4" fill="url(#bb)" stroke="${deep}" stroke-width="0.8"/>
  <rect x="74" y="62" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.95"/>
  <rect x="124" y="62" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.95"/>
  <rect x="74" y="88" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.7"/>
  <rect x="124" y="88" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.7"/>
  <rect x="100" y="102" width="20" height="28" rx="2" fill="url(#rr)" opacity="0.75"/>
  <rect x="62" y="52" width="96" height="2" fill="${champagne}"/>
  <rect x="109" y="18" width="2" height="14" fill="${deep}"/>
  <polygon points="111,18 126,22 111,26" fill="url(#rr)"/>
  <rect x="40" y="132" width="140" height="3" rx="1.5" fill="${mid}" opacity="0.5"/>
  <circle cx="38" cy="40" r="1.5" fill="${bright}"/>
  <circle cx="182" cy="46" r="2" fill="${bright}"/>
  <circle cx="190" cy="100" r="1" fill="${bright}"/>
</svg>`;

  const trophy = `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${champagne}"/>
      <stop offset="0.5" stop-color="${bright}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <linearGradient id="tb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mid}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <radialGradient id="glow4" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${bright}" stop-opacity="0.48"/>
      <stop offset="1" stop-color="${bright}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="72" r="72" fill="url(#glow4)"/>
  <rect x="85" y="122" width="50" height="9" rx="2" fill="url(#tb)"/>
  <rect x="90" y="112" width="40" height="11" rx="2" fill="url(#tc)" stroke="${deep}" stroke-width="0.6"/>
  <rect x="105" y="92" width="10" height="22" fill="url(#tb)"/>
  <path d="M75 50 L145 50 L140 92 Q140 96 135 96 L85 96 Q80 96 80 92 Z" fill="url(#tc)" stroke="${deep}" stroke-width="1"/>
  <ellipse cx="110" cy="50" rx="35" ry="5" fill="${champagne}"/>
  <ellipse cx="110" cy="50" rx="35" ry="3" fill="url(#tc)"/>
  <path d="M75 55 C60 55 55 65 55 75 C55 85 60 90 70 90" stroke="url(#tc)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M145 55 C160 55 165 65 165 75 C165 85 160 90 150 90" stroke="url(#tc)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <polygon points="110,62 113,70 121,70 115,75 117,83 110,78 103,83 105,75 99,70 107,70" fill="${ink}" opacity="0.45"/>
  <ellipse cx="95" cy="68" rx="6" ry="10" fill="${shine}" opacity="0.25"/>
  <circle cx="40" cy="42" r="2" fill="${bright}"/>
  <circle cx="182" cy="42" r="1.5" fill="${bright}"/>
  <circle cx="48" cy="98" r="1.5" fill="${bright}"/>
  <circle cx="176" cy="98" r="2" fill="${bright}"/>
</svg>`;

  return { steps, building, trophy };
}
