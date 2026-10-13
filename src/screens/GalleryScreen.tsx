import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DocumentScanner from "react-native-document-scanner-plugin";
import DocumentCard from "../components/DocumentCard";
import { PlusIcon, DocumentIcon } from "../components/Icons";
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList, ScannedDoc } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "Gallery">;

export default function GalleryScreen() {
  const navigation = useNavigation<NavProp>();

  // Shared store — same data whichever screen reads it
  const docs = useDocumentsStore((s) => s.docs);
  const loading = useDocumentsStore((s) => s.loading);
  const deleteDoc = useDocumentsStore((s) => s.deleteDoc);

  const startScan = useCallback(async () => {
    try {
      const result = await DocumentScanner.scanDocument({
        maxNumDocuments: 10,
      });
      if (result.scannedImages && result.scannedImages.length > 0) {
        navigation.navigate("Review", { images: result.scannedImages });
      }
    } catch (e) {
      console.error("Scan failed:", e);
      Alert.alert(
        "Scan failed",
        "Could not open the document scanner. Please try again.",
      );
    }
  }, [navigation]);

  const openDoc = useCallback(
    (doc: ScannedDoc) => {
      navigation.navigate("PdfPreview", { id: doc.id });
    },
    [navigation],
  );

  const confirmDelete = useCallback(
    (doc: ScannedDoc) => {
      Alert.alert(
        "Delete document?",
        `"${doc.name}" will be removed from Lens.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              void deleteDoc(doc.id).catch((error) => {
                console.error("Failed to delete document:", error);
                Alert.alert(
                  "Delete failed",
                  error instanceof Error
                    ? error.message
                    : "Could not remove this document. Please try again.",
                );
              });
            },
          },
        ],
      );
    },
    [deleteDoc],
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.accent} size="small" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View className="px-5 pt-3 pb-3.5 border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-primary text-2xl font-bold tracking-tight">
            Lens
          </Text>
        </View>
        <View className="bg-surface border border-border px-3 py-1 rounded-full">
          <Text className="text-secondary text-xs font-medium">
            {docs.length} {docs.length === 1 ? "document" : "documents"}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        numColumns={2}
        className="flex-1"
        contentContainerClassName="px-3.5 pt-3 pb-28"
        renderItem={({ item }) => (
          <DocumentCard
            doc={item}
            onPress={() => openDoc(item)}
            onDeletePress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-36 px-6">
            <View className="w-16 h-16 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
              <DocumentIcon size={28} color="#71717a" />
            </View>
            <Text className="text-primary text-base font-semibold mb-1">
              No documents yet
            </Text>
            <Text className="text-secondary text-xs text-center max-w-[220px] leading-5">
              Tap the button below to scan and organize your documents
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-5 bg-accent rounded-full px-5 py-3.5 flex-row items-center gap-2 shadow-lg shadow-black/50 elevation-6 active:opacity-90"
        onPress={startScan}
        activeOpacity={0.85}
      >
        <PlusIcon size={14} color="#ffffff" strokeWidth={2.5} />
        <Text className="text-white text-xs font-semibold tracking-wide">
          New Scan
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
