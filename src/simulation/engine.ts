import type { SimConfig } from './types'
import type { SimResult, Source } from '@/models/types'
import { computeAnnualPeriod, computeMonthlyPeriods } from '@/models/balance'
import { computeEmissions, toMtCO2 } from '@/models/emissions'
import { RENEWABLE_SOURCES } from '@/models/sources'

export function run(config: SimConfig): SimResult {
  const periods =
    config.resolution === 'annual'
      ? [computeAnnualPeriod(config.renewableCapacity, config.directProduction, config.demandTWh)]
      : computeMonthlyPeriods(config.renewableCapacity, config.directProduction, config.demandTWh)

  periods.forEach(computeEmissions)

  const totalProductionBySource: Partial<Record<Source, number>> = {}
  let totalDemand      = 0
  let totalEmissions   = 0
  let totalSurplusMWh  = 0
  let totalDeficitMWh  = 0

  for (const p of periods) {
    totalDemand    += p.demand
    totalEmissions += p.emissions
    if (p.balance >= 0) totalSurplusMWh += p.balance
    else                totalDeficitMWh += -p.balance

    for (const [src, mwh] of Object.entries(p.production) as [Source, number][]) {
      totalProductionBySource[src] = (totalProductionBySource[src] ?? 0) + mwh
    }
  }

  const renewableMWh = RENEWABLE_SOURCES.reduce(
    (s, src) => s + (totalProductionBySource[src] ?? 0),
    0,
  )
  const totalProduction = Object.values(totalProductionBySource).reduce((s, v) => s + v, 0)

  return {
    periods,
    totalProductionBySource: totalProductionBySource as Record<Source, number>,
    totalDemand,
    totalEmissionsMt:  toMtCO2(totalEmissions),
    renewableShare:    totalProduction > 0 ? renewableMWh / totalProduction : 0,
    totalBalance:      totalProduction - totalDemand,
    totalSurplusMWh,
    totalDeficitMWh,
  }
}
