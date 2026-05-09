/**
 * Energy balance computation.
 *
 * Renewables produce at their capacity factor (GW × CF × hours).
 * Nuclear, thermal, imports are set directly as TWh — no fixed dispatch.
 *
 * Monthly dispatch rule:
 *   - Distribute thermal proportionally to residual demand (demand − renewable).
 *   - Cap each month at its residual: thermal never creates a monthly surplus.
 *   - If total thermal > total residual, the excess cannot be deployed.
 */
import type { Source, CapacityMap, PeriodResult } from './types'
import { ANNUAL_CF, MONTHLY_CF, MONTHLY_DEMAND_FACTORS, MONTH_LABELS } from './profiles'
import { HOURS_PER_YEAR } from './constants'

const RENEWABLE_CF_SOURCES: Source[] = [
  'solar', 'wind_onshore', 'wind_offshore',
  'hydro_run', 'hydro_reservoir',
  'geothermal', 'biomass',
]

export const DIRECT_SOURCES: Source[] = [
  'nuclear', 'gas_ccgt', 'gas_ocgt', 'coal', 'imports',
]

const DEMAND_FACTOR_SUM = MONTHLY_DEMAND_FACTORS.reduce((s, v) => s + v, 0)

// ─── Annual ────────────────────────────────────────────────────────────────────

export function computeAnnualPeriod(
  renewableCapacity: CapacityMap,
  directProduction: CapacityMap,
  demandTWh: number,
  label = 'Annuale',
): PeriodResult {
  const demandMWh = demandTWh * 1_000_000
  const production: Partial<Record<Source, number>> = {}

  for (const src of RENEWABLE_CF_SOURCES) {
    const gw = renewableCapacity[src] ?? 0
    const cf = ANNUAL_CF[src] ?? 0
    production[src] = gw * cf * HOURS_PER_YEAR * 1_000
  }

  for (const src of DIRECT_SOURCES) {
    production[src] = (directProduction[src] ?? 0) * 1_000_000
  }

  const totalProduction = Object.values(production).reduce((s, v) => s + v, 0)
  const balance = totalProduction - demandMWh

  return {
    label,
    production: production as Record<Source, number>,
    demand: demandMWh,
    balance,
    curtailment: Math.max(0, balance),
    emissions: 0,
  }
}

// ─── Monthly ───────────────────────────────────────────────────────────────────

export function computeMonthlyPeriods(
  renewableCapacity: CapacityMap,
  directProduction: CapacityMap,
  demandTWh: number,
): PeriodResult[] {
  const hours = HOURS_PER_YEAR / 12  // ≈ 730 h/month

  // Step 1: compute renewable production and demand for each month
  const renewByMonth: number[] = MONTH_LABELS.map((_, i) => {
    let mwh = 0
    for (const src of RENEWABLE_CF_SOURCES) {
      const gw = renewableCapacity[src] ?? 0
      const cf = MONTHLY_CF[src]?.[i] ?? (ANNUAL_CF[src] ?? 0)
      mwh += gw * cf * hours * 1_000
    }
    return mwh
  })

  const demandByMonth: number[] = MONTH_LABELS.map((_, i) =>
    demandTWh * 1_000_000 * (MONTHLY_DEMAND_FACTORS[i] / DEMAND_FACTOR_SUM),
  )

  // Step 2: residual demand after renewables (floor 0 — no negative residual)
  const residualByMonth = demandByMonth.map((d, i) => Math.max(0, d - renewByMonth[i]))
  const totalResidual = residualByMonth.reduce((s, v) => s + v, 0)

  // Step 3: total thermal available (MWh)
  const totalThermalMWh = DIRECT_SOURCES.reduce(
    (s, src) => s + (directProduction[src] ?? 0) * 1_000_000,
    0,
  )

  // Step 4: thermal budget per month — proportional to residual, capped at residual
  const thermalBudget: number[] = residualByMonth.map((res) => {
    if (totalResidual <= 0) return 0
    const proportional = totalThermalMWh * (res / totalResidual)
    return Math.min(proportional, res)  // never create thermal-induced surplus
  })

  // Step 5: within each month, split budget across sources by annual share
  const thermalShareBySrc: Partial<Record<Source, number>> = {}
  if (totalThermalMWh > 0) {
    for (const src of DIRECT_SOURCES) {
      thermalShareBySrc[src] = ((directProduction[src] ?? 0) * 1_000_000) / totalThermalMWh
    }
  }

  // Step 6: assemble PeriodResult for each month
  return MONTH_LABELS.map((label, i) => {
    const production: Partial<Record<Source, number>> = {}

    for (const src of RENEWABLE_CF_SOURCES) {
      const gw = renewableCapacity[src] ?? 0
      const cf = MONTHLY_CF[src]?.[i] ?? (ANNUAL_CF[src] ?? 0)
      production[src] = gw * cf * hours * 1_000
    }

    for (const src of DIRECT_SOURCES) {
      production[src] = thermalBudget[i] * (thermalShareBySrc[src] ?? 0)
    }

    const totalProduction = Object.values(production).reduce((s, v) => s + v, 0)
    const balance = totalProduction - demandByMonth[i]

    return {
      label,
      production: production as Record<Source, number>,
      demand: demandByMonth[i],
      balance,
      // Curtailment = renewable surplus (thermal can't cause it by design)
      curtailment: Math.max(0, renewByMonth[i] - demandByMonth[i]),
      emissions: 0,
    }
  })
}
