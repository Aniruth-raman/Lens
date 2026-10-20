import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StatusBar, Text, TouchableOpacity, View, ViewToken } from "react-native";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageCard } from "../components/PageCard";
import { useDocumentsStore } from "../store/documentsStore";
import { shareImage } from "../services/documentExportService";
import { RootStackParamList } from "../types";
import { colors } from "../theme/colors";

type Nav = NativeStackNavigationProp<RootStackParamList, "PdfPreview">;
type Route = RouteProp<RootStackParamList, "PdfPreview">;
type Feedback = { title: string; message: string; action: () => void };

export default function PdfPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const { id } = useRoute<Route>().params;
  const insets = useSafeAreaInsets();
  const doc = useDocumentsStore((s) => s.docs.find((item) => item.id === id));
  const reExportPdf = useDocumentsStore((s) => s.reExportPdf);
  const reExportImages = useDocumentsStore((s) => s.reExportImages);
  const deleteDoc = useDocumentsStore((s) => s.deleteDoc);
  const exportWarning = useDocumentsStore((s) => s.exportWarning);
  const [format, setFormat] = useState<"pdf" | "images">("pdf");
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(doc?.pageCount ?? 1);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState<"pdf" | "images" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
    const visiblePage = viewableItems.find((item) => item.isViewable && item.index != null);
    if (visiblePage?.index != null) setPage(visiblePage.index + 1);
  }).current;

  useEffect(() => {
    if (doc?.pdfUri && !doc.imageUris?.length) setFormat("pdf");
    else if (!doc?.pdfUri && doc?.imageUris?.length) setFormat("images");
  }, [doc?.id, doc?.pdfUri, doc?.imageUris]);

  const hasPdf = !!doc?.pdfUri;
  const hasImages = !!doc?.imageUris?.length;
  const both = hasPdf && hasImages;
  const showPdf = hasPdf && (!hasImages || format === "pdf");

  const sharePdf = async () => {
    if (!doc?.pdfUri || sharing) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setFeedback({ title: "Sharing unavailable", message: "Sharing isn’t available on this device.", action: () => void sharePdf() });
        return;
      }
      await Sharing.shareAsync(doc.pdfUri, { mimeType: "application/pdf", dialogTitle: doc.name, UTI: "com.adobe.pdf" });
    } catch {
      setFeedback({ title: "Couldn’t share PDF", message: "Try again.", action: () => void sharePdf() });
    } finally { setSharing(false); }
  };

  const sharePage = async (uri: string) => {
    if (sharing) return;
    setSharing(true);
    try { await shareImage(uri); }
    catch { setFeedback({ title: "Couldn’t share page", message: "Try again.", action: () => void sharePage(uri) }); }
    finally { setSharing(false); }
  };

  const saveFormat = async (target: "pdf" | "images") => {
    if (saving) return;
    setSaving(target);
    try {
      if (target === "pdf") await reExportPdf(id);
      else await reExportImages(id);
      setFormat(target);
      const warning = useDocumentsStore.getState().exportWarning;
      if (warning?.documentId === id) {
        const isPdf = target === "pdf";
        setFeedback({
          title: "Saved in Lens",
          message: isPdf
            ? "The PDF is saved in Lens, but couldn’t be copied to Downloads. You can try again from the document."
            : "The images are saved in Lens, but couldn’t be copied to Pictures. You can try again from the document.",
          action: () => { setFeedback(null); void saveFormat(target); },
        });
      }
    } catch {
      setFeedback({ title: target === "pdf" ? "Couldn’t save PDF" : "Couldn’t save images", message: "Your document is still in Lens. Try again.", action: () => void saveFormat(target) });
    } finally { setSaving(null); }
  };

  const confirmDelete = async () => {
    if (!doc || deleting) return;
    setDeleting(true);
    try { await deleteDoc(id); navigation.navigate("Gallery"); }
    catch { setFeedback({ title: "Couldn’t delete document", message: "Try again.", action: () => void confirmDelete() }); }
    finally { setDeleting(false); setDeleteDialog(false); }
  };

  if (!doc) return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-6" edges={["top", "right", "bottom", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {deleting ? <><ActivityIndicator color={colors.primary} /><Text className="text-text-muted text-sm mt-3">Deleting document…</Text></> : <>
        <Text accessibilityRole="header" className="text-text text-base font-semibold mb-1">Document not found</Text>
        <Text className="text-text-muted text-sm text-center mb-6">This document may have been removed.</Text>
        <Button onPress={() => navigation.navigate("Gallery")}>Back to Gallery</Button>
      </>}
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View className="h-14 px-2 flex-row items-center justify-between border-b border-outline bg-background">
        <TouchableOpacity className="w-11 h-11 items-center justify-center" onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back to Gallery">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View className="flex-1 px-2 items-center">
          <Text className="text-sm font-medium text-text text-center" numberOfLines={1}>{doc.name}</Text>
          <Text className="text-xs text-text-muted mt-0.5">{doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"} · {showPdf ? "PDF" : "Images"}</Text>
        </View>
        <TouchableOpacity className="w-11 h-11 items-center justify-center" onPress={() => setDeleteDialog(true)} accessibilityRole="button" accessibilityLabel="Delete document">
          <Ionicons name="trash-outline" size={22} color={colors["text-muted"]} />
        </TouchableOpacity>
      </View>

      {showPdf ? pdfError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text accessibilityRole="header" className="text-text text-base font-semibold mb-4">Preview unavailable</Text>
          <Button variant="secondary" onPress={() => { setPdfError(false); setPdfLoading(true); }}>Try again</Button>
        </View>
      ) : <View className="flex-1 bg-background p-3">
        {pdfLoading && <View className="absolute inset-0 z-10 items-center justify-center bg-background"><ActivityIndicator color={colors.primary} /><Text className="text-text-muted text-sm mt-3">Loading PDF…</Text></View>}
        <Pdf source={{ uri: doc.pdfUri! }} style={{ flex: 1, backgroundColor: colors.paper }} onLoadComplete={(count) => { setTotal(count); setPdfLoading(false); }} onPageChanged={(current, count) => { setPage(current); setTotal(count); }} onError={() => { setPdfLoading(false); setPdfError(true); }} />
        {!pdfLoading && <View className="absolute bottom-5 self-center rounded-full bg-surface-raised px-3 py-1"><Text className="text-text text-xs">Page {page} of {total}</Text></View>}
      </View> : hasImages ? (
        <FlatList data={doc.imageUris} keyExtractor={(_, index) => String(index)} contentContainerClassName="px-4 py-3 pb-36" viewabilityConfig={viewabilityConfig} onViewableItemsChanged={onViewableItemsChanged} renderItem={({ item, index }) => <PageCard uri={item} pageNumber={index + 1} onShare={() => void sharePage(item)} shareDisabled={sharing || !!saving} />} />
      ) : <View className="flex-1 items-center justify-center"><Text className="text-text-muted text-sm">No preview available.</Text></View>}

      <View className="bg-background border-t border-outline px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        {both && <View className="flex-row rounded-full border border-outline p-1 mb-2">
          {(["pdf", "images"] as const).map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityLabel={item === "pdf" ? "PDF" : "Images"} accessibilityState={{ selected: format === item, disabled: !!saving }} disabled={!!saving} onPress={() => setFormat(item)} className={`min-h-[44px] flex-1 items-center justify-center rounded-full ${format === item ? "bg-surface-high" : ""}`}><Text className="text-text text-sm">{item === "pdf" ? "PDF" : "Images"}</Text></TouchableOpacity>)}
        </View>}
        {hasImages && !showPdf && <Button onPress={() => void sharePage(doc.imageUris![page - 1] ?? doc.imageUris![0])} loading={sharing} disabled={!!saving} style={{ marginBottom: 8 }}>{sharing ? "Opening share sheet…" : `Share page ${page}`}</Button>}
        {!hasPdf && <Button variant={hasImages ? "secondary" : "primary"} onPress={() => void saveFormat("pdf")} loading={saving === "pdf"} disabled={!!saving || sharing} style={{ marginBottom: 8 }}>Save as PDF</Button>}
        {hasPdf && !hasImages && <Button variant="secondary" onPress={() => void saveFormat("images")} loading={saving === "images"} disabled={!!saving || sharing} style={{ marginBottom: 8 }}>Save as images</Button>}
        {hasPdf && showPdf && <Button onPress={() => void sharePdf()} loading={sharing} disabled={!!saving} style={{ marginBottom: 8 }}>{sharing ? "Opening share sheet…" : "Share PDF"}</Button>}
        {saving && <Text accessibilityLiveRegion="polite" className="text-text-muted text-sm text-center">{saving === "pdf" ? "Saving PDF…" : "Saving images…"}</Text>}
      </View>
      <ConfirmDialog visible={deleteDialog} title="Delete document?" message={`This removes “${doc.name}” from Lens. Copies already saved to Downloads or Pictures will remain there.`} confirmLabel="Delete from Lens" onConfirm={() => void confirmDelete()} onCancel={() => setDeleteDialog(false)} destructive loading={deleting} />
      <ConfirmDialog visible={!!feedback} title={feedback?.title ?? ""} message={feedback?.message ?? ""} confirmLabel={feedback?.title === "Saved in Lens" ? "Continue" : "Try again"} onConfirm={() => { const action = feedback?.action; setFeedback(null); action?.(); }} cancelLabel="" />
    </SafeAreaView>
  );
}
