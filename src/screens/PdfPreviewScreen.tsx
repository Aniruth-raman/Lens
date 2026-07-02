import React, { useCallback } from "react";
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
import { usePdfExport } from "../hooks/usePdfExport";
import tailwindConfig from "../../tailwind.config";
import { RootStackParamList } from "../types";

const { colors } = tailwindConfig;
import { SafeAreaView } from "react-native-safe-area-context";

type RoutePropType = RouteProp<RootStackParamList, "PdfPreview">;

export default function PdfPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const { pdfUri, imageUris, docName } = route.params;

  const { shareFile } = usePdfExport();

  const handleShare = useCallback(async () => {
    try {
      if (pdfUri) {
        await shareFile(pdfUri, "application/pdf");
        return;
      }

      if (imageUris && imageUris.length > 0) {
        await shareFile(imageUris[0], "image/jpeg");
      }
    } catch (e) {
      Alert.alert("Share failed", "Could not share the file.");
    }
  }, [pdfUri, imageUris, shareFile]);

  const showingPdf = !!pdfUri;
  const source = showingPdf ? { uri: pdfUri } : null;

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
        <TouchableOpacity className="px-2 py-1" onPress={handleShare}>
          <Text className="text-accent text-xl font-bold">Share ↑</Text>
        </TouchableOpacity>
      </View>

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
      ) : (
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
      )}

      {/* Bottom action */}
      <SafeAreaView className="flex-row gap-3 p-6 border-t border-border bg-bg">
        <TouchableOpacity
          className="flex-1 border border-accent rounded-md p-4 items-center justify-center h-[52px]"
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Text className="text-accent text-[15px] font-semibold">
            {showingPdf ? "Share PDF ↑" : "Share Image ↑"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-accent rounded-md p-4 items-center justify-center h-[52px]"
          onPress={() => navigation.navigate("Gallery" as never)}
          activeOpacity={0.85}
        >
          <Text className="text-white text-[15px] font-semibold">Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
