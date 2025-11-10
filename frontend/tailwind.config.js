/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'steno': {
          'navy': '#1e3a5f',
          'navy-dark': '#152a47',
          'navy-light': '#2d4a6f',
          'teal': '#0d9488',
          'teal-dark': '#0f766e',
          'teal-light': '#14b8a6',
          'charcoal': '#2d3748',
          'charcoal-dark': '#1a202c',
          'charcoal-light': '#4a5568',
          'gold': '#d4af37',
          'gold-dark': '#b8941f',
          'gold-light': '#e5c558',
          'silver': '#c0c0c0',
        },
      },
      fontFamily: {
        'heading': ['Playfair Display', 'serif'],
        'body': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

