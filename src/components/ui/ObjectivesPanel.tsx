import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

const RENEWABLE_TARGET = 0.65
const AVOIDED_MT_TARGET = 50
const AVOIDED_MT_MAX = ITALY_CO2_BASELINE_MT  // 82 Mt

// ── SVG gauge geometry ──────────────────────────────────────────────────────
const CX = 100, CY = 100
const R_OUTER = 84, R_INNER = 56, R_NEEDLE = 73

const SEGMENTS = [
  { from: 180, to: 144, color: '#ef4444' },
  { from: 144, to: 108, color: '#fb923c' },
  { from: 108, to:  72, color: '#facc15' },
  { from:  72, to:  36, color: '#a3e635' },
  { from:  36, to:   0, color: '#22c55e' },
]

function toRad(deg: number) { return (deg * Math.PI) / 180 }
function f(n: number) { return n.toFixed(2) }

function pxy(deg: number, r: number) {
  return {
    x: CX + r * Math.cos(toRad(deg)),
    y: CY - r * Math.sin(toRad(deg)),
  }
}

function segPath(from: number, to: number) {
  const GAP = 1.5
  const a = from - GAP / 2
  const b = to   + GAP / 2
  const os = pxy(a, R_OUTER), oe = pxy(b, R_OUTER)
  const ie = pxy(b, R_INNER), is_ = pxy(a, R_INNER)
  return (
    `M${f(os.x)},${f(os.y)} ` +
    `A${R_OUTER},${R_OUTER} 0 0 0 ${f(oe.x)},${f(oe.y)} ` +
    `L${f(ie.x)},${f(ie.y)} ` +
    `A${R_INNER},${R_INNER} 0 0 1 ${f(is_.x)},${f(is_.y)}Z`
  )
}

// ── Single gauge ────────────────────────────────────────────────────────────
interface GaugeProps {
  label: string
  description: string
  value: number       // 0–1 normalised
  target: number      // 0–1 normalised
  currentText: string
  targetText: string
}

function Gauge({ label, description, value, target, currentText, targetText }: GaugeProps) {
  const clamped     = Math.min(1, Math.max(0, value))
  const needleAngle = 180 - clamped * 180          // 180° = bad (left), 0° = good (right)
  const targetAngle = 180 - Math.min(1, target) * 180
  const isGood      = value >= target

  const tOuter = pxy(targetAngle, R_OUTER + 5)
  const tInner = pxy(targetAngle, R_OUTER - 12)

  return (
    <div className="flex flex-col items-center">
      {/* Gauge SVG — viewBox crops just the upper half */}
      <svg viewBox="0 0 200 107" className="w-full max-w-[220px]" aria-hidden="true">
        <defs>
          <filter id="needle-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Coloured arc segments */}
        {SEGMENTS.map(s => (
          <path key={s.from} d={segPath(s.from, s.to)} fill={s.color} />
        ))}

        {/* Target tick (white marker on the arc) */}
        <line
          x1={f(tInner.x)} y1={f(tInner.y)}
          x2={f(tOuter.x)} y2={f(tOuter.y)}
          stroke="white" strokeWidth="3.5" strokeLinecap="round"
        />

        {/* Needle — drawn pointing right (0°), rotated to needleAngle */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${needleAngle}deg)`,
            transition: 'transform 0.65s cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
          filter="url(#needle-shadow)"
        >
          <polygon
            points={`${CX + R_NEEDLE},${CY} ${CX},${CY - 4.5} ${CX - 8},${CY} ${CX},${CY + 4.5}`}
            fill="#d1d5db"
          />
        </g>

        {/* Pivot circle */}
        <circle cx={CX} cy={CY} r="10" fill="#9ca3af" />
        <circle cx={CX} cy={CY} r="5.5" fill="white" />
      </svg>

      {/* Text below the gauge */}
      <p className={`text-xl font-bold tabular-nums leading-snug -mt-1 ${isGood ? 'text-green-600' : 'text-red-500'}`}>
        {currentText}
      </p>
      <p className="text-sm font-semibold text-gray-700 mt-0.5">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
      <p className="text-[11px] text-gray-400">
        Obiettivo: <span className="font-medium text-gray-500">{targetText}</span>
      </p>
    </div>
  )
}

// ── Panel ───────────────────────────────────────────────────────────────────
interface Props {
  coverage: number
  renewableShare: number
  avoidedMt: number
}

export function ObjectivesPanel({ coverage, renewableShare, avoidedMt }: Props) {
  const avoidedNorm   = Math.max(0, avoidedMt) / AVOIDED_MT_MAX
  const avoidedTarget = AVOIDED_MT_TARGET / AVOIDED_MT_MAX

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Obiettivi</h2>
      <div className="grid grid-cols-3 gap-6">
        <Gauge
          label="Sicurezza"
          description="Domanda complessivamente coperta"
          value={coverage}
          target={1}
          currentText={`${(coverage * 100).toFixed(1)}%`}
          targetText="100%"
        />
        <Gauge
          label="Rinnovabili"
          description="Quota elettricità da rinnovabili"
          value={renewableShare}
          target={RENEWABLE_TARGET}
          currentText={`${(renewableShare * 100).toFixed(1)}%`}
          targetText="65% — PNIEC 2030"
        />
        <Gauge
          label="Emissioni"
          description="CO₂ evitata rispetto al 2023"
          value={avoidedNorm}
          target={avoidedTarget}
          currentText={`${Math.max(0, avoidedMt).toFixed(1)} Mt`}
          targetText="50 Mt — EU 2030"
        />
      </div>
    </div>
  )
}
