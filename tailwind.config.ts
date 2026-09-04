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
        // Todos os tokens abaixo vêm de CSS custom properties (app/globals.css),
        // que trocam de valor conforme o tema (claro é o padrão; dark em
        // :root[data-theme="dark"]). Ver app/lib/theme.ts.
        surface: "var(--surface)",
        card: "var(--card)",
        "card-2": "var(--card-2)",

        // Identidade MyAsset — acento dourado (igual nos dois temas)
        forest: "var(--forest)",
        "forest-light": "var(--forest-light)",
        moss: "var(--moss)",

        // Texto
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        muted: "var(--muted)",

        // Financeiro
        positive: "var(--positive)",
        negative: "var(--negative)",
        warning: "var(--warning)",

        // Header
        header: "var(--header)",

        // Bordas
        border: "var(--border)",

        // Alertas
        cream: "var(--card)",
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
