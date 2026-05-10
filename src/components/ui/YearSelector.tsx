import { useSimStore, type TargetYear } from '@/store/simulationStore'

const YEARS: TargetYear[] = [2030, 2040, 2050]

export function YearSelector() {
  const targetYear    = useSimStore(s => s.targetYear)
  const setTargetYear = useSimStore(s => s.setTargetYear)

  return (
    <div className="flex items-center gap-2 print:hidden">
      <span className="text-xs font-medium text-gray-500">Anno obiettivo:</span>
      <div className="flex gap-1">
        {YEARS.map(year => (
          <button
            key={year}
            onClick={() => setTargetYear(year)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              targetYear === year
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  )
}
