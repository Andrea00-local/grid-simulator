import { useState } from 'react'
import { Leaf, Wind, Zap, Flame } from 'lucide-react'
import { useSimStore } from '@/store/simulationStore'
import { LevelIntro } from '@/components/layout/LevelIntro'
import { DataSources } from '@/components/ui/DataSources'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { EnergyMixChart } from '@/components/charts/EnergyMixChart'
import { EmissionsChart } from '@/components/charts/EmissionsChart'
import { BalanceIndicator } from '@/components/charts/BalanceIndicator'
import { KpiCard } from '@/components/charts/KpiCard'
import { formatPercent, formatMtCO2 } from '@/lib/utils'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

export default function Level1() {
  const [showIntro, setShowIntro] = useState(true)
  const result    = useSimStore((s) => s.result)
  const demandTWh = useSimStore((s) => s.demandTWh)

  const balanceTWh  = result.totalBalance / 1_000_000
  const emissionsMt = result.totalEmissionsMt
  const co2Change   = emissionsMt - ITALY_CO2_BASELINE_MT
  const prodTWh     = (result.totalDemand + result.totalBalance) / 1_000_000

  return (
    <>
      {showIntro && <LevelIntro level={1} onStart={() => setShowIntro(false)} />}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-1">
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">Livello 1</span>
          Bilancio Nazionale Annuale
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Costruisci il mix energetico italiano</h1>
        <p className="text-gray-500 text-sm mt-1">
          Rinnovabili in GW (produzione da capacity factor) · Fossili e nucleare in TWh (produzione diretta).
          Il bilancio può essere negativo — la domanda non si auto-copre.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Quota rinnovabile"
          value={formatPercent(result.renewableShare)}
          unit="%"
          sub="Baseline 2023: 39%"
          trend={result.renewableShare >= 0.5 ? 'good' : result.renewableShare >= 0.39 ? 'neutral' : 'bad'}
          icon={<Leaf className="w-3.5 h-3.5" />}
        />
        <KpiCard
          title="Emissioni CO₂"
          value={formatMtCO2(emissionsMt)}
          unit="MtCO₂"
          sub={`${co2Change >= 0 ? '+' : ''}${co2Change.toFixed(1)} Mt vs 2023`}
          trend={emissionsMt <= 35 ? 'good' : emissionsMt <= ITALY_CO2_BASELINE_MT ? 'neutral' : 'bad'}
          icon={<Wind className="w-3.5 h-3.5" />}
        />
        <KpiCard
          title={balanceTWh >= 0 ? 'Energia sprecata' : 'Domanda non coperta'}
          value={`${balanceTWh >= 0 ? '+' : '-'}${Math.abs(balanceTWh).toFixed(1)}`}
          unit="TWh"
          sub={balanceTWh >= 0 ? 'surplus annuale' : 'deficit annuale'}
          trend={Math.abs(balanceTWh) < 5 ? 'good' : balanceTWh >= 0 ? 'neutral' : 'bad'}
          icon={<Flame className="w-3.5 h-3.5" />}
        />
        <KpiCard
          title="Produzione totale"
          value={prodTWh.toFixed(0)}
          unit="TWh"
          sub={`Domanda: ${demandTWh} TWh`}
          trend="neutral"
          icon={<Zap className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="grid lg:grid-cols-[340px,1fr] gap-8">
        <ControlsPanel />

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <EnergyMixChart result={result} />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <EmissionsChart emissionsMt={emissionsMt} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <BalanceIndicator balanceTWh={balanceTWh} />
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Come funziona il modello</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Le <strong>rinnovabili</strong> producono in base al capacity factor (solare ~10%, eolico ~22%).
              Il <strong>termico e il nucleare</strong> producono esattamente i TWh impostati.
              Se produzione &lt; domanda il deficit è esplicito. Al <strong>Livello 2</strong> vedrai come
              questo bilancio nasconde squilibri mensili — mesi con surplus estivi e deficit invernali
              che non si eliminano tra loro senza storage.
            </p>
          </div>
        </div>
      </div>

      <DataSources level={1} />
    </div>
    </>
  )
}
