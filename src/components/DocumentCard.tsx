import { View, Text, Image, TouchableOpacity } from "react-native";
import { ScannedDoc } from "../types";

type Props = {
  doc: ScannedDoc;
  onPress: () => void;
  onLongPress: () => void;
  onMenuPress: () => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentCard({
  doc,
  onPress,
  onLongPress,
  onMenuPress,
}: Props) {
  const scannedDate = formatDate(doc.createdAt);
  const exportLabel = doc.pdfUri
    ? "PDF ready"
    : doc.imageUris?.length
      ? "Images saved"
      : "Export ready";

  return (
    <TouchableOpacity
      className="flex-1 bg-surface rounded-2xl overflow-hidden border border-border"
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Document ${doc.name}, ${doc.pageCount} pages, scanned on ${scannedDate}`}
    >
      {/* First-page thumbnail */}
      <View className="aspect-[4/3] bg-surface-alt relative overflow-hidden items-center justify-center">
        {doc.thumbUri ? (
          <Image
            source={{ uri: doc.thumbUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-muted text-xs">No preview</Text>
        )}

        {/* Page count */}
        <View className="absolute bottom-2 left-2 bg-bg/85 border border-border px-2.5 py-1 rounded-full">
          <Text className="text-primary text-[11px] font-semibold">
            {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
          </Text>
        </View>

        {/* Options menu button (44x44 touch target) */}
        <TouchableOpacity
          className="absolute top-1 right-1 w-11 h-11 items-center justify-center"
          onPress={onMenuPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${doc.name}`}
          hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <View className="w-8 h-8 rounded-full bg-bg/85 border border-border items-center justify-center">
            <Text className="text-primary text-xs leading-none">•••</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View className="p-3.5">
        <Text
          className="text-primary text-sm font-semibold tracking-tight"
          numberOfLines={1}
        >
          {doc.name}
        </Text>
        <Text className="text-muted text-xs mt-1">
          {scannedDate} · {exportLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
