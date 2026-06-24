/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soft-beige': '#f5f5f0',
        'cream': '#fcfbf4',
        'debate-dark': '#1a1a1a',
        'debate-border': '#e5e5df',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}