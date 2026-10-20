import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { EdgeInsets, SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ModalSafeAreaChildren = React.ReactNode | ((context: { insets: EdgeInsets }) => React.ReactNode);

type Props = {
  children: ModalSafeAreaChildren;
  align?: "center" | "bottom";
  scrimColor: string;
  onDismiss?: () => void;
  dismissLabel?: string;
};

function ModalSafeAreaInner({ children, align = "center", scrimColor, onDismiss, dismissLabel = "Close dialog" }: Props) {
  const insets = useSafeAreaInsets();
  const isBottom = align === "bottom";

  return (
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
        <SafeAreaView
          edges={isBottom ? ["top", "left", "right"] : ["top", "right", "bottom", "left"]}
          style={styles.safeArea}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              isBottom ? styles.bottom : styles.center,
              isBottom && styles.bottomContent,
            ]}
          >
            {typeof children === "function" ? children({ insets }) : children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

export function ModalSafeArea(props: Props) {
  return (
    <SafeAreaProvider>
      <ModalSafeAreaInner {...props} />
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
  bottomContent: { paddingHorizontal: 0 },
});
