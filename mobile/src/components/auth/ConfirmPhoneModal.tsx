import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GoldButton } from './GoldButton';
import { Dialog } from '@/components/sheet';
import { useTheme } from '@/lib/appStore';
import { Spacing, Typography } from '@/theme';

interface ConfirmPhoneModalProps {
  visible: boolean;
  /** Fully normalized phone number to confirm (e.g. +251912345678). */
  mobileNumber: string;
  loading?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onDismiss?: () => void;
}

/**
 * "Is this your number?" confirmation shown before sending the OTP, mirroring
 * the layout of KycRequiredModal (both actions are GoldButtons in a single
 * stretched row, so they share height and centering).
 */
export function ConfirmPhoneModal({
  visible,
  mobileNumber,
  loading,
  onConfirm,
  onEdit,
  onDismiss,
}: ConfirmPhoneModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Dialog visible={visible} onDismiss={onDismiss ?? onEdit} tone="default">
      <Text style={[Typography.h1, { color: colors.cream, textAlign: 'center' }]}>
        {t('auth.confirmPhoneTitle')}
      </Text>
      <Text
        style={[
          Typography.bodyMedium,
          { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
        ]}
      >
        {t('auth.confirmPhoneBody', { mobileNumber })}
      </Text>

      <View style={styles.actions}>
        <View style={styles.cancelButton}>
          <GoldButton label={t('auth.confirmPhoneEdit')} variant="outline" onPress={onEdit} compact />
        </View>
        <View style={styles.primaryButton}>
          <GoldButton label={t('auth.confirmPhoneConfirm')} onPress={onConfirm} compact loading={loading} />
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
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
  // Wider than Edit — the confirm label carries more text.
  primaryButton: {
    flex: 1.6,
    minWidth: 0,
  },
});

export default ConfirmPhoneModal;
