import { useState, useEffect } from 'react'
import { Leaf, Wind, Zap, Flame } from 'lucide-react'
import { useSimStore } from '@/store/simulationStore'
import { LevelIntro } from '@/components/layout/LevelIntro'
import { DataSources } from '@/components/ui/DataSources'
import { LEVEL2_CONFIG } from '@/simulation/levels/level2'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { EnergyMixChart } from '@/components/charts/EnergyMixChart'
import { EmissionsChart } from '@/components/charts/EmissionsChart'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { MonthlyMixChart } from '@/components/charts/MonthlyMixChart'
import { BalanceIndicator } from '@/components/charts/BalanceIndicator'
import { KpiCard } from '@/components/charts/KpiCard'
import { formatPercent, formatMtCO2 } from '@/lib/utils'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'
import { MONTH_LABELS } from '@/models/profiles'

export default function Level2() {
  const [showIntro, setShowIntro] = useState(true)
  const setLevelConfig = useSimStore((s) => s.setLevelConfig)
  const result         = useSimStore((s) => s.result)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  useEffect(() => {
    setLevelConfig(LEVEL2_CONFIG)
  }, [setLevelConfig])

  const emissionsMt = result.totalEmissionsMt
  const co2Change   = emissionsMt - ITALY_CO2_BASELINE_MT
  const surplusTWh  = result.totalSurplusMWh / 1_000_000
  const deficitTWh  = result.totalDeficitMWh / 1_000_000
  const netTWh      = result.totalBalance / 1_000_000

  const deficitMonths = result.periods
    .map((p, i) => ({ i, balance: p.balance / 1_000_000 }))
    .filter((m) => m.balance < -0.05)

  const selectedPeriod = selectedMonth !== null ? result.periods[selectedMonth] : null

  return (
    <>
      {showIntro && <LevelIntro level={2} onStart={() => setShowIntro(false)} />}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-1">
          <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5">Livello 2</span>
          Stagionalità Mensile
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Bilancio mese per mese</h1>
        <p className="text-gray-500 text-sm mt-1">
          Il termico copre la domanda residua in proporzione — ma nei mesi con alto solare il surplus
          non compensa il deficit invernale. Clicca su ogni mese per il dettaglio.
        </p>
      </div>

      {/* Annual KPIs */}
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
          title="Energia sprecata"
          value={`+${surplusTWh.toFixed(1)}`}
          unit="TWh"
          sub="Surplus mensili cumulati"
          trend={surplusTWh < 5 ? 'good' : 'neutral'}
          icon={<Flame className="w-3.5 h-3.5" />}
        />
        <KpiCard
          title="Domanda non coperta"
          value={`-${deficitTWh.toFixed(1)}`}
          unit="TWh"
          sub={
            deficitMonths.length === 0
              ? 'Nessun mese in deficit'
              : `${deficitMonths.length} mes${deficitMonths.length === 1 ? 'e' : 'i'}: ${deficitMonths.map((m) => MONTH_LABELS[m.i]).join(', ')}`
          }
          trend={deficitTWh < 1 ? 'good' : deficitTWh < 20 ? 'neutral' : 'bad'}
          icon={<Zap className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="grid lg:grid-cols-[340px,1fr] gap-8">
        <ControlsPanel />

        <div className="space-y-6">
          {/* Monthly chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <MonthlyChart
              periods={result.periods}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
            />
          </div>

          {/* Month pills */}
          <div className="flex flex-wrap gap-2">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Mix energetico — {selectedPeriod.label}
              </h3>
              <MonthlyMixChart period={selectedPeriod} />
            </div>
          )}

          {/* Gross balance summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <BalanceIndicator
              balanceTWh={netTWh}
              surplusTWh={surplusTWh}
              deficitTWh={deficitTWh}
              showGross
            />
          </div>

          {/* Annual charts */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <EnergyMixChart result={result} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <EmissionsChart emissionsMt={emissionsMt} />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
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

      <DataSources level={2} />
    </div>
    </>
  )
}
