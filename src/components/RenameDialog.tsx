import { Modal, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme/colors";
import { Button } from "./Button";
import { ModalSafeArea } from "./ModalSafeArea";

type Props = {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  error?: string;
  errorTitle?: string;
};

export function RenameDialog({ visible, value, onChangeText, onSave, onCancel, saving = false, error, errorTitle }: Props) {
  const canSave = !!value.trim() && !saving;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <ModalSafeArea scrimColor={`${colors.background}B8`} onDismiss={onCancel}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>Rename document</Text>
          <Text style={styles.fieldLabel}>Document name</Text>
          <TextInput
            accessibilityLabel="Document name"
            autoFocus
            maxLength={60}
            selectTextOnFocus
            value={value}
            onChangeText={onChangeText}
            placeholder="Document name"
            placeholderTextColor={colors["text-muted"]}
            selectionColor={colors.primary}
            returnKeyType="done"
            onSubmitEditing={onSave}
            style={styles.input}
          />
          {!!errorTitle && <Text accessibilityRole="alert" style={styles.errorTitle}>{errorTitle}</Text>}
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Button onPress={onSave} disabled={!canSave} loading={saving} style={styles.save}>Save name</Button>
          <Button variant="secondary" onPress={onCancel} disabled={saving}>Cancel</Button>
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialog: { width: "100%", maxWidth: 380, alignSelf: "center", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors["surface-raised"] },
  title: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 18 },
  fieldLabel: { color: colors["text-muted"], fontSize: 14, marginBottom: 8 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.outline, borderRadius: 12, color: colors.text, paddingHorizontal: 14, fontSize: 16, marginBottom: 12 },
  error: { color: colors.destructive, fontSize: 14, marginBottom: 12 },
  errorTitle: { color: colors.destructive, fontSize: 14, fontWeight: "600", marginBottom: 4 },
  save: { marginBottom: 8 },
});
