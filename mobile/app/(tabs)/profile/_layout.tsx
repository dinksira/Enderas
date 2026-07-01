import { Stack } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { NAV_TRANSITION_MS } from '@/theme/motion';

/**
 * Profile layout — hosts the profile index + its sub-screens
 * (edit-profile, settings, help, about) in a nested Stack.
 *
 * The tab-state bug fix lives in `(tabs)/_layout.tsx` (`unmountOnBlur`
 * on the profile Tabs.Screen). This file only owns the Stack's visual
 * config: slide-from-right transitions, no header, theme background.
 */
export default function ProfileLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: NAV_TRANSITION_MS,
        contentStyle: { backgroundColor: colors.base },
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
