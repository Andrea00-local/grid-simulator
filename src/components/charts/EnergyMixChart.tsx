import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { SimResult } from '@/models/types'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { useTheme } from '@/contexts/ThemeContext'

interface Props {
  result: SimResult
}

type ChartEntry = {
  label: string
  coal: number
  gas_ocgt: number
  gas_ccgt: number
  imports: number
  nuclear: number
  biomass: number
  geothermal: number
  hydro_run: number
  hydro_reservoir: number
  wind_onshore: number
  wind_offshore: number
  solar: number
}

const ZERO_ENTRY: Omit<ChartEntry, 'label'> = {
  coal: 0, gas_ocgt: 0, gas_ccgt: 0, imports: 0, nuclear: 0,
  biomass: 0, geothermal: 0,
  hydro_run: 0, hydro_reservoir: 0,
  wind_onshore: 0, wind_offshore: 0,
  solar: 0,
}

const GROUPS: { label: string; sources: (keyof Omit<ChartEntry, 'label'>)[] }[] = [
  { label: 'Carbone',  sources: ['coal'] },
  { label: 'Gas OCGT', sources: ['gas_ocgt'] },
  { label: 'Gas CCGT', sources: ['gas_ccgt'] },
  { label: 'Import',   sources: ['imports'] },
  { label: 'Nucleare', sources: ['nuclear'] },
  { label: 'Biomasse', sources: ['biomass'] },
  { label: 'Geo',      sources: ['geothermal'] },
  { label: 'Idro',     sources: ['hydro_run', 'hydro_reservoir'] },
  { label: 'Eolico',   sources: ['wind_onshore', 'wind_offshore'] },
  { label: 'Solare',   sources: ['solar'] },
]

const STACK_IDS: Partial<Record<keyof Omit<ChartEntry, 'label'>, string>> = {
  hydro_run: 's', hydro_reservoir: 's',
  wind_onshore: 's', wind_offshore: 's',
  coal: 's', gas_ocgt: 's', gas_ccgt: 's',
  imports: 's', nuclear: 's', biomass: 's',
  geothermal: 's', solar: 's',
}

const ALL_SOURCES = Object.keys(ZERO_ENTRY) as (keyof Omit<ChartEntry, 'label'>)[]

export function EnergyMixChart({ result }: Props) {
  const { chart } = useTheme()
  const prod   = result.totalProductionBySource
  const demand = result.totalDemand / 1_000_000

  const data: ChartEntry[] = GROUPS
    .map(({ label, sources }) => {
      const entry: ChartEntry = { label, ...ZERO_ENTRY }
      let groupTotal = 0
      for (const src of sources) {
        const twh = (prod[src as keyof typeof prod] ?? 0) / 1_000_000
        entry[src] = twh
        groupTotal += twh
      }
      return { entry, groupTotal }
    })
    .filter(({ groupTotal }) => groupTotal > 0.05)
    .map(({ entry }) => entry)

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { dataKey: string; value: number; fill: string }[]
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    const items = payload.filter((p) => p.value > 0.05)
    const total = items.reduce((s, p) => s + p.value, 0)
    return (
      <div className="gs-card p-3 text-sm min-w-[140px]">
        <p className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{label}</p>
        {items.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-gray-600 dark:text-slate-400 text-xs">
                {SOURCE_DEFINITIONS[item.dataKey as keyof typeof SOURCE_DEFINITIONS]?.labelShort ?? item.dataKey}
              </span>
            </div>
            <span className="text-gray-900 dark:text-slate-100 font-mono text-xs">{item.value.toFixed(1)} TWh</span>
          </div>
        ))}
        {items.length > 1 && (
          <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1 flex justify-between">
            <span className="text-gray-500 dark:text-slate-400 text-xs">Totale</span>
            <span className="font-mono text-xs font-semibold dark:text-slate-100">{total.toFixed(1)} TWh</span>
          </div>
        )}
        <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">{((total / demand) * 100).toFixed(1)}% della domanda</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Mix energetico (TWh/anno)</h3>
        <span className="text-xs text-gray-500 dark:text-slate-400">Domanda: {demand.toFixed(0)} TWh</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="4%" barGap={0}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} unit=" TWh" width={58} />
          <Tooltip content={<CustomTooltip />} />
          {ALL_SOURCES.map((src) => (
            <Bar
              key={src}
              dataKey={src}
              stackId={STACK_IDS[src]}
              fill={SOURCE_DEFINITIONS[src as keyof typeof SOURCE_DEFINITIONS]?.color}
              radius={0}
              maxBarSize={120}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {ALL_SOURCES.filter((src) => (prod[src as keyof typeof prod] ?? 0) > 50_000).map((src) => (
          <div key={src} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SOURCE_DEFINITIONS[src as keyof typeof SOURCE_DEFINITIONS]?.color }} />
            {SOURCE_DEFINITIONS[src as keyof typeof SOURCE_DEFINITIONS]?.labelShort}
          </div>
        ))}
      </div>
    </div>
  )
}
