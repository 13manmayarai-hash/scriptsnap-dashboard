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
        // Muted, warm accent set for dashboard stat tiles — same
        // desaturated, editorial tone as sage/error rather than generic
        // saturated web colors (Tailwind's default blue-500/purple-500/
        // etc.), which read as off-the-shelf and clashed with the rest
        // of the app.
        'accent-clay': '#BF7A4A',
        'accent-ochre': '#B58A35',
        'accent-slate': '#5F7D99',
        'accent-plum': '#83678A',
        'accent-teal': '#547E74',
        'accent-umber': '#7D6248',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
