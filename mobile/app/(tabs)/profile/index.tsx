import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { AuthRequired } from '@/components/auth';
import { useAuthStore, useIsAuthenticated } from '@/lib/authStore';
import { useTheme } from '@/lib/appStore';
import { getKycProfileStatus, type KycProfileStatus } from '@/lib/auth-utils';
import { useRefreshSession } from '@/hooks/useRefreshSession';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { Typography, Spacing, Radii } from '@/theme';
import type { ThemeColors } from '@/theme/colors';

interface MenuItem {
  key: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route?: string;
  danger?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'profile.editProfile', icon: 'account-edit-outline', route: '/(tabs)/profile/edit-profile' },
  { key: 'profile.menu.settings', icon: 'cog-outline', route: '/(tabs)/profile/settings' },
  { key: 'profile.menu.myBids', icon: 'gavel', route: '/(tabs)/bids' },
  { key: 'profile.menu.myAssets', icon: 'treasure-chest', route: '/(tabs)/assets' },
  { key: 'profile.menu.helpCenter', icon: 'lifebuoy', route: '/(tabs)/profile/help' },
  { key: 'profile.menu.about', icon: 'information-outline', route: '/(tabs)/profile/about' },
];

function getInitials(displayName?: string, email?: string): string {
  const source = displayName?.trim() || email?.trim() || '?';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

/**
 * KYC status presentation.
 *
 * Each status maps to a semantic status palette on the active theme
 * (success / warning / info / danger). The icon names are static —
 * only the colors come from the theme, so contrast is automatic in
 * light/dark mode.
 */
const KYC_STATUS_PRESENTATION: Record<
  KycProfileStatus,
  {
    badgeIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    pillIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    statusKey: 'success' | 'warning' | 'info' | 'danger';
  }
> = {
  approved: { badgeIcon: 'check-decagram', pillIcon: 'check-circle', statusKey: 'success' },
  not_submitted: { badgeIcon: 'shield-alert-outline', pillIcon: 'alert-circle-outline', statusKey: 'warning' },
  under_review: { badgeIcon: 'clock-outline', pillIcon: 'clock-outline', statusKey: 'info' },
  rejected: { badgeIcon: 'shield-off-outline', pillIcon: 'close-circle-outline', statusKey: 'danger' },
};

function getKycPalette(status: KycProfileStatus, colors: ThemeColors) {
  const presentation = KYC_STATUS_PRESENTATION[status];
  const palette = colors[presentation.statusKey];
  return { ...presentation, palette };
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title={t('profile.title')}
        icon="account-circle-outline"
        message={t('authRequired.profileMessage')}
        cta={t('authRequired.loginCta')}
        returnTo="/(tabs)/profile"
      />
    );
  }

  return <AuthenticatedProfile />;
}

function AuthenticatedProfile() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { refreshing, refresh } = useRefreshSession();

  const displayName = user?.displayName || t('profile.guestName');
  const email = user?.email || user?.mobileNumber || '';
  const initials = getInitials(user?.displayName, user?.email);
  const kycStatus = getKycProfileStatus(user);
  const kyc = kycStatus ? getKycPalette(kycStatus, colors) : null;
  const isKycActionable = kycStatus === 'not_submitted' || kycStatus === 'rejected';

  const handleKycPress = () => {
    if (!isKycActionable) return;
    router.push('/kyc' as any);
  };

  const handleLogout = () => {
    clearSession();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ScreenShell
      title={t('profile.title')}
      bottomPadding={120}
      refreshing={refreshing}
      onRefresh={refresh}
      noFade
    >
      <GlassCard padding={Spacing.md2}>
        <View style={styles.profileHead}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={[colors.gold, colors.goldDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={[Typography.statValue, { color: colors.textOnGold, fontSize: 26, fontWeight: '900' }]}>
                {initials}
              </Text>
            </LinearGradient>
            {kyc ? (
              <View
                style={[
                  styles.avatarBadge,
                  { backgroundColor: kyc.palette.fg, borderColor: colors.base },
                ]}
              >
                <MaterialCommunityIcons
                  name={kyc.badgeIcon}
                  size={14}
                  color={colors.textOnGold}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={[Typography.h1, { color: colors.cream, fontSize: 18 }]} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="email-outline" size={14} color={colors.textSecondary} />
              <Text style={[Typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {email}
              </Text>
            </View>
            {user?.mobileNumber ? (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textMuted} />
                <Text style={[Typography.caption, { color: colors.textMuted }]}>
                  {user.mobileNumber}
                </Text>
              </View>
            ) : null}
            {kycStatus && kyc ? (
              <Pressable
                onPress={handleKycPress}
                disabled={!isKycActionable}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  marginTop: 6,
                  opacity: pressed && isKycActionable ? 0.8 : 1,
                })}
              >
                <View
                  style={[
                    styles.kycStatusPill,
                    { backgroundColor: kyc.palette.soft, borderColor: kyc.palette.border },
                  ]}
                >
                  <MaterialCommunityIcons name={kyc.pillIcon} size={11} color={kyc.palette.fg} />
                  <Text style={[Typography.microCaps, { color: kyc.palette.fg }]}>
                    {t(`profile.kycStatus.${kycStatus}`)}
                  </Text>
                  {isKycActionable ? (
                    <MaterialCommunityIcons name="chevron-right" size={12} color={kyc.palette.fg} />
                  ) : null}
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      </GlassCard>

      <View style={styles.menuGroup}>
        <GlassCard padding={4}>
          {MENU_ITEMS.map((item, ii) => (
            <MenuRow key={item.key} item={item} isLast={ii === MENU_ITEMS.length - 1} />
          ))}
        </GlassCard>
      </View>

      <View style={styles.logoutWrap}>
        <Pressable onPress={handleLogout} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <GlassCard tone="danger" padding={Spacing.md} noAnimation>
            <View style={styles.logoutRow}>
              <MaterialCommunityIcons name="logout" size={22} color={colors.danger.fg} />
              <Text style={[Typography.cardTitle, { color: colors.danger.fg }]}>
                {t('profile.menu.logout')}
              </Text>
            </View>
          </GlassCard>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handlePress = () => {
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.menuRow,
        { borderBottomColor: colors.divider, opacity: pressed ? 0.7 : 1 },
        isLast && { borderBottomWidth: 0 },
      ]}
    >
      <View
        style={[
          styles.menuIconWrap,
          { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder },
        ]}
      >
        <MaterialCommunityIcons name={item.icon} size={18} color={colors.goldBright} />
      </View>
      <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '600', flex: 1 }]} numberOfLines={1}>
        {t(item.key)}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileHead: {
    flexDirection: 'row',
    gap: Spacing.sm2,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  kycStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  menuGroup: {
    marginTop: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radii.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutWrap: {
    marginTop: Spacing.lg,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs2,
  },
});
