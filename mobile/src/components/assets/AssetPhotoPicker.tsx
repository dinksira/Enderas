import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/lib/appStore';
import { fileUploadApi, type PickedFile } from '@/services/fileUploadApi';

interface AssetPhotoPickerProps {
  photos: PickedFile[];
  onChange: (photos: PickedFile[]) => void;
  disabled?: boolean;
  error?: string;
}

async function pickPhotos(): Promise<PickedFile[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', 'Please allow access to your photo library to upload photos.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.length) return [];

  return result.assets.map((asset, index) => {
    const extension = asset.uri.split('.').pop() || 'jpg';
    const fileName = asset.fileName || `photo-${Date.now()}-${index}.${extension}`;
    return {
      uri: asset.uri,
      name: fileName,
      mimeType: asset.mimeType || (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
    };
  });
}

export function AssetPhotoPicker({ photos, onChange, disabled, error }: AssetPhotoPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);

  const handleAdd = async () => {
    if (disabled || picking) return;
    setPicking(true);
    try {
      const picked = await pickPhotos();
      if (picked.length) {
        onChange([...photos, ...picked]);
      }
    } finally {
      setPicking(false);
    }
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.host}>
      <Text style={[styles.label, { color: colors.goldChampagne }]}>
        {t('assets.form.fields.photos')}
      </Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('assets.form.hints.photos')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((photo, index) => (
          <View
            key={`${photo.uri}-${index}`}
            style={[styles.thumbWrap, { borderColor: colors.goldBorder }]}
          >
            <Image source={{ uri: photo.uri }} style={styles.thumb} />
            {!disabled ? (
              <Pressable
                onPress={() => handleRemove(index)}
                style={[styles.removeBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="close" size={14} color="#FFFAF0" />
              </Pressable>
            ) : null}
          </View>
        ))}

        {!disabled ? (
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: colors.glassFill,
                borderColor: colors.goldBorder,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            {picking ? (
              <ActivityIndicator color={colors.goldBright} />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.goldBright} />
                <Text style={[styles.addText, { color: colors.textSecondary }]}>
                  {t('assets.requestWizard.actions.addPhotos')}
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </ScrollView>

      {error ? <Text style={[styles.error, { color: colors.danger.fg }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  row: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  addText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export async function uploadAssetPhotos(photos: PickedFile[]): Promise<string[]> {
  const urls: string[] = [];
  for (const photo of photos) {
    const uploaded = await fileUploadApi.uploadFile(photo, 'assets/images');
    urls.push(uploaded.fileUrl);
  }
  return urls;
}

export default AssetPhotoPicker;
