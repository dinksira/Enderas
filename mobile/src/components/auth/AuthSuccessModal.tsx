import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from './GoldButton';
import { Dialog } from '@/components/sheet';
import { useTheme } from '@/lib/appStore';
import { Radii, Spacing, Typography } from '@/theme';

interface AuthSuccessModalProps {
  visible: boolean;
  title: string;
  message?: string;
  ctaLabel: string;
  onContinue: () => void;
}

/**
 * Animated success confirmation for auth flows (OTP sent, verified,
 * password updated).
 *
 * Now built on the shared `<Dialog>` primitive — consistent backdrop,
 * dismiss language, and motion with every other overlay in the app.
 * (Previously a hand-rolled RN `Modal` with its own Animated entrance.)
 */
export function AuthSuccessModal({
  visible,
  title,
  message,
  ctaLabel,
  onContinue,
}: AuthSuccessModalProps) {
  const { colors } = useTheme();

  return (
    <Dialog visible={visible} onDismiss={onContinue} tone="success">
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
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={32}
            color={colors.success.fg}
          />
        </View>
      </View>

      <Text style={[Typography.h1, { color: colors.cream, textAlign: 'center' }]}>{title}</Text>
      {message ? (
        <Text style={[Typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
          {message}
        </Text>
      ) : null}

      <View style={styles.action}>
        <GoldButton label={ctaLabel} onPress={onContinue} compact />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  action: {
    width: '100%',
    marginTop: Spacing.lg,
  },
});

export default AuthSuccessModal;
