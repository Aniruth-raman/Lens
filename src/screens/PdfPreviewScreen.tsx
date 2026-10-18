import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "PdfPreview">;
type RoutePropType = RouteProp<RootStackParamList, "PdfPreview">;

export default function PdfPreviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const { id } = route.params;

  const doc = useDocumentsStore((s) => s.docs.find((d) => d.id === id));
  const reExportPdf = useDocumentsStore((s) => s.reExportPdf);
  const reExportImages = useDocumentsStore((s) => s.reExportImages);
  const deleteDoc = useDocumentsStore((s) => s.deleteDoc);

  const [sharing, setSharing] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "images" | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(doc?.pageCount || 1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSharePdf = async () => {
    if (!doc?.pdfUri) {
      Alert.alert(
        "PDF not found",
        "This document does not have a PDF export yet. Tap 'Create PDF' to generate one.",
      );
      return;
    }
    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Sharing unavailable",
          "System file sharing is not available on this device.",
        );
        return;
      }
      await Sharing.shareAsync(doc.pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: doc.name,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      Alert.alert(
        "Share failed",
        error instanceof Error ? error.message : "Could not share this PDF.",
      );
    } finally {
      setSharing(false);
    }
  };

  const handleExport = async (format: "pdf" | "images") => {
    setExportingFormat(format);
    try {
      if (format === "pdf") {
        await reExportPdf(id);
        Alert.alert("Success", "PDF export created and saved.");
      } else {
        await reExportImages(id);
        Alert.alert("Success", "Image exports created and saved to Pictures.");
      }
    } catch (error) {
      Alert.alert(
        format === "pdf" ? "Failed to create PDF" : "Failed to save images",
        error instanceof Error ? error.message : "Could not export this format.",
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!doc) return;
    try {
      setShowDeleteModal(false);
      await deleteDoc(doc.id);
      navigation.navigate("Gallery");
    } catch (e) {
      Alert.alert(
        "Delete failed",
        e instanceof Error ? e.message : "Could not delete document.",
      );
    }
  };

  // Missing-document fallback
  if (!doc) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-surface px-6"
        edges={["top", "right", "bottom", "left"]}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
        <View className="w-16 h-16 rounded-3xl bg-surfaceContainer border border-outlineVariant items-center justify-center mb-4">
          <Ionicons
            name="alert-circle-outline"
            size={30}
            color={colors.destructive}
          />
        </View>
        <Text className="text-white text-base font-semibold mb-1 text-center">
          Document not found
        </Text>
        <Text className="text-onSurfaceVariant text-xs text-center mb-6">
          This document may have been removed.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-full px-6 py-3 min-h-[44px] items-center justify-center"
          onPress={() => navigation.navigate("Gallery")}
          accessibilityRole="button"
          accessibilityLabel="Back to gallery"
        >
          <Text className="text-white text-xs font-semibold">
            Back to Gallery
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const showingPdf = !!doc.pdfUri;
  const hasImages = !!doc.imageUris?.length;
  const formatActionLabel = hasImages
    ? doc.pdfUri
      ? "Export PDF again"
      : "Export images again"
    : "Save images";

  const handleExportAnotherFormat = () => {
    void handleExport(doc.pdfUri && hasImages ? "pdf" : "images");
  };

  const renderPreview = () => {
    if (doc.pdfUri) {
      if (pdfError) {
        return (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-14 h-14 rounded-2xl bg-surfaceContainer border border-outlineVariant items-center justify-center mb-4">
              <MaterialIcons
                name="error-outline"
                size={24}
                color={colors.destructive}
              />
            </View>
            <Text className="text-white text-base font-semibold mb-1">
              Preview unavailable
            </Text>
            <Text className="text-onSurfaceVariant text-xs text-center mb-4 max-w-[240px]">
              {pdfError}
            </Text>
            <TouchableOpacity
              className="bg-surfaceContainer border border-outlineVariant px-5 py-2.5 rounded-full min-h-[40px] items-center justify-center"
              onPress={() => setPdfError(null)}
              accessibilityRole="button"
              accessibilityLabel="Retry loading PDF"
            >
              <Text className="text-white text-xs font-medium">Try again</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View className="flex-1 relative bg-surface p-3">
          <View className="flex-1 rounded-xl overflow-hidden shadow-2xl border border-black/20 bg-[#F8F9FA]">
            <Pdf
              source={{ uri: doc.pdfUri }}
              style={{ flex: 1, backgroundColor: "#F8F9FA" }}
              renderActivityIndicator={() => (
                <View className="flex-1 items-center justify-center bg-surface">
                  <ActivityIndicator color={colors.accent} size="small" />
                </View>
              )}
              onPageChanged={(page, numberOfPages) => {
                setCurrentPage(page);
                setTotalPages(numberOfPages);
              }}
              onError={(error: object) => {
                const message =
                  (error as { message?: string })?.message ||
                  "Could not preview PDF";
                setPdfError(message);
              }}
            />
          </View>

          {/* Floating Material 3 Page Pill Indicator '2 / 4' */}
          <View className="absolute bottom-6 self-center z-10">
            <View className="bg-surfaceContainer/95 px-3 py-1 rounded-full border border-white/10 shadow-lg flex-row items-center gap-1.5">
              <Text className="text-white font-semibold text-[11px]">
                {currentPage}
              </Text>
              <Text className="text-onSurfaceVariant/60 text-[11px]">/</Text>
              <Text className="text-onSurfaceVariant text-[11px]">
                {totalPages}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (hasImages) {
      return (
        <FlatList
          data={doc.imageUris}
          keyExtractor={(_, index) => String(index)}
          contentContainerClassName="px-4 py-3 pb-36"
          renderItem={({ item, index }) => (
            <View className="relative bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 overflow-hidden aspect-[1/1.34] p-3 flex-col justify-between mb-4">
              <View className="absolute top-3 left-3 z-10 bg-black/85 px-2.5 py-0.5 rounded-full shadow-sm flex-row items-center">
                <Text className="text-[11px] font-mono font-medium text-white">
                  Page {index + 1}
                </Text>
              </View>
              <View className="w-full h-full items-center justify-center">
                <Image
                  source={{ uri: item }}
                  className="w-full h-full rounded-md"
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
        />
      );
    }

    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-onSurfaceVariant text-xs text-center">
          No preview available.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      {/* Google Material 3 Top App Bar */}
      <View className="h-14 px-2 flex-row items-center justify-between border-b border-surfaceContainerHigh/70 shrink-0 bg-surface">
        {/* Back button (min 44x44px target) */}
        <TouchableOpacity
          className="w-11 h-11 rounded-full items-center justify-center"
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#E2E2E6" />
        </TouchableOpacity>

        {/* Document Title */}
        <View className="flex-1 px-2 items-center justify-center">
          <Text
            className="text-sm font-medium text-[#E2E2E6] tracking-normal truncate text-center"
            numberOfLines={1}
          >
            {doc.name}
          </Text>
          <Text className="text-[10px] text-onSurfaceVariant mt-0.5">
            {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"} ·{" "}
            {showingPdf ? "PDF" : "Images"}
          </Text>
        </View>

        {/* Delete button (min 44x44px target) */}
        <TouchableOpacity
          className="w-11 h-11 rounded-full items-center justify-center"
          onPress={() => setShowDeleteModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Delete document"
        >
          <MaterialIcons
            name="delete-outline"
            size={22}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Main Preview */}
      {renderPreview()}

      {/* Pinned Bottom Action Bar */}
      <View
        className="shrink-0 bg-[#111317]/95 border-t border-surfaceContainerHigh px-5 pt-3 flex-col space-y-2.5 z-20"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          className={`w-full h-12 rounded-full bg-primary flex-row items-center justify-center shadow-lg shadow-primary/20 active:scale-[0.99] ${
            sharing || exportingFormat ? "opacity-50" : ""
          }`}
          onPress={doc.pdfUri ? handleSharePdf : () => handleExport("pdf")}
          disabled={sharing || !!exportingFormat}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={doc.pdfUri ? "Share PDF" : "Create PDF"}
        >
          {sharing || exportingFormat === "pdf" ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-medium text-sm ml-2">
                {doc.pdfUri ? "Opening share sheet..." : "Creating PDF..."}
              </Text>
            </View>
          ) : (
            <>
              <Ionicons
                name={doc.pdfUri ? "share-outline" : "document-text"}
                size={18}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-medium text-sm">
                {doc.pdfUri ? "Share PDF" : "Create PDF"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-full h-12 rounded-full border border-outlineSubtle bg-[#161920] flex-row items-center justify-center active:scale-[0.99] ${
            exportingFormat ? "opacity-50" : ""
          }`}
          onPress={handleExportAnotherFormat}
          disabled={!!exportingFormat}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={formatActionLabel}
        >
          {exportingFormat === "images" ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color={colors.accent} size="small" />
              <Text className="text-gray-200 font-medium text-sm ml-2">
                Exporting images...
              </Text>
            </View>
          ) : (
            <>
              <Ionicons
                name="images"
                size={18}
                color="#E2E2E6"
                style={{ marginRight: 6 }}
              />
              <Text className="text-gray-200 font-medium text-sm">
                {formatActionLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal Overlay (Material 3 Native-Style Dialog) */}
      <Modal
        transparent
        animationType="fade"
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/70 backdrop-blur-sm items-center justify-center px-6">
          <View className="w-full max-w-[320px] bg-surfaceContainer border border-outlineVariant rounded-[24px] p-6 shadow-2xl flex-col">
            {/* Dialog Icon & Headline */}
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

            {/* Verbatim Warning Copy from Stitch Design */}
            <Text className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Deletes this document from Lens. Copies already saved to Downloads
              or Pictures are not removed.
            </Text>

            {/* Dialog Action Buttons */}
            <View className="space-y-2">
              <TouchableOpacity
                className="w-full h-11 rounded-full bg-destructive items-center justify-center shadow-md shadow-destructive/25 mb-2"
                onPress={handleDeleteDocument}
                accessibilityRole="button"
                accessibilityLabel="Delete from Lens"
              >
                <Text className="text-white text-xs font-semibold">
                  Delete from Lens
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-11 rounded-full bg-transparent border border-outlineVariant items-center justify-center"
                onPress={() => setShowDeleteModal(false)}
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
    </SafeAreaView>
  );
}
