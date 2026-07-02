import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePdfExport } from "../hooks/usePdfExport";
import { useScannedDocs } from "../hooks/useScannedDocs";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList, ScannedDoc } from "../types";

const { colors } = tailwindConfig;

type NavProp = NativeStackNavigationProp<RootStackParamList, "Review">;

export default function ReviewScreen() {
  const navigation = useNavigation() as NavProp;
  const route = useRoute() as { params: { images: string[] } };
  const [pages, setPages] = useState<string[]>(route.params.images);
  const [docName, setDocName] = useState(`Scan ${new Date().toLocaleDateString("en-IN")}`);
  const [savingMode, setSavingMode] = useState<"pdf" | "images" | null>(null);
  const docId = useRef(Date.now().toString());

  const { exportToPdf, exportAsImages, exporting } = usePdfExport();
  const { saveDoc } = useScannedDocs();

  const removePage = useCallback(
    (index: number) => {
      if (pages.length === 1) {
        Alert.alert("Cannot remove", "At least one page is required.");
        return;
      }
      setPages((current) => current.filter((_, pageIndex) => pageIndex !== index));
    },
    [pages],
  );

  const saveAndExport = async (mode: "pdf" | "images") => {
    const name = docName.trim();
    if (!name) {
      Alert.alert("Name required", "Please enter a name for this document.");
      return;
    }

    setSavingMode(mode);
    try {
      const imageUris = pages;

      if (mode === "pdf") {
        const pdfUri = await exportToPdf(imageUris, name, docId.current);
        navigation.navigate("PdfPreview", {
          id: docId.current,
          docName: name,
          thumbUri: imageUris[0],
          pageCount: imageUris.length,
          pdfUri,
          imageUris,
        });
        await saveDoc({
          id: docId.current,
          name,
          thumbUri: imageUris[0],
          pageCount: imageUris.length,
          createdAt: Date.now(),
          pdfUri,
          imageUris,
        } as ScannedDoc);
        return;
      }

      await exportAsImages(imageUris, name, docId.current);
      navigation.navigate("PdfPreview", {
        id: docId.current,
        docName: name,
        thumbUri: imageUris[0],
        pageCount: imageUris.length,
        imageUris,
      });
      await saveDoc({
        id: docId.current,
        name,
        thumbUri: imageUris[0],
        pageCount: imageUris.length,
        createdAt: Date.now(),
        imageUris,
      } as ScannedDoc);
    } catch (error) {
      Alert.alert("Export failed", "Something went wrong while exporting the scan.");
      console.error(error);
    } finally {
      setSavingMode(null);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View className="flex-row items-center pt-14 px-6 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-accent text-xl font-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-primary text-xl font-bold">Review</Text>
        <Text className="text-muted text-sm">
          {pages.length} page{pages.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <View className="px-6 py-4 border-b border-border">
        <Text className="text-muted text-sm font-bold uppercase mb-1 tracking-wider">Document name</Text>
        <TextInput
          className="bg-surface text-primary border border-border rounded-md px-4 py-3 text-lg placeholder-text-muted selection-text-accent"
          value={docName}
          onChangeText={setDocName}
          placeholder="Enter document name..."
          maxLength={60}
        />
      </View>
      <FlatList
        className="flex-1"
        contentContainerClassName="p-4 pb-32"
        data={pages}
        keyExtractor={(_, index) => index.toString()}
        numColumns={2}
        renderItem={({ item, index }) => (
          <SafeAreaView className="flex-1 m-2 h-60 rounded-md overflow-hidden bg-surface border border-border">
            <Image source={{ uri: item }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute bottom-2 left-2 bg-black/65 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-[11px] font-bold">{index + 1}</Text>
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
      <SafeAreaView className="absolute bottom-0 left-0 right-0 p-6 bg-bg border-t border-border gap-3">
        <TouchableOpacity
          className={`bg-accent rounded-md p-4 items-center justify-center h-[52px] ${exporting ? "opacity-60" : ""}`}
          onPress={() => saveAndExport("pdf")}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting && savingMode === "pdf" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">Export as PDF →</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className={`bg-surface rounded-md p-4 items-center justify-center h-[52px] border border-border ${exporting ? "opacity-60" : ""}`}
          onPress={() => saveAndExport("images")}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting && savingMode === "images" ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text className="text-xl text-accent font-bold">Save as Images</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}