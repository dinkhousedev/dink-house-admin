const {heroui} = require("@heroui/theme")

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dink-lime": "#B3FF00",
        "dink-lime-dark": "#8BC700",
        "dink-black": "#000000",
        "dink-white": "#FFFFFF",
        "dink-gray": "#1A1A1A",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      backgroundImage: {
        "hero-section-title":
          "linear-gradient(91deg, #B3FF00 32.88%, rgba(179, 255, 0, 0.40) 99.12%)",
        "dink-gradient": "linear-gradient(135deg, #B3FF00 0%, #8BC700 100%)",
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: "#000000",
            foreground: "#FFFFFF",
            primary: {
              DEFAULT: "#B3FF00",
              foreground: "#000000",
            },
            secondary: {
              DEFAULT: "#1A1A1A",
              foreground: "#FFFFFF",
            },
            success: "#8BC700",
            focus: "#B3FF00",
          },
        },
      },
    }),
  ],
};

module.exports = config;
