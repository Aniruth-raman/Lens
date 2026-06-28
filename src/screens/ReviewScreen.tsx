import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePdfExport } from '../hooks/usePdfExport';
import { useScannedDocs } from '../hooks/useScannedDocs';
import { colors, spacing, radius } from '../utils/theme';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Review'>;
type RoutePropType = RouteProp<RootStackParamList, 'Review'>;

export default function ReviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { images: initialImages } = route.params;

  const [pages, setPages] = useState<string[]>(initialImages);
  const [docName, setDocName] = useState(`Scan ${new Date().toLocaleDateString('en-IN')}`);

  const { exportToPdf, exporting } = usePdfExport();
  const { saveDoc } = useScannedDocs();

  const removePage = useCallback((index: number) => {
    if (pages.length === 1) {
      Alert.alert('Cannot remove', 'At least one page is required.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  }, [pages]);

  const handleExport = useCallback(async () => {
    if (!docName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this document.');
      return;
    }

    try {
      const pdfUri = await exportToPdf(pages, docName.trim());

      const doc = {
        id: Date.now().toString(),
        name: docName.trim(),
        pdfUri,
        thumbUri: pages[0],
        pageCount: pages.length,
        createdAt: Date.now(),
      };

      await saveDoc(doc);

      navigation.navigate('PdfPreview', { pdfUri, docName: docName.trim() });
    } catch (e) {
      Alert.alert('Export failed', 'Something went wrong while creating the PDF.');
      console.error(e);
    }
  }, [pages, docName, exportToPdf, saveDoc, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review</Text>
        <Text style={styles.pageCount}>{pages.length} page{pages.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Document name input */}
      <View style={styles.nameSection}>
        <Text style={styles.nameLabel}>Document name</Text>
        <TextInput
          style={styles.nameInput}
          value={docName}
          onChangeText={setDocName}
          placeholder="Enter document name..."
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          maxLength={60}
        />
      </View>

      {/* Pages grid */}
      <FlatList
        data={pages}
        keyExtractor={(_, i) => i.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item, index }) => (
          <View style={styles.pageCard}>
            <Image source={{ uri: item }} style={styles.pageThumb} resizeMode="cover" />
            <View style={styles.pageNum}>
              <Text style={styles.pageNumText}>{index + 1}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removePage(index)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Export button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.exportBtnText}>Export as PDF →</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    marginRight: spacing.md,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  pageCount: {
    color: colors.textMuted,
    fontSize: 13,
  },
  nameSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  nameInput: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
  },
  grid: {
    padding: spacing.sm,
    paddingBottom: 100,
  },
  pageCard: {
    flex: 1,
    margin: spacing.sm,
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageThumb: {
    width: '100%',
    height: '100%',
  },
  pageNum: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderRadius: radius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exportBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
