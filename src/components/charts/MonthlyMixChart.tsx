import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { PeriodResult, Source } from '@/models/types'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { useTheme } from '@/contexts/ThemeContext'

const GROUPS: { label: string; sources: Source[]; stackId: string }[] = [
  { label: 'Carbone',  sources: ['coal'],                              stackId: 's' },
  { label: 'Gas',      sources: ['gas_ccgt', 'gas_ocgt'],              stackId: 's' },
  { label: 'Import',   sources: ['imports'],                           stackId: 's' },
  { label: 'Nucleare', sources: ['nuclear'],                           stackId: 's' },
  { label: 'Biomasse', sources: ['biomass'],                           stackId: 's' },
  { label: 'Geo',      sources: ['geothermal'],                        stackId: 's' },
  { label: 'Idro',     sources: ['hydro_run', 'hydro_reservoir'],      stackId: 's' },
  { label: 'Eolico',   sources: ['wind_onshore', 'wind_offshore'],     stackId: 's' },
  { label: 'Solare',   sources: ['solar'],                             stackId: 's' },
]

interface Props {
  period: PeriodResult
}

export function MonthlyMixChart({ period }: Props) {
  const { chart } = useTheme()
  const demandTWh  = period.demand / 1_000_000
  const balanceTWh = period.balance / 1_000_000
  const isSurplus  = balanceTWh >= 0

  const data = GROUPS
    .map(({ label, sources, stackId }) => {
      const entry: Record<string, number | string> = { label, stackId }
      let total = 0
      for (const src of sources) {
        const twh = (period.production[src] ?? 0) / 1_000_000
        entry[src] = twh
        total += twh
      }
      return { entry, total }
    })
    .filter(({ total }) => total > 0.001)
    .map(({ entry }) => entry)

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { dataKey: string; value: number; fill: string }[]
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    const items = payload.filter(p => p.value > 0.001)
    const total = items.reduce((s, p) => s + p.value, 0)
    return (
      <div className="gs-card p-3 text-xs min-w-[130px]">
        <p className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{label}</p>
        {items.map(item => (
          <div key={item.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-gray-600 dark:text-slate-400">{SOURCE_DEFINITIONS[item.dataKey as Source]?.labelShort ?? item.dataKey}</span>
            </div>
            <span className="font-mono dark:text-slate-200">{item.value.toFixed(1)} TWh</span>
          </div>
        ))}
        {items.length > 1 && (
          <div className="border-t dark:border-slate-700 mt-1 pt-1 flex justify-between text-gray-500 dark:text-slate-400">
            <span>Totale</span>
            <span className="font-mono font-semibold dark:text-slate-200">{total.toFixed(1)} TWh</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Balance banner */}
      <div className={`rounded-xl p-3 mb-4 border flex items-center justify-between ${
        isSurplus ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/50'
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

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="4%" barGap={0}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: chart.tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: chart.tick }} axisLine={false} tickLine={false} unit=" TWh" width={50} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={demandTWh}
            stroke="#0f172a"
            strokeWidth={2}
            strokeDasharray="5 3"
            label={{ value: 'Domanda', position: 'right', fontSize: 10, fill: chart.tick }}
          />
          {GROUPS.flatMap(({ sources, stackId }) =>
            sources.map(src => (
              <Bar
                key={src}
                dataKey={src}
                stackId={stackId}
                fill={SOURCE_DEFINITIONS[src].color}
                maxBarSize={120}
                radius={0}
              />
            ))
          )}
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {GROUPS.flatMap(({ sources }) => sources).filter(src =>
          (period.production[src] ?? 0) > 50_000
        ).map(src => (
          <div key={src} className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: SOURCE_DEFINITIONS[src].color }} />
            {SOURCE_DEFINITIONS[src].labelShort}
          </div>
        ))}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
          <div className="w-4 h-0.5 bg-gray-900 dark:bg-slate-300" />
          Domanda
        </div>
      </div>
    </div>
  )
}
