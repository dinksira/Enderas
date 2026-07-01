import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { pickDocumentFile } from '@/lib/documentPickerUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Radii } from '@/theme';
import type { PickedFile } from '@/services/fileUploadApi';

interface LocalReceiptUploadProps {
  label: string;
  hint?: string;
  value?: { uri: string; name: string };
  onChange: (file: { uri: string; name: string }) => void;
  onClear?: () => void;
  disabled?: boolean;
}

/**
 * Local-only receipt picker for simulated participation flows.
 * Stores the picked file URI without uploading to the backend.
 */
export function LocalReceiptUpload({
  label,
  hint,
  value,
  onChange,
  onClear,
  disabled,
}: LocalReceiptUploadProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);

  const handlePick = async () => {
    if (disabled || picking) return;
    setPicking(true);
    try {
      const picked: PickedFile | null = await pickDocumentFile(['image/*', 'application/pdf']);
      if (!picked) return;
      onChange({ uri: picked.uri, name: picked.name });
    } catch {
      Alert.alert(t('auction.participation.uploadErrorTitle'), t('auction.participation.uploadErrorBody'));
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.host}>
      <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>{label}</Text>
      {hint ? (
        <Text style={[Typography.caption, { color: colors.textMuted, marginBottom: 8 }]}>{hint}</Text>
      ) : null}

      {value ? (
        <View
          style={[
            styles.fileRow,
            {
              backgroundColor: colors.glassFill,
              borderColor: colors.goldBorder,
            },
          ]}
        >
          <MaterialCommunityIcons name="file-check-outline" size={22} color={colors.success.fg} />
          <View style={styles.fileCopy}>
            <Text style={[Typography.bodySmall, { color: colors.cream }]} numberOfLines={1}>
              {value.name}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {t('auction.participation.receiptReady')}
            </Text>
          </View>
          {onClear && !disabled ? (
            <Pressable onPress={onClear} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={handlePick}
          disabled={disabled || picking}
          style={({ pressed }) => [
            styles.uploadBox,
            {
              backgroundColor: colors.glassFill,
              borderColor: colors.goldBorder,
              opacity: pressed ? 0.85 : disabled ? 0.55 : 1,
            },
          ]}
        >
          {picking ? (
            <ActivityIndicator color={colors.goldBright} />
          ) : (
            <>
              <MaterialCommunityIcons name="cloud-upload-outline" size={24} color={colors.goldBright} />
              <Text style={[Typography.bodySmall, { color: colors.cream }]}>
                {t('auction.participation.uploadReceipt')}
              </Text>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>
                {t('auction.participation.uploadReceiptHint')}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: 6,
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  fileCopy: {
    flex: 1,
    gap: 2,
  },
});

export default LocalReceiptUpload;
