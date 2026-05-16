/**
 * Level 4 hourly simulation.
 *
 * For each of 12 months (one representative day × 24 hours per zone):
 *  1. Renewable production per zone × hour (solar/wind scaled by zone CF, hydro by zone GW)
 *  2. Residual demand (demand minus renewable) drives proportional non-renewable allocation
 *  3. Hour-by-hour Dijkstra routing between zones (link capacity in MW = MWh/h)
 *  4. Battery per zone (equal split of national total, same logic as Level 3)
 *
 * Non-renewable allocation formula:
 *   dailyBudget[src][zone][month] = (totalSrcTWh×1e6 / 365) × (residualDay[zone][month] / Σ residualDay)
 *   where Σ is over all 7 zones × 12 months (84 representative days).
 *   Within each hour: hourlyFrac = hourlyResidual / dailyResidual.
 */
import type {
  MarketZoneId, MarketZoneResult, MarketZoneFlow,
  ZoneHourlyPoint, ZoneDailyResult, Level4Result,
  CapacityMap, DistributionPlan,
} from './types'
import { ZONES, ZONE_IDS, ZONE_TRANSMISSION_LINKS, allocateToZones } from './italianZones'
import { MONTH_LABELS, ANNUAL_CF } from './profiles'
import {
  SOLAR_PROFILE, WIND_PROFILE, HYDRO_PROFILE,
  DAYS_PER_MONTH, DEMAND_GWH_2023, DEMAND_BASELINE_TWH, MEGAPACK_HOURS,
} from './hourlyProfiles'
import { EMISSION_FACTORS } from './constants'

const CHARGE_EFF    = 0.95
const DISCHARGE_EFF = 0.95

// National annual CF used to scale zone-specific CFs onto the shared hourly profile shapes
const NATIONAL_SOLAR_CF = ANNUAL_CF.solar        ?? 0.1123
const NATIONAL_WIND_CF  = ANNUAL_CF.wind_onshore ?? 0.207

// Fixed annual CFs for biomass and geothermal
const BIOMASS_CF = 0.55
const GEO_CF     = 0.77

// ─── Public API ────────────────────────────────────────────────────────────────

