/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eduBlue: '#2c328e',
        eduGreen: '#37b396',
      }
    },
  },
  plugins: [],
}