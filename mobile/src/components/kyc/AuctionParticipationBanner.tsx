import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { useAuthStore, useIsAuthenticated } from '@/lib/authStore';
import { getAuctionParticipationBannerState } from '@/lib/auth-utils';
import { Typography, Spacing, Radii } from '@/theme';
import { PressableScale } from '@/components/ui';

type BannerVariant = 'login' | 'submit' | 'pending' | 'rejected';

/**
 * Resolve a banner variant to a theme status palette — same pattern as
 * the auction/asset/bid cards, so all status UI shares one tone system.
 */
function variantStatus(variant: BannerVariant) {
  switch (variant) {
    case 'submit':
      return 'warning' as const;
    case 'rejected':
      return 'danger' as const;
    case 'login':
    case 'pending':
    default:
      return 'info' as const;
  }
}

/**
 * Compact info strip shown below the dashboard header to guide users
 * toward login or KYC before they can participate in auctions.
 *
 * Variant colors are resolved from the theme's status palettes, so they
 * automatically adjust for WCAG contrast in light/dark mode.
 */
export function AuctionParticipationBanner() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);

  const state = getAuctionParticipationBannerState(isAuthenticated, user);
  if (!state) return null;

  const statusKey = variantStatus(state.variant);
  const status = colors[statusKey];

  const variantIcon: Record<BannerVariant, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    login: 'account-alert-outline',
    submit: 'shield-alert-outline',
    pending: 'clock-outline',
    rejected: 'shield-off-outline',
  };

  const handleLogin = () => {
    router.push('/(auth)/login?returnTo=%2F(tabs)%2Fdashboard' as any);
  };

  const handleKyc = () => {
    router.push('/kyc' as any);
  };

  const onPress =
    state.variant === 'login'
      ? handleLogin
      : state.variant === 'pending'
        ? undefined
        : handleKyc;

  const renderMessage = () => {
    switch (state.variant) {
      case 'login':
        return (
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {t('kyc.participation.loginPrefix')}
            <Text style={[Typography.caption, styles.link, { color: colors.goldBright }]} onPress={handleLogin}>
              {t('kyc.participation.loginLink')}
            </Text>
            {t('kyc.participation.loginSuffix')}
          </Text>
        );
      case 'submit':
        return (
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {t('kyc.participation.submitPrefix')}
            <Text style={[Typography.caption, styles.link, { color: colors.goldBright }]} onPress={handleKyc}>
              {t('kyc.participation.submitLink')}
            </Text>
            {t('kyc.participation.submitSuffix')}
          </Text>
        );
      case 'pending':
        return (
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {t('kyc.participation.pending')}
          </Text>
        );
      case 'rejected':
        return (
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {t('kyc.participation.rejectedPrefix')}{' '}
            <Text style={[Typography.caption, styles.link, { color: colors.goldBright }]} onPress={handleKyc}>
              {t('kyc.participation.rejectedLink')}
            </Text>
            {t('kyc.participation.rejectedSuffix')}
          </Text>
        );
      default:
        return null;
    }
  };

  return (
    <PressableScale
      onPress={onPress}
      disabled={state.variant === 'pending' || !onPress}
      noScale={state.variant === 'pending'}
      style={[
        styles.host,
        {
          backgroundColor: status.soft,
          borderColor: status.border,
        },
      ]}
    >
      <MaterialCommunityIcons name={variantIcon[state.variant]} size={14} color={status.fg} />
      <View style={styles.messageWrap}>{renderMessage()}</View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  host: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  messageWrap: {
    flex: 1,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default AuctionParticipationBanner;
