import React from "react";
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
  return (
    <TouchableOpacity
      className="flex-1 bg-surface rounded-xl overflow-hidden border border-border"
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Document ${doc.name}, ${doc.pageCount} pages, scanned on ${formatDate(doc.createdAt)}`}
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
        <View className="absolute bottom-2 right-2 bg-bg/80 px-2 py-0.5 rounded-full">
          <Text className="text-primary text-[11px] font-medium">
            {doc.pageCount}p
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
          <View className="w-6 h-6 rounded-full bg-bg/80 items-center justify-center">
            <Text className="text-secondary text-xs leading-none">•••</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View className="p-3">
        <Text
          className="text-primary text-sm font-semibold tracking-tight"
          numberOfLines={1}
        >
          {doc.name}
        </Text>
        <Text className="text-muted text-xs mt-0.5 font-normal">
          {formatDate(doc.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}