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
        bigShouldersInlineText: "var(--font-big-shoulders-inline-text)", // Fuente Big Shoulders Inline Text
        bigShouldersText: "var(--font-big-shoulders-text)", // Fuente para textos principales
        workSans: "var(--font-work-sans)", // Fuente para botones
      },
    },
  },
  plugins: [],
};

export default config;
