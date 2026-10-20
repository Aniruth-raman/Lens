import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DocumentScanner from "react-native-document-scanner-plugin";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DocumentCard from "../components/DocumentCard";
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList, ScannedDoc } from "../types";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "Gallery">;

export default function GalleryScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  const docs = useDocumentsStore((s) => s.docs);
  const loading = useDocumentsStore((s) => s.loading);
  const deleteDoc = useDocumentsStore((s) => s.deleteDoc);
  const renameDoc = useDocumentsStore((s) => s.renameDoc);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [docToRename, setDocToRename] = useState<ScannedDoc | null>(null);
  const [renameText, setRenameText] = useState("");
  const [docToDelete, setDocToDelete] = useState<ScannedDoc | null>(null);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    return docs.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [docs, searchQuery]);

  const toggleSearch = () => {
    if (showSearch) {
      setSearchQuery("");
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  };

  const startScan = async () => {
    try {
      const result = await DocumentScanner.scanDocument();
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
        onPress: () => setDocToDelete(doc),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDoc(docToDelete.id);
      setDocToDelete(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
      Alert.alert(
        "Delete failed",
        error instanceof Error
          ? error.message
          : "Could not remove this document. Please try again.",
      );
    }
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

  const displayedCount = loading
    ? "Loading..."
    : `${filteredDocs.length} ${filteredDocs.length === 1 ? "doc" : "docs"}`;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      {/* Top App Bar */}
      <View className="px-4 pt-2.5 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2.5">
              <MaterialIcons
                name="document-scanner"
                size={18}
                color={colors.primaryLight}
              />
            </View>
            <Text className="text-xl font-bold tracking-tight text-white">
              Lens
            </Text>
          </View>

          {/* Counter Badge & Search Icon */}
          <View className="flex-row items-center space-x-2">
            <View className="px-2.5 py-0.5 rounded-full bg-surfaceContainerHighest border border-outlineVariant/70 mr-1">
              <Text className="text-[11px] font-medium tracking-wide text-onSurfaceVariant">
                {displayedCount}
              </Text>
            </View>
            <TouchableOpacity
              className="w-8 h-8 rounded-full items-center justify-center hover:bg-surfaceContainer active:scale-95"
              onPress={toggleSearch}
              accessibilityRole="button"
              accessibilityLabel="Search documents"
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={18}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Search Bar Input */}
        {showSearch && (
          <View className="mt-3 flex-row items-center bg-surfaceContainerLow border border-outlineVariant rounded-xl px-3 py-2">
            <Ionicons
              name="search"
              size={16}
              color={colors.onSurfaceVariant}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-white text-xs p-0"
              placeholder="Search by document name..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Main Content Area */}
      {loading ? (
        /* Skeleton State Grid */
        <View className="flex-1 px-4 pt-2">
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((id) => (
              <View
                key={id}
                className="w-[48%] bg-surfaceContainerLow border border-outlineVariant rounded-2xl p-2.5 mb-3"
              >
                <View className="w-full aspect-[1/1.34] bg-surfaceContainer rounded-xl border border-outlineVariant/50 p-3 justify-between">
                  <View className="space-y-2">
                    <View className="h-2 w-12 bg-white/10 rounded-full" />
                    <View className="h-1.5 w-24 bg-white/5 rounded-full mt-2" />
                    <View className="h-1.5 w-20 bg-white/5 rounded-full mt-1.5" />
                  </View>
                  <View className="h-1.5 w-10 bg-white/10 rounded-full" />
                </View>
                <View className="pt-2 px-1 space-y-1.5">
                  <View className="h-2.5 w-24 bg-white/15 rounded-full" />
                  <View className="h-2 w-16 bg-white/5 rounded-full mt-1.5" />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : filteredDocs.length === 0 ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-4 pb-20">
          <View className="w-16 h-16 rounded-3xl bg-surfaceContainer border border-outlineVariant items-center justify-center mb-4 shadow-sm">
            <Ionicons
              name="folder-open-outline"
              size={30}
              color={colors.primaryLight}
            />
          </View>
          <Text className="text-base font-semibold text-white tracking-tight">
            {searchQuery.trim()
              ? `No results for “${searchQuery.trim()}”`
              : "No documents yet"}
          </Text>
          <Text className="text-xs text-onSurfaceVariant mt-1.5 max-w-[220px] leading-relaxed text-center">
            {searchQuery.trim()
              ? "Try another name or clear your search."
              : "Tap the scan button below to digitize your first receipt, contract, or ID card."}
          </Text>

          {searchQuery.trim() ? (
            <TouchableOpacity
              className="mt-5 px-4 py-2 rounded-full bg-surfaceContainer border border-outlineVariant/60"
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text className="text-white text-xs font-medium">Clear search</Text>
            </TouchableOpacity>
          ) : (
            <View className="mt-8 flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surfaceContainer border border-outlineVariant/60">
              <Text className="text-onSurfaceVariant text-[11px] mr-1">Tap</Text>
              <Ionicons name="camera-outline" size={13} color={colors.primaryLight} />
              <Text className="text-onSurfaceVariant text-[11px] ml-1">
                to scan your first doc
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* Documents Grid (2 columns) */
        <FlatList
          data={filteredDocs}
          keyExtractor={(d) => d.id}
          numColumns={2}
          className="flex-1"
          contentContainerClassName="px-4 pt-2 pb-28"
          columnWrapperClassName="justify-between mb-3"
          renderItem={({ item }) => (
            <View className="w-[48%]">
              <DocumentCard
                doc={item}
                onPress={() => openDoc(item)}
                onLongPress={() => showDocOptions(item)}
                onMenuPress={() => showDocOptions(item)}
              />
            </View>
          )}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <View className="absolute right-5 z-30" style={{ bottom: insets.bottom + 24 }}>
        <TouchableOpacity
          className="w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-lg shadow-primary/25 active:scale-95"
          onPress={startScan}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Scan document"
        >
          <Ionicons name="camera" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* Rename Modal */}
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
            <View className="w-full max-w-[320px] bg-surfaceContainer border border-outlineVariant rounded-[24px] p-6 shadow-2xl">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2.5">
                  <MaterialIcons name="edit" size={16} color={colors.primaryLight} />
                </View>
                <Text className="text-base font-semibold text-white tracking-tight">
                  Rename Document
                </Text>
              </View>

              <TextInput
                className="bg-surfaceContainerHigh text-white border border-outlineVariant rounded-xl px-3.5 py-2.5 text-sm mb-4"
                value={renameText}
                onChangeText={setRenameText}
                autoFocus
                maxLength={60}
                selectionColor={colors.accent}
                accessibilityLabel="Document name input"
              />

              <View className="flex-row justify-end space-x-2">
                <TouchableOpacity
                  className="px-4 py-2 rounded-full border border-outlineVariant min-h-[40px] items-center justify-center mr-2"
                  onPress={() => setDocToRename(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel rename"
                >
                  <Text className="text-onSurfaceVariant text-xs font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2 rounded-full bg-primary min-h-[40px] items-center justify-center"
                  onPress={submitRename}
                  accessibilityRole="button"
                  accessibilityLabel="Save new document name"
                >
                  <Text className="text-white text-xs font-semibold">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Material 3 Styled Delete Dialog Modal */}
      {docToDelete && (
        <Modal
          transparent
          animationType="fade"
          visible={!!docToDelete}
          onRequestClose={() => setDocToDelete(null)}
        >
          <View className="flex-1 bg-black/70 backdrop-blur-sm items-center justify-center px-6">
            <View className="w-full max-w-[320px] bg-surfaceContainer border border-outlineVariant rounded-[24px] p-6 shadow-2xl">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full bg-red-500/15 items-center justify-center mr-3">
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color={colors.destructive}
                  />
                </View>
                <Text className="text-lg font-semibold text-white tracking-tight flex-1">
                  Delete document?
                </Text>
              </View>

              <Text className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
                Deletes &ldquo;{docToDelete.name}&rdquo; from Lens. Copies already
                saved to Downloads or Pictures are not removed.
              </Text>

              <View className="space-y-2">
                <TouchableOpacity
                  className="w-full h-11 rounded-full bg-destructive items-center justify-center shadow-md shadow-destructive/25 mb-2"
                  onPress={handleConfirmDelete}
                  accessibilityRole="button"
                  accessibilityLabel="Delete from Lens"
                >
                  <Text className="text-white text-xs font-semibold">
                    Delete from Lens
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="w-full h-11 rounded-full border border-outlineVariant items-center justify-center"
                  onPress={() => setDocToDelete(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text className="text-onSurfaceVariant text-xs font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
