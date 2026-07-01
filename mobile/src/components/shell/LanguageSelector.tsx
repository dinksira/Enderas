import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAppStore, useTheme } from '@/lib/appStore';
import { glassElevation } from '@/lib/glassStyles';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@/lib/i18n';

/**
 * Compact language selector for the header. Shows the active language
 * code; tap to open a small dropdown with all supported languages.
 *
 * Why a custom dropdown instead of a system picker:
 *   - The header layout is tight; we need full control over sizing.
 *   - The dropdown matches the golden glassmorphism style of the rest
 *     of the app (system pickers would render with the OS chrome).
 *   - It animates in/out with the same easing curve as other panels.
 */
export function LanguageSelector() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const [open, setOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Keep the local i18n instance in sync with the persisted store value.
  // This covers cold boot (store hydrates after first render) and any
  // external changeLanguage calls.
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [language, i18n]);

  useEffect(() => {
    if (open) {
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      dropdownAnim.setValue(0);
    }
  }, [open, dropdownAnim]);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setOpen(false);
  };

  const dropdownScale = dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const dropdownOpacity = dropdownAnim;

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
      >
        <Text style={[styles.triggerText, { color: colors.cream }]}>
          {language.toUpperCase()}
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textSecondary}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.baseElevated,
                    borderColor: colors.goldBorder,
                    ...glassElevation(isDark, 'floating'),
                    opacity: dropdownOpacity,
                    transform: [{ scale: dropdownScale }],
                  },
                ]}
              >
                <View style={[styles.dropdownHeader, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.dropdownTitle, { color: colors.goldBright }]}>
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
                      <Text style={[styles.optionLabel, { color: active ? colors.goldBright : colors.cream }]}>
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
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  triggerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  dropdown: {
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LanguageSelector;
