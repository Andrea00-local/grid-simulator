import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'
import { useTheme } from '@/contexts/ThemeContext'

interface Props {
  emissionsMt: number
}

export function EmissionsChart({ emissionsMt }: Props) {
  const { chart } = useTheme()

  const data = [
    { label: 'La tua scelta', value: emissionsMt },
    { label: 'Baseline 2023', value: ITALY_CO2_BASELINE_MT },
    { label: 'Target 2030',   value: 35 },
    { label: 'Net Zero',      value: 0 },
  ]

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof data[0] }[] }) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return (
      <div className="gs-card p-3 text-sm">
        <p className="font-semibold text-gray-900 dark:text-slate-100">{d.label}</p>
        <p className="text-gray-600 dark:text-slate-400">{d.value.toFixed(1)} MtCO₂</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Emissioni CO₂ (MtCO₂/anno)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} unit=" Mt" width={48} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke={chart.grid} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  idx === 0
                    ? entry.value <= 35 ? '#10B981' : entry.value <= ITALY_CO2_BASELINE_MT ? '#F59E0B' : '#DC2626'
                    : idx === 1 ? '#94A3B8'
                    : idx === 2 ? '#3B82F6'
                    : '#10B981'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
