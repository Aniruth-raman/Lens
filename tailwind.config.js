/** @type {import('tailwindcss').Config} */
const colors = {
  bg: "#111317",
  surface: "#111317",
  "surface-alt": "#1E2023",
  surfaceContainerLow: "#17191E",
  surfaceContainer: "#1E2023",
  surfaceContainerHigh: "#282A2D",
  surfaceContainerHighest: "#333538",
  border: "#2A2E37",
  outlineVariant: "#2A2E37",
  outlineSubtle: "#2D333F",
  accent: "#6366F1",
  primary: "#6366F1",
  primaryHover: "#5254DB",
  primaryLight: "#8183FF",
  onSurface: "#E2E2E6",
  onSurfaceVariant: "#9EA1AA",
  secondary: "#9EA1AA",
  muted: "#6B7280",
  destructive: "#EF4444",
  warning: "#FFB783",
  warningContainer: "#352115",
  warningBorder: "#78350F",
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
        "2xl": 20,
        "3xl": 24,
        full: 999,
      },
    },
  },
  plugins: [],
  // Raw values for RN props that do not accept className
  colors,
};
