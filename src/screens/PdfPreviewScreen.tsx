import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  FlatList,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import Pdf from "react-native-pdf";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDocumentsStore } from "../store/documentsStore";
import { useDocumentExport } from "../hooks/useDocumentExport";
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

  // Everything about the document comes from the store, keyed by id — no
  // payload was carried through navigation to get here.
  const doc = useDocumentsStore((s) => s.docs.find((d) => d.id === id));
  const reExportPdf = useDocumentsStore((s) => s.reExportPdf);
  const reExportImages = useDocumentsStore((s) => s.reExportImages);
  const { shareFile } = useDocumentExport();

  const [activeTab, setActiveTab] = useState<"pdf" | "images">(
    doc?.pdfUri ? "pdf" : "images",
  );
  const [addingFormat, setAddingFormat] = useState<"pdf" | "images" | null>(
    null,
  );

  const handleShare = useCallback(async () => {
    if (!doc) return;
    try {
      if (activeTab === "pdf" && doc.pdfUri) {
        await shareFile(doc.pdfUri, "application/pdf");
      } else if (
        activeTab === "images" &&
        doc.imageUris &&
        doc.imageUris.length > 0
      ) {
        await shareFile(doc.imageUris[0], "image/jpeg");
      }
    } catch (e) {
      Alert.alert("Share failed", "Could not share the file.");
    }
  }, [doc, activeTab, shareFile]);

  const handleAddFormat = useCallback(
    async (mode: "pdf" | "images") => {
      setAddingFormat(mode);
      try {
        if (mode === "pdf") {
          await reExportPdf(id);
        } else {
          await reExportImages(id);
        }
        setActiveTab(mode);
      } catch (e) {
        Alert.alert(
          "Couldn't add format",
          e instanceof Error ? e.message : "Something went wrong.",
        );
      } finally {
        setAddingFormat(null);
      }
    },
    [id, reExportPdf, reExportImages],
  );

  // Missing-document fallback: the doc could have been deleted from
  // another screen, or this id could be stale.
  if (!doc) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg px-8">
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <Text className="text-primary text-lg font-semibold mb-2 text-center">
          Document not found
        </Text>
        <Text className="text-muted text-base text-center mb-6">
          This document may have been deleted.
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-md px-6 py-3"
          onPress={() => navigation.navigate("Gallery")}
        >
          <Text className="text-white font-bold">Back to Gallery</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasPdf = !!doc.pdfUri;
  const hasImages = !!(doc.imageUris && doc.imageUris.length > 0);
  const showingPdf = activeTab === "pdf" && hasPdf;
  const source = showingPdf ? { uri: doc.pdfUri } : null;

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg">
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View className="flex-row items-center pt-14 px-6 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-accent text-xl font-bold">← Back</Text>
        </TouchableOpacity>
        <Text
          className="flex-1 text-primary text-xl font-bold"
          numberOfLines={1}
        >
          {doc.name}
        </Text>
      </View>

      {/* Format toggle — only shown once both formats actually exist */}
      {hasPdf && hasImages && (
        <View className="flex-row px-6 pt-4 gap-2">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              activeTab === "pdf" ? "bg-accent" : "bg-surface border border-border"
            }`}
            onPress={() => setActiveTab("pdf")}
          >
            <Text
              className={
                activeTab === "pdf"
                  ? "text-white font-semibold"
                  : "text-muted font-semibold"
              }
            >
              PDF
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              activeTab === "images"
                ? "bg-accent"
                : "bg-surface border border-border"
            }`}
            onPress={() => setActiveTab("images")}
          >
            <Text
              className={
                activeTab === "images"
                  ? "text-white font-semibold"
                  : "text-muted font-semibold"
              }
            >
              Images
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showingPdf ? (
        <Pdf
          source={source}
          style={{ flex: 1, backgroundColor: colors.bg }}
          originWhitelist={["*"]}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          startInLoadingState
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-bg">
              <Text className="text-muted text-sm">Loading PDF...</Text>
            </View>
          )}
        />
      ) : hasImages ? (
        <FlatList
          data={doc.imageUris}
          keyExtractor={(_, index) => String(index)}
          contentContainerClassName="p-6 pb-6 gap-6"
          renderItem={({ item, index }) => (
            <View className="min-h-[360px] rounded-md overflow-hidden bg-surface border border-border">
              <Image
                source={{ uri: item }}
                className="w-full h-80"
                resizeMode="contain"
              />
              <Text className="text-muted text-xs text-center py-2">
                Page {index + 1}
              </Text>
            </View>
          )}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted text-base text-center">
            No preview available.
          </Text>
        </View>
      )}

      {/* Add whichever format this doc doesn't have yet */}
      {(!hasPdf || !hasImages) && (
        <View className="px-6 pb-3">
          {!hasPdf && (
            <TouchableOpacity
              className="border border-accent rounded-md py-3 items-center justify-center mb-2"
              onPress={() => handleAddFormat("pdf")}
              disabled={addingFormat !== null}
            >
              <Text className="text-accent font-semibold">
                {addingFormat === "pdf"
                  ? "Generating PDF..."
                  : "+ Also export as PDF"}
              </Text>
            </TouchableOpacity>
          )}
          {!hasImages && (
            <TouchableOpacity
              className="border border-accent rounded-md py-3 items-center justify-center"
              onPress={() => handleAddFormat("images")}
              disabled={addingFormat !== null}
            >
              <Text className="text-accent font-semibold">
                {addingFormat === "images"
                  ? "Adding images..."
                  : "+ Also save as Images"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Single share action, reflecting whichever format is active */}
      <SafeAreaView className="p-6 border-t border-border bg-bg">
        <TouchableOpacity
          className="bg-accent rounded-md p-4 items-center justify-center h-[52px]"
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Text className="text-white text-[15px] font-semibold">
            {activeTab === "pdf" ? "Share PDF ↑" : "Share Image ↑"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}