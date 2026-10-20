import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation, usePreventRemove, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";
import { defaultDocumentName } from "../services/fileNames";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageCard } from "../components/PageCard";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "Review">;
type RoutePropType = RouteProp<RootStackParamList, "Review">;

export default function ReviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();

  const createDocument = useDocumentsStore((s) => s.createDocument);
  const exporting = useDocumentsStore((s) => s.exporting);
  const exportProgress = useDocumentsStore((s) => s.exportProgress);

  const [pages, setPages] = useState<string[]>(route.params.images);
  const [docName, setDocName] = useState(() => defaultDocumentName());
  const [savingMode, setSavingMode] = useState<"pdf" | "images" | null>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [discardDialog, setDiscardDialog] = useState(false);
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const saveInProgress = useRef(false);

  usePreventRemove(pages.length > 0 && !savedDocumentId, ({ data }) => {
    setDiscardAction(() => () => navigation.dispatch(data.action));
    setDiscardDialog(true);
  });

  useEffect(() => {
    if (savedDocumentId) navigation.replace("PdfPreview", { id: savedDocumentId });
  }, [navigation, savedDocumentId]);

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      Alert.alert(
        "Cannot remove page",
        "A document must have at least one scanned page.",
      );
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (mode: "pdf" | "images") => {
    if (saveInProgress.current) return;

    const name = docName.trim();
    if (!name) {
      Alert.alert("Name required", "Please enter a name for this document.");
      return;
    }
    saveInProgress.current = true;
    setSavingMode(mode);
    try {
      const doc = await createDocument({
        name,
        imageUris: pages,
        exportMode: mode,
      });
      if (doc.exportWarning) {
        Alert.alert("Saved in Lens", doc.exportWarning, [
          { text: "OK", onPress: () => setSavedDocumentId(doc.id) },
        ], { cancelable: false });
      } else {
        setSavedDocumentId(doc.id);
      }
    } catch (e) {
      saveInProgress.current = false;
      setSavingMode(null);
      Alert.alert(
        "Save failed",
        e instanceof Error
          ? e.message
          : "Something went wrong while saving the scan. Please try again.",
      );
      console.error("Save error:", e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "right", "left"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-surface"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

        {/* App Bar / Navigation Header (44px touch targets) */}
        <View className="h-14 px-3 flex-row items-center justify-between border-b border-outlineVariant/60 shrink-0 bg-surface">
          <TouchableOpacity
            className="w-11 h-11 rounded-full items-center justify-center"
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color="#E2E2E6" />
          </TouchableOpacity>

          {/* Editable Document Name Input Pill */}
          <View className="flex-1 mx-1.5 flex-row items-center bg-surfaceContainer/80 border border-outlineVariant/80 rounded-full px-3 py-1.5">
            <TextInput
              className="flex-1 text-[13px] font-medium text-white tracking-tight p-0"
              value={docName}
              onChangeText={setDocName}
              placeholder="Document name"
              placeholderTextColor={colors.onSurfaceVariant}
              maxLength={60}
              selectionColor={colors.accent}
              accessibilityLabel="Document name input"
            />
            <MaterialIcons
              name="edit"
              size={15}
              color={colors.onSurfaceVariant}
              style={{ marginLeft: 6 }}
            />
          </View>

          {/* Page Counter Badge */}
          <View className="pl-1">
            <View className="bg-surfaceContainer px-2.5 py-1 rounded-full border border-outlineVariant">
              <Text className="text-[12px] font-mono font-medium text-gray-300">
                {pages.length} {pages.length === 1 ? "page" : "pages"}
              </Text>
            </View>
          </View>
        </View>
        {/* Vertically Scrolling Reel Container */}
        <FlatList
          className="flex-1"
          contentContainerClassName="px-5 py-4 pb-40"
          data={pages}
          keyExtractor={(uri) => uri}
          renderItem={({ item, index }) => (
            <PageCard
              uri={item}
              pageNumber={index + 1}
              onRemove={() => removePage(index)}
              removeDisabled={pages.length === 1 || exporting}
            />
          )}
        />

        {/* Fixed Bottom Action Bar */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-[#111317]/95 border-t border-outlineVariant/80 px-5 pt-3 z-40"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {/* Export Progress Indicator (shown when exporting) */}
          {exporting && (
            <View className="space-y-1.5 pb-2.5">
              <View className="flex-row items-center justify-between text-xs mb-1">
                <View className="flex-row items-center space-x-1.5">
                  <View className="w-2 h-2 rounded-full bg-accent mr-2" />
                  <Text className="text-gray-200 font-medium text-xs">
                    {exportProgress && exportProgress.total > 0
                      ? savingMode === "pdf" ? "Exporting PDF..." : "Saving images..."
                      : "Preparing export..."}
                  </Text>
                </View>
                {exportProgress && exportProgress.total > 0 && (
                  <Text className="text-gray-300 text-xs">
                    {exportProgress.done} / {exportProgress.total}
                  </Text>
                )}
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
              {exportProgress && exportProgress.total > 0 && (
                <View
                  className="w-full h-1.5 bg-surfaceContainer rounded-full overflow-hidden border border-outlineVariant"
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: exportProgress.total,
                    now: exportProgress.done,
                  }}
                >
                  <View
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.min(100, (exportProgress.done / exportProgress.total) * 100)}%` }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Primary Action: Export as PDF */}
          <Button onPress={() => handleSave("pdf")} disabled={exporting || savingMode !== null} loading={exporting && savingMode === "pdf"} style={{ marginBottom: 8 }}>Save as PDF</Button>
          <Button variant="secondary" onPress={() => handleSave("images")} disabled={exporting || savingMode !== null} loading={exporting && savingMode === "images"}>Save as images</Button>
        </View>
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={discardDialog}
        title="Discard this scan?"
        message="Your scanned pages will be lost if you leave Review."
        confirmLabel="Discard scan"
        onConfirm={() => { setDiscardDialog(false); discardAction?.(); }}
        onCancel={() => setDiscardDialog(false)}
        destructive
      />
    </SafeAreaView>
  );
}
