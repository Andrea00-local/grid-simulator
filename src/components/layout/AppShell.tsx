import { Link, useLocation } from 'react-router-dom'
import { Zap, Lock, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const LEVELS = [
  { n: 1, label: 'Annuale', to: '/level1', available: true },
  { n: 2, label: 'Mensile', to: '/level2', available: true },
  { n: 3, label: 'Orario',  to: '/level3', available: true },
  { n: 4, label: 'Zone',    to: '/level4', available: true },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { isDark, toggle } = useTheme()
  const levelMatch  = pathname.match(/\/level(\d)/)
  const activeLevel = levelMatch ? parseInt(levelMatch[1]) : null

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F172A] flex flex-col transition-colors duration-200 overflow-x-hidden">
      <header className="print:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Grid Simulator
          </Link>

          <div className="flex items-center gap-3">
            {activeLevel && (
              <nav className="flex items-center gap-1">
                {LEVELS.map(({ n, label, to, available }) =>
                  available ? (
                    <Link
                      key={n}
                      to={to}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        n === activeLevel
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {n}. {label}
                    </Link>
                  ) : (
                    <span
                      key={n}
                      className="px-3 py-1 rounded-full text-xs font-medium text-gray-300 dark:text-slate-600 flex items-center gap-1"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      {n}. {label}
                    </span>
                  )
                )}
              </nav>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label={isDark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 dark:border-slate-700 py-4 text-center text-xs text-gray-400 dark:text-slate-500">
        Hai curiosità sul modello?{' '}
        <a
          href="https://www.linkedin.com/in/andrea-alberoni-b988562b7/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
        >
          Contattami
        </a>
      </footer>
    </div>
  )
}
