import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { Dialog } from '@/components/sheet';
import { useTheme } from '@/lib/appStore';
import { Radii, Spacing, Typography } from '@/theme';

interface KycRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: () => void;
}

/**
 * Themed dialog shown when a user tries to submit assets without KYC
 * approval. Built on the shared `<Dialog>` primitive for consistent
 * motion + backdrop with every other overlay.
 */
export function KycRequiredModal({ visible, onClose, onVerify }: KycRequiredModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Dialog visible={visible} onDismiss={onClose} tone="warning">
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
          <MaterialCommunityIcons name="shield-alert-outline" size={30} color={colors.warning.fg} />
        </View>
      </View>

      <Text style={[Typography.h1, { color: colors.cream, textAlign: 'center' }]}>
        {t('assets.kycRequired.title')}
      </Text>
      <Text style={[Typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
        {t('assets.kycRequired.message')}
      </Text>

      <View style={styles.actions}>
        <View style={styles.cancelButton}>
          <GoldButton label={t('common.cancel')} variant="outline" onPress={onClose} compact />
        </View>
        <View style={styles.primaryButton}>
          <GoldButton label={t('profile.menu.kycVerification')} onPress={onVerify} compact />
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
  // Wider than Cancel — the verification label carries more text.
  primaryButton: {
    flex: 1.6,
    minWidth: 0,
  },
});

export default KycRequiredModal;
