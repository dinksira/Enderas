import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { GlassCard } from '@/components/shell/GlassCard';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { useTheme } from '@/lib/appStore';

const FAQ_KEYS = ['bidding', 'kyc', 'payments', 'assets'] as const;

const CONTACT_OPTIONS = [
  { key: 'email', icon: 'email-outline' as const, value: 'support@enderas.com' },
  { key: 'phone', icon: 'phone-outline' as const, value: '+251 11 123 4567' },
  { key: 'hours', icon: 'clock-outline' as const, value: 'Mon–Fri, 9:00–18:00 EAT' },
] as const;

export default function HelpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<string | null>(FAQ_KEYS[0]);

  return (
    <ScreenShell
      title={t('profile.menu.helpCenter')}
      showBack
      onBack={() => router.back()}
      bottomPadding={120}
    >
      <GlassCard padding={16}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {t('profile.helpScreen.intro')}
        </Text>
      </GlassCard>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('profile.helpScreen.faqTitle').toUpperCase()}
        </Text>
        <GlassCard padding={4}>
          {FAQ_KEYS.map((key, index) => {
            const isOpen = expanded === key;
            const isLast = index === FAQ_KEYS.length - 1;
            return (
              <View key={key}>
                <Pressable
                  onPress={() => setExpanded(isOpen ? null : key)}
                  style={({ pressed }) => [
                    styles.faqRow,
                    { borderBottomColor: colors.divider, opacity: pressed ? 0.75 : 1 },
                    isLast && !isOpen && { borderBottomWidth: 0 },
                  ]}
                >
                  <View
                    style={[
                      styles.faqIcon,
                      { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder },
                    ]}
                  >
                    <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.goldBright} />
                  </View>
                  <Text style={[styles.faqQuestion, { color: colors.cream }]}>
                    {t(`profile.helpScreen.faq.${key}.question`)}
                  </Text>
                  <MaterialCommunityIcons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
                {isOpen ? (
                  <View style={[styles.faqAnswer, { borderBottomColor: colors.divider }, isLast && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                      {t(`profile.helpScreen.faq.${key}.answer`)}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('profile.helpScreen.contactTitle').toUpperCase()}
        </Text>
        <GlassCard padding={4}>
          {CONTACT_OPTIONS.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() => {
                if (item.key === 'email') {
                  Linking.openURL(`mailto:${item.value}`).catch(() => {});
                } else if (item.key === 'phone') {
                  Linking.openURL(`tel:${item.value.replace(/\s/g, '')}`).catch(() => {});
                }
              }}
              style={({ pressed }) => [
                styles.contactRow,
                { borderBottomColor: colors.divider, opacity: pressed ? 0.75 : 1 },
                index === CONTACT_OPTIONS.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View
                style={[
                  styles.contactIcon,
                  { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder },
                ]}
              >
                <MaterialCommunityIcons name={item.icon} size={18} color={colors.goldBright} />
              </View>
              <View style={styles.contactBody}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
                  {t(`profile.helpScreen.contact.${item.key}`)}
                </Text>
                <Text style={[styles.contactValue, { color: colors.cream }]}>{item.value}</Text>
              </View>
              {item.key !== 'hours' ? (
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
              ) : null}
            </Pressable>
          ))}
        </GlassCard>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  faqIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  faqAnswer: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingLeft: 58,
    borderBottomWidth: 1,
  },
  faqAnswerText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  contactIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBody: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
