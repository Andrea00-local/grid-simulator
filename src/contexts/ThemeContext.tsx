import { createContext, useContext, useState, useEffect } from 'react'

interface ChartColors {
  grid: string
  tick: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

interface ThemeContextType {
  isDark: boolean
  toggle: () => void
  chart: ChartColors
}

const LIGHT: ChartColors = {
  grid: '#e2e8f0',
  tick: '#6b7280',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  tooltipText: '#111827',
}

const DARK: ChartColors = {
  grid: '#1e293b',
  tick: '#94a3b8',
  tooltipBg: '#1e293b',
  tooltipBorder: '#334155',
  tooltipText: '#f1f5f9',
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('gs-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('gs-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggle: () => setIsDark(d => !d),
      chart: isDark ? DARK : LIGHT,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme requires ThemeProvider')
  return ctx
}
