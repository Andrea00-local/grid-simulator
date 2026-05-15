/**
 * Energy balance computation.
 *
 * Renewable production uses MONTHLY_PRODUCTIVITY (TWh / GW / month).
 * Hydro and wind are combined per the productivity table, then split back
 * by GW fraction to populate the per-source PeriodResult fields.
 *
 * Dispatchable sources (nuclear, thermal, imports, biomass) are allocated
 * proportionally to monthly residual demand (demand − renewable production).
 * The full annual budget is distributed without capping — months with high
 * residual receive more, but production is never truncated to fit the residual.
 * If all months are covered by renewables (totalResidual == 0), the budget
 * is spread equally across months.
 * Biomass is treated as dispatchable: its annual production is derived from
 * installed GW × annual capacity factor, then distributed monthly like
 * nuclear/gas/coal/imports.
 */
import type { Source, CapacityMap, PeriodResult } from './types'
import { MONTHLY_PRODUCTIVITY, ANNUAL_CF, MONTHLY_DEMAND_FACTORS, MONTH_LABELS } from './profiles'
import { HOURS_PER_YEAR } from './constants'

export const DIRECT_SOURCES: Source[] = [
  'nuclear', 'gas_ccgt', 'gas_ocgt', 'coal', 'imports',
]

const DEMAND_FACTOR_SUM = MONTHLY_DEMAND_FACTORS.reduce((s, v) => s + v, 0)

// Biomass annual CF (from old Terna data — used to convert GW → annual TWh)
const BIOMASS_ANNUAL_CF = ANNUAL_CF.biomass ?? 0.487

// ─── Annual ────────────────────────────────────────────────────────────────────

