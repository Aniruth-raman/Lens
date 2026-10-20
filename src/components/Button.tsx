import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import type { ComponentProps, ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type ButtonVariant = "primary" | "secondary" | "destructive";
type ButtonSize = "default" | "compact";
type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  accessibilityLabel?: string;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, { backgroundColor: string; color: string; borderColor: string }> = {
  primary: { backgroundColor: colors.primary, color: colors.text, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, color: colors.text, borderColor: colors["outline-subtle"] },
  destructive: { backgroundColor: colors.destructive, color: colors.text, borderColor: colors.destructive },
};

export function Button({ children, onPress, variant = "primary", size = "default", accessibilityLabel, icon, disabled = false, loading = false, style }: Props) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, size === "compact" && styles.compact, styles[variant], { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor, opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={palette.color} style={styles.icon} /> : icon ? <Ionicons name={icon} size={19} color={variant === "secondary" ? colors["text-muted"] : palette.color} style={styles.icon} /> : null}
      <Text numberOfLines={1} style={[styles.label, size === "compact" && styles.compactLabel, variant !== "secondary" && size === "compact" && styles.strongLabel, { color: palette.color }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: 48, borderWidth: 1, borderRadius: 24, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  compact: { height: 44 },
  primary: Platform.select({ ios: { shadowColor: colors.primary, shadowOpacity: 0.23, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, default: { elevation: 0 } }) ?? {},
  secondary: { elevation: 0 },
  destructive: { elevation: 0 },
  icon: { flexShrink: 0 },
  label: { fontFamily: "Inter", fontSize: 14, fontWeight: "500", textAlign: "center", flexShrink: 1 },
  compactLabel: { fontSize: 12 },
  strongLabel: { fontWeight: "600" },
});
