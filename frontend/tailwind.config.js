/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        background: "#f8f9ff",
        primary: "#07226b",
        "primary-container": "#253a82",
        secondary: "#3d59b0",
        "secondary-container": "#87a1fe",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#454651",
        outline: "#757682",
        "outline-variant": "#c5c5d2",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
      },
      fontFamily: {
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};