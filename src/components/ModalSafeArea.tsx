import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

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
          {onDismiss && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={dismissLabel}
              style={StyleSheet.absoluteFill}
              onPress={onDismiss}
            />
          )}
          <View pointerEvents="box-none" style={styles.fill}>
            {align === "bottom" ? (
              <View pointerEvents="box-none" style={styles.bottomLayer}>
                <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
                  {children}
                </SafeAreaView>
              </View>
            ) : (
              <SafeAreaView pointerEvents="box-none" edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
                <ScrollView
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={[styles.content, styles.center]}
                >
                  {onDismiss && <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />}
                  {children}
                </ScrollView>
              </SafeAreaView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { flex: 1 },
  safeArea: { flex: 1 },
  sheetSafeArea: {
    width: "100%",
    backgroundColor: colors["surface-raised"],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.outline,
    overflow: "hidden",
  },
  content: { flexGrow: 1 },
  center: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 },
  bottomLayer: { flex: 1, justifyContent: "flex-end" },
});
