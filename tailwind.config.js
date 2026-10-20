/** @type {import('tailwindcss').Config} */
const { colors } = require("./src/theme/colors");
// Keep existing screens building and styled until Mobile migrates their call sites.
const legacyColors = {
  bg: colors.background,
  "surface-alt": colors["surface-raised"],
  surfaceContainerLow: colors.surface,
  surfaceContainer: colors["surface-raised"],
  surfaceContainerHigh: colors["surface-high"],
  surfaceContainerHighest: colors["surface-highest"],
  border: colors.outline,
  outlineVariant: colors.outline,
  outlineSubtle: colors["outline-subtle"],
  accent: colors.primary,
  primaryHover: colors["primary-hover"],
  primaryLight: colors["primary-light"],
  onSurface: colors.text,
  onSurfaceVariant: colors["text-muted"],
  secondary: colors["text-muted"],
  muted: colors["text-muted"],
  warningContainer: colors["warning-container"],
  warningBorder: colors["warning-outline"],
};
const tailwindColors = { ...colors, ...legacyColors };

module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: tailwindColors,
      fontFamily: {
        sans: ["Inter", "System"],
      },
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
  colors: tailwindColors,
};
