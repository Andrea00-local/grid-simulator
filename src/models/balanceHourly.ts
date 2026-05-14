/**
 * Level 3 hourly simulation.
 *
 * Dispatch logic (two-pass per day):
 *   Pass 0 — derive per-source monthly MWh using Level 2 logic (matches monthly chart).
 *   Pass 1 — compute renewable production per hour:
 *     solar, wind, hydro (real Terna profiles), geothermal (flat CF)
 *   Pass 2 — allocate dispatchable sources proportionally to hourly residual demand:
 *     daily budget = Level 2 monthly allocation / days_in_month
 *     each hour gets: budget × residual[h] / Σresidual
 *
 * Residual[h] = max(0, demand[h] − renewables[h]).
 * If residual is zero in all hours, budget is split evenly (edge case).
 *
 * Battery absorbs hourly surplus and fills hourly deficit after dispatch.
 * Efficiency: 95% charge / 95% discharge (90.25% round-trip).
 * SOC starts at 0 each simulated day (conservative).
 *
 * Annual result = typical-day × days per month × 12.
 */
import type { Source, CapacityMap, HourlyPoint, DailySimResult, Level3Result, Scenario } from './types'
import { MONTH_LABELS } from './profiles'
import { EMISSION_FACTORS } from './constants'
import {
  DAYS_PER_MONTH, SCENARIO_MULT, MEGAPACK_HOURS, GEOTHERMAL_CF,
  SOLAR_PROFILE, HYDRO_PROFILE, WIND_PROFILE, windOffshoreScale,
  DEMAND_GWH_2023, DEMAND_BASELINE_TWH,
} from './hourlyProfiles'
import { computeMonthlyPeriods } from './balance'

const CHARGE_EFF = 0.95
const DISCHARGE_EFF = 0.95

const RENEW_SOURCES: Source[] = [
  'solar', 'wind_onshore', 'wind_offshore', 'hydro_run', 'hydro_reservoir',
  'biomass', 'geothermal', 'nuclear',
]

// ─── Public API ────────────────────────────────────────────────────────────────

export function computeLevel3(
  renewableCapacity: CapacityMap,
  directProduction: CapacityMap,
  demandTWh: number,
  scenario: Scenario,
  storagePowerGW: number,
): Level3Result {
  const storagePowerMWh = storagePowerGW * 1_000
  const storageCapacityMWh = storagePowerGW * MEGAPACK_HOURS * 1_000

  // Pass 0: monthly allocations from Level 2 (identical to monthly chart values)
  const monthlyPeriods = computeMonthlyPeriods(renewableCapacity, directProduction, demandTWh)

  const months: DailySimResult[] = Array.from({ length: 12 }, (_, m) =>
    computeMonth(m, renewableCapacity, demandTWh, scenario, storagePowerMWh, storageCapacityMWh, monthlyPeriods[m].production),
  )

  let annualDemandMWh = 0
  let annualDeficitMWh = 0
  let annualSurplusMWh = 0
  let annualBatteryCycledMWh = 0
  let annualEmissionsTonnes = 0
  let annualRenewMWh = 0
  let annualTotalMWh = 0

  for (let m = 0; m < 12; m++) {
    const d = months[m]
    const days = DAYS_PER_MONTH[m]
    annualDemandMWh        += d.dailyDemandMWh * days
    annualDeficitMWh       += d.dailyDeficitMWh * days
    annualSurplusMWh       += d.dailySurplusMWh * days
    annualBatteryCycledMWh += d.dailyBatteryCycledMWh * days
    annualEmissionsTonnes  += d.emissionsTonnes * days
    annualRenewMWh         += d.dailyRenewMWh * days
    annualTotalMWh         += d.dailyProductionMWh * days
  }

  return {
    months,
    annualDemandTWh:        annualDemandMWh / 1e6,
    annualDeficitTWh:       annualDeficitMWh / 1e6,
    annualSurplusTWh:       annualSurplusMWh / 1e6,
    annualBatteryCycledTWh: annualBatteryCycledMWh / 1e6,
    renewableShareAnnual:   annualTotalMWh > 0 ? annualRenewMWh / annualTotalMWh : 0,
    emissionsMtAnnual:      annualEmissionsTonnes / 1e6,
  }
}

