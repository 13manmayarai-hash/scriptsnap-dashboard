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
        // Warm/editorial palette — extended app-wide from the landing
        // page's approved design (see app/page.tsx, HANDOFF.md from the
        // original design pass). Replaces the earlier dark brand-black/
        // brand-yellow theme.
        'warm-bg': '#F7F5F0',
        'warm-surface': '#FFFFFF',
        'warm-surface-alt': '#FBFAF6',
        'warm-border': '#E0DDD3',
        ink: '#20201E',
        'ink-muted': '#706E68',
        'ink-faint': '#918D84',
        sage: '#7A8B72',
        'sage-hover': '#697B62',
        'soft-accent': '#EFF1E8',
        error: '#B85C5C',
        'error-hover': '#9C4444',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
