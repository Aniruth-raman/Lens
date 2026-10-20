import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import type { ComponentProps, ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type ButtonVariant = "primary" | "secondary" | "destructive";
type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  icon?: IconName;
  caption?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, { backgroundColor: string; color: string; borderColor: string }> = {
  primary: { backgroundColor: colors.primary, color: colors.text, borderColor: colors.primary },
  secondary: { backgroundColor: colors["surface-raised"], color: colors.text, borderColor: colors["outline-subtle"] },
  destructive: { backgroundColor: colors.destructive, color: colors.text, borderColor: colors.destructive },
};

export function Button({ children, onPress, variant = "primary", accessibilityLabel, icon, caption, disabled = false, loading = false, style }: Props) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[variant], { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor, opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={palette.color} style={styles.icon} /> : icon ? <Ionicons name={icon} size={20} color={palette.color} style={styles.icon} /> : null}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.label, { color: palette.color }, caption && styles.left]}>{children}</Text>
        {caption && <Text numberOfLines={1} style={[styles.caption, { color: variant === "secondary" ? colors["text-muted"] : palette.color }]}>{caption}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  primary: { elevation: 2, shadowColor: colors.background, shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  secondary: { elevation: 0 },
  destructive: { elevation: 1 },
  copy: { flexShrink: 1 },
  icon: { flexShrink: 0 },
  label: { fontFamily: "Inter", fontSize: 14, fontWeight: "600", textAlign: "center" },
  left: { textAlign: "left" },
  caption: { fontFamily: "Inter", fontSize: 12, lineHeight: 14, marginTop: 1 },
});
