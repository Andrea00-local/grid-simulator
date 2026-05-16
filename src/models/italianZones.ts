import type { MarketZoneId, RegionId, DistributionPlan } from './types'

export const PLAN_LABELS: Record<DistributionPlan, string> = {
  uniform:     'Uniforme (pro capite)',
  current2023: 'Attuale 2023',
  pniec2030:   'PNIEC 2030',
  maximizeCF:  'Massimizza CF',
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

export function allocateToZones(
  totalSolarGW: number,
  totalWindGW: number,
  plan: DistributionPlan,
): Record<MarketZoneId, { solar: number; wind: number }> {
  const zones = ZONE_IDS.map(id => ZONES[id])

  let solarWeights: Record<MarketZoneId, number>
  let windWeights: Record<MarketZoneId, number>

  if (plan === 'uniform') {
    const totalPop = zones.reduce((s, z) => s + z.populationM, 0)
    solarWeights = Object.fromEntries(zones.map(z => [z.id, z.populationM / totalPop])) as Record<MarketZoneId, number>
    windWeights = { ...solarWeights }
  } else if (plan === 'current2023') {
    const totalSolar23 = zones.reduce((s, z) => s + z.current2023SolarGW, 0)
    const totalWind23 = zones.reduce((s, z) => s + z.current2023WindGW, 0)
    solarWeights = Object.fromEntries(zones.map(z => [z.id, z.current2023SolarGW / totalSolar23])) as Record<MarketZoneId, number>
    windWeights = Object.fromEntries(zones.map(z => [z.id, z.current2023WindGW / totalWind23])) as Record<MarketZoneId, number>
  } else if (plan === 'pniec2030') {
    const totalSolar23 = zones.reduce((s, z) => s + z.current2023SolarGW, 0)
    const totalWind23 = zones.reduce((s, z) => s + z.current2023WindGW, 0)
    const totalSolarCF = zones.reduce((s, z) => s + z.solarCF, 0)
    const totalWindCF = zones.reduce((s, z) => s + z.windCF, 0)
    solarWeights = Object.fromEntries(zones.map(z => [z.id, 0.5 * z.current2023SolarGW / totalSolar23 + 0.5 * z.solarCF / totalSolarCF])) as Record<MarketZoneId, number>
    windWeights = Object.fromEntries(zones.map(z => [z.id, 0.5 * z.current2023WindGW / totalWind23 + 0.5 * z.windCF / totalWindCF])) as Record<MarketZoneId, number>
  } else { // maximizeCF
    const totalSolarCF = zones.reduce((s, z) => s + z.solarCF, 0)
    const totalWindCF = zones.reduce((s, z) => s + z.windCF, 0)
    solarWeights = Object.fromEntries(zones.map(z => [z.id, z.solarCF / totalSolarCF])) as Record<MarketZoneId, number>
    windWeights = Object.fromEntries(zones.map(z => [z.id, z.windCF / totalWindCF])) as Record<MarketZoneId, number>
  }

  return Object.fromEntries(
    zones.map(z => [z.id, {
      solar: totalSolarGW * solarWeights[z.id],
      wind:  totalWindGW  * windWeights[z.id],
    }])
  ) as Record<MarketZoneId, { solar: number; wind: number }>
}
