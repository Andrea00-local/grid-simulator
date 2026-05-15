import { useState, useEffect } from 'react'
import { useSimStore } from '@/store/simulationStore'
import { LEVEL1_CONFIG } from '@/simulation/levels/level1'
import { LevelIntro } from '@/components/layout/LevelIntro'
import { DataSources } from '@/components/ui/DataSources'
import { ObjectivesPanel } from '@/components/ui/ObjectivesPanel'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { EnergyDonutChart } from '@/components/charts/EnergyDonutChart'
import { EmissionsChart } from '@/components/charts/EmissionsChart'
import { BalanceIndicator } from '@/components/charts/BalanceIndicator'
import { PrintButton } from '@/components/print/PrintButton'
import { ScenarioPrintHeader } from '@/components/print/ScenarioPrintHeader'
import { YearSelector } from '@/components/ui/YearSelector'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

export default function Level1() {
  const [showIntro, setShowIntro] = useState(true)
  const setLevelConfig = useSimStore(s => s.setLevelConfig)
  const result = useSimStore((s) => s.result)

  useEffect(() => { setLevelConfig(LEVEL1_CONFIG) }, [setLevelConfig])

  const balanceTWh  = result.totalBalance / 1_000_000
  const emissionsMt = result.totalEmissionsMt
  const coverage    = Math.max(0, 1 - result.totalDeficitMWh / result.totalDemand)
  const avoidedMt   = ITALY_CO2_BASELINE_MT - emissionsMt

  return (
    <>
      {showIntro && <LevelIntro level={1} onStart={() => setShowIntro(false)} />}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <ScenarioPrintHeader
        level={1}
        levelName="Bilancio Nazionale Annuale"
        coverage={coverage}
        renewableShare={result.renewableShare}
        avoidedMt={avoidedMt}
      />

      <div className="mb-8 print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-1">
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">Livello 1</span>
              Bilancio Nazionale Annuale
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Costruisci il mix energetico italiano</h1>
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
        <div className="gs-card p-5">
          <EnergyDonutChart result={result} />
        </div>

        <div className="print:hidden">
          <ControlsPanel layout="horizontal" />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="gs-card p-5">
            <EmissionsChart emissionsMt={emissionsMt} />
          </div>
          <div className="gs-card p-5">
            <BalanceIndicator balanceTWh={balanceTWh} />
          </div>
        </div>

      </div>

      <div className="print:hidden">
        <DataSources level={1} />
      </div>
    </div>
    </>
  )
}
