import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#E04040", // Color de los resaltes
        background: "#FFFFFF", // Fondo blanco
        text: "#000000", // Texto negro
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        playfair: ['var(--font-playfair)'],
        inter: ['var(--font-sans)'],
      },
    },
  },
  plugins: [],
};

export default config;
