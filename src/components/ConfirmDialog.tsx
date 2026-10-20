import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Button } from "./Button";
import { ModalSafeArea } from "./ModalSafeArea";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
};

export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel, cancelLabel = "Cancel", destructive = false, loading = false }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <ModalSafeArea scrimColor={`${colors.background}B8`} onDismiss={onCancel}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.heading}>
            {destructive && <View style={styles.iconBadge}><Ionicons name="trash-outline" size={20} color={colors.destructive} /></View>}
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button size="compact" variant={destructive ? "destructive" : "primary"} onPress={onConfirm} loading={loading}>{confirmLabel}</Button>
            {cancelLabel && onCancel ? <Button size="compact" variant="secondary" onPress={onCancel} disabled={loading}>{cancelLabel}</Button> : null}
          </View>
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors["surface-high"],
    backgroundColor: colors["surface-raised"],
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      default: {},
    }),
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: { width: 40, height: 40, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: `${colors.destructive}26` },
  title: { flex: 1, color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "600", letterSpacing: -0.3 },
  message: { color: colors["text-muted"], fontSize: 12, lineHeight: 18, marginTop: 12 },
  actions: { gap: 8, marginTop: 24 },
});
