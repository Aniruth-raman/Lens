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

const SECONDARY_FILL = "#161920";
const SECONDARY_BORDER = "#2D333F";

const variantStyles: Record<ButtonVariant, { backgroundColor: string; color: string; borderColor: string }> = {
  primary: { backgroundColor: colors.primary, color: "#FFFFFF", borderColor: colors.primary },
  secondary: { backgroundColor: SECONDARY_FILL, color: colors.text, borderColor: SECONDARY_BORDER },
  destructive: { backgroundColor: colors.destructive, color: "#FFFFFF", borderColor: colors.destructive },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "default",
  accessibilityLabel,
  icon,
  disabled = false,
  loading = false,
  style,
}: Props) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;
  const isCompact = size === "compact";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isCompact && styles.compact,
        styles[variant],
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.color} style={styles.icon} />
      ) : icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={variant === "secondary" ? colors["text-muted"] : palette.color}
          style={styles.icon}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          isCompact && styles.compactLabel,
          variant !== "secondary" && isCompact && styles.strongLabel,
          { color: palette.color },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  compact: {
    height: 44,
    paddingHorizontal: 16,
  },
  primary: Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOpacity: 0.22,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    default: { elevation: 0 },
  }) ?? {},
  secondary: {
    elevation: 0,
  },
  destructive: Platform.select({
    ios: {
      shadowColor: colors.destructive,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    default: { elevation: 0 },
  }) ?? {},
  icon: {
    flexShrink: 0,
  },
  label: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1,
  },
  compactLabel: {
    fontSize: 12,
  },
  strongLabel: {
    fontWeight: "600",
  },
});
