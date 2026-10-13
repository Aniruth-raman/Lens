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
} from "react-native";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "PdfPreview">;
type RoutePropType = RouteProp<RootStackParamList, "PdfPreview">;

export default function PdfPreviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { id } = route.params;

  const doc = useDocumentsStore((s) => s.docs.find((d) => d.id === id));
  const reExportPdf = useDocumentsStore((s) => s.reExportPdf);
  const reExportImages = useDocumentsStore((s) => s.reExportImages);

  const [sharing, setSharing] = useState(false);
  const [addingFormat, setAddingFormat] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(doc?.pageCount || 1);

  const handleSharePdf = async () => {
    if (!doc?.pdfUri) {
      Alert.alert(
        "PDF not found",
        "This document does not have a PDF export yet. Tap 'Add another format' below to generate one.",
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

  const handleAddAnotherFormat = async () => {
    if (!doc) return;
    const needsPdf = !doc.pdfUri;
    const needsImages = !doc.imageUris || doc.imageUris.length === 0;

    if (!needsPdf && !needsImages) {
      Alert.alert(
        "Formats complete",
        "Both PDF and image exports have already been generated for this document.",
      );
      return;
    }

    setAddingFormat(true);
    try {
      if (needsPdf) {
        await reExportPdf(id);
        Alert.alert("Success", "PDF export created and saved.");
      } else {
        await reExportImages(id);
        Alert.alert("Success", "Image exports created and saved to Pictures.");
      }
    } catch (e) {
      Alert.alert(
        "Failed to add format",
        e instanceof Error ? e.message : "Could not generate format.",
      );
    } finally {
      setAddingFormat(false);
    }
  };

  // Missing-document fallback
  if (!doc) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-bg px-6"
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <Text className="text-primary text-base font-semibold mb-1 text-center">
          Document not found
        </Text>
        <Text className="text-muted text-sm text-center mb-6">
          This document may have been removed.
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-lg px-5 py-2.5 min-h-[44px] items-center justify-center"
          onPress={() => navigation.navigate("Gallery")}
          accessibilityRole="button"
          accessibilityLabel="Back to gallery"
        >
          <Text className="text-white text-sm font-semibold">
            Back to Gallery
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const showingPdf = !!doc.pdfUri;
  const hasImages = !!doc.imageUris?.length;
  const nextFormat = !doc.pdfUri
    ? "Create PDF"
    : !hasImages
      ? "Save images"
      : "Both formats ready";

  const renderPreview = () => {
    if (doc.pdfUri) {
      if (pdfError) {
        return (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-14 h-14 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
              <Text className="text-destructive text-xl">!</Text>
            </View>
            <Text className="text-primary text-base font-semibold mb-2">
              Preview unavailable
            </Text>
            <Text className="text-secondary text-sm text-center mb-4">
              {pdfError}
            </Text>
            <TouchableOpacity
              className="bg-surface border border-border px-5 py-3 rounded-xl min-h-[44px] items-center justify-center"
              onPress={() => setPdfError(null)}
              accessibilityRole="button"
              accessibilityLabel="Retry loading PDF"
            >
              <Text className="text-primary text-sm font-medium">Try again</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View className="flex-1 relative bg-bg">
          <Pdf
            source={{ uri: doc.pdfUri }}
            style={{ flex: 1, backgroundColor: colors.bg }}
            renderActivityIndicator={() => (
              <View className="flex-1 items-center justify-center bg-bg">
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
            )}
            onPageChanged={(page, numberOfPages) => {
              setCurrentPage(page);
              setTotalPages(numberOfPages);
            }}
            onError={(error) => setPdfError(error.message)}
          />
          <View className="absolute bottom-4 self-center bg-bg/90 border border-border px-3.5 py-2 rounded-full">
            <Text className="text-primary text-xs font-semibold">
              PAGE {String(currentPage).padStart(2, "0")} /{" "}
              {String(totalPages).padStart(2, "0")}
            </Text>
          </View>
        </View>
      );
    }

    if (hasImages) {
      return (
        <FlatList
          data={doc.imageUris}
          keyExtractor={(_, index) => String(index)}
          contentContainerClassName="p-5 gap-4"
          renderItem={({ item, index }) => (
            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              <Image
                source={{ uri: item }}
                className="w-full h-80 bg-surface-alt"
                resizeMode="contain"
              />
              <View className="px-4 py-3 bg-surface border-t border-border flex-row items-center justify-between">
                <Text className="text-secondary text-xs font-semibold tracking-[1px]">
                  PAGE {String(index + 1).padStart(2, "0")}
                </Text>
                <Text className="text-muted text-xs">
                  {index + 1} of {doc.imageUris?.length}
                </Text>
              </View>
            </View>
          )}
        />
      );
    }

    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-muted text-sm text-center">
          No preview available.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View className="px-5 pt-3 pb-4 border-b border-border flex-row items-center">
        <TouchableOpacity
          className="flex-row items-center min-h-[44px] px-3 rounded-full bg-surface border border-border mr-3"
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text className="text-accent text-sm font-semibold">←</Text>
          <Text className="text-primary text-sm font-medium ml-2">Back</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className="text-primary text-lg font-semibold tracking-tight"
            numberOfLines={1}
          >
            {doc.name}
          </Text>
          <Text className="text-muted text-xs mt-0.5">
            {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"} ·{" "}
            {showingPdf ? "PDF" : "Images"}
          </Text>
        </View>
      </View>

      {renderPreview()}

      <View className="px-5 pt-4 pb-4 border-t border-border bg-bg gap-3">
        <Text className="text-muted text-[11px] font-semibold tracking-[1.5px]">
          EXPORT OPTIONS
        </Text>
        <TouchableOpacity
          className={`h-14 rounded-2xl bg-accent items-center justify-center ${
            sharing || !doc.pdfUri ? "opacity-50" : ""
          }`}
          onPress={handleSharePdf}
          disabled={sharing || !doc.pdfUri}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Share PDF"
        >
          {sharing ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color={colors.primary} size="small" />
              <Text className="text-white text-sm font-semibold">
                Opening share sheet...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-sm font-semibold">
              {doc.pdfUri ? "Share PDF" : "PDF not ready"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className={`h-14 rounded-2xl bg-surface border border-border items-center justify-center ${
            addingFormat || (doc.pdfUri && hasImages) ? "opacity-50" : ""
          }`}
          onPress={handleAddAnotherFormat}
          disabled={addingFormat || (!!doc.pdfUri && hasImages)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add another format"
        >
          {addingFormat ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color={colors.accent} size="small" />
              <Text className="text-primary text-sm font-semibold">
                Adding format...
              </Text>
            </View>
          ) : (
            <Text className="text-primary text-sm font-semibold">
              {nextFormat}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
