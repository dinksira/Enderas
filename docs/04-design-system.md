# Design System

The Enderas design system spans three platforms: web (admin + frontend) and mobile. The web platforms share a 3-layer CSS variable architecture while the mobile app has its own token-based theme system.

---

## Web Design System (Admin + Frontend)

### 3-Layer CSS Variable Architecture

```
Layer 1: Core Primitives     →  Raw values (colors, sizes, radii)
Layer 2: Semantic Tokens     →  Map primitives to purpose (brand, surface, text)
Layer 3: Component Tokens    →  Drive specific components (button, card, table)
```

**Key files:**
- `admin/src/styles/variables.css` — All 3 layers (328 lines)
- `admin/src/styles/tokens.js` — JS token layer (reads CSS variables)
- `admin/src/styles/global.css` — Reset, base styles, atoms, layouts
- `admin/src/styles/dashboard.css` — Sidebar, header, tables, modals
- `admin/src/styles/admin.css` — Status pills, drawers, evaluation components

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--core-color-navy-500` | `#06436a` | Primary brand, buttons, links |
| `--core-color-navy-700` | `#04304c` | Deep navy, hover states |
| `--core-color-navy-900` | `#081026` | Midnight, dark backgrounds |
| `--core-color-soft-blue` | `#76a6c5` | Accent, subtle highlights |

### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--core-color-neutral-0` | `#ffffff` | Backgrounds, text on dark |
| `--core-color-neutral-100` | `#f5f5f5` | Light backgrounds |
| `--core-color-neutral-200` | `#e0e0e0` | Borders, dividers |
| `--core-color-neutral-400` | `#999999` | Placeholder text |
| `--core-color-neutral-600` | `#666666` | Secondary text |
| `--core-color-neutral-900` | `#1c1c1c` | Primary text |

### Status Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--core-color-success` | `#28a745` | Approved, active, won |
| `--core-color-warning` | `#ffc107` | Pending, expiring |
| `--core-color-danger` | `#dc3545` | Rejected, error, lost |
| `--core-color-info` | `#17a2b8` | Informational, neutral |

### Typography

| Role | Font Family | Fallback |
|------|------------|----------|
| Display | Vidaloka | serif |
| UI | Montserrat | sans-serif |
| Body | Roboto | sans-serif |
| Amharic | Noto Sans Ethiopic | sans-serif |
| Monospace | JetBrains Mono | monospace |

**Type Scale:**

| Token | Size | Usage |
|-------|------|-------|
| `--core-font-size-caption` | 13px | Small labels, hints |
| `--core-font-size-ui` | 14px | Buttons, inputs, nav |
| `--core-font-size-body-sm` | 14px | Small body text |
| `--core-font-size-body` | 15px | Default body text |
| `--core-font-size-subheading` | 18px | Section subheadings |
| `--core-font-size-card-title` | 22px | Card titles |
| `--core-font-size-section` | 32px | Section headings |
| `--core-font-size-page-title` | 42px | Page titles |
| `--core-font-size-hero` | 56px | Hero headings |

### Spacing Scale

Based on an 8px grid:

| Token | Value |
|-------|-------|
| `--core-space-1` | 4px |
| `--core-space-2` | 8px |
| `--core-space-3` | 12px |
| `--core-space-4` | 16px |
| `--core-space-6` | 24px |
| `--core-space-8` | 32px |
| `--core-space-12` | 48px |
| `--core-space-16` | 64px |
| `--core-space-24` | 96px |
| `--core-space-32` | 128px |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--core-radius-sharp` | 0px | Edges, public site |
| `--core-radius-progress` | 2px | Progress bars |
| `--core-radius-sm` | 6px | Status pills, small elements |
| `--core-radius-md` | 10px | Cards, inputs, buttons |
| `--core-radius-lg` | 14px | Drawers, modals |
| `--core-radius-full` | 50% | Circular elements |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--core-shadow-low` | `0 4px 20px rgba(0,0,0,0.06)` | Cards, subtle elevation |
| `--core-shadow-high` | `0 8px 30px rgba(6,67,106,0.12)` | Dropdowns, popovers |
| `--core-shadow-overlay` | `0 16px 48px rgba(0,0,0,0.2)` | Modals, drawers |

### Dashboard Layout Dimensions

| Element | Size |
|---------|------|
| Sidebar width | 260px |
| Header height | 72px |
| Content padding | 32px |
| Table row height | 48px |

### Component Tokens

| Token | Value | Drives |
|-------|-------|--------|
| `--component-button-primary-bg` | `var(--core-color-navy-500)` | Primary button background |
| `--component-button-primary-radius` | `var(--core-radius-md)` | Primary button shape |
| `--component-card-radius` | `var(--core-radius-md)` | Card corners |
| `--component-table-radius` | `var(--core-radius-lg)` | Table panel corners |
| `--component-input-radius` | `var(--core-radius-md)` | Input fields |
| `--component-status-pill-radius` | `var(--core-radius-sm)` | Status badges |

### Admin vs Frontend Differences

| Aspect | Admin | Frontend |
|--------|-------|----------|
| Status pill radius | `--core-radius-sm` (6px) | `--core-radius-default` (0px) |
| Dashboard layout | Horizontal flex | Vertical flex column |
| Icon library | Material Symbols Outlined | lucide-react |
| Default route | `/app/auctions` | `/app/browse-auctions` |

