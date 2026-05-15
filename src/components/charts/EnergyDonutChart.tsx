import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { SimResult, Source } from '@/models/types'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { useTheme } from '@/contexts/ThemeContext'

// Grouped for cleaner donut segments
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
  result: SimResult
}

export function EnergyDonutChart({ result }: Props) {
  const { } = useTheme()
  const prod = result.totalProductionBySource

  const segments = GROUPS
    .map(({ label, sources }) => ({
      label,
      twh:   sources.reduce((s, src) => s + (prod[src] ?? 0) / 1_000_000, 0),
      color: SOURCE_DEFINITIONS[sources[0]].color,
    }))
    .filter(s => s.twh > 0.1)

  const totalTWh     = segments.reduce((s, x) => s + x.twh, 0)
  const renewablePct = (result.renewableShare * 100).toFixed(0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof segments[0] }[] }) => {
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Mix energetico (TWh/anno)</h3>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          Domanda: {(result.totalDemand / 1_000_000).toFixed(0)} TWh
        </span>
      </div>

      <div className="relative" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={98}
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
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 20 }} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-slate-100">
            {totalTWh.toFixed(0)}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">TWh prodotti</p>
          <p className={`text-sm font-semibold mt-1 ${Number(renewablePct) >= 65 ? 'text-green-600' : 'text-amber-500'}`}>
            {renewablePct}% rinnovabile
          </p>
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
