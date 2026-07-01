import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { GlassCard } from '@/components/shell/GlassCard';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { useTheme } from '@/lib/appStore';

const LINK_ITEMS = [
  { key: 'terms', icon: 'file-document-outline' as const },
  { key: 'privacy', icon: 'shield-lock-outline' as const },
  { key: 'licenses', icon: 'license' as const },
] as const;

const STATS = [
  { key: 'auctions', value: '2,400+' },
  { key: 'users', value: '18K+' },
  { key: 'assets', value: '9,500+' },
] as const;

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScreenShell
      title={t('profile.menu.about')}
      showBack
      onBack={() => router.back()}
      bottomPadding={120}
    >
      <GlassCard padding={20}>
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.gold, colors.goldDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}
          >
            <MaterialCommunityIcons name="gavel" size={32} color={colors.textOnGold} />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.cream }]}>Enderas</Text>
          <Text style={[styles.tagline, { color: colors.goldBright }]}>
            {t('profile.aboutScreen.tagline')}
          </Text>
          <View style={[styles.versionPill, { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder }]}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              {t('settings.about.version')} {t('settings.about.versionNumber')}
            </Text>
          </View>
        </View>
      </GlassCard>

      <View style={styles.section}>
        <GlassCard padding={16}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {t('profile.aboutScreen.description')}
          </Text>
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('profile.aboutScreen.statsTitle').toUpperCase()}
        </Text>
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <GlassCard key={stat.key} padding={14} style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.goldBright }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t(`profile.aboutScreen.stats.${stat.key}`)}
              </Text>
            </GlassCard>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('profile.aboutScreen.legalTitle').toUpperCase()}
        </Text>
        <GlassCard padding={4}>
          {LINK_ITEMS.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() => {}}
              style={({ pressed }) => [
                styles.linkRow,
                { borderBottomColor: colors.divider, opacity: pressed ? 0.75 : 1 },
                index === LINK_ITEMS.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View
                style={[
                  styles.linkIcon,
                  { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder },
                ]}
              >
                <MaterialCommunityIcons name={item.icon} size={18} color={colors.goldBright} />
              </View>
              <Text style={[styles.linkLabel, { color: colors.cream }]}>
                {t(`profile.aboutScreen.links.${item.key}`)}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </GlassCard>
      </View>

      <Text style={[styles.footer, { color: colors.textMuted }]}>
        {t('profile.aboutScreen.copyright')}
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  versionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  bodyText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footer: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
});
