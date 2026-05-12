/**
 * Normalized production profiles for Italy.
 *
 * Monthly profiles: index 0 = January … 11 = December.
 * Values are actual capacity factors (0–1).
 * Source: Terna statistical data, ENTSO-E, GSE Rapporto Statistico FER.
 *
 * Hourly profiles: index 0 = 00:00 … 23 = 23:00.
 * Values are normalized to annual CF (annual_CF * hourly_factor = hourly CF).
 * Used for Level 3.
 */
import type { Source } from './types'

// ─── Monthly capacity factors ──────────────────────────────────────────────────
export const MONTHLY_CF: Partial<Record<Source, number[]>> = {
  solar: [
    0.053, 0.090, 0.129, 0.144, 0.155, 0.176,  // Gen–Giu
    0.174, 0.166, 0.139, 0.101, 0.065, 0.057,  // Lug–Dic
  ],
  wind_onshore: [
    0.282, 0.224, 0.252, 0.220, 0.204, 0.118,  // Gen–Giu
    0.158, 0.182, 0.155, 0.203, 0.277, 0.304,  // Lug–Dic
  ],
  wind_offshore: [
    0.320, 0.300, 0.280, 0.250, 0.220, 0.180,
    0.170, 0.180, 0.210, 0.255, 0.295, 0.330,
  ],
  hydro_run: [
    0.171, 0.165, 0.145, 0.150, 0.274, 0.321,  // Gen–Giu
    0.275, 0.251, 0.198, 0.186, 0.219, 0.184,  // Lug–Dic
  ],
  hydro_reservoir: [
    0.171, 0.165, 0.145, 0.150, 0.274, 0.321,  // Gen–Giu
    0.275, 0.251, 0.198, 0.186, 0.219, 0.184,  // Lug–Dic
  ],
  geothermal: [
    0.827, 0.834, 0.821, 0.834, 0.830, 0.826,  // Gen–Giu
    0.822, 0.808, 0.836, 0.837, 0.826, 0.830,  // Lug–Dic
  ],
  biomass: [
    0.526, 0.527, 0.529, 0.465, 0.465, 0.489,  // Gen–Giu
    0.503, 0.499, 0.502, 0.448, 0.444, 0.453,  // Lug–Dic
  ],
  nuclear: [
    0.850, 0.850, 0.850, 0.850, 0.850, 0.850,
    0.850, 0.850, 0.850, 0.850, 0.850, 0.850,
  ],
}

/** Annual capacity factors (average of monthly CFs or fixed) */
export const ANNUAL_CF: Partial<Record<Source, number>> = Object.fromEntries(
  Object.entries(MONTHLY_CF).map(([src, months]) => [
    src,
    months.reduce((s, v) => s + v, 0) / 12,
  ])
) as Partial<Record<Source, number>>

// ─── Monthly demand factors ────────────────────────────────────────────────────
/** Multipliers relative to annual average demand. Index 0 = January.
 *  Derived from 2023 monthly consumption (TWh): 25.98, 24.74, 25.94, 24.43, 24.43, 25.37,
 *  29.71, 23.61*, 25.86, 25.42, 25.08, 24.97 — total 305.54 TWh.
 *  (*agosto inferred from total; Ferragosto lowers industrial demand)
 */
export const MONTHLY_DEMAND_FACTORS = [
  1.020, 0.972, 1.019, 0.960, 0.960, 0.996,
  1.167, 0.927, 1.016, 0.998, 0.985, 0.981,
]

// ─── Typical daily demand profile ─────────────────────────────────────────────
/** Normalized to 1.0 = average demand. Workday profile. Used in Level 3. */
export const HOURLY_DEMAND_PROFILE = [
  0.72, 0.68, 0.65, 0.63, 0.62, 0.65,  // 00–05
  0.72, 0.84, 0.96, 1.04, 1.08, 1.10,  // 06–11
  1.10, 1.08, 1.06, 1.04, 1.02, 1.05,  // 12–17
  1.12, 1.14, 1.10, 1.02, 0.92, 0.80,  // 18–23
]

/** Typical daily solar generation profile (normalized, summer day). Used in Level 3. */
export const HOURLY_SOLAR_PROFILE = [
  0, 0, 0, 0, 0.01, 0.05,
  0.12, 0.25, 0.50, 0.73, 0.90, 1.00,
  1.00, 0.94, 0.80, 0.60, 0.38, 0.16,
  0.04, 0.01, 0, 0, 0, 0,
]

export const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
