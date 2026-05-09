import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

interface Props {
  emissionsMt: number
}

export function EmissionsChart({ emissionsMt }: Props) {
  const data = [
    { label: 'La tua scelta', value: emissionsMt },
    { label: 'Baseline 2023', value: ITALY_CO2_BASELINE_MT },
    { label: 'Target 2030', value: 35 },
    { label: 'Net Zero', value: 0 },
  ]

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof data[0] }[] }) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-gray-900">{d.label}</p>
        <p className="text-gray-600">{d.value.toFixed(1)} MtCO₂</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Emissioni CO₂ (MtCO₂/anno)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} unit=" Mt" width={48} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#e5e7eb" />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  idx === 0
                    ? entry.value <= 35 ? '#22c55e' : entry.value <= ITALY_CO2_BASELINE_MT ? '#f59e0b' : '#ef4444'
                    : idx === 1 ? '#94a3b8'
                    : idx === 2 ? '#60a5fa'
                    : '#34d399'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
