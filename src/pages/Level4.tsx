import { useState, useEffect, useMemo } from 'react'
import { Zap, MapPin } from 'lucide-react'
import { LevelIntro } from '@/components/layout/LevelIntro'
import { DataSources } from '@/components/ui/DataSources'
import { ObjectivesPanel } from '@/components/ui/ObjectivesPanel'
import { PrintButton } from '@/components/print/PrintButton'
import { ScenarioPrintHeader } from '@/components/print/ScenarioPrintHeader'
import { YearSelector } from '@/components/ui/YearSelector'
import { useSimStore } from '@/store/simulationStore'
import { LEVEL4_CONFIG } from '@/simulation/levels/level4'
import { computeLevel4 } from '@/models/balanceRegional'
import { ZONES, PLAN_LABELS } from '@/models/italianZones'
import { ItalyGeoMap } from '@/components/map/ItalyGeoMap'
import { ZoneDetail } from '@/components/map/ZoneDetail'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'
import * as RadixSlider from '@radix-ui/react-slider'
import type { MarketZoneId, DistributionPlan } from '@/models/types'

const PLANS: DistributionPlan[] = ['uniform', 'current2023', 'pniec2030', 'maximizeCF']

export default function Level4() {
  const [showIntro, setShowIntro] = useState(true)
  const setLevelConfig    = useSimStore(s => s.setLevelConfig)
  const renewableCapacity = useSimStore(s => s.renewableCapacity)
  const directProduction  = useSimStore(s => s.directProduction)
  const demandTWh         = useSimStore(s => s.demandTWh)

  const [plan, setPlan]         = useState<DistributionPlan>('current2023')
  const [txBoost, setTxBoost]   = useState(1.0)
  const [selected, setSelected] = useState<MarketZoneId | null>(null)

  useEffect(() => { setLevelConfig(LEVEL4_CONFIG) }, [setLevelConfig])

  const level4 = useMemo(
    () => computeLevel4(renewableCapacity, directProduction, demandTWh, plan, txBoost),
    [renewableCapacity, directProduction, demandTWh, plan, txBoost],
  )

  const coverage  = Math.max(0, 1 - level4.annualDeficitTWh / demandTWh)
  const avoidedMt = ITALY_CO2_BASELINE_MT - level4.emissionsMtAnnual

  return (
    <>
      {showIntro && <LevelIntro level={4} onStart={() => setShowIntro(false)} />}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <ScenarioPrintHeader
        level={4}
        levelName="Distribuzione Territoriale"
        coverage={coverage}
        renewableShare={level4.nationalRenewableShare}
        avoidedMt={avoidedMt}
        extraParams={[
          { label: 'Piano distribuzione', value: PLAN_LABELS[plan] },
          { label: 'Potenziamento rete', value: `${txBoost.toFixed(1)}×` },
          { label: 'Zone in deficit', value: `${level4.zonesWithDeficit.length} / 7` },
          { label: 'Surplus non instradabile', value: `${level4.annualSurplusTWh.toFixed(1)} TWh` },
        ]}
      />

      {/* Header */}
      <div className="mb-8 print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-violet-600 font-medium mb-1">
              <span className="bg-violet-600 text-white text-xs rounded-full px-2 py-0.5">Livello 4</span>
              Distribuzione Territoriale
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bilancio per zona di mercato</h1>
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
        renewableShare={level4.nationalRenewableShare}
        avoidedMt={avoidedMt}
      />

      {/* Zone deficit summary */}
      <div className="gs-card p-4 flex items-center gap-3 mb-8 -mt-2">
        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-500">Zone in deficit</span>
          <span className="ml-2 text-sm font-bold text-gray-800 tabular-nums">
            {level4.zonesWithDeficit.length} / 7
          </span>
        </div>
        <span className="text-xs text-gray-400 truncate">
          {level4.zonesWithDeficit.length === 0
            ? 'Tutte le zone sono bilanciate'
            : level4.zonesWithDeficit.map(id => ZONES[id].name).join(', ')}
        </span>
        <Zap className="w-4 h-4 text-gray-400 flex-shrink-0 ml-4" />
        <span className="text-xs text-gray-500">Surplus non instradabile</span>
        <span className="text-sm font-bold text-gray-800 tabular-nums ml-1">
          {level4.annualSurplusTWh.toFixed(1)} TWh
        </span>
      </div>

      <div className="space-y-5">

        {/* Map */}
        <div className="gs-card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Bilancio per zona di mercato
            <span className="ml-2 text-xs font-normal text-gray-400">Clicca per dettaglio</span>
          </h3>
          <ItalyGeoMap result={level4} selected={selected} onSelect={setSelected} />
          <div className="flex gap-3 mt-3 flex-wrap">
            {[
              { color: '#16a34a', label: 'Surplus >20%' },
              { color: '#86efac', label: 'Surplus 5-20%' },
              { color: '#fef08a', label: 'Bilanciato' },
              { color: '#fca5a5', label: 'Deficit 5-20%' },
              { color: '#dc2626', label: 'Deficit >20%' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Flow table */}
        {level4.flows.length > 0 && (
          <div className="gs-card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Principali flussi di energia ({level4.flows.length} rotte)
            </h3>
            <div className="space-y-1.5">
              {level4.flows
                .sort((a, b) => b.energyMWh - a.energyMWh)
                .slice(0, 8)
                .map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-gray-700 w-6 text-right">{i + 1}.</span>
                    <span className="text-gray-600">{ZONES[f.from].name}</span>
                    <span className="text-blue-400">→</span>
                    <span className="text-gray-600">{ZONES[f.to].name}</span>
                    {f.path.length > 2 && (
                      <span className="text-gray-400 text-[10px]">
                        via {f.path.slice(1, -1).map(id => ZONES[id].abbr).join('→')}
                      </span>
                    )}
                    <span className="ml-auto font-medium tabular-nums">
                      {(f.energyMWh / 1e6).toFixed(1)} TWh
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Educational callout */}
        <div className="gs-callout-violet p-4">
          <h3 className="text-sm font-semibold text-violet-800 mb-1">Perché la distribuzione conta</h3>
          <p className="text-xs text-violet-700 leading-relaxed">
            Il <strong>piano "Massimizza CF"</strong> concentra solare e eolico nelle zone più soleggiate
            e ventose (Sud, Calabria, Sicilia, Sardegna) — massimizza la produzione totale ma
            crea grandi surplus al Sud e deficit al Nord. Il piano <strong>"Uniforme"</strong> distribuisce
            per abitante ma spreca i migliori capacity factor meridionali.{' '}
            Il <strong>potenziamento rete</strong> sblocca i flussi verso Nord, ma la trasmissione ha
            limiti fisici (congestioni, costo delle infrastrutture). In Italia, il corridoio
            Sud→Centro è il collo di bottiglia storico del sistema elettrico.
          </p>
        </div>
      </div>

      {/* Distribution plan + transmission controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 print:hidden">

        <div className="gs-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Piano di distribuzione</h2>
          <p className="text-xs text-gray-400 mb-3">Come vengono allocate le rinnovabili nazionali alle zone</p>
          <div className="space-y-2">
            {PLANS.map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  plan === p
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {PLAN_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="gs-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Potenziamento trasmissione</h2>
          <p className="text-xs text-gray-400 mb-3">Moltiplicatore sulle capacità Terna (1× = attuale)</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">Capacità di rete</span>
            <span className="text-sm font-bold text-violet-600">{txBoost.toFixed(1)}×</span>
          </div>
          <RadixSlider.Root
            min={1.0} max={3.0} step={0.1}
            value={[txBoost]}
            onValueChange={([v]) => setTxBoost(v)}
            className="relative flex items-center select-none touch-none w-full h-4"
          >
            <RadixSlider.Track className="bg-gray-200 relative grow rounded-full h-1">
              <RadixSlider.Range className="absolute rounded-full h-full bg-violet-500" />
            </RadixSlider.Track>
            <RadixSlider.Thumb
              className="block w-3.5 h-3.5 rounded-full shadow cursor-pointer bg-violet-600"
              style={{ boxShadow: '0 0 0 2px white, 0 0 0 3px #7c3aed' }}
            />
          </RadixSlider.Root>
          <p className="text-xs text-gray-400 mt-2">
            {txBoost === 1.0 ? 'Rete attuale invariata' : `+${((txBoost - 1) * 100).toFixed(0)}% capacità su tutte le direttrici`}
          </p>
        </div>
      </div>

      <div className="mt-5 print:hidden">
        <ControlsPanel layout="horizontal" />
      </div>

      <div className="print:hidden">
        <DataSources level={4} />
      </div>

      {/* Zone detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setSelected(null)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${selected ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selected && (
          <ZoneDetail
            zoneId={selected}
            result={level4}
            flows={level4.flows}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
    </>
  )
}
