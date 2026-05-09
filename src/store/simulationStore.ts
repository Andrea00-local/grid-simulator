import { create } from 'zustand'
import type { CapacityMap, Scenario } from '@/models/types'
import type { SimConfig, LevelConfig } from '@/simulation/types'
import type { SimResult } from '@/models/types'
import { run } from '@/simulation/engine'
import { ITALY_2023, PNIEC_2030, NET_ZERO_2050, FULL_RENEWABLE, type GridScenario } from '@/models/italianGrid'
import { LEVEL1_CONFIG } from '@/simulation/levels/level1'

export type ScenarioId = 'italy2023' | 'pniec2030' | 'netzero2050' | 'fullRenewable'

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

  setRenewableCapacity: (source: string, gw: number) => void
  setMultipleRenewable: (updates: CapacityMap) => void
  setDirectProduction: (source: string, twh: number) => void
  setDemand: (twh: number) => void
  loadScenario: (id: ScenarioId) => void
  setLevelConfig: (config: LevelConfig) => void
  setScenario: (s: Scenario) => void
  setStoragePower: (gw: number) => void
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

const init = ITALY_2023
const initResult = run(buildConfig(LEVEL1_CONFIG, init.renewableCapacity, init.directProduction, init.demandTWh))

export const useSimStore = create<SimState>()((set, get) => ({
  levelConfig:       LEVEL1_CONFIG,
  renewableCapacity: { ...init.renewableCapacity },
  directProduction:  { ...init.directProduction },
  demandTWh:         init.demandTWh,
  result:            initResult,
  scenario:          'average' as Scenario,
  storagePowerGW:    0,

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
    set({ renewableCapacity, directProduction, demandTWh, result })
  },

  setLevelConfig(config) {
    const result = run(buildConfig(config, get().renewableCapacity, get().directProduction, get().demandTWh))
    set({ levelConfig: config, result })
  },

  setScenario(s) { set({ scenario: s }) },
  setStoragePower(gw) { set({ storagePowerGW: gw }) },
}))
