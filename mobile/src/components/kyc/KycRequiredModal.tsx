import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { useTheme } from '@/lib/appStore';
import { GLASS_RADIUS, glassElevation } from '@/lib/glassStyles';

interface KycRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: () => void;
}

/**
 * Themed dialog shown when a user tries to submit assets without KYC approval.
 * Replaces the native Alert so the prompt matches the app's glass/gold styling.
 */
export function KycRequiredModal({ visible, onClose, onVerify }: KycRequiredModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const opacity = anim;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.baseElevated,
                  borderColor: colors.warning.border,
                  opacity,
                  transform: [{ scale }],
                  ...glassElevation(isDark, 'floating'),
                },
              ]}
            >
              <View style={styles.iconWrap}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: colors.warning.soft,
                      borderColor: colors.warning.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="shield-alert-outline" size={28} color={colors.warning.fg} />
                </View>
              </View>

              <Text style={[styles.title, { color: colors.cream }]}>{t('assets.kycRequired.title')}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {t('assets.kycRequired.message')}
              </Text>

              <View style={styles.actions}>
                <View style={styles.actionButton}>
                  <GoldButton label={t('common.cancel')} variant="outline" onPress={onClose} compact />
                </View>
                <View style={styles.actionButton}>
                  <GoldButton label={t('profile.menu.kycVerification')} onPress={onVerify} compact />
                </View>
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is bound at runtime (theme-aware) — see JSX.
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: GLASS_RADIUS.floating,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    marginBottom: 14,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor + borderColor are bound at runtime (theme-aware).
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    maxWidth: 280,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default KycRequiredModal;
