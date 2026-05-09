import { Printer } from 'lucide-react'

interface Props {
  className?: string
}

export function PrintButton({ className = '' }: Props) {
  return (
    <button
      onClick={() => window.print()}
      className={`print:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-colors ${className}`}
    >
      <Printer className="w-4 h-4" />
      Stampa il mio scenario
    </button>
  )
}
