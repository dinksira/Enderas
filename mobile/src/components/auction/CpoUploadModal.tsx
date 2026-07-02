import React, { useEffect, useRef, useState } from 'react';
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
import { LocalReceiptUpload } from '@/components/auction/LocalReceiptUpload';
import { useTheme } from '@/lib/appStore';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { GLASS_RADIUS, glassElevation } from '@/lib/glassStyles';
import { Typography } from '@/theme';

interface CpoUploadModalProps {
  visible: boolean;
  cpoAmount: number;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: { receiptUri: string; receiptName: string; mimeType?: string }) => void | Promise<void>;
}

export function CpoUploadModal({ visible, cpoAmount, submitting = false, onClose, onSubmit }: CpoUploadModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const [receipt, setReceipt] = useState<{ uri: string; name: string } | undefined>();

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
  const handleClose = () => {
    setReceipt(undefined);
    onClose();
  };

  const handleSubmit = async () => {
    if (!receipt || submitting) return;
    try {
      await onSubmit({ receiptUri: receipt.uri, receiptName: receipt.name });
      handleClose();
    } catch {
      // Parent surfaces errors; keep modal open for retry.
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.baseElevated,
                  borderColor: colors.goldBorder,
                  opacity: anim,
                  transform: [{ scale }],
                  ...glassElevation(isDark, 'floating'),
                },
              ]}
            >
              <View style={styles.header}>
                <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.goldBright} />
                <Text style={[styles.title, { color: colors.cream }]}>
                  {t('auction.participation.uploadCpoTitle')}
                </Text>
              </View>

              <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>
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

              <Pressable
                onPress={handleClose}
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: GLASS_RADIUS.floating,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
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

export default CpoUploadModal;
