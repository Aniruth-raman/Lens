import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { ModalSafeArea } from "./ModalSafeArea";

type Props = {
  visible: boolean;
  documentName: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function DocumentActionsSheet({ visible, documentName, onRename, onDelete, onClose }: Props) {
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderRelease: (_, gesture) => { if (gesture.dy > 50) onClose(); },
  }), [onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <ModalSafeArea align="bottom" scrimColor={`${colors.background}A6`} onDismiss={onClose} dismissLabel="Close document options">
        <View accessibilityViewIsModal style={styles.sheet}>
          <View {...panResponder.panHandlers} style={styles.handleArea} accessibilityHint="Swipe down to close.">
            <View style={styles.handle} />
          </View>
          <Text accessibilityRole="header" style={styles.name}>{documentName}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Rename" onPress={onRename} style={styles.row}>
            <Ionicons name="create-outline" size={22} color={colors.text} />
            <Text style={styles.rowText}>Rename</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={onDelete} style={[styles.row, styles.deleteRow]}>
            <Ionicons name="trash-outline" size={22} color={colors.destructive} />
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { width: "100%", paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12 },
  handleArea: { minHeight: 32, alignItems: "center", justifyContent: "center" },
  handle: { width: 36, height: 4, borderRadius: 4, backgroundColor: colors["text-muted"] },
  name: { color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 8, marginBottom: 12 },
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 12, borderRadius: 12 },
  rowText: { color: colors.text, fontSize: 16, fontWeight: "500" },
  deleteRow: { marginBottom: 4 },
  deleteText: { color: colors.destructive, fontSize: 16, fontWeight: "600" },
});
