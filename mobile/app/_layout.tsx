import 'react-native-reanimated';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreenExpo from 'expo-splash-screen';
import i18n from '@/lib/i18n';
import { useAppStore, useTheme, useHydrated } from '@/lib/appStore';
import { resolveThemeMode, THEMES } from '@/theme';
import { NAV_TRANSITION_MS } from '@/theme/motion';
import SplashScreen from '@/components/splash-screen/SplashScreen';

/**
 * Root layout.
 *
 * Theme-flicker fix
 * -----------------
 * The native splash is held visible via `preventAutoHideAsync` for as
 * long as needed to:
 *   1. load the custom fonts (useFonts),
 *   2. rehydrate the persisted store from SecureStore (useHydrated),
 *   3. compute the resolved theme mode from (preference, systemScheme),
 *   4. push that theme's base color to SystemUI (so the window
 *      background matches the first navigator render).
 *
 * Only then do we hide the native splash and mount the navigator. This
 * eliminates the previous cold-start flicker where the app rendered
 * with the default `system` theme and snapped to the user's persisted
 * preference a few frames later.
 *
 * Branded splash
 * --------------
 * After the native splash hides, we render a custom animated splash
 * (hammer strike + brand reveal) WITHOUT mounting the navigator.
 * Mounting routes during the choreography was freezing the animation
 * halfway — the JS thread was busy loading screens underneath.
 * Once choreography finishes, routes mount underneath while the splash
 * stays at full opacity. The exit fade only starts after the navigator
 * has laid out — no blank gap, no fixed post-animation delay.
 *
 * Splash timing
 * -------------
 *   1. Native splash shows immediately on app launch (configured in
 *      app.json, held by `preventAutoHideAsync`).
 *   2. We wait for fonts + persisted store to be ready (`ready` flag).
 *      During this window the native splash stays visible — covers
 *      the app's initial resource loading.
 *   3. Once ready, the custom SplashScreen mounts. Its first paint
 *      (decorative orbs + base background) happens BEFORE the native
 *      splash is hidden — we defer `hideAsync` by one animation frame
 *      so there's no brief blank frame between native-hide and
 *      custom-paint.
 *   4. The custom splash's choreography plays to completion
 *      (~2.0s, see splashConfig.choreographyRuntime). The navigator
 *      is NOT mounted during this window.
 *   5. `onChoreographyComplete` mounts the navigator; the splash
 *      stays visible until the first layout (`onLayout`).
 *   6. `dismiss` triggers the exit fade (~350ms); `onFinish` removes
 *      the overlay and reveals the first screen.
 *
 * The splash's minimum display duration therefore covers BOTH the
 * app's initial loading (fonts + store hydration, step 2) AND the
 * full choreography runtime (step 4) — neither is cut short.
 */

// Hold the native splash visible until we've finished bootstrapping.
SplashScreenExpo.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [navigatorMounted, setNavigatorMounted] = useState(false);
  const [navigatorReady, setNavigatorReady] = useState(false);
  const navigatorReadyRef = useRef(false);
  const { colors, isDark } = useTheme();
  const language = useAppStore((s) => s.language);
  const themeMode = useAppStore((s) => s.themeMode);
  const hydrated = useHydrated();
  const systemScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  // ── Bootstrap gate ───────────────────────────────────────────────────
  // Compute readiness: fonts must be loaded AND store must be hydrated.
  // Until both are true, the native splash stays visible (we return null)
  // and the navigator never mounts — so no wrong-theme flash.
  const ready = fontsLoaded && hydrated;

  // Resolve the theme *now* (before the navigator mounts) so SystemUI
  // and the root view background both match the first frame.
  const resolvedMode = resolveThemeMode(themeMode, systemScheme);
  const resolvedColors = THEMES[resolvedMode];

  // ── Native splash hide (deferred one frame after readiness) ──────────
  // We wait until `ready` AND defer one animation frame so the custom
  // SplashScreen has a chance to paint its first frame BEFORE the
  // native splash hides. Without this defer, there's a brief blank
  // frame between native-hide and custom-paint.
  useEffect(() => {
    if (!ready) return;
    const raf = requestAnimationFrame(() => {
      SplashScreenExpo.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // ── SystemUI background sync ────────────────────────────────────────
  // Apply the resolved theme's base color to the system UI background
  // (visible during app switch transitions). Updated whenever the theme
  // changes at runtime too.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.base).catch(() => {});
  }, [colors.base]);

  // ── i18n sync ───────────────────────────────────────────────────────
  // Sync i18n with the persisted language once the store has hydrated.
  useEffect(() => {
    if (!hydrated) return;
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [hydrated, language]);

  const handleChoreographyComplete = useCallback(() => {
    setNavigatorMounted(true);
  }, []);

  const handleNavigatorLayout = useCallback(() => {
    if (navigatorReadyRef.current) return;
    navigatorReadyRef.current = true;
    // Defer until the JS thread is idle, then wait one frame for paint.
    requestIdleCallback(
      () => {
        requestAnimationFrame(() => {
          setNavigatorReady(true);
        });
      },
      { timeout: 500 },
    );
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  const dismissSplash = navigatorMounted && navigatorReady;

  // ── Pre-bootstrap: hold the native splash, render nothing ───────────
  // Returning null keeps the navigator unmounted. The native splash
  // (held by preventAutoHideAsync) is what the user sees.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: resolvedColors.base }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardProvider>
        <View style={{ flex: 1, backgroundColor: resolvedColors.base }}>
          <View style={{ flex: 1 }}>
            {navigatorMounted ? (
              <View style={{ flex: 1 }} onLayout={handleNavigatorLayout}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  // `fade` at the root keeps the brand canvas stable while
                  // groups (auth/tabs/onboarding) cross-dissolve. Sub-routes
                  // inside each group can use slide_from_right for forward
                  // navigation — see those layout files.
                  animation: 'fade',
                  animationDuration: NAV_TRANSITION_MS,
                  contentStyle: { backgroundColor: resolvedColors.base },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="auction/[id]"
                  options={{ animation: 'slide_from_right', animationDuration: NAV_TRANSITION_MS }}
                />
                <Stack.Screen
                  name="kyc/index"
                  options={{ animation: 'slide_from_right', animationDuration: NAV_TRANSITION_MS }}
                />
                <Stack.Screen
                  name="assets/submit"
                  options={{ animation: 'slide_from_right', animationDuration: NAV_TRANSITION_MS }}
                />
                <Stack.Screen
                  name="assets/[id]"
                  options={{ animation: 'slide_from_right', animationDuration: NAV_TRANSITION_MS }}
                />
              </Stack>
              </View>
            ) : null}
          </View>
          {showCustomSplash ? (
            <View style={StyleSheet.absoluteFill}>
              <SplashScreen
                onChoreographyComplete={handleChoreographyComplete}
                dismiss={dismissSplash}
                onFinish={handleSplashFinish}
              />
            </View>
          ) : null}
        </View>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
