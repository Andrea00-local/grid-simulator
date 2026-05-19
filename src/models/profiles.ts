/**
 * Normalized production profiles for Italy.
 *
 * Primary data: MONTHLY_PRODUCTIVITY — TWh produced per GW installed per month.
 * Source: Terna / GSE actual 2023 data.
 *
 * MONTHLY_CF and ANNUAL_CF are derived from MONTHLY_PRODUCTIVITY so that
 * older code (RegionDetail, balanceRegional, hourlyProfiles) keeps working
 * without changes. They use the balance.ts convention of 730 h/month uniformly.
 */
import type { Source } from './types'

// ─── Monthly productivity (TWh / GW / month) ──────────────────────────────────
// Values from Terna 2023 statistics.  Hydro = run-of-river + reservoir combined.
// wind_onshore / wind_offshore have separate productivity tables.
// Biomass is NOT here — it is treated as a dispatchable source in balance.ts.
export const MONTHLY_PRODUCTIVITY: Record<'solar' | 'wind' | 'wind_onshore' | 'wind_offshore' | 'hydro' | 'geothermal', number[]> = {
  //                  Gen   Feb   Mar   Apr   Mag   Giu   Lug   Ago   Set   Ott   Nov   Dic
  solar:         [0.044, 0.065, 0.098, 0.109, 0.109, 0.131, 0.141, 0.131, 0.109, 0.076, 0.054, 0.044],
  wind:          [0.19, 0.15, 0.21, 0.18, 0.13, 0.08, 0.11, 0.14, 0.14, 0.15, 0.24, 0.24],
  wind_onshore:  [0.19, 0.15, 0.21, 0.18, 0.13, 0.08, 0.11, 0.14, 0.14, 0.15, 0.24, 0.24],
  wind_offshore: [0.26, 0.21, 0.29, 0.25, 0.17, 0.12, 0.15, 0.20, 0.19, 0.21, 0.34, 0.28],
  hydro:         [0.13, 0.11, 0.11, 0.11, 0.20, 0.23, 0.20, 0.19, 0.14, 0.14, 0.16, 0.14],
  geothermal:    [0.62, 0.62, 0.64, 0.64, 0.65, 0.63, 0.64, 0.64, 0.64, 0.65, 0.64, 0.64],
}

// ─── Derived: monthly capacity factors (for backward compat) ──────────────────
// Uses the 730 h/month convention consistent with balance.ts.
// hydro_run = hydro_reservoir = hydro.
const H = 730
export const MONTHLY_CF: Partial<Record<Source, number[]>> = {
  solar:           MONTHLY_PRODUCTIVITY.solar.map(p => p * 1000 / H),
  wind_onshore:    MONTHLY_PRODUCTIVITY.wind_onshore.map(p => p * 1000 / H),
  wind_offshore:   MONTHLY_PRODUCTIVITY.wind_offshore.map(p => p * 1000 / H),
  hydro_run:       MONTHLY_PRODUCTIVITY.hydro.map(p => p * 1000 / H),
  hydro_reservoir: MONTHLY_PRODUCTIVITY.hydro.map(p => p * 1000 / H),
  geothermal:      MONTHLY_PRODUCTIVITY.geothermal.map(p => p * 1000 / H),
  // biomass kept for ANNUAL_CF.biomass used by balanceRegional
  biomass: [
    0.526, 0.527, 0.529, 0.465, 0.465, 0.489,
    0.503, 0.499, 0.502, 0.448, 0.444, 0.453,
  ],
}

/** Annual capacity factors — average of monthly CFs (derived). */
export const ANNUAL_CF: Partial<Record<Source, number>> = Object.fromEntries(
  Object.entries(MONTHLY_CF).map(([src, months]) => [
    src,
    months.reduce((s, v) => s + v, 0) / 12,
  ])
) as Partial<Record<Source, number>>

// ─── Monthly demand factors ────────────────────────────────────────────────────
export const MONTHLY_DEMAND_FACTORS = [
  1.020, 0.972, 1.019, 0.960, 0.960, 0.996,
  1.167, 0.927, 1.016, 0.998, 0.985, 0.981,
]

// ─── Typical daily demand profile ─────────────────────────────────────────────
export const HOURLY_DEMAND_PROFILE = [
  0.72, 0.68, 0.65, 0.63, 0.62, 0.65,
  0.72, 0.84, 0.96, 1.04, 1.08, 1.10,
  1.10, 1.08, 1.06, 1.04, 1.02, 1.05,
  1.12, 1.14, 1.10, 1.02, 0.92, 0.80,
]

/** Typical daily solar generation profile (normalized, summer day). Used in Level 3. */
export const HOURLY_SOLAR_PROFILE = [
  0, 0, 0, 0, 0.01, 0.05,
  0.12, 0.25, 0.50, 0.73, 0.90, 1.00,
  1.00, 0.94, 0.80, 0.60, 0.38, 0.16,
  0.04, 0.01, 0, 0, 0, 0,
]

export const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
