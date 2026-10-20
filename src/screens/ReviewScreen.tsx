import { useEffect, useRef, useState } from "react";
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
import { useNavigation, usePreventRemove, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useDocumentsStore } from "../store/documentsStore";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";
import { defaultDocumentName } from "../services/fileNames";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  const saveInProgress = useRef(false);

  usePreventRemove(pages.length > 0 && !savedDocumentId, ({ data }) => {
    Alert.alert(
      "Discard this scan?",
      "Your scanned pages will be lost if you leave Review.",
      [
        { text: "Keep reviewing", style: "cancel" },
        {
          text: "Discard scan",
          style: "destructive",
          onPress: () => navigation.dispatch(data.action),
        },
      ],
      { cancelable: true },
    );
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

  const isAtLimit = pages.length >= 10;

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
                {pages.length} / 10
              </Text>
            </View>
          </View>
        </View>


        {/* Limit Banner (Material 3 Subtle Alert) */}
        {isAtLimit && (
          <View className="px-4 py-2.5 bg-warningContainer/80 border-b border-warningBorder/50 flex-row items-center space-x-2.5 shrink-0">
            <MaterialIcons
              name="warning"
              size={18}
              color={colors.warning}
              style={{ marginRight: 8 }}
            />
            <Text className="text-[12px] text-amber-100 font-medium leading-snug flex-1">
              10 page limit reached. Export or delete pages to continue.
            </Text>
          </View>
        )}

        {/* Vertically Scrolling Reel Container */}
        <FlatList
          className="flex-1"
          contentContainerClassName="px-5 py-4 pb-40"
          data={pages}
          keyExtractor={(uri) => uri}
          renderItem={({ item, index }) => (
            <View className="relative bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 overflow-hidden aspect-[1/1.34] p-4 flex-col justify-between mb-4">
              {/* Page Number Badge (top-left) */}
              <View className="absolute top-3 left-3 z-10 bg-black/85 px-2.5 py-0.5 rounded-full shadow-sm flex-row items-center">
                <Text className="text-[11px] font-mono font-medium text-white">
                  Page {index + 1}
                </Text>
              </View>

              {/* Remove Page Button (top-right, >=44px touch target) */}
              <TouchableOpacity
                className="absolute top-1 right-1 z-10 w-11 h-11 items-center justify-center active:scale-95"
                onPress={() => removePage(index)}
                disabled={pages.length === 1}
                accessibilityRole="button"
                accessibilityLabel={`Remove page ${index + 1}`}
              >
                <View
                  className={`w-7 h-7 rounded-full bg-black/80 items-center justify-center shadow-md ${
                    pages.length === 1 ? "opacity-30" : ""
                  }`}
                >
                  <Ionicons name="close" size={16} color="white" />
                </View>
              </TouchableOpacity>

              {/* Scanned Image Sheet Preview */}
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
          <TouchableOpacity
            className={`w-full h-12 rounded-full bg-accent flex-row items-center justify-center shadow-lg shadow-accent/25 active:scale-[0.99] mb-2.5 ${
              exporting ? "opacity-50" : ""
            }`}
            onPress={() => handleSave("pdf")}
            disabled={exporting || savingMode !== null}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Export as PDF"
          >
            <Ionicons
              name="document-text"
              size={19}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-medium text-[14px]">
              Export as PDF
            </Text>
          </TouchableOpacity>

          {/* Secondary Action: Save as Images */}
          <TouchableOpacity
            className={`w-full h-12 rounded-full bg-[#161920] border border-outlineSubtle flex-row items-center justify-center active:scale-[0.99] ${
              exporting ? "opacity-50" : ""
            }`}
            onPress={() => handleSave("images")}
            disabled={exporting || savingMode !== null}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save as Images"
          >
            <Ionicons
              name="images"
              size={19}
              color={colors.onSurfaceVariant}
              style={{ marginRight: 8 }}
            />
            <Text className="text-gray-200 font-medium text-[14px]">
              Save as Images
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
