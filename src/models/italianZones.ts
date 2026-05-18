import type { MarketZoneId, RegionId, DistributionPlan } from './types'

export const PLAN_LABELS: Record<DistributionPlan, string> = {
  attuale:    'Italia 2023',
  moltoNord:  'Produzione Nord',
  moltoSud:   'Produzione Sud',
  equilibrato:'Equilibrato',
}

export interface MarketZoneData {
  id: MarketZoneId
  name: string
  abbr: string
  populationM: number
  solarCF: number
  windCF: number
  hydroGW: number
  current2023SolarGW: number
  current2023WindGW: number
  demandPerCapitaFactor: number
}

// Aggregated from 20 regions (population-weighted CFs, summed hydro/installed GW)
export const ZONES: Record<MarketZoneId, MarketZoneData> = {
  nord:  { id:'nord',  name:'Nord',        abbr:'NORD',  populationM:27.81, solarCF:0.122, windCF:0.175, hydroGW:15.30, current2023SolarGW:9.25, current2023WindGW:0.76, demandPerCapitaFactor:1.146 },
  cnord: { id:'cnord', name:'Centro Nord', abbr:'CNORD', populationM:5.26,  solarCF:0.140, windCF:0.220, hydroGW:0.40,  current2023SolarGW:2.00, current2023WindGW:0.40, demandPerCapitaFactor:0.985 },
  csud:  { id:'csud',  name:'Centro Sud',  abbr:'CSUD',  populationM:13.64, solarCF:0.153, windCF:0.227, hydroGW:1.25,  current2023SolarGW:3.00, current2023WindGW:2.00, demandPerCapitaFactor:0.946 },
  sud:   { id:'sud',   name:'Sud',         abbr:'SUD',   populationM:4.84,  solarCF:0.168, windCF:0.278, hydroGW:0.45,  current2023SolarGW:4.10, current2023WindGW:3.40, demandPerCapitaFactor:0.888 },
  cal:   { id:'cal',   name:'Calabria',    abbr:'CAL',   populationM:1.88,  solarCF:0.160, windCF:0.300, hydroGW:0.50,  current2023SolarGW:0.60, current2023WindGW:0.80, demandPerCapitaFactor:0.800 },
  sic:   { id:'sic',   name:'Sicilia',     abbr:'SIC',   populationM:5.02,  solarCF:0.180, windCF:0.300, hydroGW:0.10,  current2023SolarGW:1.10, current2023WindGW:1.80, demandPerCapitaFactor:0.800 },
  sar:   { id:'sar',   name:'Sardegna',    abbr:'SAR',   populationM:1.61,  solarCF:0.170, windCF:0.300, hydroGW:0.60,  current2023SolarGW:0.80, current2023WindGW:1.10, demandPerCapitaFactor:0.850 },
}

export const ZONE_IDS: MarketZoneId[] = ['nord', 'cnord', 'csud', 'sud', 'cal', 'sic', 'sar']

// Zone-to-zone transmission links [from, to, GW] — derived from Terna region-level NTCs
export const ZONE_TRANSMISSION_LINKS: [MarketZoneId, MarketZoneId, number][] = [
  ['nord',  'cnord', 8.0],
  ['cnord', 'csud',  9.0],
  ['cnord', 'sar',   1.0],
  ['csud',  'sar',   0.5],
  ['csud',  'sud',   6.0],
  ['csud',  'cal',   1.0],
  ['sud',   'cal',   2.0],
  ['cal',   'sic',   1.5],
]

// Approximate SVG centroids for zone-level flow lines on the geographic map (viewBox 0 0 560 640)
export const ZONE_CENTROIDS: Record<MarketZoneId, [number, number]> = {
  nord:  [190, 105],
  cnord: [248, 218],
  csud:  [300, 320],
  sud:   [430, 370],
  cal:   [441, 477],
  sic:   [351, 567],
  sar:   [124, 422],
}

