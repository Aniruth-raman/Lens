import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DocumentCard from "../components/DocumentCard";
import { useDocumentsStore } from "../store/documentsStore";
import { RootStackParamList, ScannedDoc } from "../types";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { scanDocument } from "../services/scannerService";
import { DocumentActionsSheet } from "../components/DocumentActionsSheet";
import { RenameDialog } from "../components/RenameDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LogoMark } from "../theme/LogoMark";
import { colors } from "../theme/colors";
import { Button } from "../components/Button";

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
  const [docToActions, setDocToActions] = useState<ScannedDoc | null>(null);
  const [docToRename, setDocToRename] = useState<ScannedDoc | null>(null);
  const [renameText, setRenameText] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [docToDelete, setDocToDelete] = useState<ScannedDoc | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return docs;
    return docs.filter((doc) => doc.name.toLowerCase().includes(query));
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
      const result = await scanDocument();
      if (result.status === "success") navigation.navigate("Review", { images: result.images });
    } catch (e) {
      console.error("Scan failed:", e);
      Alert.alert(
        "Scanner unavailable",
        "Lens couldn’t open the document scanner. Try again.",
      );
    }
  };

  const openDoc = (doc: ScannedDoc) => {
    navigation.navigate("PdfPreview", { id: doc.id });
  };

  const showDocOptions = (doc: ScannedDoc) => {
    setDocToActions(doc);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      await deleteDoc(docToDelete.id);
      setDocToDelete(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  const submitRename = async () => {
    if (!docToRename) return;
    const trimmed = renameText.trim();
    if (!trimmed) return;
    setRenameSaving(true);
    setRenameError("");
    try {
      await renameDoc(docToRename.id, trimmed);
      setDocToRename(null);
      setRenameText("");
    } catch (e) {
      console.error("Rename failed:", e);
      setRenameError("Try again.");
    } finally {
      setRenameSaving(false);
    }
  };

  const displayedCount = searchQuery.trim()
    ? `${filteredDocs.length} of ${docs.length} documents`
    : `${docs.length} ${docs.length === 1 ? "document" : "documents"}`;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top App Bar */}
      <View className="px-4 pt-2.5 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5">
            <LogoMark size={32} style={{ marginRight: 10 }} />
            <Text className="text-xl font-bold tracking-tight text-text font-sans">
              Lens
            </Text>
          </View>

          {/* Counter Badge & Search Icon */}
          <View className="flex-row items-center space-x-2">
            {!loading && <Text className="text-xs font-medium text-text-muted mr-1">{displayedCount}</Text>}
            <TouchableOpacity
              className="w-11 h-11 rounded-full items-center justify-center"
              onPress={toggleSearch}
              accessibilityRole="button"
              accessibilityLabel={showSearch ? "Clear search" : "Search documents"}
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={18}
                color={colors["text-muted"]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Search Bar Input */}
        {showSearch && (
          <View className="mt-3 flex-row items-center bg-surface border border-outline rounded-xl px-3 py-2">
            <Ionicons
              name="search"
              size={16}
              color={colors["text-muted"]}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-text text-base p-0 font-sans"
              placeholder="Search documents"
              placeholderTextColor={colors["text-muted"]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="w-11 h-11 items-center justify-center" accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors["text-muted"]}
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
                className="w-[48%] bg-surface border border-outline rounded-2xl p-2.5 mb-3"
              >
                <View className="w-full aspect-[1/1.34] bg-surface-raised rounded-xl border border-outline p-3 justify-between">
                  <View className="space-y-2">
                    <View className="h-2 w-12 bg-text/10 rounded-full" />
                    <View className="h-1.5 w-24 bg-text/5 rounded-full mt-2" />
                    <View className="h-1.5 w-20 bg-text/5 rounded-full mt-1.5" />
                  </View>
                  <View className="h-1.5 w-10 bg-text/10 rounded-full" />
                </View>
                <View className="pt-2 px-1 space-y-1.5">
                  <View className="h-2.5 w-24 bg-text/15 rounded-full" />
                  <View className="h-2 w-16 bg-text/5 rounded-full mt-1.5" />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : filteredDocs.length === 0 ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-4 pb-20">
          <View className="w-16 h-16 rounded-3xl bg-surface-raised border border-outline items-center justify-center mb-4">
            <LogoMark size={52} />
          </View>
          <Text className="text-base font-semibold text-text tracking-tight font-sans">
            {searchQuery.trim()
              ? `No results for “${searchQuery.trim()}”`
              : "No documents yet"}
          </Text>
          <Text className="text-sm text-text-muted mt-1.5 max-w-[220px] leading-relaxed text-center font-sans">
            {searchQuery.trim()
              ? "Try another name or clear your search."
              : "Scan a document to save it here."}
          </Text>

          {searchQuery.trim() ? (
            <TouchableOpacity
              className="mt-5 px-4 py-2 rounded-full bg-surface-raised border border-outline min-h-[44px] items-center justify-center"
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text className="text-text text-sm font-medium">Clear search</Text>
            </TouchableOpacity>
          ) : null}
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

      <View className="absolute right-5 z-30" style={{ bottom: insets.bottom + 24 }}>
        <Button icon="camera-outline" accessibilityLabel="Scan document" onPress={startScan} style={{ width: 164 }}>Scan document</Button>
      </View>

      <DocumentActionsSheet
        visible={!!docToActions}
        documentName={docToActions?.name ?? ""}
        onClose={() => setDocToActions(null)}
        onRename={() => {
          if (!docToActions) return;
          setRenameText(docToActions.name);
          setRenameError("");
          setDocToRename(docToActions);
          setDocToActions(null);
        }}
        onDelete={() => {
          setDocToDelete(docToActions);
          setDeleteError(false);
          setDocToActions(null);
        }}
      />
      <RenameDialog
        visible={!!docToRename}
        value={renameText}
        onChangeText={setRenameText}
        onSave={submitRename}
        onCancel={() => setDocToRename(null)}
        saving={renameSaving}
        error={renameError}
        errorTitle={renameError ? "Couldn’t rename document" : undefined}
      />
      <ConfirmDialog
        visible={!!docToDelete}
        title={deleteError ? "Couldn’t delete document" : "Delete document?"}
        message={deleteError ? "Try again." : `This removes “${docToDelete?.name ?? ""}” from Lens. Copies already saved to Downloads or Pictures will remain there.`}
        confirmLabel={deleteError ? "Try again" : "Delete from Lens"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDocToDelete(null); setDeleteError(false); }}
        destructive
        loading={deleting}
      />
    </SafeAreaView>
  );
}
