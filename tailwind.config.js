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
        'warm-bg': '#F8F3E8',
        'warm-surface': '#FFFFFF',
        'warm-surface-alt': '#F1EADA',
        'warm-border': '#E0D6BE',
        // Two-tone card fill used on the landing page's feature/pricing/
        // comparison cards — exact values from the approved design system.
        'warm-tint': '#EFE8D6',
        'warm-tint-icon': '#FFFFFF',
        'warm-accent': '#C98B4F',
        ink: '#211F17',
        'ink-muted': '#4B4737',
        'ink-faint': '#756E5C',
        sage: '#5C6B49',
        'sage-hover': '#45512F',
        'soft-accent': '#DFE6D2',
        'soft-accent-line': '#C9D4B6',
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
