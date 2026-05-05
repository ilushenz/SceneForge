/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
      },
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
