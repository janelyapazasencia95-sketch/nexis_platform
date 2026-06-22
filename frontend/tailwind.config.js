/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        fondo: "#F8F9FF",
        blanco: "#FFFFFF",
        azul: "#07226B",
        azul2: "#253A82",
        azulClaro: "#DCE1FF",
        azulSuave: "#EFF4FF",
        borde: "#D3E4FE",
        texto: "#0B1C30",
        textoSuave: "#454651",
        gris: "#757682",
        rojo: "#BA1A1A",
        rojoClaro: "#FFDAD6",
        verde: "#198D20",
        amarillo: "#FFB800",
        moradoClaro: "#E5DEFF",
        morado: "#291575",
      },
      fontFamily: {
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};