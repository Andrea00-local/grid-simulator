import type { MarketZoneId, RegionId, DistributionPlan } from './types'

export const PLAN_LABELS: Record<DistributionPlan, string> = {
  attuale:    'Attuale (2023)',
  moltoNord:  'Molto a Nord',
  moltoSud:   'Molto a Sud',
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

// Zone distribution weights [nord, cnord, csud, sud, cal, sic, sar] — placeholder values
// The user will provide updated numbers; these follow the ZONE_IDS order.
const DISTRIBUTION_WEIGHTS: Record<DistributionPlan, { solar: number[]; wind: number[] }> = {
  attuale: {
    solar: [0.443, 0.096, 0.144, 0.197, 0.029, 0.053, 0.038],
    wind:  [0.074, 0.039, 0.195, 0.331, 0.078, 0.175, 0.107],
  },
  moltoNord: {
    solar: [0.500, 0.200, 0.120, 0.090, 0.030, 0.040, 0.020],
    wind:  [0.350, 0.200, 0.180, 0.140, 0.050, 0.050, 0.030],
  },
  moltoSud: {
    solar: [0.050, 0.050, 0.150, 0.250, 0.150, 0.200, 0.150],
    wind:  [0.040, 0.040, 0.180, 0.280, 0.160, 0.170, 0.130],
  },
  equilibrato: {
    solar: [0.200, 0.130, 0.170, 0.180, 0.100, 0.120, 0.100],
    wind:  [0.140, 0.100, 0.200, 0.220, 0.130, 0.120, 0.090],
  },
}

export function allocateToZones(
  totalSolarGW: number,
  totalWindGW: number,
  plan: DistributionPlan,
): Record<MarketZoneId, { solar: number; wind: number }> {
  const w = DISTRIBUTION_WEIGHTS[plan]
  return Object.fromEntries(
    ZONE_IDS.map((id, i) => [id, {
      solar: totalSolarGW * w.solar[i],
      wind:  totalWindGW  * w.wind[i],
    }])
  ) as Record<MarketZoneId, { solar: number; wind: number }>
}
