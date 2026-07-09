import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from './GoldButton';
import { useTheme } from '@/lib/appStore';
import { GLASS_RADIUS, glassElevation } from '@/lib/glassStyles';

interface AuthSuccessModalProps {
  visible: boolean;
  title: string;
  message?: string;
  ctaLabel: string;
  onContinue: () => void;
}

/**
 * Animated success confirmation for auth flows (OTP sent, verified, password updated).
 */
export function AuthSuccessModal({
  visible,
  title,
  message,
  ctaLabel,
  onContinue,
}: AuthSuccessModalProps) {
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onContinue}>
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.baseElevated,
                borderColor: colors.success.border,
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
                    backgroundColor: colors.success.soft,
                    borderColor: colors.success.border,
                  },
                ]}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={32} color={colors.success.fg} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.cream }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            ) : null}

            <View style={styles.action}>
              <GoldButton label={ctaLabel} onPress={onContinue} compact />
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
    maxWidth: 280,
    paddingHorizontal: 4,
  },
  action: {
    width: '100%',
  },
});

export default AuthSuccessModal;
