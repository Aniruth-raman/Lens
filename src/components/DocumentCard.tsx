import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ScannedDoc } from '../types';
import { colors, spacing, radius } from '../utils/theme';

type Props = {
  doc: ScannedDoc;
  onOpen: (doc: ScannedDoc) => void;
  onDelete: (id: string) => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DocumentCard({ doc, onOpen, onDelete }: Props) {
  const confirmDelete = () => {
    Alert.alert('Delete document?', `"${doc.name}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(doc.id) },
    ]);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onOpen(doc)} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.thumbContainer}>
        {doc.thumbUri ? (
          <Image source={{ uri: doc.thumbUri }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbIcon}>📄</Text>
          </View>
        )}
        <View style={styles.pageBadge}>
          <Text style={styles.pageBadgeText}>{doc.pageCount}p</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{doc.name}</Text>
        <Text style={styles.date}>{formatDate(doc.createdAt)}</Text>
      </View>

      {/* Delete button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbContainer: {
    height: 180,
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    fontSize: 40,
  },
  pageBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pageBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    color: colors.textMuted,
    fontSize: 11,
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
