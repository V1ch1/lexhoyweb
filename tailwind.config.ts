/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#E04040", // Color de los resaltes
        background: "#FFFFFF", // Fondo blanco
        text: "#000000", // Texto negro
      },
      fontFamily: {
        bigShouldersInline: "var(--font-big-shoulders-inline)", // Fuente para el logo
        bigShouldersText: "var(--font-big-shoulders-text)", // Fuente para textos principales
        workSans: "var(--font-work-sans)", // Fuente para botones
      },
    },
  },
  plugins: [],
};
