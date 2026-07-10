import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { useTheme } from '@/lib/appStore';
import { NAV_TRANSITION_MS } from '@/theme/motion';

export default function AuctionDetailLayout() {
  const { colors } = useTheme();

  return (
    <BottomSheetModalProvider>
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
    </BottomSheetModalProvider>
  );
}
