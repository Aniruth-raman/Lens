import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation, usePreventRemove, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useDocumentsStore } from "../store/documentsStore";
import { RootStackParamList } from "../types";
import { defaultDocumentName } from "../services/fileNames";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageCard } from "../components/PageCard";
import { colors } from "../theme/colors";

type Notice = { title: string; message: string; confirmLabel: string; onConfirm: () => void; destructive?: boolean; cancelLabel?: string };

type NavProp = NativeStackNavigationProp<RootStackParamList, "Review">;
type RoutePropType = RouteProp<RootStackParamList, "Review">;

export default function ReviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();

  const createDocument = useDocumentsStore((s) => s.createDocument);
  const reExportPdf = useDocumentsStore((s) => s.reExportPdf);
  const reExportImages = useDocumentsStore((s) => s.reExportImages);
  const exporting = useDocumentsStore((s) => s.exporting);
  const exportProgress = useDocumentsStore((s) => s.exportProgress);

  const [pages, setPages] = useState<string[]>(route.params.images);
  const [docName, setDocName] = useState(() => defaultDocumentName());
  const [savingMode, setSavingMode] = useState<"pdf" | "images" | null>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [discardDialog, setDiscardDialog] = useState(false);
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [retryingSavedDocument, setRetryingSavedDocument] = useState(false);
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
      setNotice({ title: "Cannot remove page", message: "A document needs at least one page.", confirmLabel: "OK", onConfirm: () => setNotice(null) });
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (mode: "pdf" | "images") => {
    if (saveInProgress.current) return;

    const name = docName.trim();
    if (!name) {
      setNotice({ title: "Name required", message: "Enter a name for this document.", confirmLabel: "OK", onConfirm: () => setNotice(null) });
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
        if (doc.exportWarning.includes("export could not be created")) {
          const message = mode === "pdf"
            ? "The document is still in Review. Try saving the PDF again."
            : "The document is still in Review. Try saving the images again.";
          setNotice({ title: "Couldn’t save document", message, confirmLabel: "Try again", cancelLabel: "", onConfirm: () => void retrySavedFormat(doc.id, mode) });
        } else {
          const message = mode === "pdf"
            ? "The PDF is saved in Lens, but couldn’t be copied to Downloads. You can try again from the document."
            : "The images are saved in Lens, but couldn’t be copied to Pictures. You can try again from the document.";
          setNotice({ title: "Saved in Lens", message, confirmLabel: "Continue", cancelLabel: "", onConfirm: () => { setNotice(null); setSavedDocumentId(doc.id); } });
        }
      } else {
        setSavedDocumentId(doc.id);
      }
    } catch (e) {
      saveInProgress.current = false;
      setSavingMode(null);
      const message = mode === "pdf"
        ? "The document is still in Review. Try saving the PDF again."
        : "The document is still in Review. Try saving the images again.";
      setNotice({ title: "Couldn’t save document", message, confirmLabel: "Try again", onConfirm: () => void handleSave(mode) });
      console.error("Save error:", e);
    }
  };

  const retrySavedFormat = async (id: string, mode: "pdf" | "images") => {
    setNotice(null);
    setRetryingSavedDocument(true);
    setSavingMode(mode);
    saveInProgress.current = true;
    try {
      if (mode === "pdf") await reExportPdf(id);
      else await reExportImages(id);
      const warning = useDocumentsStore.getState().exportWarning;
      if (warning?.documentId === id) {
        const message = mode === "pdf"
          ? "The PDF is saved in Lens, but couldn’t be copied to Downloads. You can try again from the document."
          : "The images are saved in Lens, but couldn’t be copied to Pictures. You can try again from the document.";
        setNotice({ title: "Saved in Lens", message, confirmLabel: "Continue", cancelLabel: "", onConfirm: () => { setNotice(null); setSavedDocumentId(id); } });
      } else setSavedDocumentId(id);
    } catch (error) {
      console.error("Could not retry the saved format:", error);
      const message = mode === "pdf"
        ? "The document is still in Review. Try saving the PDF again."
        : "The document is still in Review. Try saving the images again.";
      setNotice({ title: "Couldn’t save document", message, confirmLabel: "Try again", cancelLabel: "", onConfirm: () => void retrySavedFormat(id, mode) });
    } finally {
      setRetryingSavedDocument(false);
      saveInProgress.current = false;
      setSavingMode(null);
    }
  };

  if (pages.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6" edges={["top", "right", "bottom", "left"]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Text className="text-text text-lg font-semibold font-sans">No pages to save</Text>
        <Button variant="secondary" icon="arrow-back-outline" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>Back to Gallery</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "right", "left"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />

        {/* App Bar / Navigation Header (44px touch targets) */}
        <View className="h-14 px-3 flex-row items-center justify-between border-b border-outline shrink-0 bg-background">
          <TouchableOpacity
            className="w-11 h-11 rounded-full items-center justify-center"
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Editable Document Name Input Pill */}
          <View className="flex-1 mx-1.5 flex-row items-center bg-surface-raised border border-outline rounded-full px-3 py-1.5">
            <TextInput
              className="flex-1 text-base font-medium text-text tracking-tight p-0 font-sans"
              value={docName}
              onChangeText={setDocName}
              placeholder="Document name"
              placeholderTextColor={colors["text-muted"]}
              maxLength={60}
              selectionColor={colors.primary}
              accessibilityLabel="Document name input"
            />
            <MaterialIcons
              name="edit"
              size={15}
              color={colors["text-muted"]}
              style={{ marginLeft: 6 }}
            />
          </View>

          {/* Page Counter Badge */}
          <View className="pl-1">
            <View className="bg-surface-raised px-2.5 py-1 rounded-full border border-outline">
              <Text className="text-xs font-medium text-text-muted font-sans">
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
              removeDisabled={exporting}
            />
          )}
          ListFooterComponent={pages.length === 1 ? <Text className="text-sm text-text-muted text-center mb-4 font-sans">A document needs at least one page.</Text> : null}
        />

        {/* Fixed Bottom Action Bar */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-background/95 border-t border-outline px-5 pt-3 z-40"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {/* Export Progress Indicator (shown when exporting) */}
          {exporting && (
            <View className="space-y-1.5 pb-2.5">
              <View className="flex-row items-center justify-between text-xs mb-1">
                <View className="flex-row items-center space-x-1.5">
                  <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                  <Text accessibilityLiveRegion="polite" className="text-text font-medium text-sm font-sans">
                    {exportProgress && exportProgress.total > 0
                      ? savingMode === "pdf" ? "Saving PDF…" : "Saving images…"
                      : savingMode === "pdf" ? "Preparing PDF…" : "Preparing images…"}
                  </Text>
                </View>
                {exportProgress && exportProgress.total > 0 && (
                  <Text className="text-text-muted text-xs font-sans">
                    {exportProgress.done} of {exportProgress.total} pages
                  </Text>
                )}
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
              {exportProgress && exportProgress.total > 0 && (
                <View
                  className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden border border-outline"
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: exportProgress.total,
                    now: exportProgress.done,
                  }}
                >
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, (exportProgress.done / exportProgress.total) * 100)}%` }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Primary Action: Export as PDF */}
          <View style={{ gap: 10 }}>
            <Button icon="document-text-outline" onPress={() => handleSave("pdf")} disabled={exporting || savingMode !== null || retryingSavedDocument} loading={exporting && savingMode === "pdf"}>Save as PDF</Button>
            <Button variant="secondary" icon="images-outline" onPress={() => handleSave("images")} disabled={exporting || savingMode !== null || retryingSavedDocument} loading={exporting && savingMode === "images"}>Save as images</Button>
          </View>
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
      <ConfirmDialog
        visible={!!notice}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        confirmLabel={notice?.confirmLabel ?? "OK"}
        onConfirm={() => notice?.onConfirm()}
        onCancel={notice?.cancelLabel === "" ? undefined : () => setNotice(null)}
        cancelLabel={notice?.cancelLabel ?? "Cancel"}
        destructive={notice?.destructive}
        loading={retryingSavedDocument}
      />
    </SafeAreaView>
  );
}
