import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

  const docs = useDocumentsStore((s) => s.docs);
  const loading = useDocumentsStore((s) => s.loading);
  const deleteDoc = useDocumentsStore((s) => s.deleteDoc);
  const renameDoc = useDocumentsStore((s) => s.renameDoc);

  const [docToRename, setDocToRename] = useState<ScannedDoc | null>(null);
  const [renameText, setRenameText] = useState("");

  const startScan = async () => {
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
  };

  const openDoc = (doc: ScannedDoc) => {
    navigation.navigate("PdfPreview", { id: doc.id });
  };

  const confirmDelete = (doc: ScannedDoc) => {
    Alert.alert(
      "Delete document?",
      `"${doc.name}" will be removed from Lens. Copies previously exported to Downloads or Pictures will remain on your device.`,
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
  };

  const showDocOptions = (doc: ScannedDoc) => {
    Alert.alert(doc.name, "Choose an action", [
      {
        text: "Rename",
        onPress: () => {
          setRenameText(doc.name);
          setDocToRename(doc);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDelete(doc),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const submitRename = async () => {
    if (!docToRename) return;
    const trimmed = renameText.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a valid document name.");
      return;
    }
    try {
      await renameDoc(docToRename.id, trimmed);
      setDocToRename(null);
    } catch (e) {
      Alert.alert(
        "Rename failed",
        e instanceof Error ? e.message : "Could not rename document.",
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-bg"
        edges={["top", "bottom"]}
      >
        <ActivityIndicator color={colors.accent} size="small" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View className="px-5 pt-4 pb-5 border-b border-border">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-2 h-2 rounded-full bg-accent" />
          <Text className="text-secondary text-[11px] font-semibold tracking-[2px]">
            LENS · DOCUMENT SCANNER
          </Text>
        </View>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-primary text-3xl font-bold tracking-tight">
              Documents
            </Text>
            <Text className="text-muted text-sm mt-1">
              Your scans, all in one place.
            </Text>
          </View>
          <View className="bg-surface border border-border rounded-full px-3 py-1.5 mb-1">
            <Text className="text-secondary text-xs font-medium">
              {docs.length} {docs.length === 1 ? "document" : "documents"}
            </Text>
          </View>
        </View>
      </View>

      {/* Grid: two-column grid of DocumentCards, newest first */}
      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        numColumns={2}
        className="flex-1"
        contentContainerClassName="flex-grow p-5 pb-32 gap-4"
        columnWrapperClassName="gap-4"
        renderItem={({ item }) => (
          <DocumentCard
            doc={item}
            onPress={() => openDoc(item)}
            onLongPress={() => showDocOptions(item)}
            onMenuPress={() => showDocOptions(item)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-16 h-16 rounded-2xl bg-surface border border-border items-center justify-center mb-5">
              <Text className="text-accent text-3xl">▤</Text>
            </View>
            <Text className="text-primary text-lg font-semibold mb-2 text-center">
              Start your library
            </Text>
            <Text className="text-muted text-sm leading-5 text-center max-w-[260px]">
              Scan a document and it will be ready to review, export, and share here.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-5 right-5 h-14 px-5 rounded-2xl bg-accent flex-row items-center justify-center shadow-lg elevation-6"
        onPress={startScan}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Scan new document"
      >
        <Text className="text-white text-2xl font-light leading-none mr-2">＋</Text>
        <Text className="text-white text-sm font-semibold">Scan document</Text>
      </TouchableOpacity>

      {/* Rename modal */}
      {docToRename && (
        <Modal
          transparent
          animationType="fade"
          visible={!!docToRename}
          onRequestClose={() => setDocToRename(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 bg-black/70 items-center justify-center px-6"
          >
            <View className="w-full bg-surface border border-border rounded-xl p-5">
              <Text className="text-primary text-base font-semibold mb-3">
                Rename Document
              </Text>
              <TextInput
                className="bg-surface-alt text-primary border border-border rounded-lg px-3.5 py-2.5 text-sm mb-4"
                value={renameText}
                onChangeText={setRenameText}
                autoFocus
                maxLength={60}
                selectionColor={colors.accent}
                accessibilityLabel="Document name input"
              />
              <View className="flex-row justify-end gap-3">
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-surface-alt min-h-[44px] items-center justify-center"
                  onPress={() => setDocToRename(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel rename"
                >
                  <Text className="text-secondary text-sm font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-accent min-h-[44px] items-center justify-center"
                  onPress={submitRename}
                  accessibilityRole="button"
                  accessibilityLabel="Save new document name"
                >
                  <Text className="text-white text-sm font-semibold">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
