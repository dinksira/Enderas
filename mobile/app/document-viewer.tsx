import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { AppHeader } from '@/components/shell/AppHeader';
import { useTheme } from '@/lib/appStore';

export default function DocumentViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.base }]}>
      <AppHeader title={title ?? 'Document'} showBack onBack={() => router.back()} hideActions />
      {url ? <DocumentViewer documentUrl={url} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
