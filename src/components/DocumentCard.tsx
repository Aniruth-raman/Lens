import React from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { ScannedDoc } from "../types";

type Props = {
  doc: ScannedDoc;
  onOpen: (doc: ScannedDoc) => void;
  onDelete: (id: string) => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentCard({ doc, onOpen, onDelete }: Props) {
  const confirmDelete = () => {
    Alert.alert(
      "Delete document?",
      `"${doc.name}" will be removed permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(doc.id),
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      className="flex-1 m-2 bg-surface rounded-md overflow-hidden border border-border"
      onPress={() => onOpen(doc)}
      activeOpacity={0.8}
    >
      {/* Thumbnail */}
      <View className="h-[180px] bg-surface-alt relative">
        {doc.thumbUri ? (
          <Image
            source={{ uri: doc.thumbUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-[40px]">📄</Text>
          </View>
        )}
        <View className="absolute bottom-2 right-2 bg-black/70 rounded-full px-2 py-0.5">
          <Text className="text-white text-[11px] font-semibold">
            {doc.pageCount}p
          </Text>
        </View>
      </View>

      {/* Info row */}
      <View className="p-2">
        <Text
          className="text-primary text-[13px] font-semibold mb-0.5"
          numberOfLines={1}
        >
          {doc.name}
        </Text>
        <Text className="text-muted text-[11px]">
          {formatDate(doc.createdAt)}
        </Text>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        className="absolute top-2 right-2 bg-black/60 w-6 h-6 rounded-full items-center justify-center"
        onPress={confirmDelete}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Text className="text-white text-[11px] font-bold">✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
