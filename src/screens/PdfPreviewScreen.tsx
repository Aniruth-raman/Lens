import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { usePdfExport } from '../hooks/usePdfExport';
import { colors, spacing, radius } from '../utils/theme';
import { RootStackParamList } from '../types';

type RoutePropType = RouteProp<RootStackParamList, 'PdfPreview'>;

export default function PdfPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const { pdfUri, docName } = route.params;

  const { sharePdf } = usePdfExport();

  const handleShare = useCallback(async () => {
    try {
      await sharePdf(pdfUri);
    } catch (e) {
      Alert.alert('Share failed', 'Could not share the PDF.');
    }
  }, [pdfUri, sharePdf]);

  // On iOS, WebView can render PDFs directly from file://
  // On Android, we embed with Google Docs viewer as fallback
  const source =
    Platform.OS === 'ios'
      ? { uri: pdfUri }
      : { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUri)}` };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{docName}</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share ↑</Text>
        </TouchableOpacity>
      </View>

      {/* PDF viewer */}
      <WebView
        source={source}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}
      />

      {/* Bottom action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareFooterBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareFooterBtnText}>Share PDF ↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('Gallery' as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: spacing.sm,
  },
  shareBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  shareBtnText: {
    color: colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  shareFooterBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  shareFooterBtnText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
