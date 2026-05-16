// ─── Temporal & spatial dimensions ────────────────────────────────────────────
export type Resolution = 'annual' | 'monthly' | 'hourly'

export type Scenario = 'bad' | 'average' | 'good'

export type Zone =
  | 'national'
  | 'nord'
  | 'cnord'
  | 'csud'
  | 'sud'
  | 'sicilia'
  | 'sardegna'

// ─── Energy sources ────────────────────────────────────────────────────────────
export type Source =
  | 'solar'
  | 'wind_onshore'
  | 'wind_offshore'
  | 'hydro_run'
  | 'hydro_reservoir'
  | 'biomass'
  | 'geothermal'
  | 'nuclear'
  | 'gas_ccgt'
  | 'gas_ocgt'
  | 'coal'
  | 'imports'

export type SourceCategory = 'renewable' | 'dispatchable' | 'import'

export interface SourceDefinition {
  id: Source
  label: string
  labelShort: string
  color: string
  category: SourceCategory
  /** gCO₂/kWh — operational emissions */
  emissionFactor: number
  /** Is it intermittent (capacity factor from profiles) or dispatchable? */
  dispatchable: boolean
  /** GW slider range */
  sliderMin: number
  sliderMax: number
  sliderStep: number
}

// ─── Installed capacity ────────────────────────────────────────────────────────
/** GW installed per source per zone */
export type CapacityMap = Partial<Record<Source, number>>
export type ZoneCapacityMap = Partial<Record<Zone, CapacityMap>>

// ─── Simulation output ────────────────────────────────────────────────────────
export interface PeriodResult {
  /** Label: '2023', 'Gen', '00:00', etc. */
  label: string
  /** MWh produced per source */
  production: Record<Source, number>
  /** MWh demanded */
  demand: number
  /** MWh surplus (positive) or deficit (negative) */
  balance: number
  /** MWh curtailed (renewables turned off because excess) */
  curtailment: number
  /** tCO₂ emitted in this period */
  emissions: number
}

// ─── Level 3 hourly output ────────────────────────────────────────────────────
export interface HourlyPoint {
  hour: number
  production: Record<Source, number>  // MWh
  batteryDischarge: number            // MWh delivered to grid
  batteryCharge: number               // MWh absorbed from grid
  batterySOC: number                  // MWh state-of-charge at end of hour
  demand: number                      // MWh
  deficit: number                     // MWh unmet demand
  curtailment: number                 // MWh excess beyond storage
}

export interface DailySimResult {
  monthIndex: number
  monthLabel: string
  hours: HourlyPoint[]
  dailyDemandMWh: number
  dailyProductionMWh: number      // sum of all sources (no battery)
  dailySurplusMWh: number         // sum of hourly curtailment
  dailyDeficitMWh: number         // sum of hourly deficit
  dailyBatteryCycledMWh: number   // sum of battery discharge
  dailyRenewMWh: number           // sum of renewable source production
  renewableShareDay: number
  emissionsTonnes: number
}

export interface Level3Result {
  months: DailySimResult[]
  annualDemandTWh: number
  annualDeficitTWh: number
  annualSurplusTWh: number
  annualBatteryCycledTWh: number
  renewableShareAnnual: number
  emissionsMtAnnual: number
}

export interface SimResult {
  periods: PeriodResult[]
  /** Aggregated TWh per source over all periods */
  totalProductionBySource: Record<Source, number>
  /** Total TWh demanded */
  totalDemand: number
  /** MtCO₂ total */
  totalEmissionsMt: number
  /** Renewable fraction 0–1 */
  renewableShare: number
  /** Net balance = surplus - deficit (MWh). Can be 0 even when both exist. */
  totalBalance: number
  /** Sum of positive period balances (MWh) — energy wasted / curtailed */
  totalSurplusMWh: number
  /** Sum of |negative| period balances (MWh) — unmet demand */
  totalDeficitMWh: number
}

// ─── Level 4 regional types ────────────────────────────────────────────────────

export type RegionId =
  'vda' | 'pie' | 'lig' | 'lom' | 'taa' | 'ven' | 'fvg' | 'emr' |
  'tos' | 'umb' | 'mar' | 'laz' | 'abr' | 'mol' |
  'cam' | 'pug' | 'bas' | 'cal' |
  'sic' | 'sar'

// Terna 7-zone market model
export type MarketZoneId = 'nord' | 'cnord' | 'csud' | 'sud' | 'cal' | 'sic' | 'sar'

export type DistributionPlan = 'uniform' | 'current2023' | 'pniec2030' | 'maximizeCF'

export interface MarketZoneResult {
  zoneId: MarketZoneId
  name: string
  solarGW: number
  windGW: number
  productionMWh: number
  renewableMWh: number
  demandMWh: number
  rawBalance: number
  routedBalance: number
  importedMWh: number
  exportedMWh: number
  emissionsTonnes: number
}

export interface MarketZoneFlow {
  from: MarketZoneId
  to: MarketZoneId
  energyMWh: number
  path: MarketZoneId[]
}

export interface Level4Result {
  zones: Record<MarketZoneId, MarketZoneResult>
  flows: MarketZoneFlow[]
  annualDeficitTWh: number
  annualSurplusTWh: number
  nationalRenewableShare: number
  emissionsMtAnnual: number
  zonesWithDeficit: MarketZoneId[]
}