export function computeAnnualPeriod(
  renewableCapacity: CapacityMap,
  directProduction: CapacityMap,
  demandTWh: number,
  label = 'Annuale',
): PeriodResult {
  const demandMWh = demandTWh * 1_000_000
  const production: Partial<Record<Source, number>> = {}

  // Renewables: annual = sum of 12 monthly productivities × GW
  const solarGW      = renewableCapacity.solar            ?? 0
  const windOnGW     = renewableCapacity.wind_onshore     ?? 0
  const windOffGW    = renewableCapacity.wind_offshore    ?? 0
  const hydroRunGW   = renewableCapacity.hydro_run        ?? 0
  const hydroResGW   = renewableCapacity.hydro_reservoir  ?? 0
  const geoGW        = renewableCapacity.geothermal       ?? 0
  const totalWindGW  = windOnGW + windOffGW
  const totalHydroGW = hydroRunGW + hydroResGW

  const annualSolar   = MONTHLY_PRODUCTIVITY.solar.reduce((s, p) => s + p, 0)
  const annualWind    = MONTHLY_PRODUCTIVITY.wind.reduce((s, p) => s + p, 0)
  const annualHydro   = MONTHLY_PRODUCTIVITY.hydro.reduce((s, p) => s + p, 0)
  const annualGeo     = MONTHLY_PRODUCTIVITY.geothermal.reduce((s, p) => s + p, 0)

  production.solar            = solarGW   * annualSolar * 1_000_000
  production.wind_onshore     = totalWindGW  > 0 ? totalWindGW  * annualWind  * 1_000_000 * (windOnGW  / totalWindGW)  : 0
  production.wind_offshore    = totalWindGW  > 0 ? totalWindGW  * annualWind  * 1_000_000 * (windOffGW / totalWindGW)  : 0
  production.hydro_run        = totalHydroGW > 0 ? totalHydroGW * annualHydro * 1_000_000 * (hydroRunGW / totalHydroGW) : 0
  production.hydro_reservoir  = totalHydroGW > 0 ? totalHydroGW * annualHydro * 1_000_000 * (hydroResGW / totalHydroGW) : 0
  production.geothermal       = geoGW     * annualGeo  * 1_000_000

  // Biomass: annual production from GW × annual CF (treated as dispatchable at annual level)
  production.biomass = (renewableCapacity.biomass ?? 0) * BIOMASS_ANNUAL_CF * HOURS_PER_YEAR * 1_000

  // Direct dispatchable sources
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
  // ── Capacities ────────────────────────────────────────────────────────────────
  const solarGW      = renewableCapacity.solar            ?? 0
  const windOnGW     = renewableCapacity.wind_onshore     ?? 0
  const windOffGW    = renewableCapacity.wind_offshore    ?? 0
  const hydroRunGW   = renewableCapacity.hydro_run        ?? 0
  const hydroResGW   = renewableCapacity.hydro_reservoir  ?? 0
  const geoGW        = renewableCapacity.geothermal       ?? 0
  const totalWindGW  = windOnGW + windOffGW
  const totalHydroGW = hydroRunGW + hydroResGW

  const windOnFrac  = totalWindGW  > 0 ? windOnGW  / totalWindGW  : 0
  const windOffFrac = totalWindGW  > 0 ? windOffGW / totalWindGW  : 0
  const hydroRunFrac = totalHydroGW > 0 ? hydroRunGW / totalHydroGW : 0
  const hydroResFrac = totalHydroGW > 0 ? hydroResGW / totalHydroGW : 0

  // ── Step 1: renewable production per month (MWh) ──────────────────────────────
  // Formula: GW × productivity_TWh_per_GW × 1_000_000 MWh/TWh
  const renewByMonth: number[] = MONTH_LABELS.map((_, m) => {
    const solar = solarGW      * MONTHLY_PRODUCTIVITY.solar[m]      * 1_000_000
    const wind  = totalWindGW  * MONTHLY_PRODUCTIVITY.wind[m]       * 1_000_000
    const hydro = totalHydroGW * MONTHLY_PRODUCTIVITY.hydro[m]      * 1_000_000
    const geo   = geoGW        * MONTHLY_PRODUCTIVITY.geothermal[m] * 1_000_000
    return solar + wind + hydro + geo
  })

  // ── Step 2: monthly demand ─────────────────────────────────────────────────────
  const demandByMonth: number[] = MONTH_LABELS.map((_, m) =>
    demandTWh * 1_000_000 * (MONTHLY_DEMAND_FACTORS[m] / DEMAND_FACTOR_SUM),
  )

  // ── Step 3: residual demand after renewables ──────────────────────────────────
  const residualByMonth = demandByMonth.map((d, m) => Math.max(0, d - renewByMonth[m]))
  const totalResidual   = residualByMonth.reduce((s, v) => s + v, 0)

  // ── Step 4: dispatchable pool — DIRECT_SOURCES + biomass ─────────────────────
  const biomassAnnualMWh = (renewableCapacity.biomass ?? 0) * BIOMASS_ANNUAL_CF * HOURS_PER_YEAR * 1_000
  const totalDispatchableMWh = DIRECT_SOURCES.reduce(
    (s, src) => s + (directProduction[src] ?? 0) * 1_000_000,
    0,
  ) + biomassAnnualMWh

  // ── Step 5: monthly dispatchable budget — proportional to residual, uncapped ───
  // Full annual thermal is distributed proportionally; if renewables cover all
  // demand every month (totalResidual == 0), split equally across months.
  const thermalBudget: number[] = residualByMonth.map((res) => {
    if (totalResidual <= 0) return totalDispatchableMWh / 12
    return totalDispatchableMWh * (res / totalResidual)
  })

  // ── Step 6: share of budget per source ────────────────────────────────────────
  const shareBySrc: Partial<Record<Source | 'biomass', number>> = {}
  if (totalDispatchableMWh > 0) {
    for (const src of DIRECT_SOURCES) {
      shareBySrc[src] = ((directProduction[src] ?? 0) * 1_000_000) / totalDispatchableMWh
    }
    shareBySrc['biomass'] = biomassAnnualMWh / totalDispatchableMWh
  }

  // ── Step 7: assemble PeriodResult for each month ──────────────────────────────
  return MONTH_LABELS.map((label, m) => {
    const production: Partial<Record<Source, number>> = {}
    const budget = thermalBudget[m]

    // Renewables (split combined wind/hydro by GW fraction)
    const windMWh  = totalWindGW  * MONTHLY_PRODUCTIVITY.wind[m]       * 1_000_000
    const hydroMWh = totalHydroGW * MONTHLY_PRODUCTIVITY.hydro[m]      * 1_000_000
    production.solar           = solarGW * MONTHLY_PRODUCTIVITY.solar[m]      * 1_000_000
    production.wind_onshore    = windMWh  * windOnFrac
    production.wind_offshore   = windMWh  * windOffFrac
    production.hydro_run       = hydroMWh * hydroRunFrac
    production.hydro_reservoir = hydroMWh * hydroResFrac
    production.geothermal      = geoGW    * MONTHLY_PRODUCTIVITY.geothermal[m] * 1_000_000

    // Dispatchable sources (including biomass)
    for (const src of DIRECT_SOURCES) {
      production[src] = budget * (shareBySrc[src] ?? 0)
    }
    production.biomass = budget * (shareBySrc['biomass'] ?? 0)

    const totalProduction = Object.values(production).reduce((s, v) => s + v, 0)
    const balance = totalProduction - demandByMonth[m]

    return {
      label,
      production: production as Record<Source, number>,
      demand: demandByMonth[m],
      balance,
      curtailment: Math.max(0, balance),
      emissions: 0,
    }
  })
}
