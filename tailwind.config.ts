import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        // Fundos — private banking dark
        surface: "#0C0D0F",
        card: "#141618",
        "card-2": "#1C1E22",

        // Identidade MyAsset — acento dourado
        forest: "#C4A96B",
        "forest-light": "#D4B97A",
        moss: "#8B7240",

        // Texto
        ink: "#F5F3EF",
        "ink-2": "#9BA3AF",
        "ink-3": "#6B7280",
        muted: "#4A4F5A",

        // Financeiro
        positive: "#5FBF8A",
        negative: "#E0686C",
        warning: "#D9A05B",

        // Header
        header: "#0C0D0F",

        // Bordas
        border: "#2A2D33",

        // Alertas
        cream: "#141618",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(0,0,0,0.4)",
        "card-md": "0 12px 32px -12px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
