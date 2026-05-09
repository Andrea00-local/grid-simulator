/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Source colors
        solar:    { DEFAULT: '#f59e0b', light: '#fde68a' },
        wind:     { DEFAULT: '#38bdf8', light: '#bae6fd' },
        hydro:    { DEFAULT: '#06b6d4', light: '#a5f3fc' },
        biomass:  { DEFAULT: '#22c55e', light: '#bbf7d0' },
        geo:      { DEFAULT: '#a855f7', light: '#e9d5ff' },
        gas:      { DEFAULT: '#f97316', light: '#fed7aa' },
        coal:     { DEFAULT: '#78716c', light: '#d6d3d1' },
        imports:  { DEFAULT: '#94a3b8', light: '#e2e8f0' },
      },
    },
  },
  plugins: [],
}
