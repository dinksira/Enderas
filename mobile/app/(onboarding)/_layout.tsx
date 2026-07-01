import { Stack } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { NAV_TRANSITION_MS } from '@/theme/motion';

/**
 * Onboarding layout — anchors the brand canvas so there's no white
 * flash between route transitions. The single onboarding step uses a
 * fade transition (calmer than a slide for a one-screen flow).
 */
export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: NAV_TRANSITION_MS,
        contentStyle: { backgroundColor: colors.base },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
