import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Button } from "./Button";

type Props = {
  visible: boolean;
  documentName: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function DocumentActionsSheet({ visible, documentName, onRename, onDelete, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close document options" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.title}>Document options</Text>
          <Text numberOfLines={1} style={styles.name}>{documentName}</Text>
          <Button variant="secondary" onPress={onRename} style={styles.action}>Rename</Button>
          <Button variant="destructive" onPress={onDelete} style={styles.action}>Delete</Button>
          <Button variant="secondary" onPress={onClose}>Cancel</Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: `${colors.background}A6`, justifyContent: "flex-end" },
  sheet: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors["surface-raised"] },
  handle: { width: 36, height: 4, borderRadius: 4, backgroundColor: colors["text-muted"], alignSelf: "center", marginBottom: 18 },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  name: { color: colors["text-muted"], fontSize: 14, marginTop: 4, marginBottom: 18 },
  action: { marginBottom: 8 },
});
