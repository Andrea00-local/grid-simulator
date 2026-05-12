import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import type { HourlyPoint, Source } from '@/models/types'
import { SOURCE_DEFINITIONS } from '@/models/sources'

const SUN_MOON: Record<number, string> = {
  0: '🌙', 6: '🌅', 12: '☀️', 18: '🌆', 23: '🌑',
}

function SunMoonTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  const h    = payload?.value ?? 0
  const icon = SUN_MOON[h] ?? ''
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fill="#9ca3af">{h}:00</text>
      <text x={0} y={0} dy={25} textAnchor="middle" fontSize={13}>{icon}</text>
    </g>
  )
}

// Stack bottom → top: coal, gas, imports, biomass, geo, hydro (merged), wind, solar
const THERMAL_STACK: Source[] = ['nuclear', 'coal', 'gas_ccgt', 'imports', 'biomass', 'geothermal']
const VARIABLE_STACK: Source[] = ['wind_offshore', 'wind_onshore', 'solar']
const HYDRO_COLOR = '#14B8A6'

const BATTERY_COLOR = '#14b8a6'
const DEMAND_COLOR  = '#0f172a'

interface Props {
  hours: HourlyPoint[]
  storageCapacityGWh?: number
  title?: string
  selectedSource?: string | null
  onSelectSource?: (s: string | null) => void
}

