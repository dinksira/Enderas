import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/appStore';
import { useAssetCategories } from '@/hooks/useAssetCategories';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { categories, loading } = useAssetCategories();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [open, anim]);

  const dropdownScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const dropdownOpacity = anim;

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.glassFill,
            borderColor: value ? colors.goldBorderActive : colors.goldBorder,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.browse.category')}
      >
        <MaterialCommunityIcons name="filter-variant" size={18} color={colors.goldBright} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={[styles.modalOverlay, { paddingTop: insets.top + 150 }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.baseElevated,
                    borderColor: colors.goldBorder,
                    shadowColor: Platform.select({ ios: '#000', android: colors.goldGlow }),
                    opacity: dropdownOpacity,
                    transform: [{ scale: dropdownScale }],
                  },
                ]}
              >
                <View style={[styles.dropdownHeader, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.dropdownTitle, { color: colors.goldBright }]}>
                    {t('dashboard.browse.category').toUpperCase()}
                  </Text>
                </View>
                {loading ? (
                  <View style={styles.loadingRow}>
                    <Text style={[styles.optionLabel, { color: colors.textMuted }]}>
                      {t('common.loading')}
                    </Text>
                  </View>
                ) : (
                  ['', ...categories].map((cat) => {
                  const active = cat === value;
                  return (
                    <Pressable
                      key={cat || 'all'}
                      onPress={() => {
                        onChange(cat);
                        setOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.optionRow,
                        {
                          backgroundColor: active ? colors.glassFillActive : 'transparent',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: active ? colors.goldBright : colors.cream },
                        ]}
                      >
                        {cat
                          ? t(`dashboard.categories.${cat}`, { defaultValue: cat })
                          : t('dashboard.filters.all')}
                      </Text>
                      {active ? (
                        <MaterialCommunityIcons name="check-circle" size={18} color={colors.goldBright} />
                      ) : null}
                    </Pressable>
                  );
                })
                )}
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
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...Platform.select({
      ios: {
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 14 },
    }),
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
  loadingRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CategoryFilter;
