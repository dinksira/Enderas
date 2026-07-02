import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { pickDocumentFile } from '@/lib/documentPickerUtils';

import { useTheme } from '@/lib/appStore';
import { isImageSource, isPdfSource, resolveMediaUrl } from '@/lib/media-utils';
import { fileUploadApi, type PickedFile } from '@/services/fileUploadApi';
import { ApiError } from '@/services/api';

interface KycFileUploadProps {
  label: string;
  value?: string;
  onChange: (fileUrl: string) => void;
  disabled?: boolean;
  acceptPdf?: boolean;
  hint?: string;
  /** Upload folder on the server (defaults to kyc). */
  folder?: string;
}

function isImagePicked(file: PickedFile): boolean {
  return isImageSource(file.uri, file.mimeType) || /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}

async function pickFile(acceptPdf: boolean): Promise<PickedFile | null> {
  if (acceptPdf) {
    return pickDocumentFile(['image/*', 'application/pdf']);
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', 'Please allow access to your photo library to upload documents.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const extension = asset.uri.split('.').pop() || 'jpg';
  const fileName = asset.fileName || `image-${Date.now()}.${extension}`;
  return {
    uri: asset.uri,
    name: fileName,
    mimeType: asset.mimeType || (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
  };
}

export function KycFileUpload({
  label,
  value,
  onChange,
  disabled,
  acceptPdf,
  hint,
  folder = 'kyc',
}: KycFileUploadProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);

  const handlePick = async () => {
    if (disabled || uploading) return;

    setError(null);
    const picked = await pickFile(Boolean(acceptPdf));
    if (!picked) return;

    if (isImagePicked(picked)) {
      setLocalPreviewUri(picked.uri);
    } else {
      setLocalPreviewUri(null);
    }

    setUploading(true);
    try {
      const uploaded = await fileUploadApi.uploadFile(picked, folder);
      setMimeType(uploaded.mimeType || picked.mimeType);
      onChange(uploaded.fileUrl);
    } catch (err) {
      setLocalPreviewUri(null);
      const message = err instanceof ApiError ? err.message : t('kyc.uploadFailed');
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (disabled || uploading) return;
    setMimeType(null);
    setLocalPreviewUri(null);
    onChange('');
  };

  const hasFile = Boolean(value || localPreviewUri);
  const previewUri = localPreviewUri || resolveMediaUrl(value);
  const showImagePreview = Boolean(previewUri) && isImageSource(previewUri, mimeType);
  const showPdfPreview = hasFile && !showImagePreview && isPdfSource(value, mimeType);

  return (
    <View style={styles.host}>
      <Text style={[styles.label, { color: colors.goldChampagne }]}>{label}</Text>

      {showImagePreview && previewUri ? (
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: colors.glassFill,
              borderColor: error ? colors.danger.border : colors.goldBorder,
            },
          ]}
        >
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewOverlay}>
            {uploading ? (
              <View style={[styles.previewAction, { backgroundColor: 'rgba(10, 8, 4, 0.72)' }]}>
                <ActivityIndicator color={colors.goldBright} size="small" />
              </View>
            ) : (
              <Pressable
                onPress={handlePick}
                disabled={disabled || uploading}
                style={({ pressed }) => [
                  styles.previewAction,
                  { backgroundColor: 'rgba(10, 8, 4, 0.72)', opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <MaterialCommunityIcons name="image-edit-outline" size={16} color={colors.goldBright} />
                <Text style={[styles.previewActionText, { color: colors.cream }]}>
                  {t('kyc.changeFile')}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleRemove}
              disabled={disabled || uploading}
              style={({ pressed }) => [
                styles.previewRemove,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.danger.fg} />
            </Pressable>
          </View>
        </View>
      ) : showPdfPreview ? (
        <Pressable
          onPress={handlePick}
          disabled={disabled || uploading}
          style={({ pressed }) => [
            styles.pdfCard,
            {
              backgroundColor: colors.glassFill,
              borderColor: error ? colors.danger.border : colors.goldBorderActive,
              opacity: pressed ? 0.9 : disabled ? 0.6 : 1,
            },
          ]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.goldBright} />
          ) : (
            <>
              <View
                style={[
                  styles.pdfIconWrap,
                  { backgroundColor: colors.chipFill, borderColor: colors.goldBorder },
                ]}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.goldBright} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.uploadTitle, { color: colors.cream }]}>{t('kyc.fileReady')}</Text>
                <Text style={[styles.uploadHint, { color: colors.textMuted }]}>{t('kyc.changeFile')}</Text>
              </View>
              <Pressable onPress={handleRemove} hitSlop={8} disabled={disabled || uploading}>
                <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </>
          )}
        </Pressable>
      ) : (
        <Pressable
          onPress={handlePick}
          disabled={disabled || uploading}
          style={({ pressed }) => [
            styles.uploadBox,
            {
              backgroundColor: colors.glassFill,
              borderColor: error ? colors.danger.border : colors.goldBorder,
              borderStyle: 'dashed',
              opacity: pressed ? 0.9 : disabled ? 0.6 : 1,
            },
          ]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.goldBright} />
          ) : (
            <>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: colors.chipFill,
                    borderColor: colors.goldBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={22} color={colors.textMuted} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.uploadTitle, { color: colors.cream }]}>{t('kyc.uploadFile')}</Text>
                <Text style={[styles.uploadHint, { color: colors.textMuted }]} numberOfLines={1}>
                  {hint || (acceptPdf ? 'JPG, PNG, PDF' : 'JPG, PNG')}
                </Text>
              </View>
              <MaterialCommunityIcons name="plus" size={18} color={colors.goldBright} />
            </>
          )}
        </Pressable>
      )}

      {error ? <Text style={[styles.error, { color: colors.danger.fg }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: 6,
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minHeight: 72,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  uploadHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  previewCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 168,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 168,
  },
  previewOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  previewActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewRemove: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 8, 4, 0.72)',
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 72,
  },
  pdfIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    // color bound at runtime (theme-aware) — see JSX.
    marginTop: 2,
  },
});

export default KycFileUpload;
