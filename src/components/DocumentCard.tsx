import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { ScannedDoc } from "../types";
import { TrashIcon, DocumentIcon } from "./Icons";

type Props = {
  doc: ScannedDoc;
  onPress: () => void;
  onDeletePress: () => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentCard({ doc, onPress, onDeletePress }: Props) {
  return (
    <TouchableOpacity
      className="flex-1 m-1.5 bg-surface rounded-2xl overflow-hidden border border-border"
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View className="h-44 bg-surface-alt relative items-center justify-center">
        {doc.thumbUri ? (
          <Image
            source={{ uri: doc.thumbUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <DocumentIcon size={32} color="#71717a" />
          </View>
        )}

        {/* Format badge */}
        {doc.pdfUri && (
          <View className="absolute top-2.5 left-2.5 bg-black/70 border border-white/10 px-1.5 py-0.5 rounded-md">
            <Text className="text-white text-[10px] font-semibold tracking-wider">
              PDF
            </Text>
          </View>
        )}

        {/* Page count pill */}
        <View className="absolute bottom-2.5 right-2.5 bg-black/70 border border-white/10 px-2 py-0.5 rounded-full">
          <Text className="text-zinc-200 text-[10px] font-medium">
            {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
          </Text>
        </View>

        {/* Delete action button */}
        <TouchableOpacity
          className="absolute top-2.5 right-2.5 bg-black/60 border border-white/10 w-7 h-7 rounded-full items-center justify-center active:bg-destructive"
          onPress={onDeletePress}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <TrashIcon size={12} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View className="p-3 bg-surface">
        <Text
          className="text-primary text-[13px] font-semibold mb-0.5 tracking-tight"
          numberOfLines={1}
        >
          {doc.name}
        </Text>
        <Text className="text-muted text-[11px] font-normal">
          {formatDate(doc.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}