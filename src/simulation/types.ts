import type { Resolution, Zone, CapacityMap } from '@/models/types'

export interface LevelConfig {
  level: 1 | 2 | 3 | 4
  title: string
  subtitle: string
  resolution: Resolution
  activeZones: Zone[]
  hasStorage: boolean
  hasTransmission: boolean
}

export interface SimConfig {
  level: 1 | 2 | 3 | 4
  resolution: Resolution
  activeZones: Zone[]
  /** GW installed — solar, wind, hydro, geo, biomass */
  renewableCapacity: CapacityMap
  /** TWh of direct production — nuclear, gas, coal, imports */
  directProduction: CapacityMap
  demandTWh: number
  storageMWh?: number
}