// ─── Per-month computation ─────────────────────────────────────────────────────

function computeMonth(
  m: number,
  renewableCapacity: CapacityMap,
  demandTWh: number,
  scenario: Scenario,
  storagePowerMWh: number,
  storageCapacityMWh: number,
  monthlyProd: Record<Source, number>,
): DailySimResult {
  const demandScale = demandTWh / DEMAND_BASELINE_TWH

  // ── Capacities (only for sources with real hourly profiles) ───────────────────
  const solarGW      = renewableCapacity.solar            ?? 0
  const windOnGW     = renewableCapacity.wind_onshore     ?? 0
  const windOffGW    = renewableCapacity.wind_offshore    ?? 0
  const hydroRunGW   = renewableCapacity.hydro_run        ?? 0
  const hydroResGW   = renewableCapacity.hydro_reservoir  ?? 0
  const hydroTotalGW = hydroRunGW + hydroResGW
  const geoGW        = renewableCapacity.geothermal       ?? 0

  const hydroRunFrac = hydroTotalGW > 0 ? hydroRunGW / hydroTotalGW : 0
  const hydroResFrac = hydroTotalGW > 0 ? hydroResGW / hydroTotalGW : 0
  const offScale     = windOffshoreScale(m)

  // ── Scenario multipliers ───────────────────────────────────────────────────────
  const scenSolar = SCENARIO_MULT.solar[scenario]
  const scenWind  = SCENARIO_MULT.wind[scenario]
  const scenHydro = SCENARIO_MULT.hydro[scenario]

  // ── Daily budgets from Level 2 monthly allocations (MWh/day) ──────────────────
  const nuclearBudget  = (monthlyProd.nuclear  ?? 0) / DAYS_PER_MONTH[m]
  const coalBudget     = (monthlyProd.coal     ?? 0) / DAYS_PER_MONTH[m]
  const importsBudget  = (monthlyProd.imports  ?? 0) / DAYS_PER_MONTH[m]
  const gasCcgtBudget  = (monthlyProd.gas_ccgt ?? 0) / DAYS_PER_MONTH[m]
  const gasOcgtBudget  = (monthlyProd.gas_ocgt ?? 0) / DAYS_PER_MONTH[m]
  const biomassBudget  = (monthlyProd.biomass  ?? 0) / DAYS_PER_MONTH[m]

  // ── Pass 1: per-hour renewable output and residual demand ─────────────────────
  const renewH   = new Array<number>(24)
  const demandH  = new Array<number>(24)
  const residualH = new Array<number>(24)
  let totalResidual = 0

  for (let h = 0; h < 24; h++) {
    demandH[h] = DEMAND_GWH_2023[m][h] * demandScale * 1_000  // GWh → MWh

    const solarMWh   = solarGW      * SOLAR_PROFILE[m][h]   * scenSolar * 1_000
    const windOnMWh  = windOnGW     * WIND_PROFILE[m][h]    * scenWind  * 1_000
    const windOffMWh = windOffGW    * WIND_PROFILE[m][h]    * offScale  * scenWind * 1_000
    const hydroMWh   = hydroTotalGW * HYDRO_PROFILE[m][h]   * scenHydro * 1_000
    const geoMWh     = geoGW        * GEOTHERMAL_CF         * 1_000

    renewH[h] = solarMWh + windOnMWh + windOffMWh + hydroMWh + geoMWh
    residualH[h] = Math.max(0, demandH[h] - renewH[h])
    totalResidual += residualH[h]
  }

  // ── Pass 2: dispatch residual sources and battery ─────────────────────────────
  let soc = 0
  const hours: HourlyPoint[] = []

  for (let h = 0; h < 24; h++) {
    // Fraction of daily residual that falls in this hour
    const frac = totalResidual > 0 ? residualH[h] / totalResidual : 1 / 24

    const solarMWh   = solarGW      * SOLAR_PROFILE[m][h]   * scenSolar * 1_000
    const windOnMWh  = windOnGW     * WIND_PROFILE[m][h]    * scenWind  * 1_000
    const windOffMWh = windOffGW    * WIND_PROFILE[m][h]    * offScale  * scenWind * 1_000
    const hydroMWh   = hydroTotalGW * HYDRO_PROFILE[m][h]   * scenHydro * 1_000
    const geoMWh     = geoGW        * GEOTHERMAL_CF         * 1_000

    const nuclearH   = nuclearBudget  * frac
    const coalH      = coalBudget     * frac
    const importsH   = importsBudget  * frac
    const biomassH   = biomassBudget  * frac
    const gasCcgtH   = gasCcgtBudget  * frac
    const gasOcgtH   = gasOcgtBudget  * frac

    const totalProd = solarMWh + windOnMWh + windOffMWh + hydroMWh + geoMWh
      + nuclearH + coalH + importsH + biomassH + gasCcgtH + gasOcgtH
    const net = totalProd - demandH[h]

    // Battery: absorbs surplus, discharges on deficit
    let batteryDischarge = 0
    let batteryCharge = 0
    if (net > 0 && storageCapacityMWh > 0) {
      const charge = Math.min(net, storagePowerMWh, (storageCapacityMWh - soc) / CHARGE_EFF)
      batteryCharge = charge
      soc += charge * CHARGE_EFF
    } else if (net < 0 && storageCapacityMWh > 0) {
      const discharge = Math.min(-net, storagePowerMWh, soc * DISCHARGE_EFF)
      batteryDischarge = discharge
      soc -= discharge / DISCHARGE_EFF
    }

    const deficit     = Math.max(0, -net - batteryDischarge)
    const curtailment = Math.max(0,  net - batteryCharge)

    hours.push({
      hour: h,
      production: {
        solar:           solarMWh,
        wind_onshore:    windOnMWh,
        wind_offshore:   windOffMWh,
        hydro_run:       hydroMWh * hydroRunFrac,
        hydro_reservoir: hydroMWh * hydroResFrac,
        biomass:         biomassH,
        geothermal:      geoMWh,
        nuclear:         nuclearH,
        gas_ccgt:        gasCcgtH,
        gas_ocgt:        gasOcgtH,
        coal:            coalH,
        imports:         importsH,
      },
      batteryDischarge,
      batteryCharge,
      batterySOC: soc,
      demand:     demandH[h],
      deficit,
      curtailment,
    })
  }

  // ── Daily aggregates ───────────────────────────────────────────────────────────
  let dailyDemandMWh = 0
  let dailyDeficitMWh = 0
  let dailySurplusMWh = 0
  let dailyBatteryCycledMWh = 0
  let dailyRenewMWh = 0
  let dailyProdMWh = 0
  let emissionsTonnes = 0

  for (const hp of hours) {
    dailyDemandMWh        += hp.demand
    dailyDeficitMWh       += hp.deficit
    dailySurplusMWh       += hp.curtailment
    dailyBatteryCycledMWh += hp.batteryDischarge

    for (const src of RENEW_SOURCES) {
      dailyRenewMWh += hp.production[src]
    }
    dailyProdMWh += Object.values(hp.production).reduce((a, b) => a + b, 0)

    for (const [src, mwh] of Object.entries(hp.production) as [Source, number][]) {
      emissionsTonnes += (mwh * EMISSION_FACTORS[src]) / 1_000
    }
  }

  return {
    monthIndex: m,
    monthLabel: MONTH_LABELS[m],
    hours,
    dailyDemandMWh,
    dailyProductionMWh: dailyProdMWh,
    dailySurplusMWh,
    dailyDeficitMWh,
    dailyBatteryCycledMWh,
    dailyRenewMWh,
    renewableShareDay: dailyProdMWh > 0 ? dailyRenewMWh / dailyProdMWh : 0,
    emissionsTonnes,
  }
}
