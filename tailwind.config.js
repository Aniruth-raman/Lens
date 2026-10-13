/** @type {import('tailwindcss').Config} */
const colors = {
  bg: "#0a0a0a",
  surface: "#151515",
  "surface-alt": "#1e1e1e",
  border: "#262626",
  accent: "#2563eb",
  primary: "#f5f5f5",
  secondary: "#a3a3a3",
  muted: "#737373",
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
        full: 999,
      },
    },
  },
  plugins: [],
  // Raw values for RN props that do not accept className
  colors,
};
