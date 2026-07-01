import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GoldButton } from './GoldButton';
import { AppHeader } from '@/components/shell/AppHeader';
import { GlassCard } from '@/components/shell/GlassCard';
import { useTheme } from '@/lib/appStore';
import { Spacing } from '@/theme';

interface AuthRequiredProps {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  message: string;
  cta: string;
  /** Route to return to after login (e.g. /(tabs)/bids). */
  returnTo?: string;
}

/**
 * Shown on tab screens that require a signed-in end-user account.
 * Keeps the tab bar visible while prompting login.
 *
 * Uses a static layout (no entrance animations) so tab switches never
 * leave the prompt stuck at opacity 0 behind a cross-fade.
 */
export function AuthRequired({ title, icon, message, cta, returnTo }: AuthRequiredProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleLogin = () => {
    const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    router.push(`/(auth)/login${params}` as any);
  };

  return (
    <View style={[styles.host, { backgroundColor: colors.base }]}>
      <AppHeader title={title} instantTitle />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        keyboardShouldPersistTaps="handled"
      >
        <GlassCard padding={24} noAnimation>
          <View style={styles.content}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder },
              ]}
            >
              <MaterialCommunityIcons name={icon} size={36} color={colors.goldBright} />
            </View>

            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

            <GoldButton label={cta} onPress={handleLogin} />

            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {t('authRequired.noAccountHint')}{' '}
              <Text
                style={{ color: colors.goldBright, fontWeight: '700' }}
                onPress={() => router.push('/(auth)/register')}
              >
                {t('auth.register')}
              </Text>
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm2,
    paddingBottom: Spacing.tabBarClearance,
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
    gap: 18,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  hint: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default AuthRequired;
