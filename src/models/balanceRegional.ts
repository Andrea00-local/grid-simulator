import type { MarketZoneId, MarketZoneResult, MarketZoneFlow, Level4Result, CapacityMap, DistributionPlan } from './types'
import { ZONES, ZONE_IDS, ZONE_TRANSMISSION_LINKS, allocateToZones } from './italianZones'
import { ANNUAL_CF } from './profiles'
import { EMISSION_FACTORS, HOURS_PER_YEAR } from './constants'

const TWH_PER_GW_LINK = (HOURS_PER_YEAR * 0.6) / 1000  // ~5.26 TWh/GW/year

export function computeLevel4(
  renewableCapacity: CapacityMap,
  directProduction: CapacityMap,
  demandTWh: number,
  plan: DistributionPlan,
  transmissionBoost: number,
): Level4Result {
  const totalSolarGW = renewableCapacity.solar ?? 0
  const totalWindGW  = (renewableCapacity.wind_onshore ?? 0) + (renewableCapacity.wind_offshore ?? 0)
  const allocation = allocateToZones(totalSolarGW, totalWindGW, plan)

  const totalDemandMWh = demandTWh * 1e6
  const totalPop = ZONE_IDS.reduce((s, id) => s + ZONES[id].populationM * ZONES[id].demandPerCapitaFactor, 0)

  const zoneResults: Partial<Record<MarketZoneId, MarketZoneResult>> = {}

  for (const id of ZONE_IDS) {
    const z = ZONES[id]
    const { solar, wind } = allocation[id]

    const popWeight = (z.populationM * z.demandPerCapitaFactor) / totalPop
    const demandMWh = totalDemandMWh * popWeight

    const solarMWh = solar * z.solarCF * HOURS_PER_YEAR * 1000
    const windMWh  = wind  * z.windCF  * HOURS_PER_YEAR * 1000

    const hydroRunCF = ANNUAL_CF.hydro_run ?? 0.29
    const hydroMWh = z.hydroGW * (hydroRunCF + 0.05) * HOURS_PER_YEAR * 1000 * 0.5

    const biomassMWh  = ((renewableCapacity.biomass    ?? 0) * (ANNUAL_CF.biomass    ?? 0.6)   * HOURS_PER_YEAR * 1000) * popWeight
    const geoMWh      = ((renewableCapacity.geothermal ?? 0) * (ANNUAL_CF.geothermal ?? 0.855) * HOURS_PER_YEAR * 1000) * popWeight
    const nuclearMWh  = (directProduction.nuclear ?? 0) * 1e6 * popWeight
    const gasMWh      = (directProduction.gas_ccgt ?? 0) * 1e6 * popWeight
    const coalMWh     = (directProduction.coal     ?? 0) * 1e6 * popWeight
    const importsMWh  = (directProduction.imports  ?? 0) * 1e6 * popWeight

    const renewableMWh  = solarMWh + windMWh + hydroMWh + biomassMWh + geoMWh + nuclearMWh
    const productionMWh = renewableMWh + gasMWh + coalMWh + importsMWh

    const emissionsTonnes =
      gasMWh     * EMISSION_FACTORS.gas_ccgt    / 1000 +
      coalMWh    * EMISSION_FACTORS.coal        / 1000 +
      importsMWh * EMISSION_FACTORS.imports     / 1000 +
      biomassMWh * EMISSION_FACTORS.biomass     / 1000 +
      geoMWh     * EMISSION_FACTORS.geothermal  / 1000

    zoneResults[id] = {
      zoneId: id,
      name: z.name,
      solarGW: solar,
      windGW: wind,
      productionMWh,
      renewableMWh,
      demandMWh,
      rawBalance: productionMWh - demandMWh,
      routedBalance: productionMWh - demandMWh,
      importedMWh: 0,
      exportedMWh: 0,
      emissionsTonnes,
    }
  }

  const results = zoneResults as Record<MarketZoneId, MarketZoneResult>

  // Build zone transmission graph
  const linkCapacity = new Map<string, number>()
  const adjList = new Map<MarketZoneId, MarketZoneId[]>()

  for (const id of ZONE_IDS) adjList.set(id, [])

  for (const [a, b, gw] of ZONE_TRANSMISSION_LINKS) {
    const cap = gw * transmissionBoost * TWH_PER_GW_LINK * 1e6
    linkCapacity.set(`${a}-${b}`, cap)
    linkCapacity.set(`${b}-${a}`, cap)
    adjList.get(a)!.push(b)
    adjList.get(b)!.push(a)
  }

  const flows = routeEnergy(results, linkCapacity, adjList)

  for (const flow of flows) {
    results[flow.from].exportedMWh  += flow.energyMWh
    results[flow.to].importedMWh    += flow.energyMWh
    results[flow.from].routedBalance -= flow.energyMWh
    results[flow.to].routedBalance   += flow.energyMWh
  }

  let annualDeficitMWh = 0
  let annualSurplusMWh = 0
  let totalRenewMWh = 0
  let totalProdMWh = 0
  let totalEmissions = 0
  const zonesWithDeficit: MarketZoneId[] = []

  for (const z of Object.values(results)) {
    if (z.routedBalance < -1e6) {
      annualDeficitMWh += -z.routedBalance
      zonesWithDeficit.push(z.zoneId)
    } else if (z.routedBalance > 1e6) {
      annualSurplusMWh += z.routedBalance
    }
    totalRenewMWh  += z.renewableMWh
    totalProdMWh   += z.productionMWh
    totalEmissions += z.emissionsTonnes
  }

  return {
    zones: results,
    flows,
    annualDeficitTWh:       annualDeficitMWh / 1e6,
    annualSurplusTWh:       annualSurplusMWh / 1e6,
    nationalRenewableShare: totalProdMWh > 0 ? totalRenewMWh / totalProdMWh : 0,
    emissionsMtAnnual:      totalEmissions / 1e6,
    zonesWithDeficit,
  }
}

