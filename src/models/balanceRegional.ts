import type { RegionId, RegionalResult, RegionFlow, Level4Result, CapacityMap, DistributionPlan } from './types'
import { REGIONS, REGION_IDS, TRANSMISSION_LINKS, allocateToRegions } from './italianRegions'
import { ANNUAL_CF } from './profiles'
import { EMISSION_FACTORS, HOURS_PER_YEAR } from './constants'

// Effective annual energy that can flow through 1 GW of transmission
const TWH_PER_GW_LINK = (HOURS_PER_YEAR * 0.6) / 1000  // ~5.26 TWh/GW/year

export function computeLevel4(
  renewableCapacity: CapacityMap,
  directProduction: CapacityMap,
  demandTWh: number,
  plan: DistributionPlan,
  transmissionBoost: number,  // multiplier on link capacities, e.g. 1.5 = +50%
): Level4Result {
  // 1. Allocate solar and wind (wind_onshore only for simplicity) to regions
  const totalSolarGW = renewableCapacity.solar ?? 0
  const totalWindGW  = (renewableCapacity.wind_onshore ?? 0) + (renewableCapacity.wind_offshore ?? 0)
  const allocation = allocateToRegions(totalSolarGW, totalWindGW, plan)

  // 2. National totals for non-regionalized sources
  const totalDemandMWh = demandTWh * 1e6
  const totalPop = REGION_IDS.reduce((s, id) => s + REGIONS[id].populationM * REGIONS[id].demandPerCapitaFactor, 0)

  // 3. Compute each region's balance
  const regionResults: Partial<Record<RegionId, RegionalResult>> = {}

  for (const id of REGION_IDS) {
    const r = REGIONS[id]
    const { solar, wind } = allocation[id]

    // Regional demand (weighted by population × industry factor)
    const popWeight = (r.populationM * r.demandPerCapitaFactor) / totalPop
    const demandMWh = totalDemandMWh * popWeight

    // Solar production
    const solarMWh = solar * r.solarCF * HOURS_PER_YEAR * 1000

    // Wind (using regional CF, blended on+offshore)
    const windMWh = wind * r.windCF * HOURS_PER_YEAR * 1000

    // Fixed hydro (region-specific, not redistributed)
    const hydroRunCF = ANNUAL_CF.hydro_run ?? 0.29
    const hydroMWh = r.hydroGW * (hydroRunCF + 0.05) * HOURS_PER_YEAR * 1000 * 0.5
      // approximation: blend run-of-river and reservoir CFs

    // Fixed biomass + geothermal (national, allocated proportionally to demand)
    const biomassMWh  = ((renewableCapacity.biomass    ?? 0) * (ANNUAL_CF.biomass    ?? 0.6)   * HOURS_PER_YEAR * 1000) * popWeight
    const geoMWh      = ((renewableCapacity.geothermal ?? 0) * (ANNUAL_CF.geothermal ?? 0.855) * HOURS_PER_YEAR * 1000) * popWeight

    // Thermal: allocated proportionally to demand
    const nuclearMWh = (directProduction.nuclear ?? 0) * 1e6 * popWeight
    const gasMWh     = (directProduction.gas_ccgt ?? 0) * 1e6 * popWeight
    const coalMWh    = (directProduction.coal     ?? 0) * 1e6 * popWeight
    const importsMWh = (directProduction.imports  ?? 0) * 1e6 * popWeight

    const renewableMWh = solarMWh + windMWh + hydroMWh + biomassMWh + geoMWh + nuclearMWh
    const productionMWh = renewableMWh + gasMWh + coalMWh + importsMWh

    // Emissions
    const emissionsTonnes =
      gasMWh     * EMISSION_FACTORS.gas_ccgt / 1000 +
      coalMWh    * EMISSION_FACTORS.coal     / 1000 +
      importsMWh * EMISSION_FACTORS.imports  / 1000 +
      biomassMWh * EMISSION_FACTORS.biomass  / 1000 +
      geoMWh     * EMISSION_FACTORS.geothermal / 1000

    regionResults[id] = {
      regionId: id,
      name: r.name,
      solarGW: solar,
      windGW: wind,
      productionMWh,
      renewableMWh,
      demandMWh,
      rawBalance: productionMWh - demandMWh,
      routedBalance: productionMWh - demandMWh,  // will be updated
      importedMWh: 0,
      exportedMWh: 0,
      emissionsTonnes,
    }
  }

  const results = regionResults as Record<RegionId, RegionalResult>

  // 4. Build transmission graph with annual capacity in MWh
  const linkCapacity = new Map<string, number>()
  const adjList = new Map<RegionId, RegionId[]>()

  for (const id of REGION_IDS) adjList.set(id, [])

  for (const [a, b, gw] of TRANSMISSION_LINKS) {
    const cap = gw * transmissionBoost * TWH_PER_GW_LINK * 1e6  // MWh/year
    linkCapacity.set(`${a}-${b}`, cap)
    linkCapacity.set(`${b}-${a}`, cap)
    adjList.get(a)!.push(b)
    adjList.get(b)!.push(a)
  }

  // 5. Dijkstra routing
  const flows = routeEnergy(results, linkCapacity, adjList)

  // Apply flows to results
  for (const flow of flows) {
    results[flow.from].exportedMWh  += flow.energyMWh
    results[flow.to].importedMWh    += flow.energyMWh
    results[flow.from].routedBalance -= flow.energyMWh
    results[flow.to].routedBalance   += flow.energyMWh
  }

  // 6. Aggregate national stats
  let annualDeficitMWh = 0
  let annualSurplusMWh = 0
  let totalRenewMWh = 0
  let totalProdMWh = 0
  let totalEmissions = 0
  const regionsWithDeficit: RegionId[] = []

  for (const r of Object.values(results)) {
    if (r.routedBalance < -1e6) {
      annualDeficitMWh += -r.routedBalance
      regionsWithDeficit.push(r.regionId)
    } else if (r.routedBalance > 1e6) {
      annualSurplusMWh += r.routedBalance
    }
    totalRenewMWh  += r.renewableMWh
    totalProdMWh   += r.productionMWh
    totalEmissions += r.emissionsTonnes
  }

  return {
    regions: results,
    flows,
    annualDeficitTWh:       annualDeficitMWh / 1e6,
    annualSurplusTWh:       annualSurplusMWh / 1e6,
    nationalRenewableShare: totalProdMWh > 0 ? totalRenewMWh / totalProdMWh : 0,
    emissionsMtAnnual:      totalEmissions / 1e6,
    regionsWithDeficit,
  }
}

