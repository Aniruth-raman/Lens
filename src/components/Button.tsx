import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { colors } from "../theme/colors";

type ButtonVariant = "primary" | "secondary" | "destructive";

type Props = {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, { backgroundColor: string; color: string; borderColor: string }> = {
  primary: { backgroundColor: colors.primary, color: colors.text, borderColor: colors.primary },
  secondary: { backgroundColor: colors["surface-raised"], color: colors.text, borderColor: colors["outline-subtle"] },
  destructive: { backgroundColor: colors.destructive, color: colors.text, borderColor: colors.destructive },
};

export function Button({ children, onPress, variant = "primary", accessibilityLabel, disabled = false, loading = false, style }: Props) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor, opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1 }, style]}
    >
      {loading && <ActivityIndicator color={palette.color} style={styles.spinner} />}
      <Text style={[styles.label, { color: palette.color }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderWidth: 1, borderRadius: 999, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  spinner: { marginRight: 8 },
});
