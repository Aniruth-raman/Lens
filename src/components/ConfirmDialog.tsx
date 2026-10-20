import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Button } from "./Button";

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close dialog" style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button variant={destructive ? "destructive" : "primary"} onPress={onConfirm} loading={loading} style={styles.confirm}>{confirmLabel}</Button>
          {cancelLabel && onCancel && <Button variant="secondary" onPress={onCancel} disabled={loading}>{cancelLabel}</Button>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", paddingHorizontal: 24 },
  dialog: { width: "100%", maxWidth: 380, alignSelf: "center", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors["surface-raised"] },
  title: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "700", marginBottom: 10 },
  message: { color: colors["text-muted"], fontSize: 14, lineHeight: 20, marginBottom: 20 },
  confirm: { marginBottom: 8 },
});
