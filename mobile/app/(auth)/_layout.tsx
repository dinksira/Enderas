import { Stack } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { NAV_TRANSITION_MS } from '@/theme/motion';

/**
 * Auth navigation stack — login / register / verify-otp.
 *
 * Uses `slide_from_right` for forward navigation (feels like pushing a
 * new screen) and the standard `slide_from_left` for back. Duration
 * matches the global motion token (~280ms) — fast enough to feel
 * snappy, slow enough to read as intentional.
 *
 * Background color is bound to the active theme's `base` so there's no
 * flash of the wrong color when a route transition briefly exposes the
 * window background.
 */
export default function AuthLayout() {
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
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-reset-otp" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="reset-success" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
