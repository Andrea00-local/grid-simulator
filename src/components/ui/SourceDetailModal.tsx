import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { SOURCE_DETAILS } from '@/models/sourceDetails'
import { useSimStore } from '@/store/simulationStore'
import type { SourceKey } from '@/models/sourceDetails'

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(value: number, duration = 300): number {
  const [disp, setDisp] = useState(value)
  const prevRef = useRef(value)
  const rafRef  = useRef(0)

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    const start = prevRef.current
    const end   = value
    const t0    = performance.now()

    function tick(now: number) {
      const p     = Math.min((now - t0) / duration, 1)
      const eased = p < 1 ? p * p * (3 - 2 * p) : 1
      setDisp(start + (end - start) * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else        prevRef.current = end
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return disp
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getColor(key: SourceKey): string {
  if (key === 'hydro') return '#14B8A6'
  return SOURCE_DEFINITIONS[key]?.color ?? '#6b7280'
}

interface Props {
  sourceKey: SourceKey
  currentValue: number
  isOpen: boolean
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SourceDetailModal({ sourceKey, currentValue, isOpen, onClose }: Props) {
  const detail     = SOURCE_DETAILS[sourceKey]
  const targetYear = useSimStore(s => s.targetYear)

  // Hoist all hooks above the early-return so Rules of Hooks are respected
  const anchor2023    = detail?.italy2023.value ?? 0
  const yearsToTarget = targetYear - 2023
  const diff          = currentValue - anchor2023
  const annualGrowth  = diff / yearsToTarget

  const dispTarget = useCountUp(currentValue)
  const dispGrowth = useCountUp(annualGrowth)

  if (!detail) return null

  const color  = getColor(sourceKey)
  const unit   = detail.unit           // local const — keeps type narrow inside closures
  const isGW   = unit === 'GW'
  const dec    = isGW ? 1 : 0
  const fmt    = (v: number) => v.toFixed(dec)
  const fmt1   = (v: number) => v.toFixed(1)

  // ── KPI box 1 ─────────────────────────────────────────────────────────────
  const box1 = detail.capacityFactor
    ? {
        title: 'CAPACITY FACTOR',
        main:  `${(detail.capacityFactor.value * 100).toFixed(1)}%`,
        sub:   detail.capacityFactor.notes,
      }
    : {
        title: 'TIPO PRODUZIONE',
        main:  'Disp.',
        sub:   'Programmabile su richiesta',
      }

  const growthColor =
    Math.abs(diff) < 0.05 ? '#6b7280' : diff > 0 ? '#22c55e' : '#ef4444'

  // ── Chart data ────────────────────────────────────────────────────────────
  const historicalPts = detail.historical
    .filter(p => p.year >= 2005)
    .map(p => ({
      year:       p.year,
      storico:    p.value,
      proiezione: null as number | null,
    }))

  const anchor = { year: 2023, storico: anchor2023, proiezione: anchor2023 }
  const target = { year: targetYear, storico: null as number | null, proiezione: currentValue }

  const lastHist = historicalPts[historicalPts.length - 1]
  const chartData =
    lastHist?.year === 2023
      ? [...historicalPts.slice(0, -1), anchor, target]
      : [...historicalPts, anchor, target]

  // X ticks: always include 2005 … 2023 + targetYear
  const xTicks = Array.from(
    new Set([2005, 2010, 2015, 2020, 2023, targetYear]),
  ).sort((a, b) => a - b)

  const yMax = Math.max(anchor2023, currentValue, 0.1) * 1.2

  // ── Custom dot renderers ──────────────────────────────────────────────────
  type DotProps = { cx?: number; cy?: number; payload?: { year: number } }

  function storiciDot({ cx = 0, cy = 0, payload }: DotProps) {
    if (!cx || !cy || payload?.year !== 2023)
      return <g key={`sd-${payload?.year}`} />
    return (
      <g key="dot-2023">
        <circle cx={cx} cy={cy} r={5} fill={color} />
        <text
          x={cx} y={cy - 10}
          textAnchor="middle" fontSize={9}
          fill={color} fontWeight="600"
        >
          2023: {fmt(anchor2023)} {unit}
        </text>
      </g>
    )
  }

  function projectionDot({ cx = 0, cy = 0, payload }: DotProps) {
    if (!cx || !cy || payload?.year !== targetYear)
      return <g key={`pd-${payload?.year}`} />
    return (
      <g key={`dot-${targetYear}`}>
        <circle cx={cx} cy={cy} r={6} fill="white" stroke={color} strokeWidth={2.5} />
        <text
          x={cx} y={cy - 13}
          textAnchor="middle" fontSize={9}
          fill={color} fontWeight="600"
        >
          {targetYear}: {fmt(currentValue)} {unit}
        </text>
      </g>
    )
  }

  const extraNote =
    sourceKey === 'wind_offshore'
      ? 'Le prime installazioni offshore italiane sono attese dopo il 2025, con iter autorizzativi ancora in corso.'
      : sourceKey === 'nuclear'
      ? 'Le ultime centrali italiane furono chiuse nel 1987–1990. Un eventuale rilancio richiederebbe 15–20 anni di costruzione.'
      : null

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Dettaglio: ${detail.label}`}
      >
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
              style={{ borderBottomColor: `${color}22` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{detail.label}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Fonte energetica — {unit}</p>
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

            {/* ── Scrollable body ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Description */}
              <p className="text-sm text-gray-700 leading-relaxed">{detail.description}</p>

              {/* ── 4 KPI boxes ─────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

                {/* Box 1 — CF or type */}
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    {box1.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums leading-tight">
                    {box1.main}
                  </p>
                </div>

                {/* Box 2 — Oggi 2023 */}
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    ITALIA 2023
                  </p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums leading-tight">
                    {fmt(anchor2023)}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
                  </p>
                </div>

                {/* Box 3 — Target utente (count-up) */}
                <div
                  className="rounded-xl p-3.5"
                  style={{ backgroundColor: `${color}12`, border: `1.5px solid ${color}30` }}
                >
                  <p className="text-[9px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: `${color}bb` }}>
                    AL {targetYear}
                  </p>
                  <p
                    className="text-xl font-bold tabular-nums leading-tight"
                    style={{ color }}
                  >
                    {fmt(dispTarget)}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
                  </p>
                </div>

                {/* Box 4 — Crescita annua (count-up) */}
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    {diff >= 0 ? 'DA INSTALLARE/ANNO' : 'DA RIDURRE/ANNO'}
                  </p>
                  <p
                    className="text-xl font-bold tabular-nums leading-tight"
                    style={{ color: growthColor }}
                  >
                    {diff > 0.05 ? '+' : ''}{fmt1(dispGrowth)}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
                  </p>
                </div>

              </div>

              {/* ── Chart ───────────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Da dove veniamo, dove dobbiamo arrivare
                  </h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-2">
                    <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke={color} strokeWidth="2" /></svg>
                    storico
                    <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke={color} strokeWidth="2" strokeDasharray="4 3" /></svg>
                    proiezione
                  </span>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 24, right: 32, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="year"
                      type="number"
                      domain={[2005, targetYear]}
                      ticks={xTicks}
                      tickFormatter={v =>
                        v >= 2023 ? String(v) : `'${String(v).slice(2)}`
                      }
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, yMax]}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      width={38}
                      tickFormatter={v => String(Math.round(v))}
                      label={{
                        value: detail.unit,
                        angle: -90,
                        position: 'insideLeft',
                        offset: 10,
                        style: { fontSize: 9, fill: '#9ca3af' },
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const v = value as number | null
                        if (v == null) return ['-', '']
                        return [
                          `${v.toFixed(dec)} ${unit}`,
                          name === 'storico' ? 'Storico' : 'Proiezione',
                        ]
                      }}
                      labelFormatter={year => `Anno ${year}`}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />

                    {/* Historical solid line */}
                    <Line
                      type="monotone"
                      dataKey="storico"
                      stroke={color}
                      strokeWidth={2.5}
                      dot={storiciDot as unknown as boolean}
                      connectNulls={false}
                      name="storico"
                      isAnimationActive={false}
                    />

                    {/* Projection dashed line */}
                    <Line
                      type="linear"
                      dataKey="proiezione"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      strokeOpacity={0.75}
                      dot={projectionDot as unknown as boolean}
                      connectNulls
                      name="proiezione"
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Growth annotation */}
                {Math.abs(diff) > 0.05 && (
                  <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
                    <svg width="18" height="2" className="flex-shrink-0">
                      <line x1="0" y1="1" x2="18" y2="1" stroke={color} strokeWidth="2" strokeDasharray="5 3" />
                    </svg>
                    {diff > 0
                      ? `+${fmt1(annualGrowth)} ${unit}/anno richiesti (2023 → ${targetYear})`
                      : `${fmt1(annualGrowth)} ${unit}/anno — riduzione necessaria`
                    }
                  </p>
                )}
              </div>

              {/* Recent growth */}
              <div className="flex items-center gap-2 py-2 border-t border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  Ritmo recente:{' '}
                  <span className="font-medium text-gray-700">{detail.recentGrowth}</span>
                </p>
              </div>

              {/* Extra note */}
              {extraNote && (
                <p className="text-xs text-gray-400 italic leading-relaxed border-t border-gray-100 pt-3">
                  {extraNote}
                </p>
              )}

            </div>
          </div>
      </div>
    </>
  )
}
