import React from "react";
import { View, StyleSheet } from "react-native";

export function ChevronLeftIcon({
  size = 18,
  color = "#fafafa",
}: {
  size?: number;
  color?: string;
}) {
  const dim = Math.round(size * 0.42);
  return (
    <View style={[styles.center, { width: size, height: size, marginLeft: -1 }]}>
      <View
        style={{
          width: dim,
          height: dim,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
          borderRadius: 1,
        }}
      />
    </View>
  );
}

export function PlusIcon({
  size = 16,
  color = "#fafafa",
  strokeWidth = 2,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          position: "absolute",
          width: size,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: strokeWidth,
          height: size,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
        }}
      />
    </View>
  );
}

export function CloseIcon({
  size = 14,
  color = "#fafafa",
  strokeWidth = 1.8,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          position: "absolute",
          width: size,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

export function TrashIcon({
  size = 15,
  color = "#ef4444",
}: {
  size?: number;
  color?: string;
}) {
  const w = size;
  const h = Math.round(size * 1.15);
  return (
    <View style={[styles.center, { width: w, height: h }]}>
      {/* Lid handle */}
      <View
        style={{
          width: Math.round(w * 0.35),
          height: 1.5,
          backgroundColor: color,
          borderTopLeftRadius: 1,
          borderTopRightRadius: 1,
          marginBottom: 1,
        }}
      />
      {/* Lid bar */}
      <View
        style={{
          width: Math.round(w * 0.85),
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
          marginBottom: 2,
        }}
      />
      {/* Bin body */}
      <View
        style={{
          width: Math.round(w * 0.72),
          height: Math.round(h * 0.62),
          borderWidth: 1.5,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <View style={{ width: 1, height: "60%", backgroundColor: color }} />
        <View style={{ width: 1, height: "60%", backgroundColor: color }} />
      </View>
    </View>
  );
}

export function DocumentIcon({
  size = 28,
  color = "#71717a",
}: {
  size?: number;
  color?: string;
}) {
  const w = Math.round(size * 0.78);
  const h = size;
  return (
    <View
      style={{
        width: w,
        height: h,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 4,
        padding: 3,
        justifyContent: "space-around",
      }}
    >
      <View
        style={{
          width: "60%",
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: "80%",
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: "45%",
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

export function ShareIcon({
  size = 16,
  color = "#fafafa",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Arrow head */}
      <View
        style={{
          width: Math.round(size * 0.35),
          height: Math.round(size * 0.35),
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          transform: [{ rotate: "-45deg" }],
          marginTop: -2,
          marginBottom: -3,
        }}
      />
      {/* Stem */}
      <View
        style={{
          width: 2,
          height: Math.round(size * 0.42),
          backgroundColor: color,
          borderRadius: 1,
          marginBottom: 1,
        }}
      />
      {/* Tray */}
      <View
        style={{
          width: Math.round(size * 0.8),
          height: Math.round(size * 0.35),
          borderWidth: 1.8,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}

export function EditIcon({
  size = 14,
  color = "#a1a1aa",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: Math.round(size * 0.7),
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

export function CheckIcon({
  size = 14,
  color = "#10b981",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: Math.round(size * 0.35),
          height: Math.round(size * 0.6),
          borderBottomWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
          marginBottom: 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
