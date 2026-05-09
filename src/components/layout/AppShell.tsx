import { Link, useLocation } from 'react-router-dom'
import { Zap, Lock } from 'lucide-react'

const LEVELS = [
  { n: 1, label: 'Annuale',  to: '/level1', available: true },
  { n: 2, label: 'Mensile',  to: '/level2', available: true },
  { n: 3, label: 'Orario',   to: '/level3', available: true },
  { n: 4, label: 'Zone',     to: '/level4', available: true },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const levelMatch = pathname.match(/\/level(\d)/)
  const activeLevel = levelMatch ? parseInt(levelMatch[1]) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 hover:text-blue-600 transition-colors">
            <Zap className="w-5 h-5 text-blue-600" />
            Grid Simulator
          </Link>

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
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {n}. {label}
                  </Link>
                ) : (
                  <span
                    key={n}
                    className="px-3 py-1 rounded-full text-xs font-medium text-gray-300 flex items-center gap-1"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    {n}. {label}
                  </span>
                )
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
