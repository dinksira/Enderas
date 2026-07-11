import { Stack } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { NAV_TRANSITION_MS } from '@/theme/motion';

/**
 * Auction detail layout — index / buy-doc / document / bid sub-routes.
 *
 * The bottom-sheet modal provider used to be nested here as a defensive
 * workaround for screens that opened sheets from inside this stack. The
 * root `_layout.tsx` already mounts a single `BottomSheetModalProvider`
 * above the navigator, so the nested provider is redundant and was
 * removed during the SDK-57 redesign (it caused ref/dismiss quirks when
 * a sheet was dismissed from a parent route).
 */
export default function AuctionDetailLayout() {
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
      <Stack.Screen name="index" />
      <Stack.Screen name="buy-doc" />
      <Stack.Screen name="document" />
      <Stack.Screen name="bid" />
    </Stack>
  );
}
