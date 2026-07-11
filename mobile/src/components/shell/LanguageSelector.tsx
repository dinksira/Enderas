import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAppStore, useTheme } from '@/lib/appStore';
import { SheetDropdown } from '@/components/sheet';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@/lib/i18n';
import { Radii, Spacing, Typography } from '@/theme';

/**
 * Compact language selector for the header. Shows the active language
 * code; tap to open a small dropdown with all supported languages.
 *
 * Now built on the shared `<SheetDropdown>` primitive so the motion
 * + backdrop matches every other overlay in the app.
 */
export function LanguageSelector() {
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const [open, setOpen] = useState(false);

  // Keep the local i18n instance in sync with the persisted store value.
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [language, i18n]);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.glassFill,
            borderColor: colors.goldBorder,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Text style={[Typography.caption, { color: colors.cream, fontWeight: '800', letterSpacing: 1 }]}>
          {language.toUpperCase()}
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textSecondary}
        />
      </Pressable>

      <SheetDropdown visible={open} onDismiss={() => setOpen(false)} maxWidth={220}>
        <View style={[styles.dropdownHeader, { borderBottomColor: colors.divider }]}>
          <Text style={[Typography.eyebrow, { color: colors.goldBright }]}>
            LANGUAGE
          </Text>
        </View>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang === language;
          return (
            <Pressable
              key={lang}
              onPress={() => handleSelect(lang)}
              style={({ pressed }) => [
                styles.optionRow,
                { backgroundColor: active ? colors.glassFillActive : 'transparent', opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[Typography.bodyMedium, { color: active ? colors.goldBright : colors.cream }]}>
                {LANGUAGE_LABELS[lang]}
              </Text>
              {active ? (
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.goldBright} />
              ) : (
                <MaterialCommunityIcons name="circle-outline" size={18} color={colors.textMuted} />
              )}
            </Pressable>
          );
        })}
      </SheetDropdown>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 34,
  },
  dropdownHeader: {
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm2,
    borderBottomWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm2,
  },
});

export default LanguageSelector;
