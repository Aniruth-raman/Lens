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
import { usePdfExport } from "../hooks/usePdfExport";
import { useScannedDocs } from "../hooks/useScannedDocs";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";

const { colors } = tailwindConfig;
import { SafeAreaView } from "react-native-safe-area-context";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Review">;
type RoutePropType = RouteProp<RootStackParamList, "Review">;

export default function ReviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { images: initialImages } = route.params;

  const [pages, setPages] = useState<string[]>(initialImages);
  const [docName, setDocName] = useState(
    `Scan ${new Date().toLocaleDateString("en-IN")}`,
  );
  const [savingMode, setSavingMode] = useState<"pdf" | "images" | null>(null);

  const { exportToPdf, exportAsImages, exporting } = usePdfExport();
  const { saveDoc } = useScannedDocs();

  const removePage = useCallback(
    (index: number) => {
      if (pages.length === 1) {
        Alert.alert("Cannot remove", "At least one page is required.");
        return;
      }
      setPages((prev) => prev.filter((_, i) => i !== index));
    },
    [pages],
  );

  const handleSave = useCallback(
    async (mode: "pdf" | "images") => {
      const name = docName.trim();
      if (!name) {
        Alert.alert("Name required", "Please enter a name for this document.");
        return;
      }

      setSavingMode(mode);
      try {
        const baseDoc = {
          id: Date.now().toString(),
          name,
          thumbUri: pages[0],
          pageCount: pages.length,
          createdAt: Date.now(),
        };

        if (mode === "pdf") {
          const pdfUri = await exportToPdf(pages, name);
          await saveDoc({ ...baseDoc, pdfUri });
          navigation.navigate("PdfPreview", { pdfUri, docName: name });
          return;
        }

        const imageUris = await exportAsImages(pages, name);
        await saveDoc({ ...baseDoc, imageUris });
        navigation.navigate("PdfPreview", { imageUris, docName: name });
      } catch (e) {
        Alert.alert(
          "Save failed",
          "Something went wrong while saving the scan.",
        );
        console.error(e);
      } finally {
        setSavingMode(null);
      }
    },
    [pages, docName, exportToPdf, exportAsImages, saveDoc, navigation],
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View className="flex-row items-center pt-14 px-6 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-accent text-xl font-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-primary text-xl font-bold">Review</Text>
        <Text className="text-muted text-sm">
          {pages.length} page{pages.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Document name input */}
      <View className="px-6 py-4 border-b border-border">
        <Text className="text-muted text-sm font-bold uppercase mb-1 tracking-wider">
          Document name
        </Text>
        <TextInput
          className="bg-surface text-primary border border-border rounded-md px-4 py-3 text-lg placeholder-text-muted selection-text-accent"
          value={docName}
          onChangeText={setDocName}
          placeholder="Enter document name..."
          maxLength={60}
        />
      </View>

      {/* Pages grid */}
      <FlatList
        className="flex-1"
        contentContainerClassName="p-4 pb-32"
        data={pages}
        keyExtractor={(_, i) => i.toString()}
        numColumns={2}
        renderItem={({ item, index }) => (
          <SafeAreaView className="flex-1 m-2 h-60 rounded-md overflow-hidden bg-surface border border-border">
            <Image
              source={{ uri: item }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute bottom-2 left-2 bg-black/65 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-[11px] font-bold">
                {index + 1}
              </Text>
            </View>
            <TouchableOpacity
              className="absolute top-2 right-2 bg-red-500/85 rounded-full w-6 h-6 items-center justify-center"
              onPress={() => removePage(index)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Text className="text-white text-[11px] font-bold">✕</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      />

      {/* Export button */}
      <SafeAreaView className="absolute bottom-0 left-0 right-0 p-6 bg-bg border-t border-border gap-3">
        <TouchableOpacity
          className={`bg-accent rounded-md p-4 items-center justify-center h-[52px] ${
            exporting ? "opacity-60" : ""
          }`}
          onPress={() => handleSave("pdf")}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting && savingMode === "pdf" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">
              Export as PDF →
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className={`bg-surface rounded-md p-4 items-center justify-center h-[52px] border border-border ${
            exporting ? "opacity-60" : ""
          }`}
          onPress={() => handleSave("images")}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting && savingMode === "images" ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text className="text-xl text-accent font-bold">
              Save as Images
            </Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}