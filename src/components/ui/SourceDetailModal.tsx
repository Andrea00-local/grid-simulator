import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { SOURCE_DETAILS } from '@/models/sourceDetails'
import type { SourceKey } from '@/models/sourceDetails'

interface Props {
  sourceKey: SourceKey
  currentValue: number
  isOpen: boolean
  onClose: () => void
}

function getColor(sourceKey: SourceKey): string {
  if (sourceKey === 'hydro') return '#14B8A6'
  return SOURCE_DEFINITIONS[sourceKey]?.color ?? '#6b7280'
}

export function SourceDetailModal({ sourceKey, currentValue, isOpen, onClose }: Props) {
  const detail = SOURCE_DETAILS[sourceKey]
  if (!detail) return null

  const color = getColor(sourceKey)
  const italy2023Value = detail.italy2023.value
  const isTWh = detail.unit === 'TWh'

  // ── Chart data ──────────────────────────────────────────────────────────────
  const historicalPoints = detail.historical.map(p => ({
    year: p.year,
    storico: p.value,
    proiezione: null as number | null,
  }))

  // Anchor 2023 point
  const anchor = { year: 2023, storico: italy2023Value, proiezione: italy2023Value }

  const projectionPoint =
    currentValue !== italy2023Value
      ? [{ year: 2030, storico: null as number | null, proiezione: currentValue }]
      : []

  // Merge: avoid duplicating 2023 if last historical is already 2023
  const lastHistorical = historicalPoints[historicalPoints.length - 1]
  const chartData =
    lastHistorical?.year === 2023
      ? [
          ...historicalPoints.slice(0, -1),
          anchor,
          ...projectionPoint,
        ]
      : [
          ...historicalPoints,
          anchor,
          ...projectionPoint,
        ]

  // ── Growth calculation ───────────────────────────────────────────────────────
  const diff = currentValue - italy2023Value
  const annualGrowth = diff / 7

  let growthText: string
  let growthColor: string
  if (Math.abs(diff) < 0.05) {
    growthText = 'Scenario attuale (nessuna crescita aggiuntiva)'
    growthColor = 'text-gray-600'
  } else if (diff > 0) {
    growthText = `Per raggiungere ${currentValue.toFixed(currentValue < 10 ? 1 : 0)} ${detail.unit} entro il 2030 servono +${annualGrowth.toFixed(1)} ${detail.unit}/anno per 7 anni`
    // Amber if growth is >3× the recent pace (or very fast for TWh reductions)
    growthColor = 'text-green-700'
  } else {
    growthText = `Riduzione di ${Math.abs(diff).toFixed(1)} ${detail.unit} rispetto al 2023`
    growthColor = 'text-amber-700'
  }

  // Special notes
  const extraNote =
    sourceKey === 'wind_offshore'
      ? 'Le prime installazioni offshore italiane sono attese dopo il 2025, con iter autorizzativi ancora in corso.'
      : sourceKey === 'nuclear'
      ? 'Le ultime centrali italiane furono chiuse nel 1987–1990. Un eventuale rilancio richiederebbe 15–20 anni di costruzione.'
      : null

  const showCapacityFactor = !isTWh && !!detail.capacityFactor

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Dettaglio: ${detail.label}`}
      >
        {isOpen && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{detail.label}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Dettaglio fonte energetica</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-3"
                aria-label="Chiudi pannello"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Description */}
              <p className="text-sm text-gray-700 leading-relaxed">{detail.description}</p>

              {/* Info row: Capacity Factor | Italia 2023 */}
              <div className={`grid gap-3 ${showCapacityFactor ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {showCapacityFactor && detail.capacityFactor && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Fattore di Capacità
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {(detail.capacityFactor.value * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Range: {detail.capacityFactor.range}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-snug">{detail.capacityFactor.notes}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Italia 2023
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {italy2023Value.toFixed(italy2023Value < 10 ? 1 : 0)}{' '}
                    <span className="text-sm font-normal text-gray-500">{detail.unit}</span>
                  </p>
                  {detail.italy2023.productionTWh !== undefined && detail.unit === 'GW' && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      ≈ {detail.italy2023.productionTWh} TWh prodotti
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 leading-snug">{detail.italy2023.context}</p>
                </div>
              </div>

              {/* Targets */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Obiettivi e scenari
                </h3>
                <div className="flex flex-wrap gap-2">
                  {detail.targets.map(t => (
                    <div
                      key={t.year + t.label}
                      className="flex flex-col items-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white min-w-[90px]"
                    >
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        {t.label}
                      </span>
                      <span className="text-base font-bold mt-0.5" style={{ color }}>
                        {t.value.toFixed(t.value < 10 ? 1 : 0)}
                        <span className="text-xs font-normal text-gray-400 ml-0.5">{detail.unit}</span>
                      </span>
                      <span className="text-xs text-gray-400">{t.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical chart */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Andamento storico e proiezione
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 16, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickCount={6}
                      domain={['dataMin', currentValue !== italy2023Value ? 2030 : 2023]}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      width={44}
                      label={{
                        value: detail.historicalLabel,
                        angle: -90,
                        position: 'insideLeft',
                        offset: 10,
                        style: { fontSize: 9, fill: '#9ca3af' },
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const v = value as number | null | undefined
                        if (v == null) return ['-', String(name)]
                        const label = name === 'storico' ? 'Storico' : 'Proiezione'
                        return [`${v.toFixed(v < 10 ? 2 : 1)} ${detail.unit}`, label]
                      }}
                      labelFormatter={(year) => `Anno ${year}`}
                      contentStyle={{ fontSize: 12 }}
                    />
                    {/* Reference lines for targets */}
                    {detail.targets.map(t => (
                      <ReferenceLine
                        key={t.year + t.label}
                        y={t.value}
                        stroke={color}
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                        label={{
                          value: t.label,
                          position: 'insideTopRight',
                          fontSize: 9,
                          fill: color,
                        }}
                      />
                    ))}
                    {/* Historical line */}
                    <Line
                      type="monotone"
                      dataKey="storico"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      name="storico"
                    />
                    {/* Projection line */}
                    {currentValue !== italy2023Value && (
                      <Line
                        type="monotone"
                        dataKey="proiezione"
                        stroke={color}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        strokeOpacity={0.6}
                        dot={false}
                        connectNulls={false}
                        name="proiezione"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Required growth section */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Scenario corrente del simulatore
                </h3>
                <p className={`text-sm font-medium leading-snug ${growthColor}`}>
                  {growthText}
                </p>
                <p className="text-xs text-gray-500">
                  Crescita recente: <span className="font-medium text-gray-700">{detail.recentGrowth}</span>
                </p>
                {extraNote && (
                  <p className="text-xs text-gray-400 italic leading-snug border-t border-gray-200 pt-2 mt-2">
                    {extraNote}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
