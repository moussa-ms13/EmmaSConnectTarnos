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
        primary: '#0d6efd',
        sidebar: '#112240',
        background: '#f8f9fa',
      },
    },
  },
  plugins: [],
}
