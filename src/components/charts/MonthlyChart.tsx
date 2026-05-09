import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PeriodResult, Source } from '@/models/types'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { useTheme } from '@/contexts/ThemeContext'

const ALL_SOURCES: Source[] = [
  'coal', 'gas_ocgt', 'gas_ccgt', 'imports',
  'nuclear', 'biomass', 'geothermal',
  'hydro_run', 'hydro_reservoir',
  'wind_onshore', 'wind_offshore',
  'solar',
]

const STACK_IDS: Partial<Record<Source, string>> = Object.fromEntries(
  ['coal','gas_ocgt','gas_ccgt','imports','nuclear','biomass','geothermal',
   'hydro_run','hydro_reservoir','wind_onshore','wind_offshore','solar']
  .map(s => [s, 's'])
) as Partial<Record<Source, string>>

interface ChartRow {
  label: string
  demand: number
  balance: number
  [key: string]: number | string
}

interface Props {
  periods: PeriodResult[]
  selectedMonth: number | null
  onSelectMonth: (idx: number) => void
}

export function MonthlyChart({ periods, selectedMonth, onSelectMonth }: Props) {
  const { chart } = useTheme()

  const data: ChartRow[] = periods.map((p) => {
    const row: ChartRow = {
      label: p.label,
      demand: p.demand / 1_000_000,
      balance: p.balance / 1_000_000,
    }
    for (const src of ALL_SOURCES) {
      row[src] = (p.production[src] ?? 0) / 1_000_000
    }
    return row
  })

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { dataKey: string; value: number; fill: string }[]
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    const demandVal = payload.find((p) => p.dataKey === 'demand')?.value ?? 0
    const prodItems = payload
      .filter((p) => p.dataKey !== 'demand' && p.value > 0.05)
      .sort((a, b) => b.value - a.value)
    const totalProd = prodItems.reduce((s, p) => s + p.value, 0)
    const bal = totalProd - demandVal

    return (
      <div className="gs-card p-3 text-sm min-w-[180px]">
        <p className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{label}</p>
        {prodItems.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-3 mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-gray-600 dark:text-slate-400 text-xs">
                {SOURCE_DEFINITIONS[item.dataKey as Source]?.labelShort}
              </span>
            </div>
            <span className="text-xs font-mono dark:text-slate-200">{item.value.toFixed(1)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 dark:border-slate-700 mt-2 pt-1 space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">Produzione</span>
            <span className="font-mono font-semibold dark:text-slate-100">{totalProd.toFixed(1)} TWh</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">Domanda</span>
            <span className="font-mono dark:text-slate-100">{demandVal.toFixed(1)} TWh</span>
          </div>
          <div className={`flex justify-between text-xs font-semibold ${bal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <span>Bilancio</span>
            <span className="font-mono">{bal >= 0 ? '+' : ''}{bal.toFixed(1)} TWh</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Produzione mensile e domanda (TWh)</h3>
        <span className="text-xs text-gray-400 dark:text-slate-500">Clicca su un mese per il dettaglio</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="6%"
          barGap={0}
          onClick={(d) => {
            if (d?.activeTooltipIndex != null) onSelectMonth(Number(d.activeTooltipIndex))
          }}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} unit=" TWh" width={52} />
          <Tooltip content={<CustomTooltip />} />
          {ALL_SOURCES.map((src) => (
            <Bar
              key={src}
              dataKey={src}
              stackId={STACK_IDS[src] ?? src}
              fill={SOURCE_DEFINITIONS[src].color}
              radius={0}
              maxBarSize={80}
              opacity={selectedMonth === null ? 1 : undefined}
            />
          ))}
          <Line
            type="monotone"
            dataKey="demand"
            stroke="#1e293b"
            strokeWidth={2}
            dot={false}
            name="Domanda"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
