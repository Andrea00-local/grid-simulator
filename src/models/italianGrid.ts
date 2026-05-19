/**
 * Italian grid scenarios — source: Terna, GSE, ENTSO-E, PNIEC 2023 update.
 * renewableCapacity: GW installed.
 * directProduction: TWh/year of direct production.
 * demandTWh: annual electricity demand.
 */
import type { CapacityMap } from './types'

export interface GridScenario {
  renewableCapacity: CapacityMap
  directProduction: CapacityMap
  demandTWh: number
  storagePowerGW?: number
}

export const ITALY_2023: GridScenario = {
  renewableCapacity: {
    solar:           30.3,
    wind_onshore:    12.3,
    wind_offshore:   0.0,
    hydro_run:       8.5,
    hydro_reservoir: 14.7,
    biomass:         4.1,
    geothermal:      0.8,
  },
  directProduction: {
    nuclear:  0,
    gas_ccgt: 121,
    gas_ocgt: 0,
    coal:     12,
    imports:  51,
  },
  demandTWh: 305.54,
}

export const PNIEC_2030: GridScenario = {
  renewableCapacity: {
    solar:           79.2,
    wind_onshore:    26.0,
    wind_offshore:   2.1,
    hydro_run:       8.5,
    hydro_reservoir: 14.7,
    biomass:         3.2,
    geothermal:      1.0,
  },
  directProduction: {
    nuclear:  0,
    gas_ccgt: 107,
    gas_ocgt: 0,
    coal:     0,
    imports:  43,
  },
  demandTWh: 359,
  storagePowerGW: 28.4,
}

export const NET_ZERO_2050: GridScenario = {
  renewableCapacity: {
    solar:           120.0,
    wind_onshore:    28.0,
    wind_offshore:   8.0,
    hydro_run:       8.2,
    hydro_reservoir: 14.5,
    biomass:         2.0,
    geothermal:      3.0,
  },
  directProduction: {
    nuclear:  57,
    gas_ccgt: 12,  // 8 + 4 merged
    gas_ocgt: 0,
    coal:     0,
    imports:  15,
  },
  demandTWh: 450,
}

export const FULL_RENEWABLE: GridScenario = {
  renewableCapacity: {
    solar:           90.0,
    wind_onshore:    35.0,
    wind_offshore:   6.0,
    hydro_run:       8.2,
    hydro_reservoir: 14.5,
    biomass:         1.5,
    geothermal:      3.5,
  },
  directProduction: {
    nuclear:  0,
    gas_ccgt: 18,  // 15 + 3
    gas_ocgt: 0,
    coal:     0,
    imports:  8,
  },
  demandTWh: 380,
}

// Legacy flat maps kept for backward compat (used nowhere else now)
export const ITALY_2023_CAPACITY = ITALY_2023.renewableCapacity
export const PNIEC_2030_CAPACITY = PNIEC_2030.renewableCapacity
export const NET_ZERO_2050_CAPACITY = NET_ZERO_2050.renewableCapacity
export const FULL_RENEWABLE_CAPACITY = FULL_RENEWABLE.renewableCapacity
