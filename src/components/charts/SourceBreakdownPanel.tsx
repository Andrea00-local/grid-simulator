import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Entry {
  key: string
  label: string
  color: string
  value: number
  unit: string
}

interface Props {
  entries: Entry[]
  selectedSource: string | null
  onSelectSource: (s: string | null) => void
  title?: string
}

export function SourceBreakdownPanel({ entries, selectedSource, onSelectSource, title }: Props) {
  const sorted = [...entries].sort((a, b) => b.value - a.value)
  const total = entries.reduce((s, e) => s + e.value, 0)
  const unit = entries[0]?.unit ?? ''
  const maxVal = sorted[0]?.value ?? 1

  const pieData = entries.map(e => ({ ...e, value: Math.max(e.value, 0) }))

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {title && (
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide truncate">
          {title}
        </p>
      )}

      {/* Donut chart */}
      <div className="relative" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={1}
              dataKey="value"
              isAnimationActive={false}
            >
              {pieData.map((entry) => {
                const isSelected = selectedSource === entry.key
                const isDimmed = selectedSource !== null && !isSelected
                return (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    opacity={isDimmed ? 0.3 : 1}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectSource(selectedSource === entry.key ? null : entry.key)}
                  />
                )
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-bold text-gray-800 dark:text-slate-100 tabular-nums leading-tight">
            {total.toFixed(1)}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500">{unit}</span>
        </div>
      </div>

      {/* Clear selection button */}
      {selectedSource !== null && (
        <button
          onClick={() => onSelectSource(null)}
          className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 self-center"
        >
          <span>✕</span>
          <span>Mostra tutto</span>
        </button>
      )}

      {/* Source list */}
      <div className="space-y-1.5">
        {sorted.map((entry) => {
          const isSelected = selectedSource === entry.key
          const isDimmed = selectedSource !== null && !isSelected
          const barPct = maxVal > 0 ? (entry.value / maxVal) * 100 : 0

          return (
            <button
              key={entry.key}
              onClick={() => onSelectSource(selectedSource === entry.key ? null : entry.key)}
              className="w-full text-left group"
              style={{ opacity: isDimmed ? 0.4 : 1 }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={`text-xs truncate flex-1 ${isSelected ? 'font-semibold text-gray-800 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400'}`}>
                  {entry.label}
                </span>
                <span className="text-xs tabular-nums text-gray-700 dark:text-slate-300 flex-shrink-0 font-medium">
                  {entry.value.toFixed(1)}
                </span>
              </div>
              <div className="h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden ml-3.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${barPct}%`, backgroundColor: entry.color }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
