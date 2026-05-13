/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#0d9488", // Teal 600
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "#dc2626", // Red 600
          foreground: "#ffffff",
        },
        surface: "#ffffff",
        surface2: "#f0fdfa", // Teal 50
        muted: "#475569", // Slate 600
      },
      boxShadow: {
        soft: "0 35px 80px rgba(13, 148, 136, 0.12)",
      },
    },
  },
  plugins: [],
};
