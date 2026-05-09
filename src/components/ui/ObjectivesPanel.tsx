import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

/** EU/PNIEC 2030 electricity renewable target */
const RENEWABLE_TARGET = 0.65
/** ~62% cut of Italy 2023 baseline (82 Mt), aligned with EU Fit for 55 power sector */
const AVOIDED_MT_TARGET = 50
const AVOIDED_MT_MAX = ITALY_CO2_BASELINE_MT

interface GoalBarProps {
  label: string
  description: string
  current: number
  target: number
  max: number
  formatCurrent: (v: number) => string
  formatTarget: string
}

function GoalBar({ label, description, current, target, max, formatCurrent, formatTarget }: GoalBarProps) {
  const fillPct = Math.min(100, Math.max(0, (current / max) * 100))
  const targetPct = Math.min(99.5, (target / max) * 100)
  const isGood = current >= target

  return (
    <div className="pb-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          <span className="text-xs text-gray-400">{description}</span>
        </div>
        <span className={`text-sm font-bold tabular-nums ${isGood ? 'text-green-600' : 'text-red-500'}`}>
          {formatCurrent(current)}
        </span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full">
        {/* Clipped fill bar */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isGood ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        {/* Target marker (escapes the clip) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-px w-px h-5 bg-gray-500 z-10"
          style={{ left: `${targetPct}%` }}
        >
          <span className="absolute top-full mt-1 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap font-medium">
            {formatTarget}
          </span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  /** 0–1: fraction of demand that is covered */
  coverage: number
  /** 0–1: share of electricity from renewables */
  renewableShare: number
  /** Mt CO₂ avoided relative to Italy 2023 baseline */
  avoidedMt: number
}

export function ObjectivesPanel({ coverage, renewableShare, avoidedMt }: Props) {
  const avoidedClamped = Math.max(0, avoidedMt)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Obiettivi</h2>
      <GoalBar
        label="Sicurezza"
        description="Domanda complessivamente coperta"
        current={coverage}
        target={1}
        max={1}
        formatCurrent={(v) => `${(v * 100).toFixed(1)}%`}
        formatTarget="100%"
      />
      <GoalBar
        label="Rinnovabili"
        description="Quota elettricità da fonti rinnovabili"
        current={renewableShare}
        target={RENEWABLE_TARGET}
        max={1}
        formatCurrent={(v) => `${(v * 100).toFixed(1)}%`}
        formatTarget="65% — PNIEC 2030"
      />
      <GoalBar
        label="Emissioni"
        description="CO₂ evitata rispetto al 2023"
        current={avoidedClamped}
        target={AVOIDED_MT_TARGET}
        max={AVOIDED_MT_MAX}
        formatCurrent={(v) => `${v.toFixed(1)} Mt evitate`}
        formatTarget="50 Mt — EU 2030"
      />
    </div>
  )
}
