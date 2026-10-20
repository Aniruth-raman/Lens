import { Modal, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Button } from "./Button";
import { ModalSafeArea } from "./ModalSafeArea";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmIcon?: IconName;
  onConfirm: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
};

export function ConfirmDialog({ visible, title, message, confirmLabel, confirmIcon, onConfirm, onCancel, cancelLabel = "Cancel", destructive = false, loading = false }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <ModalSafeArea scrimColor={`${colors.background}B8`} onDismiss={onCancel}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button variant={destructive ? "destructive" : "primary"} icon={confirmIcon ?? (destructive ? "trash-outline" : "checkmark-outline")} onPress={onConfirm} loading={loading} style={styles.confirm}>{confirmLabel}</Button>
          {cancelLabel && onCancel && <Button variant="secondary" icon="close-outline" onPress={onCancel} disabled={loading}>{cancelLabel}</Button>}
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialog: { width: "100%", maxWidth: 380, alignSelf: "center", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors["surface-raised"] },
  title: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "700", marginBottom: 10 },
  message: { color: colors["text-muted"], fontSize: 14, lineHeight: 20, marginBottom: 20 },
  confirm: { marginBottom: 8 },
});
