import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DocumentScanner from 'react-native-document-scanner-plugin';
import DocumentCard from '../components/DocumentCard';
import { useScannedDocs } from '../hooks/useScannedDocs';
import { colors, spacing, radius } from '../utils/theme';
import { RootStackParamList, ScannedDoc } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Gallery'>;

export default function GalleryScreen() {
  const navigation = useNavigation<NavProp>();
  const { docs, loading, deleteDoc } = useScannedDocs();

  const startScan = useCallback(async () => {
    try {
      const result = await DocumentScanner.scanDocument({ maxNumDocuments: 10 });
      if (result.scannedImages && result.scannedImages.length > 0) {
        navigation.navigate('Review', { images: result.scannedImages });
      }
    } catch (e) {
      console.error('Scan failed:', e);
    }
  }, [navigation]);

  const openDoc = useCallback(
    (doc: ScannedDoc) => {
      navigation.navigate('PdfPreview', { pdfUri: doc.pdfUri, docName: doc.name });
    },
    [navigation]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lens</Text>
        <Text style={styles.headerSub}>{docs.length} document{docs.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Grid */}
      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <DocumentCard doc={item} onOpen={openDoc} onDelete={deleteDoc} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗂️</Text>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptySub}>Tap the button below to scan your first document</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={startScan} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  grid: {
    padding: spacing.sm,
    paddingBottom: 100,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});
