import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f2f7f5",
          100: "#e5f0ec",
          600: "#2f8069",
          700: "#256653",
          800: "#1b4d3e",
          900: "#123328",
          950: "#0a1f18",
        },
        sun: {
          50: "#fff7ed",
          100: "#feecd8",
          500: "#e98024",
          600: "#cf6b17",
        },
        stone: {
          50: "#f8faf9",
          100: "#f0f5f2",
          200: "#e2ebe6",
          300: "#cbd6d0",
          500: "#7b8c84",
          600: "#5c6e65",
          700: "#42524a",
          800: "#26332d",
          900: "#141f1a",
        },
        alert: {
          red: "#c93b2b",
          "red-bg": "#fef2f2",
          "red-border": "#fecaca",
        }
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
