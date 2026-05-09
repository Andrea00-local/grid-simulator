/**
 * Level 3 hourly simulation.
 *
 * Dispatch order (bottom → top):
 *   nuclear, coal, imports, biomass, geothermal (flat baseload)
 *   hydro_run (flat per month)
 *   hydro_reservoir (demand-following shape)
 *   wind, solar (scenario-scaled hourly profile)
 *   gas_ccgt (fills residual demand, up to daily budget)
 *   battery (fills remaining deficit / absorbs curtailment)
 *
 * Battery: Tesla MegaPack ratio (2.5 h duration).
 * Efficiency: 95% charge and 95% discharge (90.25% round-trip).
 * Starting SOC: 0 (conservative — fresh start each simulated day).
 *
 * Annual aggregation: typical-day result × days per month × 12 months.
 */
import type { Source, CapacityMap, HourlyPoint, DailySimResult, Level3Result, Scenario } from './types'
import { MONTHLY_CF, HOURLY_DEMAND_PROFILE, MONTH_LABELS, MONTHLY_DEMAND_FACTORS } from './profiles'
import { EMISSION_FACTORS } from './constants'
import {
  DAYS_PER_MONTH, SCENARIO_MULT, MEGAPACK_HOURS,
  HOURLY_SOLAR_CF,
  windHourlyCF, hydroRunHourlyCF, hydroReservoirHourlyCF,
} from './hourlyProfiles'

const DEMAND_PROFILE_SUM = HOURLY_DEMAND_PROFILE.reduce((a, b) => a + b, 0)
const MONTHLY_DEMAND_FACTOR_SUM = MONTHLY_DEMAND_FACTORS.reduce((a, b) => a + b, 0)

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

  const months: DailySimResult[] = Array.from({ length: 12 }, (_, m) =>
    computeMonth(m, renewableCapacity, directProduction, demandTWh, scenario, storagePowerMWh, storageCapacityMWh),
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
  directProduction: CapacityMap,
  demandTWh: number,
  scenario: Scenario,
  storagePowerMWh: number,
  storageCapacityMWh: number,
): DailySimResult {
  const monthFrac = MONTHLY_DEMAND_FACTORS[m] / MONTHLY_DEMAND_FACTOR_SUM
  const dailyDemand = (demandTWh * 1e6 * monthFrac) / DAYS_PER_MONTH[m]

  // Daily gas budget (allocated proportionally to demand like Level 2)
  let gasRemaining = ((directProduction.gas_ccgt ?? 0) * 1e6 * monthFrac) / DAYS_PER_MONTH[m]

  // Flat baseload: nuclear, coal, imports (direct TWh → hourly MWh)
  const nuclearH = ((directProduction.nuclear ?? 0) * 1e6 * monthFrac) / DAYS_PER_MONTH[m] / 24
  const coalH    = ((directProduction.coal    ?? 0) * 1e6 * monthFrac) / DAYS_PER_MONTH[m] / 24
  const importsH = ((directProduction.imports ?? 0) * 1e6 * monthFrac) / DAYS_PER_MONTH[m] / 24

  // Flat baseload: biomass and geothermal (GW × monthly CF × 1000 = MWh/h)
  const biomassH    = (renewableCapacity.biomass    ?? 0) * (MONTHLY_CF.biomass?.[m]    ?? 0.6)   * 1_000
  const geothermalH = (renewableCapacity.geothermal ?? 0) * (MONTHLY_CF.geothermal?.[m] ?? 0.855) * 1_000

  // Scenario multipliers
  const scenSolar = SCENARIO_MULT.solar[scenario]
  const scenWind  = SCENARIO_MULT.wind[scenario]
  const scenHydro = SCENARIO_MULT.hydro[scenario]

  // Pre-compute hourly CF arrays (avoid recomputing inside loop)
  const solarCF    = HOURLY_SOLAR_CF[m]
  const windOnCF   = windHourlyCF('wind_onshore',  m)
  const windOffCF  = windHourlyCF('wind_offshore', m)
  const hydroRunCF = hydroRunHourlyCF(m)
  const hydroResCF = hydroReservoirHourlyCF(m)

  const solarGW    = renewableCapacity.solar            ?? 0
  const windOnGW   = renewableCapacity.wind_onshore     ?? 0
  const windOffGW  = renewableCapacity.wind_offshore    ?? 0
  const hydroRunGW = renewableCapacity.hydro_run        ?? 0
  const hydroResGW = renewableCapacity.hydro_reservoir  ?? 0

  let soc = 0  // battery starts empty
  const hours: HourlyPoint[] = []

  for (let h = 0; h < 24; h++) {
    const demand = (dailyDemand * HOURLY_DEMAND_PROFILE[h]) / DEMAND_PROFILE_SUM

    // Renewable production (MWh)
    const solarMWh    = solarGW    * solarCF[h]    * scenSolar * 1_000
    const windOnMWh   = windOnGW   * windOnCF[h]   * scenWind  * 1_000
    const windOffMWh  = windOffGW  * windOffCF[h]  * scenWind  * 1_000
    const hydroRunMWh = hydroRunGW * hydroRunCF[h] * scenHydro * 1_000
    const hydroResMWh = hydroResGW * hydroResCF[h] * scenHydro * 1_000

    const fixedMWh = solarMWh + windOnMWh + windOffMWh + hydroRunMWh + hydroResMWh
      + biomassH + geothermalH + nuclearH + coalH + importsH

    // Gas: fill residual demand up to daily budget
    const needGas = Math.max(0, demand - fixedMWh)
    const gasH = Math.min(needGas, gasRemaining)
    gasRemaining -= gasH

    const totalProd = fixedMWh + gasH
    const net = totalProd - demand

    // Battery dispatch
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
        hydro_run:       hydroRunMWh,
        hydro_reservoir: hydroResMWh,
        biomass:         biomassH,
        geothermal:      geothermalH,
        nuclear:         nuclearH,
        gas_ccgt:        gasH,
        gas_ocgt:        0,
        coal:            coalH,
        imports:         importsH,
      },
      batteryDischarge,
      batteryCharge,
      batterySOC: soc,
      demand,
      deficit,
      curtailment,
    })
  }

  // ── Daily aggregates ──
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
