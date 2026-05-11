import { useState, useEffect, useRef } from 'react'

export interface FeedbackTesti {
  bad: string
  ok: string
  okHigh?: string
  good: string
}

export interface TargetBarProps {
  label: string
  valore: number
  target: number
  min: number
  max: number
  unita: string
  targetLabel: string
  direzione: 'alto-meglio' | 'basso-meglio'
  feedbackTesti: FeedbackTesti
  tooltip: string
  badThreshold?: number
  okHighThreshold?: number
}

function useCountUp(value: number, duration = 300): number {
  const [displayed, setDisplayed] = useState(value)
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
      setDisplayed(start + (end - start) * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else        prevRef.current = end
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return displayed
}

export function TargetBar({
  label, valore, target, min, max, unita,
  targetLabel, direzione, feedbackTesti, tooltip,
  badThreshold, okHighThreshold,
}: TargetBarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const displayed = useCountUp(valore)

  const safeMax = max > min ? max : min + 1

  // Percentage positions (0–100)
  const tPos = Math.min(100, Math.max(0, ((target - min) / (safeMax - min)) * 100))
  const vPos = Math.min(100, Math.max(0, ((valore - min) / (safeMax - min)) * 100))

  const isGood = direzione === 'alto-meglio' ? valore >= target : valore <= target

  // ── Feedback zone ─────────────────────────────────────────────────────────
  let feedbackText: string
  if (isGood) {
    feedbackText = feedbackTesti.good
  } else if (direzione === 'alto-meglio') {
    const badLim = badThreshold ?? (min + (target - min) / 2)
    if (valore < badLim) {
      feedbackText = feedbackTesti.bad
    } else if (okHighThreshold !== undefined && feedbackTesti.okHigh && valore >= okHighThreshold) {
      feedbackText = feedbackTesti.okHigh
    } else {
      feedbackText = feedbackTesti.ok
    }
  } else {
    const badLim = badThreshold ?? (target + (safeMax - target) / 2)
    feedbackText = valore > badLim ? feedbackTesti.bad : feedbackTesti.ok
  }

  // ── Accent colour ─────────────────────────────────────────────────────────
  let accentColor: string
  if (isGood) {
    accentColor = '#22c55e'
  } else {
    const isOk = direzione === 'alto-meglio'
      ? valore >= (badThreshold ?? (min + (target - min) / 2))
      : valore <= (badThreshold ?? (target + (safeMax - target) / 2))
    accentColor = isOk ? '#eab308' : '#ef4444'
  }

  // ── Gradient ──────────────────────────────────────────────────────────────
  let gradient: string
  if (direzione === 'alto-meglio') {
    gradient = `linear-gradient(to right,
      #dc2626 0%,
      #ef4444 ${tPos * 0.3}%,
      #facc15 ${tPos * 0.75}%,
      #22c55e ${Math.max(tPos, 0.5)}%,
      #15803d 100%)`
  } else if (tPos <= 1) {
    // target ≈ 0 (net-zero 2050): whole bar is warning zone
    gradient = `linear-gradient(to right, #facc15 0%, #f97316 25%, #dc2626 100%)`
  } else {
    gradient = `linear-gradient(to right,
      #15803d 0%,
      #22c55e ${tPos * 0.85}%,
      #facc15 ${tPos}%,
      #f97316 ${Math.min(100, tPos + (100 - tPos) * 0.45)}%,
      #dc2626 100%)`
  }

  // ── Number format ─────────────────────────────────────────────────────────
  const formatted =
    unita === '%'
      ? displayed.toFixed(1)
      : Math.abs(displayed) < 10
      ? displayed.toFixed(1)
      : displayed.toFixed(0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">

      {/* Label + tooltip trigger */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <div className="relative">
          <button
            type="button"
            className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[9px] font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label={`Informazioni su ${label}`}
          >
            ?
          </button>
          {showTooltip && (
            <div
              role="tooltip"
              className="absolute left-5 top-0 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl z-50 leading-relaxed"
            >
              {tooltip}
            </div>
          )}
        </div>
      </div>

      {/* Large current value */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-bold tabular-nums leading-none"
          style={{ fontSize: '2.5rem', color: accentColor, transition: 'color 300ms ease-out' }}
        >
          {formatted}
        </span>
        <span className="text-sm text-gray-400 font-medium">{unita}</span>
        {isGood && (
          <span className="ml-0.5 text-green-500 font-bold text-lg" aria-label="Obiettivo raggiunto">
            ✓
          </span>
        )}
      </div>

      {/* Bar + markers */}
      <div
        className="relative mt-2"
        role="meter"
        aria-valuenow={valore}
        aria-valuemin={min}
        aria-valuemax={safeMax}
        aria-label={`${label}: ${formatted} ${unita}, target ${target} ${unita}`}
      >
        {/* Gradient track */}
        <div className="h-4 rounded-full" style={{ background: gradient }} />

        {/* Target marker (line + triangle above) */}
        <div
          className="absolute inset-y-0 flex items-center"
          style={{
            left: `${tPos}%`,
            transform: 'translateX(-50%)',
            transition: 'left 500ms ease-out',
          }}
        >
          {/* Downward triangle sitting above the bar */}
          <div
            className="absolute w-0 h-0"
            style={{
              top: -9,
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft:   '5px solid transparent',
              borderRight:  '5px solid transparent',
              borderTop:    '6px solid #1e293b',
            }}
          />
          {/* Vertical white line through bar */}
          <div className="w-0.5 h-full rounded-full bg-white opacity-90" />
        </div>

        {/* Value indicator ball */}
        <div
          className="absolute top-1/2 rounded-full bg-white"
          style={{
            width:  20,
            height: 20,
            left:   `${vPos}%`,
            transform: 'translate(-50%, -50%)',
            border: `2.5px solid ${accentColor}`,
            transition: 'left 300ms ease-out, border-color 300ms ease-out',
            boxShadow: '0 0 0 2px white, 0 2px 6px rgba(0,0,0,0.18)',
          }}
        />
      </div>

      {/* Target label + feedback text */}
      <div className="space-y-0.5">
        <p className="text-xs text-gray-400">{targetLabel}</p>
        <p
          className="text-xs font-medium leading-snug"
          style={{ color: accentColor, transition: 'color 300ms ease-out' }}
        >
          {feedbackText}
        </p>
      </div>

    </div>
  )
}
