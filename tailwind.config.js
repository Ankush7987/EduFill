/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brandPrimary: '#1E3A8A', // Deep Blue
        brandSecondary: '#10B981', // Teal/Green
      }
    },
  },
  plugins: [],
}