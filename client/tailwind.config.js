/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#1e2a4a',
          100: '#1a2540',
          500: '#4f6ef7',
          600: '#3b57e8',
          700: '#93a8fb',
        },
      },
    },
  },
  plugins: [],
}
