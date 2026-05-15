import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { PeriodResult, Source } from '@/models/types'
import { SOURCE_DEFINITIONS } from '@/models/sources'

const GROUPS: { label: string; sources: Source[] }[] = [
  { label: 'Solare',   sources: ['solar'] },
  { label: 'Eolico',      sources: ['wind_onshore']  },
  { label: 'Eolico off.', sources: ['wind_offshore'] },
  { label: 'Idro',     sources: ['hydro_run', 'hydro_reservoir'] },
  { label: 'Geo',      sources: ['geothermal'] },
  { label: 'Biomasse', sources: ['biomass'] },
  { label: 'Nucleare', sources: ['nuclear'] },
  { label: 'Gas',      sources: ['gas_ccgt', 'gas_ocgt'] },
  { label: 'Carbone',  sources: ['coal'] },
  { label: 'Import',   sources: ['imports'] },
]

interface Props {
  period: PeriodResult
}

export function MonthlyMixChart({ period }: Props) {
  const balanceTWh = period.balance / 1_000_000
  const demandTWh  = period.demand  / 1_000_000
  const isSurplus  = balanceTWh >= 0

  const segments = GROUPS
    .map(({ label, sources }) => ({
      label,
      twh:   sources.reduce((s, src) => s + (period.production[src] ?? 0) / 1_000_000, 0),
      color: SOURCE_DEFINITIONS[sources[0]].color,
    }))
    .filter(s => s.twh > 0.01)

  const totalTWh = segments.reduce((s, x) => s + x.twh, 0)

  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: { payload: typeof segments[0] }[]
  }) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return (
      <div className="gs-card p-2.5 text-xs">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="font-semibold dark:text-slate-100">{d.label}</span>
        </div>
        <p className="text-gray-600 dark:text-slate-300">{d.twh.toFixed(1)} TWh</p>
        <p className="text-gray-400 dark:text-slate-500">{((d.twh / totalTWh) * 100).toFixed(1)}% del mix</p>
      </div>
    )
  }

  return (
    <div>
      {/* Balance banner */}
      <div className={`rounded-xl p-3 mb-4 border flex items-center justify-between ${
        isSurplus
          ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/50'
          : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50'
      }`}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isSurplus ? 'text-green-600' : 'text-red-500'}`}>
            {isSurplus ? 'Surplus' : 'Deficit'}
          </p>
          <p className={`text-xl font-bold tabular-nums ${isSurplus ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isSurplus ? '+' : ''}{balanceTWh.toFixed(1)} TWh
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 dark:text-slate-400">
          <p>Produzione: <strong className="text-gray-700 dark:text-slate-200">{((period.demand + period.balance) / 1_000_000).toFixed(1)} TWh</strong></p>
          <p>Domanda: <strong className="text-gray-700 dark:text-slate-200">{demandTWh.toFixed(1)} TWh</strong></p>
          <p>CO₂: <strong className="text-gray-700 dark:text-slate-200">{(period.emissions / 1_000_000).toFixed(2)} MtCO₂</strong></p>
        </div>
      </div>

      <div className="relative" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={88}
              dataKey="twh"
              nameKey="label"
              paddingAngle={1.5}
              strokeWidth={0}
              isAnimationActive
            >
              {segments.map((seg, i) => (
                <Cell key={i} fill={seg.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-slate-100">
            {totalTWh.toFixed(1)}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">TWh</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
            {seg.label}
          </div>
        ))}
      </div>
    </div>
  )
}
