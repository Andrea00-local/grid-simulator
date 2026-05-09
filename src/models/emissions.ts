import type { Source, PeriodResult } from './types'
import { EMISSION_FACTORS } from './constants'

/**
 * Annotates emissions on a PeriodResult (in-place mutation for perf).
 * Returns tCO₂ for the period.
 */
export function computeEmissions(period: PeriodResult): number {
  let tCO2 = 0
  for (const [src, mwh] of Object.entries(period.production) as [Source, number][]) {
    const gCO2perKWh = EMISSION_FACTORS[src] ?? 0
    // MWh * 1000 kWh/MWh * gCO2/kWh / 1_000_000 = tCO2
    tCO2 += mwh * 1000 * gCO2perKWh / 1_000_000
  }
  period.emissions = tCO2
  return tCO2
}

/** Convert tCO₂ to MtCO₂ */
export function toMtCO2(tCO2: number): number {
  return tCO2 / 1_000_000
}
