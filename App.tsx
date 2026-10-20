import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GalleryScreen from "./src/screens/GalleryScreen";
import ReviewScreen from "./src/screens/ReviewScreen";
import PdfPreviewScreen from "./src/screens/PdfPreviewScreen";
import { RootStackParamList } from "./src/types";
import { useDocumentsStore } from "./src/store/documentsStore";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./src/theme/colors";
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Single, canonical load of the documents index at startup. Screens
  // subscribe to the store directly and don't re-trigger this themselves.
  useEffect(() => {
    useDocumentsStore.getState().load();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="Gallery" component={GalleryScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="PdfPreview" component={PdfPreviewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
