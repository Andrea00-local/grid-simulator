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
    0.034, 0.052, 0.090, 0.116, 0.140, 0.160,  // Jan–Jun
    0.166, 0.152, 0.118, 0.080, 0.042, 0.028,  // Jul–Dec
  ],
  wind_onshore: [
    0.258, 0.240, 0.228, 0.206, 0.190, 0.154,
    0.144, 0.150, 0.172, 0.210, 0.248, 0.268,
  ],
  wind_offshore: [
    0.320, 0.300, 0.280, 0.250, 0.220, 0.180,
    0.170, 0.180, 0.210, 0.255, 0.295, 0.330,
  ],
  hydro_run: [
    0.220, 0.250, 0.360, 0.460, 0.490, 0.410,
    0.300, 0.220, 0.240, 0.280, 0.310, 0.240,
  ],
  geothermal: [
    0.855, 0.855, 0.855, 0.855, 0.855, 0.855,
    0.855, 0.855, 0.855, 0.855, 0.855, 0.855,
  ],
  biomass: [
    0.600, 0.600, 0.600, 0.600, 0.600, 0.600,
    0.600, 0.600, 0.600, 0.600, 0.600, 0.600,
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
/** Multipliers relative to annual average demand. Index 0 = January. */
export const MONTHLY_DEMAND_FACTORS = [
  1.06, 1.00, 0.97, 0.91, 0.93, 0.96,
  1.04, 0.94, 0.96, 0.99, 1.02, 1.08,
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
