/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-black': '#000000',
        'brand-white': '#FFFFFF',
        'brand-yellow': '#FFD700',
        // Alias used throughout the dashboard sidebar (logo, tier label,
        // borders) — was previously undefined, so those utilities
        // generated no CSS and silently lost their styling.
        'brand-gold': '#FFD700',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
