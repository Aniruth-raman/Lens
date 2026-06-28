import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GalleryScreen from './src/screens/GalleryScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import PdfPreviewScreen from './src/screens/PdfPreviewScreen';
import { RootStackParamList } from './src/types';
import { colors } from './src/utils/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="PdfPreview" component={PdfPreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
