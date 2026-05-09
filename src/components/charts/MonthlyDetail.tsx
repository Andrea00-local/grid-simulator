import type { PeriodResult, Source } from '@/models/types'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { SOURCE_ORDER } from '@/models/sources'

interface Props {
  period: PeriodResult
}

export function MonthlyDetail({ period }: Props) {
  const prodTWh = Object.fromEntries(
    Object.entries(period.production).map(([k, v]) => [k, v / 1_000_000])
  ) as Record<Source, number>

  const demandTWh = period.demand / 1_000_000
  const balanceTWh = period.balance / 1_000_000
  const isSurplus = balanceTWh >= 0
  const totalProd = Object.values(prodTWh).reduce((s, v) => s + v, 0)

  const visibleSources = SOURCE_ORDER.filter((src) => (prodTWh[src] ?? 0) > 0.01).reverse()

  return (
    <div className="space-y-4">
      {/* Balance banner */}
      <div className={`rounded-xl p-4 border ${isSurplus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1 ${isSurplus ? 'text-green-600' : 'text-red-500'}">
          {isSurplus ? 'Surplus' : 'Deficit'}
        </p>
        <div className={`text-2xl font-bold tabular-nums ${isSurplus ? 'text-green-700' : 'text-red-600'}`}>
          {isSurplus ? '+' : ''}{balanceTWh.toFixed(1)}{' '}
          <span className="text-base font-normal">TWh</span>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span>Produzione: <strong className="text-gray-700">{totalProd.toFixed(1)} TWh</strong></span>
          <span>Domanda: <strong className="text-gray-700">{demandTWh.toFixed(1)} TWh</strong></span>
        </div>
      </div>

      {/* Production breakdown */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Produzione per fonte</p>
        <div className="space-y-1.5">
          {visibleSources.map((src) => {
            const twh = prodTWh[src] ?? 0
            const pct = totalProd > 0 ? (twh / totalProd) * 100 : 0
            return (
              <div key={src}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_DEFINITIONS[src].color }} />
                    <span className="text-gray-600">{SOURCE_DEFINITIONS[src].label}</span>
                  </div>
                  <span className="font-mono text-gray-900">{twh.toFixed(1)} TWh</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: SOURCE_DEFINITIONS[src].color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Emissions */}
      <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
        Emissioni CO₂:{' '}
        <strong className="text-gray-700">
          {(period.emissions / 1_000_000).toFixed(1)} MtCO₂
        </strong>
      </div>
    </div>
  )
}
