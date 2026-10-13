import React, { useCallback, useState } from "react";
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
    },
    [deleteDoc],
  );

  const showDocOptions = useCallback(
    (doc: ScannedDoc) => {
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
    },
    [confirmDelete],
  );

  const submitRename = useCallback(async () => {
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
  }, [docToRename, renameText, renameDoc]);

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

      {/* Header: app name "Lens" and nothing else decorative */}
      <View className="px-5 pt-3 pb-3 border-b border-border">
        <Text className="text-primary text-2xl font-bold tracking-tight">
          Lens
        </Text>
      </View>

      {/* Grid: two-column grid of DocumentCards, newest first */}
      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        numColumns={2}
        className="flex-1"
        contentContainerClassName="p-4 pb-28 gap-3"
        columnWrapperClassName="gap-3"
        renderItem={({ item }) => (
          <DocumentCard
            doc={item}
            onPress={() => openDoc(item)}
            onLongPress={() => showDocOptions(item)}
            onMenuPress={() => showDocOptions(item)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-48 px-6">
            <Text className="text-primary text-base font-semibold mb-1 text-center">
              No documents yet
            </Text>
            <Text className="text-muted text-sm text-center">
              Tap the + button to scan your first document
            </Text>
          </View>
        }
      />

      {/* Primary action: FAB bottom-right above safe-area inset */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center shadow-lg elevation-6"
        onPress={startScan}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Scan new document"
      >
        <Text className="text-white text-3xl font-light leading-none">＋</Text>
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
