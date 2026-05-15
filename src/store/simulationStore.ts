import { create } from 'zustand'
import type { CapacityMap, Scenario } from '@/models/types'
import type { SimConfig, LevelConfig } from '@/simulation/types'
import type { SimResult } from '@/models/types'
import { run } from '@/simulation/engine'
import { ITALY_2023, PNIEC_2030, NET_ZERO_2050, FULL_RENEWABLE, type GridScenario } from '@/models/italianGrid'
import { LEVEL1_CONFIG } from '@/simulation/levels/level1'

export type ScenarioId = 'italy2023' | 'pniec2030' | 'netzero2050' | 'fullRenewable'
export type TargetYear = 2030 | 2040 | 2050

export const SCENARIOS: Record<ScenarioId, { label: string } & GridScenario> = {
  italy2023:     { label: 'Italia 2023',      ...ITALY_2023 },
  pniec2030:     { label: 'PNIEC 2030',       ...PNIEC_2030 },
  netzero2050:   { label: 'Net Zero 2050',    ...NET_ZERO_2050 },
  fullRenewable: { label: '100% Rinnovabili', ...FULL_RENEWABLE },
}

interface SimState {
  levelConfig: LevelConfig
  renewableCapacity: CapacityMap    // GW
  directProduction: CapacityMap     // TWh
  demandTWh: number
  result: SimResult
  scenario: Scenario          // Level 3: weather condition
  storagePowerGW: number      // Level 3: installed battery power
  targetYear: TargetYear      // Reference year for projections

  setRenewableCapacity: (source: string, gw: number) => void
  setMultipleRenewable: (updates: CapacityMap) => void
  setDirectProduction: (source: string, twh: number) => void
  setDemand: (twh: number) => void
  loadScenario: (id: ScenarioId) => void
  setLevelConfig: (config: LevelConfig) => void
  setScenario: (s: Scenario) => void
  setStoragePower: (gw: number) => void
  setTargetYear: (year: TargetYear) => void
}

function buildConfig(lc: LevelConfig, rc: CapacityMap, dp: CapacityMap, demand: number): SimConfig {
  return {
    level: lc.level,
    resolution: lc.resolution,
    activeZones: lc.activeZones,
    renewableCapacity: rc,
    directProduction: dp,
    demandTWh: demand,
  }
}

const initResult = run(buildConfig(LEVEL1_CONFIG, { ...ITALY_2023.renewableCapacity }, { ...ITALY_2023.directProduction }, ITALY_2023.demandTWh))

export const useSimStore = create<SimState>()((set, get) => ({
  levelConfig:       LEVEL1_CONFIG,
  renewableCapacity: { ...ITALY_2023.renewableCapacity },
  directProduction:  { ...ITALY_2023.directProduction },
  demandTWh:         ITALY_2023.demandTWh,
  result:            initResult,
  scenario:          'average' as Scenario,
  storagePowerGW:    0,
  targetYear:        2030,

  setRenewableCapacity(source, gw) {
    const renewableCapacity = { ...get().renewableCapacity, [source]: gw }
    const result = run(buildConfig(get().levelConfig, renewableCapacity, get().directProduction, get().demandTWh))
    set({ renewableCapacity, result })
  },

  setMultipleRenewable(updates) {
    const renewableCapacity = { ...get().renewableCapacity, ...updates }
    const result = run(buildConfig(get().levelConfig, renewableCapacity, get().directProduction, get().demandTWh))
    set({ renewableCapacity, result })
  },

  setDirectProduction(source, twh) {
    const directProduction = { ...get().directProduction, [source]: twh }
    const result = run(buildConfig(get().levelConfig, get().renewableCapacity, directProduction, get().demandTWh))
    set({ directProduction, result })
  },

  setDemand(twh) {
    const result = run(buildConfig(get().levelConfig, get().renewableCapacity, get().directProduction, twh))
    set({ demandTWh: twh, result })
  },

  loadScenario(id) {
    const s = SCENARIOS[id]
    const renewableCapacity = { ...s.renewableCapacity }
    const directProduction  = { ...s.directProduction }
    const demandTWh         = s.demandTWh
    const result = run(buildConfig(get().levelConfig, renewableCapacity, directProduction, demandTWh))
    const targetYear: TargetYear = (id === 'pniec2030' || id === 'italy2023') ? 2030 : 2050
    set({ renewableCapacity, directProduction, demandTWh, result, targetYear })
  },

  setLevelConfig(config) {
    const result = run(buildConfig(config, get().renewableCapacity, get().directProduction, get().demandTWh))
    set({ levelConfig: config, result })
  },

  setScenario(s) { set({ scenario: s }) },
  setStoragePower(gw) { set({ storagePowerGW: gw }) },
  setTargetYear(year) { set({ targetYear: year }) },
}))
