/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Source palette ────────────────────────────────────────────────
        solar:          { DEFAULT: '#FFB627', dark: '#FF8C42' },
        'wind-on':      { DEFAULT: '#7DD3FC', dark: '#38BDF8' },
        'wind-off':     { DEFAULT: '#0EA5E9', dark: '#0284C7' },
        hydro:          { DEFAULT: '#14B8A6', dark: '#0D9488' },
        geo:            { DEFAULT: '#A855F7', dark: '#9333EA' },
        biomass:        { DEFAULT: '#22C55E', dark: '#16A34A' },
        gas:            { DEFAULT: '#EA580C', dark: '#C2410C' },
        coal:           { DEFAULT: '#475569', dark: '#334155' },
        nuclear:        { DEFAULT: '#8B5CF6', dark: '#7C3AED' },
        imports:        { DEFAULT: '#94A3B8' },
        // ── Semantic ──────────────────────────────────────────────────────
        success:        '#10B981',
        alarm:          { DEFAULT: '#DC2626', dark: '#B91C1C' },
        warning:        '#F59E0B',
        info:           '#3B82F6',
        // ── Canvas ────────────────────────────────────────────────────────
        canvas:         '#FAFAF9',
        night:          '#0F172A',
      },
      backgroundColor: {
        canvas: '#FAFAF9',
      },
    },
  },
  plugins: [],
}
