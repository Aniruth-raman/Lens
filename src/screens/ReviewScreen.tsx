import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "Review">;
type RoutePropType = RouteProp<RootStackParamList, "Review">;

export default function ReviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();

  const initialImages = Array.isArray(route.params?.images)
    ? route.params.images
    : [];

  const createDocument = useDocumentsStore((s) => s.createDocument);
  const exporting = useDocumentsStore((s) => s.exporting);

  const [pages, setPages] = useState<string[]>(initialImages);
  const [docName, setDocName] = useState(() => {
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `Scan ${dateStr}`;
  });
  const [savingMode, setSavingMode] = useState<"pdf" | "images" | null>(null);

  const removePage = useCallback((index: number) => {
    setPages((prev) => {
      if (prev.length <= 1) {
        Alert.alert("Cannot remove", "At least one page is required.");
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSave = useCallback(
    async (mode: "pdf" | "images") => {
      const name = docName.trim();
      if (!name) {
        Alert.alert("Name required", "Please enter a name for this document.");
        return;
      }
      if (pages.length === 0) {
        Alert.alert("No pages", "This document has no scanned pages.");
        return;
      }

      setSavingMode(mode);
      try {
        const doc = await createDocument({
          name,
          imageUris: pages,
          exportMode: mode,
        });
        navigation.navigate("PdfPreview", { id: doc.id });
      } catch (e) {
        Alert.alert(
          "Save failed",
          e instanceof Error
            ? e.message
            : "Something went wrong while saving the scan. Please try again.",
        );
        console.error("Save error:", e);
      } finally {
        setSavingMode(null);
      }
    },
    [pages, docName, createDocument, navigation],
  );

  if (pages.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-bg px-6"
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <Text className="text-primary text-base font-semibold mb-1 text-center">
          No pages to review
        </Text>
        <Text className="text-muted text-sm text-center mb-6">
          Go back and scan a document first.
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-lg px-5 py-2.5 min-h-[44px] items-center justify-center"
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back to scanner"
        >
          <Text className="text-white text-sm font-semibold">Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

        {/* Header: back, editable document name, page count */}
        <View className="px-5 pt-3 pb-3 border-b border-border">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              className="min-h-[44px] min-w-[44px] justify-center"
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text className="text-accent text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-secondary text-xs font-medium">
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </Text>
          </View>
          <TextInput
            className="bg-surface text-primary border border-border rounded-lg px-3.5 py-2.5 text-sm font-medium"
            value={docName}
            onChangeText={setDocName}
            placeholder="Document name"
            maxLength={60}
            selectionColor={colors.accent}
            accessibilityLabel="Document name"
          />
        </View>

        {/* 10 page limit warning */}
        {pages.length >= 10 && (
          <View className="mx-5 mt-3 p-3 rounded-lg bg-surface border border-border">
            <Text className="text-secondary text-xs text-center font-medium">
              Maximum 10 pages per scan session reached.
            </Text>
          </View>
        )}

        {/* Body: scanned pages shown large, in order, scrollable, with per-page remove */}
        <FlatList
          className="flex-1"
          contentContainerClassName="p-5 pb-6 gap-4"
          data={pages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View className="bg-surface rounded-xl border border-border overflow-hidden">
              <View className="h-96 bg-surface-alt relative items-center justify-center">
                <Image
                  source={{ uri: item }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
                {/* Page indicator */}
                <View className="absolute bottom-3 left-3 bg-bg/80 px-2.5 py-1 rounded-full">
                  <Text className="text-primary text-xs font-medium">
                    Page {index + 1} of {pages.length}
                  </Text>
                </View>
                {/* Per-page remove button (44x44 touch target) */}
                <TouchableOpacity
                  className="absolute top-2 right-2 w-11 h-11 items-center justify-center"
                  onPress={() => removePage(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove page ${index + 1}`}
                  hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
                >
                  <View className="w-7 h-7 rounded-full bg-bg/80 items-center justify-center">
                    <Text className="text-destructive text-sm font-bold">✕</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Footer: pinned above safe-area inset, primary "Export as PDF", secondary "Save as Images" */}
        <View className="px-5 pt-3 pb-4 border-t border-border bg-bg gap-2.5">
          <TouchableOpacity
            className={`h-12 rounded-xl bg-accent items-center justify-center ${
              exporting ? "opacity-60" : ""
            }`}
            onPress={() => handleSave("pdf")}
            disabled={exporting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Export as PDF"
          >
            {exporting && savingMode === "pdf" ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color={colors.primary} size="small" />
                <Text className="text-white text-sm font-semibold">
                  Exporting PDF...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-sm font-semibold">
                Export as PDF
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className={`h-12 rounded-xl bg-surface border border-border items-center justify-center ${
              exporting ? "opacity-60" : ""
            }`}
            onPress={() => handleSave("images")}
            disabled={exporting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save as Images"
          >
            {exporting && savingMode === "images" ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color={colors.accent} size="small" />
                <Text className="text-primary text-sm font-semibold">
                  Saving images...
                </Text>
              </View>
            ) : (
              <Text className="text-primary text-sm font-semibold">
                Save as Images
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
