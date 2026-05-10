import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { SOURCE_DETAILS } from '@/models/sourceDetails'
import { useSimStore } from '@/store/simulationStore'
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
  const targetYear = useSimStore(s => s.targetYear)
  if (!detail) return null

  const color = getColor(sourceKey)
  const italy2023Value = detail.italy2023.value
  const isTWh = detail.unit === 'TWh'

  // ── Growth calculation ─────────────────────────────────────────────────────
  const yearsToTarget = targetYear - 2023
  const diff         = currentValue - italy2023Value
  const annualGrowth = diff / yearsToTarget
  const isGrowing    = diff > 0.05
  const isShrinking  = diff < -0.05
  const isFlat       = !isGrowing && !isShrinking

  // ── Chart data (2004 → 2050) ───────────────────────────────────────────────
  const historicalPoints = detail.historical.map(p => ({
    year: p.year,
    storico:     p.value,
    proiezione:  null as number | null,
  }))

  // Anchor at 2023
  const anchor = { year: 2023, storico: italy2023Value, proiezione: italy2023Value }

  // Projection beyond 2023: same annual rate as needed to hit user target by 2030,
  // then held constant from 2030 to 2050 (or continued if extrapolation makes sense)
  const projectionPoints: { year: number; storico: number | null; proiezione: number | null }[] = []

  if (!isFlat) {
    // targetYear: user's target (large dot)
    projectionPoints.push({ year: targetYear, storico: null, proiezione: currentValue })

    if (targetYear < 2050) {
      // 2050: extrapolate at same annual rate from targetYear onward
      const extrapolated2050 = currentValue + annualGrowth * (2050 - targetYear)
      const value2050 = Math.max(0, extrapolated2050)
      projectionPoints.push({ year: 2050, storico: null, proiezione: value2050 })
    }
  } else {
    // No change: flat dotted line to 2050
    projectionPoints.push({ year: targetYear, storico: null, proiezione: italy2023Value })
    if (targetYear < 2050) {
      projectionPoints.push({ year: 2050, storico: null, proiezione: italy2023Value })
    }
  }

  // Merge: avoid duplicating 2023 if last historical point is already 2023
  const lastHist = historicalPoints[historicalPoints.length - 1]
  const chartData =
    lastHist?.year === 2023
      ? [...historicalPoints.slice(0, -1), anchor, ...projectionPoints]
      : [...historicalPoints, anchor, ...projectionPoints]

  // Custom dot: only render a visible dot at the user's target year (2030)
  function projectionDot(props: { cx?: number; cy?: number; payload?: { year: number; proiezione: number | null } }) {
    const { cx, cy, payload } = props
    if (payload?.year === targetYear && payload.proiezione != null) {
      return <circle key="target-dot" cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />
    }
    return <circle key={`dot-${payload?.year}`} cx={cx} cy={cy} r={0} fill="none" />
  }

  // ── Text summaries ─────────────────────────────────────────────────────────
  let growthLine: string
  let growthColor: string
  if (isFlat) {
    growthLine = `Scenario attuale — nessuna variazione rispetto al 2023`
    growthColor = 'text-gray-600'
  } else if (isGrowing) {
    growthLine = `Per raggiungere ${currentValue.toFixed(currentValue < 10 ? 1 : 0)} ${detail.unit} entro il ${targetYear} servono +${annualGrowth.toFixed(1)} ${detail.unit}/anno`
    growthColor = 'text-green-700'
  } else {
    growthLine = `Riduzione di ${Math.abs(diff).toFixed(1)} ${detail.unit} rispetto al 2023 (−${Math.abs(annualGrowth).toFixed(1)} ${detail.unit}/anno) entro il ${targetYear}`
    growthColor = 'text-amber-700'
  }

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
                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
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

              {/* Info row: CF | Italia 2023 */}
              <div className={`grid gap-3 ${showCapacityFactor ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {showCapacityFactor && detail.capacityFactor && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Fattore di Capacità</p>
                    <p className="text-xl font-bold text-gray-900">
                      {(detail.capacityFactor.value * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Range: {detail.capacityFactor.range}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-snug">{detail.capacityFactor.notes}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Italia 2023</p>
                  <p className="text-xl font-bold text-gray-900">
                    {italy2023Value.toFixed(italy2023Value < 10 ? 1 : 0)}{' '}
                    <span className="text-sm font-normal text-gray-500">{detail.unit}</span>
                  </p>
                  {detail.italy2023.productionTWh !== undefined && detail.unit === 'GW' && (
                    <p className="text-xs text-gray-500 mt-0.5">≈ {detail.italy2023.productionTWh} TWh prodotti</p>
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
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t.label}</span>
                      <span className="text-base font-bold mt-0.5" style={{ color }}>
                        {t.value.toFixed(t.value < 10 ? 1 : 0)}
                        <span className="text-xs font-normal text-gray-400 ml-0.5">{detail.unit}</span>
                      </span>
                      <span className="text-xs text-gray-400">{t.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical + projection chart (2004–2050) */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Storico e proiezione 2004–2050
                  </h3>
                  <span className="text-[10px] text-gray-400 italic">
                    ● target impostato · - - proiezione
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      domain={[2004, 2050]}
                      type="number"
                      ticks={[2004, 2010, 2015, 2020, 2023, 2030, 2040, 2050]}
                      tickFormatter={v => `'${String(v).slice(2)}`}
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
                        const lbl = name === 'storico' ? 'Storico' : 'Proiezione'
                        return [`${v.toFixed(v < 10 ? 2 : 1)} ${detail.unit}`, lbl]
                      }}
                      labelFormatter={year => `Anno ${year}`}
                      contentStyle={{ fontSize: 12 }}
                    />
                    {/* Reference lines for PNIEC + Net Zero targets */}
                    {detail.targets.map(t => (
                      <ReferenceLine
                        key={t.year + t.label}
                        y={t.value}
                        stroke={color}
                        strokeDasharray="4 4"
                        strokeOpacity={0.4}
                        label={{ value: t.label, position: 'insideTopRight', fontSize: 9, fill: color }}
                      />
                    ))}
                    {/* Reference line for user's current slider value */}
                    <ReferenceLine
                      y={currentValue}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      strokeOpacity={0.6}
                      label={{ value: 'Il tuo target', position: 'insideBottomRight', fontSize: 9, fill: color }}
                    />
                    {/* Historical line */}
                    <Line
                      type="monotone"
                      dataKey="storico"
                      stroke={color}
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                      name="storico"
                    />
                    {/* Projection line (dashed) with dot at 2030 */}
                    <Line
                      type="monotone"
                      dataKey="proiezione"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      strokeOpacity={0.65}
                      dot={projectionDot as unknown as boolean}
                      connectNulls={false}
                      name="proiezione"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Annual growth needed — visually prominent */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Crescita necessaria per il tuo scenario
                </h3>

                {/* Big number */}
                {!isFlat && (
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl font-bold tabular-nums"
                      style={{ color }}
                    >
                      {isGrowing ? '+' : ''}{annualGrowth.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      {detail.unit}/anno
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      per {yearsToTarget} anni (2023→{targetYear})
                    </span>
                  </div>
                )}

                <p className={`text-sm font-medium leading-snug ${growthColor}`}>
                  {growthLine}
                </p>

                <div className="flex items-center gap-2 border-t border-gray-200 pt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    Ritmo recente: <span className="font-medium text-gray-700">{detail.recentGrowth}</span>
                  </p>
                </div>

                {extraNote && (
                  <p className="text-xs text-gray-400 italic leading-snug border-t border-gray-200 pt-2">
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
