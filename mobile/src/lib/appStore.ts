/**
 * Global app store — owns runtime UI state that needs to survive cold
 * boots: language preference and theme mode.
 *
 * Persistence
 * -----------
 * Uses `zustand/middleware` persist with `expo-secure-store` (encrypted
 * on-device). The persisted shape is intentionally minimal — only
 * `language` and `themeMode` — so future schema changes don't migrate
 * stale UI state.
 *
 * Hydration & theme-flicker fix
 * -----------------------------
 * SecureStore is async, so the store hydrates AFTER the first render.
 * Previously that caused a "theme flicker" — the app rendered with the
 * default `system` preference (which fell back to dark), then snapped
 * to the user's persisted preference a few frames later.
 *
 * Fix: `app/_layout.tsx` reads `useHydrated()` and refuses to render
 * the navigator until hydration completes. The native splash screen
 * is held visible via `preventAutoHideAsync` during this window, so
 * the user sees the splash (not the wrong theme) until the store is
 * ready. Once hydrated, the resolved theme is applied to SystemUI and
 * the navigator mounts — no flicker.
 *
 * i18n sync
 * --------
 * The store is the source of truth for the active language. `setLanguage`
 * calls `i18n.changeLanguage` so every `useTranslation` consumer re-renders.
 * On cold boot, `app/_layout.tsx` reads the hydrated `language` and syncs
 * i18n once.
 *
 * Theme sync
 * ---------
 * `themeMode` is the user's preference (`dark` | `light` | `system`).
 * `useTheme()` resolves it against the OS color scheme and drives
 * `StatusBar` style + SystemUI background.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import i18n from '@/lib/i18n';
import {
  type ThemeMode,
  type ThemePreference,
  type ThemeColors,
  THEMES,
  resolveThemeMode,
} from '@/theme';
import { type SupportedLanguage } from '@/lib/i18n';

interface AppState {
  /** Active UI language code. */
  language: SupportedLanguage;
  /** User theme preference — may follow the OS when set to `system`. */
  themeMode: ThemePreference;
  /** True after the user has completed the onboarding flow. */
  onboardingComplete: boolean;
  /** True once the persisted state has been rehydrated from SecureStore. */
  _hasHydrated: boolean;

  setLanguage: (lang: SupportedLanguage) => void;
  setThemeMode: (mode: ThemePreference) => void;
  toggleTheme: () => void;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
      themeMode: 'system',
      onboardingComplete: false,
      _hasHydrated: false,

      setLanguage: (lang) => {
        i18n.changeLanguage(lang).catch(() => {});
        set({ language: lang });
      },
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleTheme: () => {
        const current = resolveThemeMode(get().themeMode, null);
        set({ themeMode: current === 'dark' ? 'light' : 'dark' });
      },
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
    }),
    {
      name: 'enderas-app-store',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => SecureStore.getItemAsync(name),
        setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
        removeItem: (name: string) => SecureStore.deleteItemAsync(name),
      })),
      partialize: (state) => ({ language: state.language, themeMode: state.themeMode, onboardingComplete: state.onboardingComplete }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete so `useHydrated()` returns true and
        // `app/_layout.tsx` can hide the splash + mount the navigator.
        if (state) state._hasHydrated = true;
      },
    },
  ),
);

/**
 * Subscribe to the hydration flag. The root layout gates first paint
 * on this so the resolved theme is applied before the navigator mounts.
 */
export function useHydrated(): boolean {
  return useAppStore((s) => s._hasHydrated);
}

/**
 * Convenience hook: returns the active palette + mode metadata.
 * Components should always read colors via this hook so theme switches
 * propagate instantly. The return value is memoized on resolved mode so
 * consumers don't re-render when unrelated store state changes.
 */
export function useTheme(): {
  colors: ThemeColors;
  mode: ThemeMode;
  preference: ThemePreference;
  isDark: boolean;
} {
  const preference = useAppStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  const mode = resolveThemeMode(preference, systemScheme);

  return useMemo(
    () => ({
      colors: THEMES[mode],
      mode,
      preference,
      isDark: mode === 'dark',
    }),
    [mode, preference],
  );
}
