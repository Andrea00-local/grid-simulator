/**
 * Hourly profiles for Level 3 simulation.
 *
 * Solar: Gaussian curve per month (width = season daylight length).
 * Wind: slight night-peak shape, scaled by monthly CF.
 * Hydro-run: flat per month.
 * Hydro-reservoir: demand-following shape, scaled by own monthly CF.
 * All profiles scaled so that their 24-hour average equals the monthly CF.
 */
import type { Scenario } from './types'
import { MONTHLY_CF } from './profiles'

// ─── Tesla MegaPack ratio ──────────────────────────────────────────────────────
/** Energy-to-power ratio (hours). MegaPack 2: ~3.9 MWh / 1.5 MW ≈ 2.6 h → rounded 2.5 */
export const MEGAPACK_HOURS = 2.5

// ─── Calendar ─────────────────────────────────────────────────────────────────
export const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// ─── Scenario multipliers ─────────────────────────────────────────────────────
export const SCENARIO_MULT: Record<'solar' | 'wind' | 'hydro', Record<Scenario, number>> = {
  solar: { bad: 0.20, average: 1.0, good: 1.60 },
  wind:  { bad: 0.20, average: 1.0, good: 1.80 },
  hydro: { bad: 0.70, average: 1.0, good: 1.20 },
}

// ─── Solar ────────────────────────────────────────────────────────────────────
// Gaussian sigma (h) controls daylight width; wider in summer.
const SOLAR_PEAK_HOUR = 12.5
const SOLAR_SIGMA = [1.8, 2.0, 2.4, 2.7, 3.0, 3.2, 3.2, 3.0, 2.6, 2.2, 1.9, 1.7]

/** 12×24 matrix: hourly CF for solar in each month. Average over 24h = monthly CF. */
export const HOURLY_SOLAR_CF: number[][] = SOLAR_SIGMA.map((sigma, m) => {
  const cf = MONTHLY_CF.solar![m]
  const raw = Array.from({ length: 24 }, (_, h) =>
    Math.exp(-0.5 * ((h - SOLAR_PEAK_HOUR) / sigma) ** 2),
  )
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map(v => (v * cf * 24) / sum)
})

// ─── Wind ─────────────────────────────────────────────────────────────────────
// Slightly stronger at night (offshore thermal gradient), weaker at noon.
const WIND_SHAPE_RAW = [
  1.12, 1.15, 1.14, 1.10, 1.06, 1.03, 0.98, 0.93,
  0.89, 0.87, 0.85, 0.85, 0.87, 0.89, 0.91, 0.93,
  0.95, 0.98, 1.00, 1.03, 1.05, 1.07, 1.09, 1.11,
]
const WIND_SHAPE_SUM = WIND_SHAPE_RAW.reduce((a, b) => a + b, 0)
const WIND_SHAPE_NORM = WIND_SHAPE_RAW.map(v => (v * 24) / WIND_SHAPE_SUM) // avg = 1

/** Hourly CF array for wind (on/offshore) in month m. */
export function windHourlyCF(
  src: 'wind_onshore' | 'wind_offshore',
  m: number,
): number[] {
  const cf = MONTHLY_CF[src]![m]
  return WIND_SHAPE_NORM.map(v => v * cf)
}

// ─── Hydro run-of-river ───────────────────────────────────────────────────────
/** Flat hourly CF for hydro_run in month m. */
export function hydroRunHourlyCF(m: number): number[] {
  const cf = MONTHLY_CF.hydro_run![m]
  return Array(24).fill(cf)
}

// ─── Hydro reservoir ──────────────────────────────────────────────────────────
// Monthly CFs for reservoir hydro (not in profiles.ts — defined here).
// Higher in spring (snowmelt), managed for winter demand peaks, lower in late summer.
export const HYDRO_RESERVOIR_MONTHLY_CF = [
  0.30, 0.30, 0.38, 0.45, 0.48, 0.40,
  0.30, 0.25, 0.27, 0.32, 0.35, 0.38,
]

// Dispatch-following shape: peaks with morning and evening demand.
const HYDRO_RES_SHAPE_RAW = [
  0.70, 0.68, 0.67, 0.67, 0.68, 0.72, 0.80, 0.92,
  1.02, 1.08, 1.10, 1.05, 0.98, 0.95, 0.95, 0.97,
  1.00, 1.05, 1.12, 1.15, 1.12, 1.06, 0.93, 0.80,
]
const HYDRO_RES_SHAPE_SUM = HYDRO_RES_SHAPE_RAW.reduce((a, b) => a + b, 0)
const HYDRO_RES_SHAPE_NORM = HYDRO_RES_SHAPE_RAW.map(v => (v * 24) / HYDRO_RES_SHAPE_SUM)

/** Hourly CF array for hydro_reservoir in month m. */
export function hydroReservoirHourlyCF(m: number): number[] {
  const cf = HYDRO_RESERVOIR_MONTHLY_CF[m]
  return HYDRO_RES_SHAPE_NORM.map(v => v * cf)
}
