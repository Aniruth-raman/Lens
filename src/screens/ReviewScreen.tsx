import { useState } from "react";
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

  const removePage = (index: number) => {
    setPages((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  };

  const handleSave = async (mode: "pdf" | "images") => {
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
  };

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

        <View className="px-5 pt-3 pb-5 border-b border-border gap-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="flex-row items-center min-h-[44px] px-3 rounded-full bg-surface border border-border"
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text className="text-accent text-sm font-semibold">←</Text>
              <Text className="text-primary text-sm font-medium ml-2">Back</Text>
            </TouchableOpacity>
            <View className="bg-surface border border-border rounded-full px-3 py-2">
              <Text className="text-secondary text-xs font-semibold">
                {String(pages.length).padStart(2, "0")} {pages.length === 1 ? "PAGE" : "PAGES"}
              </Text>
            </View>
          </View>
          <View>
            <Text className="text-muted text-[11px] font-semibold tracking-[1.5px] mb-2">
              DOCUMENT NAME
            </Text>
            <TextInput
              className="bg-surface text-primary border border-border rounded-xl px-4 py-3.5 text-base font-medium"
              value={docName}
              onChangeText={setDocName}
              placeholder="Document name"
              maxLength={60}
              selectionColor={colors.accent}
              accessibilityLabel="Document name"
            />
          </View>
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
            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
                <Text className="text-secondary text-xs font-semibold tracking-[1px]">
                  PAGE {String(index + 1).padStart(2, "0")}
                </Text>
                <TouchableOpacity
                  className={`min-h-[36px] px-3 rounded-full border border-border flex-row items-center ${pages.length === 1 ? "opacity-40" : "bg-surface-alt"}`}
                  onPress={() => removePage(index)}
                  disabled={pages.length === 1}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: pages.length === 1 }}
                  accessibilityLabel={`Remove page ${index + 1}`}
                >
                  <Text className="text-destructive text-xs font-semibold">Remove</Text>
                </TouchableOpacity>
              </View>
              <View className="h-80 bg-surface-alt relative items-center justify-center">
                <Image
                  source={{ uri: item }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
        />

        <View className="px-5 pt-4 pb-4 border-t border-border bg-bg gap-3">
          <Text className="text-muted text-[11px] font-semibold tracking-[1.5px]">
            SAVE YOUR SCAN AS
          </Text>
          <TouchableOpacity
            className={`h-14 rounded-2xl bg-accent items-center justify-center ${
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
            className={`h-14 rounded-2xl bg-surface border border-border items-center justify-center ${
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