// Mapping from each of the 20 regions to its Terna market zone
export const REGION_TO_ZONE: Record<RegionId, MarketZoneId> = {
  vda: 'nord', pie: 'nord', lig: 'nord', lom: 'nord',
  taa: 'nord', ven: 'nord', fvg: 'nord', emr: 'nord',
  tos: 'cnord', mar: 'cnord',
  sar: 'sar',
  laz: 'csud', umb: 'csud', abr: 'csud', cam: 'csud',
  bas: 'sud', pug: 'sud', mol: 'sud',
  cal: 'cal',
  sic: 'sic',
}

// Zone distribution weights [nord, cnord, csud, sud, cal, sic, sar] — from Terna/ENTSO-E data.
// Order matches ZONE_IDS. All arrays must sum to 1.0 (normalized).
// Sources: solar=fotovoltaico, wind_onshore=eolico, wind_offshore=eolico offshore, biomass=bioenergie.
// Hydro is fixed by zone.hydroGW. Geothermal uses cnord profile only (physically in Toscana).
const DISTRIBUTION_WEIGHTS: Record<DistributionPlan, {
  solar:         number[]
  wind_onshore:  number[]
  wind_offshore: number[]
  biomass:       number[]
}> = {
  // ── Italia 2023 ─────────────────────────────────────────────────────────────
  attuale: {
    solar:         [0.485, 0.091, 0.162, 0.131, 0.020, 0.071, 0.040],
    wind_onshore:  [0.020, 0.010, 0.190, 0.410, 0.100, 0.180, 0.090],
    wind_offshore: [0.020, 0.010, 0.190, 0.410, 0.100, 0.180, 0.090],
    biomass:       [0.618, 0.049, 0.118, 0.118, 0.049, 0.020, 0.029],
  },
  // ── Produzione Nord — more renewables in northern zones ─────────────────────
  moltoNord: {
    solar:         [0.550, 0.090, 0.165, 0.095, 0.010, 0.040, 0.050],
    wind_onshore:  [0.030, 0.015, 0.200, 0.370, 0.090, 0.170, 0.125],
    wind_offshore: [0.040, 0.030, 0.070, 0.300, 0.060, 0.230, 0.270],
    biomass:       [0.700, 0.080, 0.080, 0.080, 0.020, 0.020, 0.020],
  },
  // ── Produzione Sud — more renewables in southern zones ──────────────────────
  moltoSud: {
    solar:         [0.390, 0.070, 0.170, 0.160, 0.040, 0.110, 0.060],
    wind_onshore:  [0.020, 0.010, 0.190, 0.410, 0.100, 0.180, 0.090],
    wind_offshore: [0.020, 0.010, 0.080, 0.330, 0.080, 0.240, 0.240],
    biomass:       [0.618, 0.049, 0.118, 0.118, 0.049, 0.020, 0.029],
  },
  // ── Equilibrato — geographically balanced ────────────────────────────────────
  equilibrato: {
    solar:         [0.200, 0.090, 0.170, 0.180, 0.100, 0.150, 0.110],
    wind_onshore:  [0.100, 0.050, 0.200, 0.280, 0.130, 0.150, 0.090],
    wind_offshore: [0.060, 0.040, 0.120, 0.320, 0.120, 0.200, 0.140],
    biomass:       [0.300, 0.100, 0.150, 0.150, 0.100, 0.100, 0.100],
  },
}

export function allocateToZones(
  totalSolarGW:        number,
  totalWindOnshoreGW:  number,
  totalWindOffshoreGW: number,
  totalBiomassGW:      number,
  plan: DistributionPlan,
): Record<MarketZoneId, { solar: number; wind_onshore: number; wind_offshore: number; biomass: number }> {
  const w = DISTRIBUTION_WEIGHTS[plan]
  return Object.fromEntries(
    ZONE_IDS.map((id, i) => [id, {
      solar:         totalSolarGW        * w.solar[i],
      wind_onshore:  totalWindOnshoreGW  * w.wind_onshore[i],
      wind_offshore: totalWindOffshoreGW * w.wind_offshore[i],
      biomass:       totalBiomassGW      * w.biomass[i],
    }])
  ) as Record<MarketZoneId, { solar: number; wind_onshore: number; wind_offshore: number; biomass: number }>
}
