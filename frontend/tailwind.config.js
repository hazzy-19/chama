/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f766e",
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "#db2626",
          foreground: "#ffffff",
        },
        surface: "#ffffff",
        surface2: "#ecf8f7",
        muted: "#4b6462",
      },
      boxShadow: {
        soft: "0 35px 80px rgba(15, 118, 110, 0.12)",
      },
    },
  },
  plugins: [],
};
