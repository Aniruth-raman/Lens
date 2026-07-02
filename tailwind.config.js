/** @type {import('tailwindcss').Config} */
const colors = {
  bg: "#0a0a0a",
  surface: "#151515",
  "surface-alt": "#1e1e1e",
  border: "#2a2a2a",
  accent: "#2563eb",
  "accent-light": "#3b82f6",
  danger: "#ef4444",
  primary: "#f5f5f5",
  secondary: "#9ca3af",
  muted: "#4b5563",
};

module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      borderRadius: {
        sm: 6,
        md: 10,
        lg: 16,
        full: 999,
      },
    },
  },
  plugins: [],
  // Raw values for the handful of RN props that don't accept `className`
  // (StatusBar.backgroundColor, ActivityIndicator.color, react-native-pdf's style, etc.)
  colors,
};