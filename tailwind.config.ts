import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        // Fundos
        surface: "#F2F2F0",
        card: "#FFFFFF",

        // Identidade MyAsset
        forest: "#2D4A3E",
        "forest-light": "#3D6B58",
        moss: "#8FA398",

        // Texto
        ink: "#1A1A1A",
        "ink-2": "#4B5563",
        "ink-3": "#9CA3AF",

        // Financeiro
        positive: "#16A34A",
        negative: "#DC2626",
        warning: "#D97706",

        // Header escuro
        header: "#1F2937",

        // Bordas
        border: "#E5E7EB",

        // Alertas
        cream: "#F2F2F0",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-md": "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
