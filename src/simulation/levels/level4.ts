import type { LevelConfig } from '../types'

export const LEVEL4_CONFIG: LevelConfig = {
  level: 4,
  title: 'Distribuzione Territoriale',
  subtitle: 'Bilancio orario per zona con routing Dijkstra e stoccaggio.',
  resolution: 'monthly',
  activeZones: ['national'],
  hasStorage: true,
  hasTransmission: true,
}
