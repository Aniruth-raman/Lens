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
import { ChevronLeftIcon, CloseIcon, DocumentIcon } from "../components/Icons";
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
    const now = new Date()
      .toLocaleString("en-IN", {
        hour12: false,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(/\D/g, "");

    return `Scan ${now}`;
  });
  const [savingMode, setSavingMode] = useState<"pdf" | "images" | null>(null);

  const removePage = useCallback((index: number) => {
    setPages((prev) => {
      if (prev.length === 1) {
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
        console.error(e);
      } finally {
        setSavingMode(null);
      }
    },
    [pages, docName, createDocument, navigation],
  );

  if (pages.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg px-6" edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <View className="w-16 h-16 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
          <DocumentIcon size={28} color="#71717a" />
        </View>
        <Text className="text-primary text-base font-semibold mb-1 text-center">
          No pages to review
        </Text>
        <Text className="text-secondary text-xs text-center mb-6 leading-5">
          Go back and scan a document first.
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-full px-6 py-2.5 active:opacity-90"
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text className="text-white text-xs font-semibold">Back</Text>
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

        {/* Header */}
        <View className="px-5 pt-3 pb-3.5 border-b border-border flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center mr-3 active:bg-surface-alt"
              activeOpacity={0.7}
            >
              <ChevronLeftIcon size={18} color="#fafafa" />
            </TouchableOpacity>
            <Text className="text-primary text-lg font-semibold tracking-tight">
              Review Scan
            </Text>
          </View>
          <View className="bg-surface border border-border px-3 py-1 rounded-full">
            <Text className="text-secondary text-xs font-medium">
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </Text>
          </View>
        </View>

        {/* Document name input */}
        <View className="px-5 py-3 border-b border-border">
          <Text className="text-secondary text-xs font-medium mb-1.5">
            Document Name
          </Text>
          <TextInput
            className="bg-surface text-primary border border-border rounded-xl px-3.5 py-2.5 text-sm font-medium placeholder:text-muted"
            value={docName}
            onChangeText={setDocName}
            placeholder="Enter document name..."
            maxLength={60}
            selectionColor={colors.accent}
          />
        </View>

        {/* Pages grid */}
        <FlatList
          className="flex-1"
          contentContainerClassName="px-3.5 pt-3 pb-32"
          data={pages}
          keyExtractor={(_, i) => i.toString()}
          numColumns={2}
          renderItem={({ item, index }) => (
            <View className="flex-1 m-1.5 h-56 rounded-2xl overflow-hidden bg-surface border border-border relative">
              <Image
                source={{ uri: item }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-2.5 left-2.5 bg-black/70 border border-white/10 px-2 py-0.5 rounded-full">
                <Text className="text-zinc-200 text-[10px] font-medium">
                  Page {index + 1}
                </Text>
              </View>
              <TouchableOpacity
                className="absolute top-2.5 right-2.5 bg-black/60 border border-white/10 w-7 h-7 rounded-full items-center justify-center active:bg-destructive"
                onPress={() => removePage(index)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <CloseIcon size={11} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Export / Save dock */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pt-3 pb-6 bg-bg/95 border-t border-border flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 h-12 rounded-xl bg-surface border border-border items-center justify-center active:bg-surface-alt ${
              exporting ? "opacity-60" : ""
            }`}
            onPress={() => handleSave("images")}
            disabled={exporting}
            activeOpacity={0.8}
          >
            {exporting && savingMode === "images" ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Text className="text-secondary text-xs font-semibold">
                Save as Images
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 h-12 rounded-xl bg-accent items-center justify-center active:opacity-90 ${
              exporting ? "opacity-60" : ""
            }`}
            onPress={() => handleSave("pdf")}
            disabled={exporting}
            activeOpacity={0.8}
          >
            {exporting && savingMode === "pdf" ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white text-xs font-semibold">
                Export as PDF
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
