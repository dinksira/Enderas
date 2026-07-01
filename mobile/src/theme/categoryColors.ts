import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Category palette — content colors used to brand asset/auction cards by
 * category. These are *content* colors (not UI chrome) so they live here
 * rather than in `colors.ts` — the same golden UI accent system applies
 * to every category; only the card cover gradient changes.
 *
 * Each entry pairs a 2-stop linear gradient (top→bottom) with a Material
 * Community Icons name. Gradients are tuned to keep white text readable
 * on top (3:1+ contrast for the title overlay).
 */
export type CategoryKey =
  | 'vehicles'
  | 'vehicle'
  | 'land'
  | 'buildings'
  | 'building'
  | 'equipment'
  | 'salvage_assets'
  | 'salvage'
  | 'other_assets'
  | 'other'
  | 'realEstate'
  | 'jewelry'
  | 'art'
  | 'electronics'
  | 'machinery';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface CategoryTheme {
  /** 2-stop linear gradient (top, bottom) for the card cover. */
  colors: [string, string];
  /** Material Community Icons name for the category. */
  icon: IconName;
}

const CATEGORY_THEMES: Record<CategoryKey, CategoryTheme> = {
  vehicles: { colors: ['#2A3A5C', '#141E33'], icon: 'car-sports' },
  vehicle: { colors: ['#2A3A5C', '#141E33'], icon: 'car-sports' },
  land: { colors: ['#3D4A2E', '#1E2618'], icon: 'terrain' },
  buildings: { colors: ['#3D4A2E', '#1E2618'], icon: 'home-city' },
  building: { colors: ['#3D4A2E', '#1E2618'], icon: 'home-city' },
  equipment: { colors: ['#1E3A4A', '#0F1E26'], icon: 'toolbox-outline' },
  salvage_assets: { colors: ['#4A3020', '#261810'], icon: 'recycle' },
  salvage: { colors: ['#4A3020', '#261810'], icon: 'recycle' },
  other_assets: { colors: ['#3A3020', '#1A1308'], icon: 'package-variant' },
  other: { colors: ['#3A3020', '#1A1308'], icon: 'package-variant' },
  realEstate: { colors: ['#3D4A2E', '#1E2618'], icon: 'home-city' },
  jewelry: { colors: ['#4A3520', '#261A0E'], icon: 'diamond-stone' },
  art: { colors: ['#3A2848', '#1E1426'], icon: 'palette' },
  electronics: { colors: ['#1E3A4A', '#0F1E26'], icon: 'laptop' },
  machinery: { colors: ['#3A3020', '#1E1810'], icon: 'excavator' },
};

const DEFAULT_THEME: CategoryTheme = {
  colors: ['#3A3020', '#1A1308'],
  icon: 'gavel',
};

/**
 * Look up the category theme. Falls back to the gavel default when the
 * category is unknown or unnormalized.
 *
 * Matching is fuzzy: the input is lowercased and stripped of whitespace,
 * then matched against the keys. If no exact match, we check whether the
 * input *contains* any known key (handles values like "Vehicle Auction").
 */
export function getCategoryTheme(category: string): CategoryTheme {
  const key = category.replace(/\s+/g, '').toLowerCase();
  const normalized = Object.keys(CATEGORY_THEMES).find(
    (k) => k.toLowerCase() === key || category.toLowerCase().includes(k.toLowerCase()),
  );
  return normalized ? CATEGORY_THEMES[normalized as CategoryKey] : DEFAULT_THEME;
}
