/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Disable relying on media prefers-color-scheme if user wants Light mode only, we enforce it by class
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'sans-serif'],
      },
      borderRadius: {
        // Enforce max rounded-md dynamically via config alias 
        'lg': '0.375rem',
        'xl': '0.375rem',
        '2xl': '0.375rem',
        '3xl': '0.375rem',
      }
    },
  },
  plugins: [],
}