### Public Site Theme

Separate `--pub-*` variable namespace for the landing page:

| Token | Value |
|-------|-------|
| `--pub-gold` | `#c9a227` |
| `--pub-bg-deep` | `#070b14` |
| `--pub-bg-surface` | `#0d1117` |
| `--pub-text` | `#e6e6e6` |
| `--pub-radius` | `0px` (sharp edges) |

**Public site fonts:**
- Display: Syne
- Body: Roboto
- UI: Montserrat
- Monospace: IBM Plex Mono

---

## Mobile Design System

The mobile app has a completely independent theme system in `src/theme/`.

### Color Palette

**Dark Mode (default):**

| Token | Hex | Usage |
|-------|-----|-------|
| `base` | `#0A0A0F` | Background |
| `surface` | `#141419` | Cards, surfaces |
| `gold` | `#D4A017` | Primary accent |
| `cream` | `#FFFAF0` | Primary text |
| `muted` | `#6B7280` | Secondary text |
| `success` | `#22C55E` | Approved, won |
| `warning` | `#F59E0B` | Pending, expiring |
| `danger` | `#EF4444` | Rejected, error |
| `info` | `#3B82F6` | Informational |

**Light Mode:**

| Token | Hex | Usage |
|-------|-----|-------|
| `base` | `#FBF6E9` | Background |
| `surface` | `#FFFFFF` | Cards, surfaces |
| `gold` | `#9C700A` | Primary accent |
| `cream` | `#1A1308` | Primary text |
| `muted` | `#6B7280` | Secondary text |

### Typography

| Role | Font Family |
|------|------------|
| Display | Space Grotesk |
| Body/UI | Inter |
| Numeric | JetBrains Mono |

**Type Scale:**

| Preset | Size | Weight |
|--------|------|--------|
| `hero` | 32px | 700 |
| `heading` | 24px | 700 |
| `subheading` | 18px | 600 |
| `body` | 16px | 400 |
| `bodySmall` | 14px | 400 |
| `caption` | 12px | 400 |
| `mono` | 14px | 500 (JetBrains Mono) |

### Spacing

4px base unit, 10-step scale:

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 20px |
| `2xl` | 24px |
| `3xl` | 32px |
| `4xl` | 40px |
| `5xl` | 48px |
| `6xl` | 64px |

### Border Radius

10-step scale:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 8px | Small elements |
| `sm` | 12px | Inputs, buttons |
| `md` | 16px | Cards |
| `lg` | 20px | Modals |
| `xl` | 24px | Large surfaces |
| `2xl` | 32px | — |
| `3xl` | 40px | — |
| `full` | 9999px | Pills, avatars |

### Shadows

Platform-aware elevation:

| Token | iOS | Android |
|-------|-----|---------|
| `sm` | `shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4` | `elevation: 2` |
| `md` | `shadowOffset: {width:0, height:4}, shadowOpacity: 0.15, shadowRadius: 8` | `elevation: 4` |
| `lg` | `shadowOffset: {width:0, height:8}, shadowOpacity: 0.2, shadowRadius: 16` | `elevation: 8` |
| `xl` | `shadowOffset: {width:0, height:16}, shadowOpacity: 0.25, shadowRadius: 32` | `elevation: 16` |

### Motion

Reanimated-based animation system:

| Token | Duration | Usage |
|-------|----------|-------|
| `instant` | 90ms | Micro-interactions |
| `fast` | 150ms | Button press, tab switch |
| `normal` | 250ms | Screen transitions |
| `slow` | 350ms | Modal open/close |
| `choreographed` | 500ms | Complex sequences |

**Easings:** `easeOut` (0.25, 0.46, 0.45, 0.94), `spring` (damping: 15, stiffness: 150)

### Category Colors

15 asset categories, each with a 2-stop gradient and icon:

| Category | Gradient | Icon |
|----------|----------|------|
| Vehicles | `#3B82F6` → `#1D4ED8` | 🚗 |
| Machinery | `#F59E0B` → `#D97706` | ⚙️ |
| Buildings | `#8B5CF6` → `#6D28D9` | 🏢 |
| Land | `#10B981` → `#059669` | 🌍 |
| Equipment | `#6366F1` → `#4338CA` | 🔧 |
| Salvage | `#EF4444` → `#DC2626` | 🗑️ |
| Other | `#6B7280` → `#4B5563` | 📦 |

### Status Tones

| Status | Dark Mode | Light Mode |
|--------|-----------|------------|
| live/won | `success` palette | `success` palette |
| ending | `warning` palette | `warning` palette |
| lost | `danger` palette | `danger` palette |
| pending | `info` palette | `info` palette |

---

## CSS Methodology

### Web (Admin + Frontend)

- **BEM naming** for component styles: `.dashboard-table-panel`, `.status-pill--approved`
- **CSS custom properties** for all tokens (no hardcoded values)
- **Component-scoped CSS** via class naming (no CSS modules)
- **Import chain:** `global.css` → imports `variables.css`, `tokens.js`

### Mobile

- **TypeScript theme objects** (not CSS variables)
- **StyleSheet.create** for component styles
- **Theme context** via Zustand store (`useTheme()` hook)
- **Platform-aware** shadow/elevation system
