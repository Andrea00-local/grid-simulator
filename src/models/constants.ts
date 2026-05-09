import type { Source } from './types'

/** gCO₂/kWh — operational emissions (combustion only, no lifecycle) */
export const EMISSION_FACTORS: Record<Source, number> = {
  solar:            0,
  wind_onshore:     0,
  wind_offshore:    0,
  hydro_run:        0,
  hydro_reservoir:  0,
  biomass:          230,   // debated, but counts per EU taxonomy
  geothermal:       38,
  nuclear:          0,     // operational (no combustion); lifecycle ~12 gCO₂/kWh
  gas_ccgt:         370,
  gas_ocgt:         550,
  coal:             820,
  imports:          200,   // rough EU mix average
}

/** Hours in a year */
export const HOURS_PER_YEAR = 8_760

/** Italy national electricity demand 2023 (TWh) */
export const ITALY_DEMAND_TWH = 280

/** Italy 2023 CO₂ baseline from power sector (MtCO₂) */
export const ITALY_CO2_BASELINE_MT = 82

/** Net-zero target for power sector (MtCO₂) */
export const NET_ZERO_TARGET_MT = 0
