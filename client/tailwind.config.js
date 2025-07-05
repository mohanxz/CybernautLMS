/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ⬅️ Add this line to enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
  ],

}