export function computeLevel4(
  renewableCapacity: CapacityMap,
  directProduction: CapacityMap,
  demandTWh: number,
  plan: DistributionPlan,
  transmissionBoost: number,
  storagePowerGW = 0,
): Level4Result {

  // ── Installed capacity & source totals ────────────────────────────────────────
  const totalSolarGW = renewableCapacity.solar ?? 0
  const totalWindGW  = (renewableCapacity.wind_onshore ?? 0) + (renewableCapacity.wind_offshore ?? 0)

  const gasTotalMWh     = (directProduction.gas_ccgt  ?? 0) * 1e6
  const coalTotalMWh    = (directProduction.coal       ?? 0) * 1e6
  const nuclearTotalMWh = (directProduction.nuclear    ?? 0) * 1e6
  const importsTotalMWh = (directProduction.imports    ?? 0) * 1e6
  const biomassTotalMWh = (renewableCapacity.biomass    ?? 0) * BIOMASS_CF * 8760 * 1000
  const geoTotalMWh     = (renewableCapacity.geothermal ?? 0) * GEO_CF     * 8760 * 1000

  // ── Battery per zone ──────────────────────────────────────────────────────────
  const nZones             = ZONE_IDS.length  // 7
  const battCapMWhPerZone  = storagePowerGW * MEGAPACK_HOURS * 1000 / nZones
  const battPowerMWhPerZone = battCapMWhPerZone > 0 ? battCapMWhPerZone / MEGAPACK_HOURS : 0

  // ── Zone allocation & demand weights ─────────────────────────────────────────
  const allocation = allocateToZones(totalSolarGW, totalWindGW, plan)

  const totalPopW = ZONE_IDS.reduce((s, id) => s + ZONES[id].populationM * ZONES[id].demandPerCapitaFactor, 0)
  const popWeight = Object.fromEntries(
    ZONE_IDS.map(id => [id, (ZONES[id].populationM * ZONES[id].demandPerCapitaFactor) / totalPopW])
  ) as Record<MarketZoneId, number>

  const demandScale = demandTWh / DEMAND_BASELINE_TWH

  // Zone CF scale factors (zone CF / national CF), applied to national hourly profile shapes
  const zoneSolarScale = Object.fromEntries(
    ZONE_IDS.map(id => [id, NATIONAL_SOLAR_CF > 0 ? ZONES[id].solarCF / NATIONAL_SOLAR_CF : 1])
  ) as Record<MarketZoneId, number>
  const zoneWindScale = Object.fromEntries(
    ZONE_IDS.map(id => [id, NATIONAL_WIND_CF > 0 ? ZONES[id].windCF / NATIONAL_WIND_CF : 1])
  ) as Record<MarketZoneId, number>

  // ── Pass 1: renewable production + residual demand per zone × month ───────────
  // Store hourly demand and residual for later use in the main simulation
  type HoursCache = { demand: number[]; residual: number[]; renew: number[] }
  const hoursCache: Record<MarketZoneId, HoursCache[]> = {} as Record<MarketZoneId, HoursCache[]>
  const residualDay: Record<MarketZoneId, number[]>    = {} as Record<MarketZoneId, number[]>

  for (const id of ZONE_IDS) {
    hoursCache[id]  = []
    residualDay[id] = []
    const { solar: solarGW, wind: windGW } = allocation[id]
    const hydroGW  = ZONES[id].hydroGW
    const sScale   = zoneSolarScale[id]
    const wScale   = zoneWindScale[id]
    const pw       = popWeight[id]

    for (let m = 0; m < 12; m++) {
      const demand:   number[] = []
      const residual: number[] = []
      const renew:    number[] = []
      let   dayRes = 0

      for (let h = 0; h < 24; h++) {
        const d   = DEMAND_GWH_2023[m][h] * demandScale * 1000 * pw  // MWh
        const s   = solarGW * SOLAR_PROFILE[m][h] * sScale * 1000
        const w   = windGW  * WIND_PROFILE[m][h]  * wScale * 1000
        const hyd = hydroGW * HYDRO_PROFILE[m][h]          * 1000
        const r   = s + w + hyd
        const res = Math.max(0, d - r)
        demand.push(d)
        renew.push(r)
        residual.push(res)
        dayRes += res
      }
      hoursCache[id].push({ demand, residual, renew })
      residualDay[id].push(dayRes)
    }
  }

  // ── Pass 2: total residual across all 84 representative days ─────────────────
  let totalResidual84 = 0
  for (const id of ZONE_IDS)
    for (let m = 0; m < 12; m++)
      totalResidual84 += residualDay[id][m]

  // ── Pass 3: daily budgets for non-renewables per zone × month ─────────────────
  // dailyBudget = (totalTWh×1e6 / 365) × (residualDay / totalResidual84)
  type NRKey = 'gas' | 'coal' | 'nuclear' | 'imports' | 'biomass' | 'geo'
  const NR_TOTALS: Record<NRKey, number> = {
    gas:     gasTotalMWh,
    coal:    coalTotalMWh,
    nuclear: nuclearTotalMWh,
    imports: importsTotalMWh,
    biomass: biomassTotalMWh,
    geo:     geoTotalMWh,
  }
  const dailyBudget: Record<NRKey, Record<MarketZoneId, number[]>> = {
    gas: {}, coal: {}, nuclear: {}, imports: {}, biomass: {}, geo: {},
  } as Record<NRKey, Record<MarketZoneId, number[]>>

  for (const key of Object.keys(NR_TOTALS) as NRKey[]) {
    for (const id of ZONE_IDS) {
      dailyBudget[key][id] = []
      for (let m = 0; m < 12; m++) {
        const b = totalResidual84 > 0
          ? (NR_TOTALS[key] / 365) * (residualDay[id][m] / totalResidual84)
          : 0
        dailyBudget[key][id].push(b)
      }
    }
  }

  // ── Transmission graph (MW = MWh/h per link) ──────────────────────────────────
  const linkCapMW = new Map<string, number>()
  const adj       = new Map<MarketZoneId, MarketZoneId[]>()
  for (const id of ZONE_IDS) adj.set(id, [])
  for (const [a, b, gw] of ZONE_TRANSMISSION_LINKS) {
    const cap = gw * transmissionBoost * 1000
    linkCapMW.set(`${a}-${b}`, cap)
    linkCapMW.set(`${b}-${a}`, cap)
    adj.get(a)!.push(b)
    adj.get(b)!.push(a)
  }

  // ── Main simulation ────────────────────────────────────────────────────────────
  const zoneMonths: Record<MarketZoneId, ZoneDailyResult[]> = {} as Record<MarketZoneId, ZoneDailyResult[]>
  for (const id of ZONE_IDS) zoneMonths[id] = []

  // Annual aggregates for map coloring
  const annZone: Record<MarketZoneId, {
    solar: number; wind: number; hydro: number; nonrenew: number
    prod: number; demand: number; imported: number; exported: number
    emissions: number; deficit: number; surplus: number
  }> = {} as Record<MarketZoneId, any>
  for (const id of ZONE_IDS) {
    annZone[id] = { solar: 0, wind: 0, hydro: 0, nonrenew: 0, prod: 0, demand: 0, imported: 0, exported: 0, emissions: 0, deficit: 0, surplus: 0 }
  }

  // Annual inter-zone flows (MWh): key = `${from}:${to}`
  const flowPairMap = new Map<string, number>()

  for (let m = 0; m < 12; m++) {
    const days = DAYS_PER_MONTH[m]

    // Battery warm-up: single dry pass (no routing) to find steady-state initial SOC
    const initSOC: Record<MarketZoneId, number> = {} as Record<MarketZoneId, number>
    for (const id of ZONE_IDS) {
      if (battCapMWhPerZone <= 0) { initSOC[id] = 0; continue }
      let soc = 0
      const { demand, residual, renew } = hoursCache[id][m]
      const dayRes = residualDay[id][m]
      for (let h = 0; h < 24; h++) {
        let prod = renew[h]
        const frac = dayRes > 0 ? residual[h] / dayRes : 1 / 24
        for (const key of Object.keys(NR_TOTALS) as NRKey[])
          prod += dailyBudget[key][id][m] * frac
        const net = prod - demand[h]
        if (net > 0) {
          const charge = Math.min(net, battPowerMWhPerZone, (battCapMWhPerZone - soc) / CHARGE_EFF)
          soc += charge * CHARGE_EFF
        } else if (net < 0) {
          const discharge = Math.min(-net, battPowerMWhPerZone, soc * DISCHARGE_EFF)
          soc -= discharge / DISCHARGE_EFF
        }
      }
      initSOC[id] = soc
    }

    // Actual per-hour simulation
    const battSOC: Record<MarketZoneId, number> = { ...initSOC }
    const zoneHours: Record<MarketZoneId, ZoneHourlyPoint[]> = {} as Record<MarketZoneId, ZoneHourlyPoint[]>
    for (const id of ZONE_IDS) zoneHours[id] = []

    for (let h = 0; h < 24; h++) {
      // Per-zone local production and net balance
      const localProd: Record<MarketZoneId, {
        solar: number; wind: number; hydro: number
        gas: number; coal: number; nuclear: number; imports: number; biomass: number; geo: number
        total: number
      }> = {} as Record<MarketZoneId, any>

      const localNet: Record<MarketZoneId, number> = {} as Record<MarketZoneId, number>

      for (const id of ZONE_IDS) {
        const { solar: solarGW, wind: windGW } = allocation[id]
        const hydroGW = ZONES[id].hydroGW
        const sScale  = zoneSolarScale[id]
        const wScale  = zoneWindScale[id]
        const { demand, residual } = hoursCache[id][m]
        const dayRes = residualDay[id][m]
        const frac   = dayRes > 0 ? residual[h] / dayRes : 1 / 24

        const solarH  = solarGW * SOLAR_PROFILE[m][h] * sScale * 1000
        const windH   = windGW  * WIND_PROFILE[m][h]  * wScale * 1000
        const hydroH  = hydroGW * HYDRO_PROFILE[m][h]           * 1000
        const gasH    = dailyBudget.gas[id][m]     * frac
        const coalH   = dailyBudget.coal[id][m]    * frac
        const nucH    = dailyBudget.nuclear[id][m] * frac
        const impH    = dailyBudget.imports[id][m] * frac
        const bioH    = dailyBudget.biomass[id][m] * frac
        const geoH    = dailyBudget.geo[id][m]     * frac
        const total   = solarH + windH + hydroH + gasH + coalH + nucH + impH + bioH + geoH

        localProd[id] = { solar: solarH, wind: windH, hydro: hydroH, gas: gasH, coal: coalH, nuclear: nucH, imports: impH, biomass: bioH, geo: geoH, total }
        localNet[id]  = total - demand[h]
      }

      // Dijkstra routing — reset link capacity each hour
      const remCap = new Map<string, number>(linkCapMW)
      const routedBal: Record<MarketZoneId, number> = { ...localNet }
      const regImport: Record<MarketZoneId, number> = {} as Record<MarketZoneId, number>
      for (const id of ZONE_IDS) regImport[id] = 0

      for (let iter = 0; iter < 200; iter++) {
        const surplus = ZONE_IDS.filter(id => routedBal[id] > 100)
          .sort((a, b) => routedBal[b] - routedBal[a])
        const deficit = ZONE_IDS.filter(id => routedBal[id] < -100)
          .sort((a, b) => routedBal[a] - routedBal[b])

        if (!surplus.length || !deficit.length) break

        let routed = false
        outer:
        for (const src of surplus) {
          for (const dst of deficit) {
            const r = dijkstraPath(src, dst, remCap, adj)
            if (!r || r.bottleneck <= 0) continue
            const amount = Math.min(routedBal[src], -routedBal[dst], r.bottleneck)
            if (amount < 10) continue

            routedBal[src] -= amount
            routedBal[dst] += amount
            regImport[src]  -= amount
            regImport[dst]  += amount

            for (let i = 0; i < r.path.length - 1; i++) {
              const a = r.path[i], b = r.path[i + 1]
              remCap.set(`${a}-${b}`, (remCap.get(`${a}-${b}`) ?? 0) - amount)
              remCap.set(`${b}-${a}`, (remCap.get(`${b}-${a}`) ?? 0) - amount)
            }

            const pairKey = `${src}:${dst}`
            flowPairMap.set(pairKey, (flowPairMap.get(pairKey) ?? 0) + amount * days)
            routed = true
            break outer
          }
        }
        if (!routed) break
      }

      // Battery + record hourly point per zone
      for (const id of ZONE_IDS) {
        const net = routedBal[id]
        let battCharge = 0, battDischarge = 0

        if (net > 0 && battCapMWhPerZone > 0) {
          battCharge = Math.min(net, battPowerMWhPerZone, (battCapMWhPerZone - battSOC[id]) / CHARGE_EFF)
          battSOC[id] += battCharge * CHARGE_EFF
        } else if (net < 0 && battCapMWhPerZone > 0) {
          battDischarge = Math.min(-net, battPowerMWhPerZone, battSOC[id] * DISCHARGE_EFF)
          battSOC[id]  -= battDischarge / DISCHARGE_EFF
        }

        const deficit     = Math.max(0, -(net + battDischarge))
        const curtailment = Math.max(0,  net - battCharge)
        const lp          = localProd[id]
        const { demand }  = hoursCache[id][m]

        zoneHours[id].push({
          hour: h,
          solar:           lp.solar,
          wind:            lp.wind,
          hydro:           lp.hydro,
          biomass:         lp.biomass,
          geothermal:      lp.geo,
          nuclear:         lp.nuclear,
          gas:             lp.gas,
          coal:            lp.coal,
          imports:         lp.imports,
          regionalImport:  regImport[id],
          batteryDischarge: battDischarge,
          batteryCharge:    battCharge,
          batterySOC:       battSOC[id],
          demand:           demand[h],
          deficit,
          curtailment,
        })
      }
    }

    // Aggregate daily totals and append ZoneDailyResult
    for (const id of ZONE_IDS) {
      const hrs = zoneHours[id]
      let solar = 0, wind = 0, hydro = 0, bio = 0, geo = 0
      let nuc = 0, gas = 0, coal = 0, imp = 0, regImp = 0
      let bch = 0, bdis = 0, dem = 0, def = 0, curt = 0, em = 0

      for (const hp of hrs) {
        solar += hp.solar; wind += hp.wind; hydro += hp.hydro
        bio   += hp.biomass; geo += hp.geothermal
        nuc   += hp.nuclear; gas += hp.gas; coal += hp.coal; imp += hp.imports
        regImp += hp.regionalImport
        bch    += hp.batteryCharge; bdis += hp.batteryDischarge
        dem    += hp.demand; def += hp.deficit; curt += hp.curtailment
        em     += hp.gas  * EMISSION_FACTORS.gas_ccgt / 1000
        em     += hp.coal * EMISSION_FACTORS.coal     / 1000
      }

      zoneMonths[id].push({
        monthIndex: m, monthLabel: MONTH_LABELS[m], hours: hrs,
        solarMWh: solar, windMWh: wind, hydroMWh: hydro,
        biomassMWh: bio, geothermalMWh: geo,
        nuclearMWh: nuc, gasMWh: gas, coalMWh: coal, importsMWh: imp,
        regionalImportMWh: regImp,
        batteryChargeMWh: bch, batteryDischargeMWh: bdis,
        demandMWh: dem, deficitMWh: def, curtailmentMWh: curt,
        emissionsTonnes: em,
      })

      // Accumulate annual zone totals
      const az = annZone[id]
      az.solar    += solar * days;  az.wind  += wind  * days;  az.hydro += hydro * days
      az.nonrenew += (nuc + gas + coal + imp + bio + geo) * days
      az.prod     += (solar + wind + hydro + nuc + gas + coal + imp + bio + geo) * days
      az.demand   += dem   * days
      az.imported += Math.max(0,  regImp) * days
      az.exported += Math.max(0, -regImp) * days
      az.emissions += em  * days
      az.deficit   += def  * days
      az.surplus   += curt * days
    }
  }

  // ── Build Level4Result ────────────────────────────────────────────────────────
  const zoneResults: Record<MarketZoneId, MarketZoneResult> = {} as Record<MarketZoneId, MarketZoneResult>
  let annDeficitMWh = 0, annSurplusMWh = 0, totalRenewMWh = 0, totalProdMWh = 0, totalEmissions = 0
  const zonesWithDeficit: MarketZoneId[] = []

  for (const id of ZONE_IDS) {
    const az = annZone[id]
    const routedBalance = az.surplus - az.deficit  // > 0 surplus, < 0 deficit

    zoneResults[id] = {
      zoneId: id, name: ZONES[id].name,
      solarGW:    allocation[id].solar,
      windGW:     allocation[id].wind,
      productionMWh:  az.prod,
      renewableMWh:   az.solar + az.wind + az.hydro,
      demandMWh:      az.demand,
      rawBalance:     az.prod - az.demand,
      routedBalance,
      importedMWh:    az.imported,
      exportedMWh:    az.exported,
      emissionsTonnes: az.emissions,
    }

    annDeficitMWh += az.deficit
    annSurplusMWh += az.surplus
    totalRenewMWh += az.solar + az.wind + az.hydro
    totalProdMWh  += az.prod
    totalEmissions += az.emissions
    if (az.deficit > az.demand * 0.001) zonesWithDeficit.push(id)
  }

  const flows: MarketZoneFlow[] = Array.from(flowPairMap.entries())
    .map(([key, mwh]) => {
      const [from, to] = key.split(':') as [MarketZoneId, MarketZoneId]
      return { from, to, energyMWh: mwh, path: [from, to] }
    })
    .sort((a, b) => b.energyMWh - a.energyMWh)

  return {
    zones: zoneResults,
    zoneMonths,
    flows,
    annualDeficitTWh:       annDeficitMWh / 1e6,
    annualSurplusTWh:       annSurplusMWh / 1e6,
    nationalRenewableShare: totalProdMWh > 0 ? totalRenewMWh / totalProdMWh : 0,
    emissionsMtAnnual:      totalEmissions / 1e6,
    zonesWithDeficit,
  }
}

// ─── Dijkstra: find highest-bottleneck path from start to end ─────────────────
function dijkstraPath(
  start: MarketZoneId,
  end:   MarketZoneId,
  capacities: Map<string, number>,
  adj:   Map<MarketZoneId, MarketZoneId[]>,
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
    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity
      if (d < minD) { minD = d; u = id }
    }
    if (!u || minD === Infinity) break
    if (u === end) break
    unvisited.delete(u)

    for (const v of (adj.get(u) ?? [])) {
      if (!unvisited.has(v)) continue
      const cap = Math.min(capacities.get(`${u}-${v}`) ?? 0, capacities.get(`${v}-${u}`) ?? 0)
      if (cap <= 0) continue
      const w  = 1 / cap
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
