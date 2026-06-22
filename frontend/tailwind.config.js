/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        fondo: "#F3FBFE",
        tarjeta: "#EAF3F7",
        borde: "#B8D6E3",
        petroleo: "#0B5A82",
        petroleo2: "#1C7293",
        marino: "#21295C",
        texto: "#374152",
      },
    },
  },
  plugins: [],
}