export function HourlyDispatchChart({ hours, storageCapacityGWh, title, selectedSource, onSelectSource }: Props) {
  const ALL_STACK = [...THERMAL_STACK, ...VARIABLE_STACK]
  const dispatchData = hours.map(hp => {
    const pt: Record<string, number> = { hour: hp.hour }
    for (const src of ALL_STACK) pt[src] = hp.production[src] / 1_000
    pt['hydro']   = ((hp.production['hydro_run'] ?? 0) + (hp.production['hydro_reservoir'] ?? 0)) / 1_000
    pt['battery'] = hp.batteryDischarge / 1_000
    pt['demand']  = hp.demand           / 1_000
    return pt
  })

  const hasBattery = (storageCapacityGWh ?? 0) > 0

  const socData = hours.map(hp => ({
    hour: hp.hour,
    soc: hp.batterySOC / 1_000,
  }))

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}

      {/* Dispatch chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={dispatchData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="hour"
            ticks={[0, 6, 12, 18, 23]}
            tick={<SunMoonTick />}
            height={42}
          />
          <YAxis
            width={38}
            tick={{ fontSize: 11 }}
            tickFormatter={v => v.toFixed(0)}
            label={{ value: 'GW', angle: -90, position: 'insideLeft', fontSize: 11, dx: 10 }}
          />
          <Tooltip
            content={<DispatchTooltip />}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />

          {/* Thermal + baseload stack (bottom) */}
          {THERMAL_STACK.map(src => {
            const def = SOURCE_DEFINITIONS[src]
            const isSelected = selectedSource === src
            const isDimmed = selectedSource !== null && !isSelected
            return (
              <Area
                key={src}
                type="monotone"
                dataKey={src}
                stackId="d"
                fill={def.color}
                stroke={def.color}
                fillOpacity={isDimmed ? 0.06 : (isSelected ? 0.9 : 0.88)}
                strokeOpacity={isDimmed ? 0.1 : 1}
                strokeWidth={0.3}
                name={def.labelShort}
                isAnimationActive={false}
                style={{ cursor: onSelectSource ? 'pointer' : 'default' }}
                onClick={() => { if (onSelectSource) onSelectSource(selectedSource === src ? null : src) }}
              />
            )
          })}

          {/* Hydro merged */}
          {(() => {
            const isSelected = selectedSource === 'hydro'
            const isDimmed = selectedSource !== null && !isSelected
            return (
              <Area
                key="hydro"
                type="monotone"
                dataKey="hydro"
                stackId="d"
                fill={HYDRO_COLOR}
                stroke={HYDRO_COLOR}
                fillOpacity={isDimmed ? 0.06 : (isSelected ? 0.9 : 0.88)}
                strokeOpacity={isDimmed ? 0.1 : 1}
                strokeWidth={0.3}
                name="Idroelettrico"
                isAnimationActive={false}
                style={{ cursor: onSelectSource ? 'pointer' : 'default' }}
                onClick={() => { if (onSelectSource) onSelectSource(selectedSource === 'hydro' ? null : 'hydro') }}
              />
            )
          })()}

          {/* Variable renewables (top of stack) */}
          {VARIABLE_STACK.map(src => {
            const def = SOURCE_DEFINITIONS[src]
            const isSelected = selectedSource === src
            const isDimmed = selectedSource !== null && !isSelected
            return (
              <Area
                key={src}
                type="monotone"
                dataKey={src}
                stackId="d"
                fill={def.color}
                stroke={def.color}
                fillOpacity={isDimmed ? 0.06 : (isSelected ? 0.9 : 0.88)}
                strokeOpacity={isDimmed ? 0.1 : 1}
                strokeWidth={0.3}
                name={def.labelShort}
                isAnimationActive={false}
                style={{ cursor: onSelectSource ? 'pointer' : 'default' }}
                onClick={() => { if (onSelectSource) onSelectSource(selectedSource === src ? null : src) }}
              />
            )
          })}

          <Area
            type="monotone"
            dataKey="battery"
            stackId="d"
            fill={BATTERY_COLOR}
            stroke={BATTERY_COLOR}
            fillOpacity={selectedSource !== null && selectedSource !== 'battery' ? 0.06 : (selectedSource === 'battery' ? 0.9 : 0.88)}
            strokeOpacity={selectedSource !== null && selectedSource !== 'battery' ? 0.1 : 1}
            strokeWidth={0.3}
            name="Batteria"
            isAnimationActive={false}
            style={{ cursor: onSelectSource ? 'pointer' : 'default' }}
            onClick={() => {
              if (onSelectSource) onSelectSource(selectedSource === 'battery' ? null : 'battery')
            }}
          />

          <Line
            type="monotone"
            dataKey="demand"
            stroke={DEMAND_COLOR}
            strokeWidth={2}
            dot={false}
            name="Domanda"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Color legend */}
      {!onSelectSource && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 px-1">
          {[...VARIABLE_STACK].reverse().map(src => {
            const def = SOURCE_DEFINITIONS[src]
            return (
              <span key={src} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: def.color }} />
                {def.labelShort}
              </span>
            )
          })}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: HYDRO_COLOR }} />
            Idroelettrico
          </span>
          {[...THERMAL_STACK].reverse().map(src => {
            const def = SOURCE_DEFINITIONS[src]
            return (
              <span key={src} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: def.color }} />
                {def.labelShort}
              </span>
            )
          })}
          {hasBattery && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: BATTERY_COLOR }} />
              Batteria
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-4 h-0.5 inline-block" style={{ background: DEMAND_COLOR }} />
            Domanda
          </span>
        </div>
      )}

      {/* Battery SOC chart */}
      {hasBattery && (
        <div className="mt-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Stato di carica batteria (GWh)</p>
          <ResponsiveContainer width="100%" height={70}>
            <ComposedChart data={socData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="hour"
                ticks={[0, 6, 12, 18, 23]}
                tickFormatter={h => `${h}:00`}
                tick={{ fontSize: 10 }}
                height={18}
              />
              <YAxis
                domain={[0, storageCapacityGWh ?? 'auto']}
                tick={{ fontSize: 10 }}
                width={35}
              />
              <Area
                type="monotone"
                dataKey="soc"
                fill={BATTERY_COLOR}
                stroke="#0d9488"
                fillOpacity={0.35}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
              {(storageCapacityGWh ?? 0) > 0 && (
                <ReferenceLine
                  y={storageCapacityGWh}
                  stroke="#f97316"
                  strokeDasharray="4 2"
                  strokeWidth={1}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Custom tooltip ────────────────────────────────────────────────────────────

function DispatchTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { dataKey: string; value: number; name: string; fill?: string; stroke?: string }[]
  label?: number
}) {
  if (!active || !payload?.length) return null

  const demand    = payload.find(p => p.dataKey === 'demand')?.value ?? 0
  const totalProd = payload
    .filter(p => p.dataKey !== 'demand')
    .reduce((s, p) => s + (p.value ?? 0), 0)
  const balance = totalProd - demand

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-xs w-44">
      <p className="font-semibold text-gray-800 mb-2">{label}:00</p>

      <div className="mb-2">
        <span className="text-gray-500">Domanda:</span>{' '}
        <span className="font-medium tabular-nums">{demand.toFixed(1)} GW</span>
      </div>

      <div className="space-y-0.5 mb-2">
        {[...payload]
          .filter(p => p.dataKey !== 'demand' && (p.value ?? 0) > 0.05)
          .reverse()
          .map(p => (
            <div key={p.dataKey} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 truncate">
                <span
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ background: p.fill ?? p.stroke }}
                />
                <span className="truncate text-gray-600">{p.name}</span>
              </span>
              <span className="tabular-nums text-gray-700 flex-shrink-0">{(p.value ?? 0).toFixed(1)}</span>
            </div>
          ))}
      </div>

      <div className={`font-semibold border-t pt-1.5 ${
        balance < -0.2 ? 'text-red-600' : balance > 0.2 ? 'text-amber-600' : 'text-green-600'
      }`}>
        {balance < -0.2
          ? `Deficit: ${(-balance).toFixed(1)} GW`
          : balance > 0.2
          ? `Surplus: ${balance.toFixed(1)} GW`
          : 'Bilanciato'}
      </div>
    </div>
  )
}
