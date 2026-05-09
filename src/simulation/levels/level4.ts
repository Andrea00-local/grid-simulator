import type { LevelConfig } from '../types'

export const LEVEL4_CONFIG: LevelConfig = {
  level: 4,
  title: 'Distribuzione Territoriale',
  subtitle: 'Bilancio per regione con routing Dijkstra sulle linee Terna.',
  resolution: 'monthly',
  activeZones: ['national'],
  hasStorage: false,
  hasTransmission: true,
}