// ─── Dijkstra-based energy routing ─────────────────────────────────────────────

function routeEnergy(
  results: Record<RegionId, RegionalResult>,
  capacities: Map<string, number>,
  adj: Map<RegionId, RegionId[]>,
): RegionFlow[] {
  const flows: RegionFlow[] = []

  // Working copies of balances and remaining link capacities
  const balance = new Map<RegionId, number>()
  const remCap   = new Map<string, number>(capacities)

  for (const id of REGION_IDS) {
    balance.set(id, results[id].rawBalance)
  }

  // Iterate: pair each surplus region with nearest deficit region
  for (let iter = 0; iter < 200; iter++) {
    const surplus = REGION_IDS.filter(id => (balance.get(id) ?? 0) > 1e6)
      .sort((a, b) => (balance.get(b) ?? 0) - (balance.get(a) ?? 0))
    const deficit = REGION_IDS.filter(id => (balance.get(id) ?? 0) < -1e6)
      .sort((a, b) => (balance.get(a) ?? 0) - (balance.get(b) ?? 0))

    if (surplus.length === 0 || deficit.length === 0) break

    // Try to route from largest surplus to largest deficit
    let routed = false
    outer:
    for (const src of surplus) {
      for (const dst of deficit) {
        const result = dijkstraPath(src, dst, remCap, adj)
        if (!result || result.bottleneck <= 0) continue

        const available = balance.get(src) ?? 0
        const needed    = -(balance.get(dst) ?? 0)
        const amount    = Math.min(available, needed, result.bottleneck)

        if (amount < 1e5) continue  // skip tiny flows (< 0.1 GWh)

        // Update balances
        balance.set(src, (balance.get(src) ?? 0) - amount)
        balance.set(dst, (balance.get(dst) ?? 0) + amount)

        // Reduce link capacities along path
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
  start: RegionId,
  end: RegionId,
  capacities: Map<string, number>,
  adj: Map<RegionId, RegionId[]>,
): { path: RegionId[]; bottleneck: number } | null {
  const dist       = new Map<RegionId, number>()
  const prev       = new Map<RegionId, RegionId>()
  const bottleneck = new Map<RegionId, number>()
  const unvisited  = new Set(REGION_IDS)

  for (const id of REGION_IDS) { dist.set(id, Infinity); bottleneck.set(id, Infinity) }
  dist.set(start, 0)

  while (unvisited.size > 0) {
    let u: RegionId | null = null
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

  const path: RegionId[] = []
  let curr: RegionId | undefined = end
  while (curr !== undefined) {
    path.unshift(curr)
    curr = prev.get(curr)
  }
  if (path[0] !== start) return null

  return { path, bottleneck: bottleneck.get(end) ?? 0 }
}
