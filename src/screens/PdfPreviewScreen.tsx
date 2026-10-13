import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  FlatList,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDocumentsStore } from "../store/documentsStore";
import {
  ChevronLeftIcon,
  ShareIcon,
  EditIcon,
  CheckIcon,
  DocumentIcon,
} from "../components/Icons";
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
  const renameDoc = useDocumentsStore((s) => s.renameDoc);
  const [sharing, setSharing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  const [activeTab, setActiveTab] = useState<"pdf" | "images">(
    doc?.pdfUri ? "pdf" : "images",
  );
  const [addingFormat, setAddingFormat] = useState<"pdf" | "images" | null>(
    null,
  );
  const [pdfError, setPdfError] = useState<string | null>(null);

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

  const handleSharePdf = useCallback(async () => {
    if (!doc?.pdfUri) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing unavailable", "This device cannot share files.");
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
  }, [doc]);

  const handleRename = useCallback(async () => {
    try {
      await renameDoc(id, draftName);
      setEditingName(false);
    } catch (error) {
      Alert.alert(
        "Rename failed",
        error instanceof Error
          ? error.message
          : "Could not rename this document.",
      );
    }
  }, [id, draftName, renameDoc]);

  // Missing-document fallback
  if (!doc) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-bg px-6"
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <View className="w-16 h-16 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
          <DocumentIcon size={28} color="#71717a" />
        </View>
        <Text className="text-primary text-base font-semibold mb-1 text-center">
          Document not found
        </Text>
        <Text className="text-secondary text-xs text-center mb-6 leading-5">
          This document may have been deleted or moved.
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-full px-6 py-2.5 active:opacity-90"
          onPress={() => navigation.navigate("Gallery")}
        >
          <Text className="text-white text-xs font-semibold">
            Back to Gallery
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasPdf = !!doc.pdfUri;
  const hasImages = !!(doc.imageUris && doc.imageUris.length > 0);
  const showingPdf = activeTab === "pdf" && hasPdf;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

        {/* Header */}
        <View className="px-5 pt-3 pb-3.5 border-b border-border flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center mr-3 active:bg-surface-alt"
            activeOpacity={0.7}
          >
            <ChevronLeftIcon size={18} color="#fafafa" />
          </TouchableOpacity>

          {editingName ? (
            <View className="flex-1 flex-row items-center">
              <TextInput
                className="flex-1 bg-surface text-primary border border-border rounded-xl px-3 py-1.5 text-xs mr-2"
                value={draftName}
                onChangeText={setDraftName}
                maxLength={60}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleRename}
                selectionColor={colors.accent}
              />
              <TouchableOpacity
                onPress={handleRename}
                className="bg-accent px-3 py-1.5 rounded-lg mr-1.5"
              >
                <Text className="text-white text-xs font-semibold">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingName(false)}
                className="bg-surface border border-border px-3 py-1.5 rounded-lg"
              >
                <Text className="text-secondary text-xs">Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="flex-1 mr-2">
                <Text
                  className="text-primary text-base font-semibold tracking-tight"
                  numberOfLines={1}
                >
                  {doc.name}
                </Text>
                <Text className="text-muted text-[11px] font-normal">
                  {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setDraftName(doc.name);
                  setEditingName(true);
                }}
                className="bg-surface border border-border px-3 py-1.5 rounded-full flex-row items-center gap-1.5 active:bg-surface-alt"
                activeOpacity={0.7}
              >
                <EditIcon size={12} color="#a1a1aa" />
                <Text className="text-secondary text-xs font-medium">
                  Rename
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Format toggle — minimalist segmented control */}
        {hasPdf && hasImages && (
          <View className="flex-row bg-surface border border-border rounded-xl p-1 mx-5 my-2.5">
            <TouchableOpacity
              className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                activeTab === "pdf"
                  ? "bg-surface-alt border border-border-light"
                  : ""
              }`}
              onPress={() => setActiveTab("pdf")}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeTab === "pdf" ? "text-primary" : "text-muted"
                }`}
              >
                PDF Document
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                activeTab === "images"
                  ? "bg-surface-alt border border-border-light"
                  : ""
              }`}
              onPress={() => setActiveTab("images")}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeTab === "images" ? "text-primary" : "text-muted"
                }`}
              >
                Page Images
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content viewer */}
        {showingPdf && pdfError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-secondary text-xs text-center">{pdfError}</Text>
          </View>
        ) : showingPdf ? (
          <Pdf
            source={{ uri: doc.pdfUri! }}
            style={{ flex: 1, backgroundColor: colors.bg }}
            renderActivityIndicator={() => (
              <View className="flex-1 items-center justify-center bg-bg">
                <ActivityIndicator color={colors.accent} size="small" />
                <Text className="text-muted text-xs mt-2 font-medium">
                  Loading PDF...
                </Text>
              </View>
            )}
            onError={(error) => setPdfError(error.message)}
            onLoadComplete={() => setPdfError(null)}
          />
        ) : hasImages ? (
          <FlatList
            data={doc.imageUris}
            keyExtractor={(_, index) => String(index)}
            contentContainerClassName="px-5 py-3 gap-3.5 pb-24"
            renderItem={({ item, index }) => (
              <View className="rounded-2xl overflow-hidden bg-surface border border-border">
                <Image
                  source={{ uri: item }}
                  className="w-full h-80 bg-surface-alt"
                  resizeMode="contain"
                />
                <View className="py-2.5 px-3 bg-surface flex-row items-center justify-between border-t border-border">
                  <Text className="text-secondary text-xs font-medium">
                    Page {index + 1} of {doc.imageUris?.length}
                  </Text>
                </View>
              </View>
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-secondary text-xs text-center">
              No preview available.
            </Text>
          </View>
        )}

        {/* Missing format suggestion card */}
        {(!hasPdf || !hasImages) && (
          <View className="mx-5 my-2 p-3 rounded-xl bg-surface border border-border flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-primary text-xs font-medium">
                {!hasPdf ? "Generate PDF document" : "Extract page images"}
              </Text>
              <Text className="text-muted text-[11px]">
                {!hasPdf
                  ? "Create a shareable single-file PDF"
                  : "Save high-resolution image files"}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-surface-alt border border-border-light px-3 py-1.5 rounded-lg active:bg-surface"
              onPress={() => handleAddFormat(!hasPdf ? "pdf" : "images")}
              disabled={addingFormat !== null}
            >
              <Text className="text-accent text-xs font-semibold">
                {addingFormat !== null ? "Creating..." : "+ Add"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom dock */}
        <View className="px-5 pt-3 pb-6 border-t border-border bg-bg/95">
          {hasPdf && (
            <TouchableOpacity
              className="h-12 rounded-xl bg-accent items-center justify-center flex-row gap-2 active:opacity-90"
              onPress={handleSharePdf}
              disabled={sharing}
              activeOpacity={0.85}
            >
              <ShareIcon size={14} color="#ffffff" />
              <Text className="text-white text-xs font-semibold">
                {sharing ? "Opening share sheet..." : "Share Document"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Clean saved status indicator */}
          <View className="flex-row items-center justify-center gap-1.5 mt-2.5">
            <CheckIcon size={12} color="#10b981" />
            <Text className="text-muted text-[11px] font-medium">
              {Platform.OS === "android"
                ? activeTab === "pdf"
                  ? "Saved to Downloads/Lens"
                  : "Saved to Pictures/Lens"
                : "Saved to Files → On My iPhone → Lens"}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
