/**
 * Simple merit-order dispatch for a single time period.
 *
 * Given:
 *  - must-run production (renewables + geothermal at their CF)
 *  - residual demand = demand - must-run
 *  - dispatchable sources in merit order with max energy available
 *
 * Returns dispatched energy (MWh) per source.
 */
import type { Source, CapacityMap } from './types'
import { MERIT_ORDER } from './sources'
import { HOURS_PER_YEAR } from './constants'

/** Max capacity factor allowed for each dispatchable source */
const DISPATCHABLE_MAX_CF: Partial<Record<Source, number>> = {
  hydro_reservoir: 0.45,
  biomass:         0.75,
  gas_ccgt:        0.88,
  gas_ocgt:        0.60,
  coal:            0.85,
  imports:         0.90,
}

/**
 * Dispatches dispatchable sources to cover residual demand.
 * @param residualMWh  Demand left after must-run (MWh over the period)
 * @param capacity     Installed capacity (GW)
 * @param hoursInPeriod  Hours in this time period
 * @returns MWh dispatched per source
 */
export function dispatch(
  residualMWh: number,
  capacity: CapacityMap,
  hoursInPeriod: number = HOURS_PER_YEAR,
): Record<Source, number> {
  const result: Partial<Record<Source, number>> = {}
  let remaining = Math.max(0, residualMWh)

  for (const src of MERIT_ORDER) {
    const cap = capacity[src] ?? 0
    const maxCf = DISPATCHABLE_MAX_CF[src] ?? 0.85
    const maxEnergy = cap * 1000 * maxCf * hoursInPeriod  // GW → MW, then MWh
    const dispatched = Math.min(remaining, maxEnergy)
    result[src] = dispatched
    remaining -= dispatched
  }

  return result as Record<Source, number>
}
