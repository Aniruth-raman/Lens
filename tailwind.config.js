/** @type {import('tailwindcss').Config} */
const colors = {
  bg: "#09090b",
  surface: "#141417",
  "surface-alt": "#1c1c20",
  border: "#27272a",
  "border-light": "#3f3f46",
  accent: "#2563eb",
  "accent-subtle": "rgba(37, 99, 235, 0.15)",
  primary: "#fafafa",
  secondary: "#a1a1aa",
  muted: "#71717a",
  destructive: "#ef4444",
};

module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      borderRadius: {
        sm: 6,
        md: 10,
        lg: 14,
        xl: 18,
        "2xl": 22,
        full: 999,
      },
    },
  },
  plugins: [],
  // Raw values for the handful of RN props that don't accept `className`
  // (StatusBar.backgroundColor, ActivityIndicator.color, react-native-pdf's style, etc.)
  colors,
};
