import { useMemo } from 'react';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/lib/appStore';

export interface KeyboardToolbarTheme {
  primary: ColorValue;
  disabled: ColorValue;
  background: string;
  ripple: ColorValue;
}

export type KeyboardToolbarThemeConfig = {
  light: KeyboardToolbarTheme;
  dark: KeyboardToolbarTheme;
};

/** Gold-themed keyboard toolbar colors shared by auth and form screens. */
export function useKeyboardToolbarTheme(): KeyboardToolbarThemeConfig {
  const { colors } = useTheme();

  return useMemo(
    () => ({
      light: {
        primary: colors.goldBright,
        disabled: colors.textMuted,
        background: colors.baseElevated,
        ripple: colors.goldGlow,
      },
      dark: {
        primary: colors.goldBright,
        disabled: colors.textMuted,
        background: colors.baseElevated,
        ripple: colors.goldGlow,
      },
    }),
    [colors],
  );
}
