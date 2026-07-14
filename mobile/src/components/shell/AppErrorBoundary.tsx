import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * Branded, hook-based fallback rendered by the class boundary once the
 * subtree has already crashed. Because it mounts fresh above the failed
 * tree, it can safely use theme/i18n hooks again.
 */
function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const goHome = () => {
    onReset();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.base, paddingTop: insets.top + Spacing.xl },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.goldBright} />
      </View>

      <Text style={[Typography.h1, styles.title, { color: colors.cream }]}>
        {t('common.errorBoundary.title')}
      </Text>
      <Text style={[Typography.body, styles.body, { color: colors.textSecondary }]}>
        {t('common.errorBoundary.body')}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.errorBoundary.retry')}
        >
          <Text style={[Typography.bodyMedium, { color: colors.textOnGold, fontWeight: '800' }]}>
            {t('common.errorBoundary.retry')}
          </Text>
        </Pressable>

        <Pressable
          onPress={goHome}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.goldBorder, opacity: pressed ? 0.75 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.errorBoundary.home')}
        >
          <Text style={[Typography.bodyMedium, { color: colors.goldChampagne, fontWeight: '700' }]}>
            {t('common.errorBoundary.home')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Top-level error boundary. Prevents a render-time throw anywhere in the
 * navigator from white-screening the entire app; instead the user sees a
 * branded recovery screen with retry / go-home actions.
 */
export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      // Surfaced only in development; production ships without console noise.
      // Wire a crash reporter (e.g. Sentry) here when available.
      console.error('[AppErrorBoundary]', error, info.componentStack);
    }
  }

  reset() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.reset} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 340,
    gap: Spacing.sm,
  },
  primaryButton: {
    height: 52,
    borderRadius: Radii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    height: 52,
    borderRadius: Radii.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppErrorBoundary;
