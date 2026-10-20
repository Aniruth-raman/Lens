import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  align?: "center" | "bottom";
  scrimColor: string;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function ModalSafeArea({ children, align = "center", scrimColor, onDismiss, dismissLabel = "Close dialog" }: Props) {
  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.overlay, { backgroundColor: scrimColor }]}>
          {onDismiss && <Pressable accessibilityRole="button" accessibilityLabel={dismissLabel} style={StyleSheet.absoluteFill} onPress={onDismiss} />}
          <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.content, align === "bottom" ? styles.bottom : styles.center]}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  center: { justifyContent: "center" },
  bottom: { justifyContent: "flex-end" },
});
