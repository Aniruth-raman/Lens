import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { usePdfExport } from "../hooks/usePdfExport";
import { useScannedDocs } from "../hooks/useScannedDocs";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";

const { colors } = tailwindConfig;

type RoutePropType = RouteProp<RootStackParamList, "PdfPreview">;

export default function PdfPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const { id, docName, thumbUri, pageCount, pdfUri, imageUris } = route.params;
  const { exportToPdf, exportAsImages, exporting } = usePdfExport();
  const { saveDoc } = useScannedDocs();

  const handleExportPdf = useCallback(async () => {
    if (!imageUris || imageUris.length === 0) {
      Alert.alert("Export unavailable", "No page images are available for this document.");
      return;
    }

    try {
      const nextPdfUri = await exportToPdf(imageUris, docName, id);
      await saveDoc({
        id,
        name: docName,
        thumbUri,
        pageCount,
        createdAt: Date.now(),
        pdfUri: nextPdfUri,
        imageUris,
      });
    } catch (e) {
      Alert.alert("Export failed", "Something went wrong while exporting the scan.");
      console.error(e);
    }
  }, [imageUris, docName, id, thumbUri, pageCount, exportToPdf, saveDoc]);

  const handleExportImages = useCallback(async () => {
    if (!imageUris || imageUris.length === 0) {
      Alert.alert("Export unavailable", "No page images are available for this document.");
      return;
    }

    try {
      await exportAsImages(imageUris, docName, id);
      await saveDoc({
        id,
        name: docName,
        thumbUri,
        pageCount,
        createdAt: Date.now(),
        pdfUri,
        imageUris,
      });
    } catch (e) {
      Alert.alert("Export failed", "Something went wrong while exporting the scan.");
      console.error(e);
    }
  }, [imageUris, docName, id, thumbUri, pageCount, pdfUri, exportAsImages, saveDoc]);

  const handleDone = useCallback(async () => {
    navigation.navigate("Gallery" as never);
  }, [navigation]);

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
          {docName}
        </Text>
      </View>

      <FlatList
        data={imageUris || []}
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

      {/* Bottom action */}
      <SafeAreaView className="p-6 border-t border-border bg-bg">
        <TouchableOpacity
          className={`bg-accent rounded-md p-4 items-center justify-center h-[52px] mb-3 ${
            exporting ? "opacity-60" : ""
          }`}
          onPress={handleExportPdf}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-[15px] font-semibold">
              Export as PDF
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className={`bg-accent rounded-md p-4 items-center justify-center h-[52px] mb-3 ${
            exporting ? "opacity-60" : ""
          }`}
          onPress={handleExportImages}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-[15px] font-semibold">
              Save as Images
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-surface rounded-md p-4 items-center justify-center h-[52px] border border-border"
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Text className="text-primary text-[15px] font-semibold">Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}