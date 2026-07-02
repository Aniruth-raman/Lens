import { useCallback } from "react";
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
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList, ScannedDoc } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "Gallery">;

export default function GalleryScreen() {
  const navigation = useNavigation<NavProp>();

  // Shared store — same data whichever screen reads it, no isolated
  // per-screen copies that can drift out of sync.
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
      // Only the id crosses the navigation boundary — PdfPreviewScreen
      // reads everything else straight from the store.
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
            onPress: () => deleteDoc(doc.id),
          },
        ],
      );
    },
    [deleteDoc],
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View className="px-8 pt-4 pb-4 border-b border-border">
        <Text className="text-primary text-3xl font-bold">Lens</Text>
        <Text className="text-muted text-base mt-2">
          {docs.length} document{docs.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        numColumns={2}
        className="flex-1"
        contentContainerClassName="px-8 pt-8 pb-24"
        renderItem={({ item }) => (
          <DocumentCard
            doc={item}
            onPress={() => openDoc(item)}
            onDeletePress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-64 px-8">
            <Text className="text-6xl mb-2">🗂️</Text>
            <Text className="text-primary text-lg font-semibold mb-2">
              No scans yet
            </Text>
            <Text className="text-muted text-base text-center">
              Tap the button below to scan your first document
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        className="absolute bottom-16 right-8 w-20 h-20 rounded-full bg-blue-500 items-center justify-center shadow-lg elevation-8"
        onPress={startScan}
        activeOpacity={0.85}
      >
        <Text className="text-white text-3xl">＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}