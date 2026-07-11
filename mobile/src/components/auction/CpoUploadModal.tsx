import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { Dialog } from '@/components/sheet';
import { LocalReceiptUpload } from '@/components/auction/LocalReceiptUpload';
import { useTheme } from '@/lib/appStore';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { Spacing, Typography } from '@/theme';

interface CpoUploadModalProps {
  visible: boolean;
  cpoAmount: number;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: { receiptUri: string; receiptName: string; mimeType?: string }) => void | Promise<void>;
}

/**
 * CPO receipt upload dialog. Built on the shared `<Dialog>` primitive
 * so the backdrop, dismiss language, and motion match every other
 * overlay in the app.
 *
 * The receipt state is local to the dialog — clearing on close.
 */
export function CpoUploadModal({ visible, cpoAmount, submitting = false, onClose, onSubmit }: CpoUploadModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [receipt, setReceipt] = useState<{ uri: string; name: string } | undefined>();

  const handleClose = () => {
    setReceipt(undefined);
    onClose();
  };

  const handleSubmit = async () => {
    if (!receipt || submitting) return;
    try {
      await onSubmit({ receiptUri: receipt.uri, receiptName: receipt.name });
      setReceipt(undefined);
      handleClose();
    } catch {
      // Parent surfaces errors; keep modal open for retry.
    }
  };

  return (
    <Dialog visible={visible} onDismiss={handleClose} tone="default">
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
          <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.goldBright} />
        </View>
        <Text style={[Typography.h1, { color: colors.cream, flex: 1 }]}>
          {t('auction.participation.uploadCpoTitle')}
        </Text>
      </View>

      <View style={[styles.amountCard, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
        <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 9 }]}>
          {t('auction.participation.cpoReceipt')}
        </Text>
        <Text style={[styles.amountValue, { color: colors.goldBright }]}>{formatEtbAmount(cpoAmount)}</Text>
      </View>

      <Text style={[Typography.caption, { color: colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 }]}>
        {t('auction.participation.uploadCpoBody', { amount: formatEtbAmount(cpoAmount) })}
      </Text>

      <LocalReceiptUpload
        label={t('auction.participation.cpoReceipt')}
        hint={t('auction.participation.cpoReceiptHint')}
        value={receipt}
        onChange={setReceipt}
        onClear={() => setReceipt(undefined)}
      />

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <GoldButton label={t('common.cancel')} variant="outline" onPress={handleClose} compact />
        </View>
        <View style={styles.actionButton}>
          <GoldButton
            label={submitting ? t('common.submitting') : t('auction.participation.submitCpo')}
            onPress={handleSubmit}
            disabled={!receipt || submitting}
            compact
          />
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm,
    gap: 2,
    marginBottom: Spacing.sm,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs2,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
});

export default CpoUploadModal;
