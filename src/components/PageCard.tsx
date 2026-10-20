import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type Props = {
  uri: string;
  pageNumber: number;
  onRemove?: () => void;
  removeDisabled?: boolean;
  onShare?: () => void;
  shareDisabled?: boolean;
};

export function PageCard({ uri, pageNumber, onRemove, removeDisabled = false, onShare, shareDisabled = false }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setFailed(false); setLoaded(false); }, [uri]);
  const content = (
    <View style={styles.card}>
      <View style={styles.badge}><Text style={styles.badgeText}>Page {pageNumber}</Text></View>
      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove page ${pageNumber}`}
          accessibilityState={{ disabled: removeDisabled }}
          disabled={removeDisabled}
          hitSlop={4}
          onPress={onRemove}
          style={[styles.remove, removeDisabled && styles.dimmed]}
        >
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      )}
      {onShare && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Share page ${pageNumber}`}
          accessibilityState={{ disabled: shareDisabled || !loaded, busy: shareDisabled }}
          disabled={shareDisabled || !loaded}
          onPress={(event) => { event.stopPropagation(); onShare(); }}
          style={[styles.share, (shareDisabled || !loaded) && styles.dimmed]}
        >
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </Pressable>
      )}
      {failed ? (
        <View style={styles.unavailable}><Text style={styles.unavailableText}>This page couldn’t be opened.</Text></View>
      ) : (
        <>
          <Image source={{ uri }} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} resizeMode="contain" style={styles.image} />
          {!loaded && <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Loading page…</Text></View>}
        </>
      )}
    </View>
  );
  if (!onShare) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Share page ${pageNumber}`}
      accessibilityState={{ disabled: shareDisabled || !loaded, busy: shareDisabled }}
      disabled={shareDisabled || !loaded}
      onPress={onShare}
      style={shareDisabled && styles.dimmed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", aspectRatio: 1 / 1.34, position: "relative", backgroundColor: colors.paper, borderRadius: 18, overflow: "hidden", marginBottom: 16, padding: 16, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: "100%" },
  badge: { position: "absolute", zIndex: 1, top: 12, left: 12, backgroundColor: colors.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: colors.text, fontSize: 12, fontFamily: "Inter", fontWeight: "600" },
  remove: { position: "absolute", zIndex: 2, top: 2, right: 2, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  removeText: { width: 28, height: 28, overflow: "hidden", textAlign: "center", textAlignVertical: "center", borderRadius: 14, backgroundColor: colors.background, color: colors.text, fontSize: 24, lineHeight: 27 },
  share: { position: "absolute", zIndex: 2, top: 2, right: 2, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: `${colors.background}D9` },
  dimmed: { opacity: 0.45 },
  unavailable: { flex: 1, justifyContent: "center", alignItems: "center", padding: 12 },
  unavailableText: { color: colors["text-muted"], textAlign: "center", fontSize: 14 },
  loading: { ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors["text-muted"], fontSize: 14, marginTop: 8 },
});
