import { useState, useEffect } from 'react'
import { useSimStore } from '@/store/simulationStore'
import { LevelIntro } from '@/components/layout/LevelIntro'
import { DataSources } from '@/components/ui/DataSources'
import { ObjectivesPanel } from '@/components/ui/ObjectivesPanel'
import { LEVEL2_CONFIG } from '@/simulation/levels/level2'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { EmissionsChart } from '@/components/charts/EmissionsChart'
import { MonthlyStreamChart } from '@/components/charts/MonthlyStreamChart'
import { MonthlyMixChart } from '@/components/charts/MonthlyMixChart'
import { BalanceIndicator } from '@/components/charts/BalanceIndicator'
import { PrintButton } from '@/components/print/PrintButton'
import { ScenarioPrintHeader } from '@/components/print/ScenarioPrintHeader'
import { YearSelector } from '@/components/ui/YearSelector'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

export default function Level2() {
  const [showIntro, setShowIntro] = useState(true)
  const setLevelConfig = useSimStore((s) => s.setLevelConfig)
  const result         = useSimStore((s) => s.result)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  useEffect(() => {
    setLevelConfig(LEVEL2_CONFIG)
  }, [setLevelConfig])

  const emissionsMt = result.totalEmissionsMt
  const surplusTWh  = result.totalSurplusMWh / 1_000_000
  const deficitTWh  = result.totalDeficitMWh / 1_000_000
  const netTWh      = result.totalBalance / 1_000_000
  const coverage    = Math.max(0, 1 - result.totalDeficitMWh / result.totalDemand)
  const avoidedMt   = ITALY_CO2_BASELINE_MT - emissionsMt

  const selectedPeriod = selectedMonth !== null ? result.periods[selectedMonth] : null

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bilancio mese per mese</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Il termico copre la domanda residua in proporzione — ma nei mesi con alto solare il surplus
              non compensa il deficit invernale. Clicca su ogni mese per il dettaglio.
            </p>
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

      <div className="grid lg:grid-cols-[340px,1fr] gap-8 print:grid-cols-1">
        <div className="print:hidden">
          <ControlsPanel />
        </div>

        <div className="space-y-6">
          {/* Monthly stream chart */}
          <div className="gs-card p-5">
            <MonthlyStreamChart
              periods={result.periods}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
            />
          </div>

          {/* Month pills */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {result.periods.map((p, i) => {
              const bal = p.balance / 1_000_000
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
                    {isSurplus ? '+' : ''}{bal.toFixed(1)}
                  </span>
                </button>
              )
            })}
            <span className="text-xs text-gray-400 self-center ml-1">TWh/mese</span>
          </div>

          {/* Month detail */}
          {selectedPeriod && (
            <div className="gs-card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Mix energetico — {selectedPeriod.label}
              </h3>
              <MonthlyMixChart period={selectedPeriod} />
            </div>
          )}

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

          <div className="gs-callout-emerald p-4">
            <h3 className="text-sm font-semibold text-emerald-800 mb-1">Il punto chiave del Livello 2</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Il bilancio annuale netto può essere zero, ma nascondere <strong>surplus estivi</strong> (solare
              in eccesso) e <strong>deficit invernali</strong> (solare basso + domanda alta) che non si
              eliminano tra loro. La differenza tra surplus lordo e deficit lordo è la quantità di storage
              inter-stagionale che servirebbe per coprire il fabbisogno senza combustibili fossili. Al
              <strong> Livello 3</strong> introduremo lo storage per valorizzare il surplus.
            </p>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <DataSources level={2} />
      </div>
    </div>
    </>
  )
}