function routeEnergy(
  results: Record<MarketZoneId, MarketZoneResult>,
  capacities: Map<string, number>,
  adj: Map<MarketZoneId, MarketZoneId[]>,
): MarketZoneFlow[] {
  const flows: MarketZoneFlow[] = []
  const balance = new Map<MarketZoneId, number>()
  const remCap   = new Map<string, number>(capacities)

  for (const id of ZONE_IDS) balance.set(id, results[id].rawBalance)

  for (let iter = 0; iter < 200; iter++) {
    const surplus = ZONE_IDS.filter(id => (balance.get(id) ?? 0) > 1e6)
      .sort((a, b) => (balance.get(b) ?? 0) - (balance.get(a) ?? 0))
    const deficit = ZONE_IDS.filter(id => (balance.get(id) ?? 0) < -1e6)
      .sort((a, b) => (balance.get(a) ?? 0) - (balance.get(b) ?? 0))

    if (surplus.length === 0 || deficit.length === 0) break

    let routed = false
    outer:
    for (const src of surplus) {
      for (const dst of deficit) {
        const result = dijkstraPath(src, dst, remCap, adj)
        if (!result || result.bottleneck <= 0) continue

        const available = balance.get(src) ?? 0
        const needed    = -(balance.get(dst) ?? 0)
        const amount    = Math.min(available, needed, result.bottleneck)

        if (amount < 1e5) continue

        balance.set(src, (balance.get(src) ?? 0) - amount)
        balance.set(dst, (balance.get(dst) ?? 0) + amount)

        for (let i = 0; i < result.path.length - 1; i++) {
          const a = result.path[i], b = result.path[i + 1]
          remCap.set(`${a}-${b}`, (remCap.get(`${a}-${b}`) ?? 0) - amount)
          remCap.set(`${b}-${a}`, (remCap.get(`${b}-${a}`) ?? 0) - amount)
        }

        flows.push({ from: src, to: dst, energyMWh: amount, path: result.path })
        routed = true
        break outer
      }
    }
    if (!routed) break
  }

  return flows
}

function dijkstraPath(
  start: MarketZoneId,
  end: MarketZoneId,
  capacities: Map<string, number>,
  adj: Map<MarketZoneId, MarketZoneId[]>,
): { path: MarketZoneId[]; bottleneck: number } | null {
  const dist       = new Map<MarketZoneId, number>()
  const prev       = new Map<MarketZoneId, MarketZoneId>()
  const bottleneck = new Map<MarketZoneId, number>()
  const unvisited  = new Set(ZONE_IDS)

  for (const id of ZONE_IDS) { dist.set(id, Infinity); bottleneck.set(id, Infinity) }
  dist.set(start, 0)

  while (unvisited.size > 0) {
    let u: MarketZoneId | null = null
    let minD = Infinity
    for (const id of unvisited) { const d = dist.get(id) ?? Infinity; if (d < minD) { minD = d; u = id } }
    if (!u || minD === Infinity) break
    if (u === end) break
    unvisited.delete(u)

    for (const v of (adj.get(u) ?? [])) {
      if (!unvisited.has(v)) continue
      const cap = Math.min(capacities.get(`${u}-${v}`) ?? 0, capacities.get(`${v}-${u}`) ?? 0)
      if (cap <= 0) continue
      const w = 1 / cap
      const nd = (dist.get(u) ?? Infinity) + w
      if (nd < (dist.get(v) ?? Infinity)) {
        dist.set(v, nd)
        prev.set(v, u)
        bottleneck.set(v, Math.min(bottleneck.get(u) ?? Infinity, cap))
      }
    }
  }

  if ((dist.get(end) ?? Infinity) === Infinity) return null

  const path: MarketZoneId[] = []
  let curr: MarketZoneId | undefined = end
  while (curr !== undefined) {
    path.unshift(curr)
    curr = prev.get(curr)
  }
  if (path[0] !== start) return null

  return { path, bottleneck: bottleneck.get(end) ?? 0 }
}
