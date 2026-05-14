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
        cream: "#F5F1EA",
        ink: "#1A1A1A",
        forest: "#2D4A3E",
        moss: "#8FA398",
      },
    },
  },
  plugins: [],
};

export default config;
