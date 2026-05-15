import { useState, useEffect, useMemo } from 'react'
import { useSimStore } from '@/store/simulationStore'
import { LevelIntro } from '@/components/layout/LevelIntro'
import { DataSources } from '@/components/ui/DataSources'
import { ObjectivesPanel } from '@/components/ui/ObjectivesPanel'
import { LEVEL2_CONFIG } from '@/simulation/levels/level2'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { EmissionsChart } from '@/components/charts/EmissionsChart'
import { MonthlyStreamChart } from '@/components/charts/MonthlyStreamChart'
import { BalanceIndicator } from '@/components/charts/BalanceIndicator'
import { SourceBreakdownPanel } from '@/components/charts/SourceBreakdownPanel'
import { PrintButton } from '@/components/print/PrintButton'
import { ScenarioPrintHeader } from '@/components/print/ScenarioPrintHeader'
import { YearSelector } from '@/components/ui/YearSelector'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import type { Source } from '@/models/types'

const ALL_SOURCES: Source[] = [
  'coal', 'gas_ocgt', 'gas_ccgt', 'imports',
  'nuclear', 'biomass', 'geothermal',
  'wind_onshore', 'wind_offshore',
  'solar',
]

export default function Level2() {
  const [showIntro, setShowIntro] = useState(true)
  const setLevelConfig = useSimStore((s) => s.setLevelConfig)
  const result         = useSimStore((s) => s.result)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  useEffect(() => {
    setLevelConfig(LEVEL2_CONFIG)
  }, [setLevelConfig])

  const emissionsMt = result.totalEmissionsMt
  const surplusTWh  = result.totalSurplusMWh / 1_000_000
  const deficitTWh  = result.totalDeficitMWh / 1_000_000
  const netTWh      = result.totalBalance / 1_000_000
  const coverage    = Math.max(0, 1 - result.totalDeficitMWh / result.totalDemand)
  const avoidedMt   = ITALY_CO2_BASELINE_MT - emissionsMt

  const breakdownEntries = useMemo(() => {
    const periodData = selectedMonth !== null
      ? [result.periods[selectedMonth]]
      : result.periods

    const entries = ALL_SOURCES
      .map(src => {
        const value = periodData.reduce((s, p) => s + (p.production[src] ?? 0), 0) / 1_000_000
        return { key: src as string, label: SOURCE_DEFINITIONS[src].labelShort, color: SOURCE_DEFINITIONS[src].color, value, unit: 'TWh' }
      })
      .filter(e => e.value > 0.01)

    const hydroValue = periodData.reduce(
      (s, p) => s + (p.production['hydro_run'] ?? 0) + (p.production['hydro_reservoir'] ?? 0), 0,
    ) / 1_000_000
    if (hydroValue > 0.01) entries.push({ key: 'hydro', label: 'Idroelettrico', color: '#14B8A6', value: hydroValue, unit: 'TWh' })

    return entries
  }, [result.periods, selectedMonth])

  const breakdownTitle = selectedMonth !== null ? result.periods[selectedMonth].label : 'Anno intero'

  return (
    <>
      {showIntro && <LevelIntro level={2} onStart={() => setShowIntro(false)} />}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <ScenarioPrintHeader
        level={2}
        levelName="Stagionalità Mensile"
        coverage={coverage}
        renewableShare={result.renewableShare}
        avoidedMt={avoidedMt}
      />

      <div className="mb-8 print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-1">
              <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5">Livello 2</span>
              Stagionalità Mensile
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bilancio mese per mese</h1>
              <button
                onClick={() => setShowIntro(true)}
                className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-[11px] font-bold flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Informazioni su questo livello"
              >?</button>
            </div>
          </div>
          <PrintButton className="mt-1 flex-shrink-0" />
        </div>
        <YearSelector />
      </div>

      <ObjectivesPanel
        coverage={coverage}
        renewableShare={result.renewableShare}
        avoidedMt={avoidedMt}
      />

      <div className="space-y-6">
        {/* Month pills — above chart */}
        <div className="flex flex-wrap gap-2 print:hidden">
          {result.periods.map((p, i) => {
            const rawBal = p.balance / 1_000_000
            const demandTWh = p.demand / 1_000_000
            const withinMargin = rawBal < 0 && Math.abs(rawBal) < demandTWh * 0.01
            const bal = withinMargin ? 0 : rawBal
            const isSurplus = bal >= 0
            const isSelected = selectedMonth === i
            return (
              <button
                key={i}
                onClick={() => setSelectedMonth(isSelected ? null : i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-gray-900 text-white border-gray-900'
                    : isSurplus
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
              >
                {p.label}
                <span className="ml-1.5 opacity-75">
                  {bal === 0 ? '0' : `${isSurplus ? '+' : ''}${bal.toFixed(1)}`}
                </span>
              </button>
            )
          })}
          <span className="text-xs text-gray-400 self-center ml-1">TWh/mese</span>
        </div>

        {/* Monthly stream chart with breakdown panel */}
        <div className="gs-card p-5">
          <div className="grid grid-cols-[1fr,220px] gap-4 items-start">
            <MonthlyStreamChart
              periods={result.periods}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              selectedSource={selectedSource}
              onSelectSource={setSelectedSource}
            />
            <SourceBreakdownPanel
              entries={breakdownEntries}
              selectedSource={selectedSource}
              onSelectSource={setSelectedSource}
              title={breakdownTitle}
            />
          </div>
        </div>

        {/* Controls immediately below main chart */}
        <div className="print:hidden">
          <ControlsPanel layout="horizontal" />
        </div>

        {/* Gross balance summary */}
        <div className="gs-card p-5">
          <BalanceIndicator
            balanceTWh={netTWh}
            surplusTWh={surplusTWh}
            deficitTWh={deficitTWh}
            showGross
          />
        </div>

        {/* Annual emissions */}
        <div className="gs-card p-5">
          <EmissionsChart emissionsMt={emissionsMt} />
        </div>

      </div>

      <div className="print:hidden">
        <DataSources level={2} />
      </div>
    </div>
    </>
  )
}
