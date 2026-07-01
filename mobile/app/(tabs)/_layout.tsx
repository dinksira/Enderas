import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { BackgroundOrbs } from '@/components/shell/BackgroundOrbs';
import { GoldenTabBar } from '@/components/shell/GoldenTabBar';

/**
 * Tabs layout — hosts the four main app screens (dashboard, bids,
 * assets, profile) and renders the custom golden glassmorphism tab bar.
 *
 * Anti-flash measures
 * -------------------
 * - `SafeAreaView` is tinted with `colors.base` so the area behind the
 *   status bar and below the tab bar matches the screen background.
 * - `contentStyle.backgroundColor` is set on every tab screen so there
 *   is no white frame during route transitions.
 * - Tab switches use `animation: 'none'`. A cross-fade (`fade`) left
 *   protected auth-gate screens stuck at opacity 0 and briefly showed
 *   the previous tab during transitions.
 * - The `BackgroundOrbs` layer is rendered ONCE at the layout level
 *   (not per-screen) so it stays put during tab switches — that gives
 *   the impression of a single continuous canvas behind the content.
 *
 * Profile tab
 * ------------
 * The profile tab hosts a nested Stack for sub-screens (settings,
 * edit-profile, help, about). The stack is kept alive during tab
 * switches so the navigation state persists when returning. The
 * profile screen itself uses `noFade` on ScreenShell since the
 * component stays mounted — no entrance animation is needed on
 * focus.
 *
 */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <View style={[styles.host, { backgroundColor: colors.base }]}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.base }]} edges={['top', 'bottom']}>
        <BackgroundOrbs />
        <View style={styles.content}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.goldBright,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: { display: 'none' }, // we render our own bar
              sceneStyle: { backgroundColor: colors.base },
              animation: 'none',
              lazy: false,
            }}
            tabBar={(props) => <GoldenTabBar {...(props as any)} />}
          >
            <Tabs.Screen name="dashboard" />
            <Tabs.Screen name="bids" />
            <Tabs.Screen name="assets" />
            <Tabs.Screen name="profile" />
          </Tabs>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  safe: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
});
