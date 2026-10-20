import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScannedDoc } from "../types";
import { colors } from "../theme/colors";

type Props = {
  doc: ScannedDoc;
  onPress: () => void;
  onLongPress: () => void;
  onMenuPress: () => void;
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (date.getFullYear() !== new Date().getFullYear()) options.year = "numeric";
  return date.toLocaleDateString(undefined, options);
}

export default function DocumentCard({ doc, onPress, onLongPress, onMenuPress }: Props) {
  const scannedDate = formatDate(doc.createdAt);
  const pageLabel = `${doc.pageCount} ${doc.pageCount === 1 ? "page" : "pages"}`;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${doc.name}, ${doc.pageCount} ${doc.pageCount === 1 ? "page" : "pages"}, scanned ${scannedDate}`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.openCard}
      >
        <View style={styles.paperFrame}>
          {doc.thumbUri ? (
            <Image source={{ uri: doc.thumbUri }} resizeMode="cover" style={styles.thumbnail} />
          ) : (
            <View style={styles.paperPlaceholder}>
              <View style={styles.lines}>
                <View style={[styles.line, styles.titleLine]} />
                <View style={styles.line} />
                <View style={[styles.line, styles.shortLine]} />
                <View style={styles.line} />
              </View>
            </View>
          )}
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>{pageLabel}</Text>
          </View>
        </View>
        <View style={styles.details}>
          <Text numberOfLines={1} style={styles.name}>{doc.name}</Text>
          <Text style={styles.metadata}>{doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"} · {scannedDate}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Document options"
        hitSlop={4}
        onPress={onMenuPress}
        style={styles.options}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surface, overflow: "hidden" },
  openCard: { padding: 10 },
  paperFrame: { width: "100%", aspectRatio: 1 / 1.34, borderRadius: 12, overflow: "hidden", padding: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.outline },
  thumbnail: { flex: 1, width: "100%", height: "100%", borderRadius: 6, backgroundColor: colors.paper },
  paperPlaceholder: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: colors.paper, justifyContent: "center" },
  lines: { gap: 8 },
  line: { width: "100%", height: 4, borderRadius: 4, backgroundColor: colors["text-muted"], opacity: 0.28 },
  titleLine: { width: "65%", height: 6, backgroundColor: colors.text, opacity: 0.8 },
  shortLine: { width: "72%" },
  pageBadge: { position: "absolute", top: 8, right: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.background, opacity: 0.94 },
  pageBadgeText: { color: colors.text, fontFamily: "Inter", fontSize: 11, fontWeight: "600" },
  details: { paddingTop: 8, paddingHorizontal: 2 },
  name: { color: colors.text, fontFamily: "Inter", fontSize: 14, fontWeight: "600" },
  metadata: { color: colors["text-muted"], fontFamily: "Inter", fontSize: 12, marginTop: 3 },
  options: { position: "absolute", top: 8, left: 8, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: `${colors.background}D9`, borderWidth: 1, borderColor: colors.outline },
});
