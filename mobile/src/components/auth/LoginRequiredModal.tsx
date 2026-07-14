import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from './GoldButton';
import { Dialog } from '@/components/sheet';
import { useTheme } from '@/lib/appStore';
import { Spacing, Typography } from '@/theme';

interface LoginRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  /** Optional context-specific message (defaults to the generic auth copy). */
  message?: string;
}

/**
 * Dialog shown when an unauthenticated user taps a gated action (e.g.
 * buying an auction document). Mirrors `KycRequiredModal` so the app
 * gives the same "here's why, here's how" feedback for both auth and
 * KYC gates instead of silently redirecting to the login screen.
 */
export function LoginRequiredModal({ visible, onClose, onLogin, message }: LoginRequiredModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Dialog visible={visible} onDismiss={onClose} tone="default">
      <View style={styles.iconWrap}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
          ]}
        >
          <MaterialCommunityIcons name="login-variant" size={30} color={colors.goldBright} />
        </View>
      </View>

      <Text style={[Typography.h1, { color: colors.cream, textAlign: 'center' }]}>
        {t('auth.loginRequiredTitle')}
      </Text>
      <Text style={[Typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
        {message ?? t('auth.loginRequiredMessage')}
      </Text>

      <View style={styles.actions}>
        <View style={styles.cancelButton}>
          <GoldButton label={t('common.cancel')} variant="outline" onPress={onClose} compact />
        </View>
        <View style={styles.primaryButton}>
          <GoldButton label={t('auth.login')} onPress={onLogin} compact />
        </View>
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
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.xs2,
    width: '100%',
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    minWidth: 0,
  },
  primaryButton: {
    flex: 1.4,
    minWidth: 0,
  },
});

export default LoginRequiredModal;
