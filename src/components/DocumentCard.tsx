import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScannedDoc } from "../types";

type Props = {
  doc: ScannedDoc;
  onPress: () => void;
  onLongPress: () => void;
  onMenuPress: () => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DocumentCard({
  doc,
  onPress,
  onLongPress,
  onMenuPress,
}: Props) {
  const scannedDate = formatDate(doc.createdAt);
  const pageLabel = `${doc.pageCount} p`;

  return (
    <TouchableOpacity
      className="flex-1 bg-surfaceContainerLow border border-outlineVariant rounded-2xl p-2.5 flex flex-col active:scale-[0.98]"
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Document ${doc.name}, ${doc.pageCount} pages, scanned on ${scannedDate}`}
    >
      {/* Document Sheet Thumbnail Container (Portrait Aspect Ratio) */}
      <View className="w-full aspect-[1/1.34] bg-[#0F1115] rounded-xl overflow-hidden relative border border-outlineVariant/80 p-2 items-center justify-center">
        {doc.thumbUri ? (
          <View className="w-full h-full bg-[#FAFAFA] rounded-md overflow-hidden shadow-inner">
            <Image
              source={{ uri: doc.thumbUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        ) : (
          <View className="w-full h-full bg-[#FAFAFA] rounded-md p-2 flex flex-col justify-between shadow-inner">
            <View className="space-y-1.5">
              <View className="h-1.5 w-10 bg-neutral-900 rounded-full" />
              <View className="h-1 w-16 bg-neutral-400 rounded-full mt-1" />
              <View className="h-1 w-20 bg-neutral-300 rounded-full" />
              <View className="h-1 w-14 bg-neutral-300 rounded-full" />
            </View>
            <View className="border-t border-neutral-200 pt-1 flex-row justify-between items-center">
              <Text className="text-[7px] font-mono font-bold text-neutral-500">
                LENS
              </Text>
              <Text className="text-[7px] font-mono text-neutral-400">
                PAGE 1
              </Text>
            </View>
          </View>
        )}

        {/* Options 3-dots trigger button (top-left) */}
        <TouchableOpacity
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/75 items-center justify-center border border-white/10"
          onPress={onMenuPress}
          activeOpacity={0.7}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${doc.name}`}
        >
          <Ionicons name="ellipsis-horizontal" size={13} color="#E2E2E6" />
        </TouchableOpacity>

        {/* Page Count Badge (top-right) */}
        <View className="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded-md border border-white/10">
          <Text className="text-[10px] font-medium text-gray-200">
            {pageLabel}
          </Text>
        </View>
      </View>

      {/* Info Metadata */}
      <View className="pt-2 px-0.5">
        <Text
          className="text-xs font-semibold text-white truncate leading-tight"
          numberOfLines={1}
        >
          {doc.name}
        </Text>
        <Text className="text-[11px] text-onSurfaceVariant mt-0.5">
          {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"} · {scannedDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
