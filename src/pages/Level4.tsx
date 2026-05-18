import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
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
import { TransmissionDetail } from '@/components/map/TransmissionDetail'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'
import { MEGAPACK_HOURS } from '@/models/hourlyProfiles'
import * as RadixSlider from '@radix-ui/react-slider'
import type { MarketZoneId, DistributionPlan } from '@/models/types'

const PLANS: DistributionPlan[] = ['attuale', 'moltoNord', 'moltoSud']

export default function Level4() {
  const [showIntro, setShowIntro] = useState(true)
  const setLevelConfig    = useSimStore(s => s.setLevelConfig)
  const renewableCapacity = useSimStore(s => s.renewableCapacity)
  const directProduction  = useSimStore(s => s.directProduction)
  const demandTWh         = useSimStore(s => s.demandTWh)

  const storagePowerGW = useSimStore(s => s.storagePowerGW)

  const [plan, setPlan]             = useState<DistributionPlan>('attuale')
  const [txBoost, setTxBoost]       = useState(1.0)
  const [selected, setSelected]     = useState<MarketZoneId | null>(null)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)

  function selectZone(id: MarketZoneId) { setSelected(id); setSelectedLink(null) }
  function selectLink(key: string)      { setSelectedLink(key); setSelected(null) }
  function closeDrawer()                { setSelected(null); setSelectedLink(null) }

  useEffect(() => { setLevelConfig(LEVEL4_CONFIG) }, [setLevelConfig])

  const level4 = useMemo(
    () => computeLevel4(renewableCapacity, directProduction, demandTWh, plan, txBoost, storagePowerGW),
    [renewableCapacity, directProduction, demandTWh, plan, txBoost, storagePowerGW],
  )

  const storageCapacityGWh = storagePowerGW * MEGAPACK_HOURS
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
          { label: 'Batteria', value: storageCapacityGWh > 0 ? `${storageCapacityGWh.toFixed(0)} GWh` : 'Nessuna' },
          { label: 'Zone in deficit', value: `${level4.zonesWithDeficit.length} / 7` },
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
            <span className="ml-2 text-xs font-normal text-gray-400">Clicca su zona o linea per dettaglio</span>
          </h3>
          <ItalyGeoMap
            result={level4}
            selected={selected}
            onSelect={selectZone}
            selectedLink={selectedLink}
            onSelectLink={selectLink}
          />
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

        {/* Flow bar chart */}
        {(() => {
          const chartData = level4.transmissionLinks
            .filter(l => l.annualFromToTWh + l.annualToFromTWh > 0.001)
            .map(l => ({
              label:  `${ZONES[l.from].abbr}↔${ZONES[l.to].abbr}`,
              fromTo: Math.round(l.annualFromToTWh * 10) / 10,
              toFrom: Math.round(l.annualToFromTWh * 10) / 10,
              util:   Math.round(l.utilizationPct),
              fromName: ZONES[l.from].name,
              toName:   ZONES[l.to].name,
            }))
            .sort((a, b) => (b.fromTo + b.toFrom) - (a.fromTo + a.toFrom))

          if (chartData.length === 0) return null

          return (
            <div className="gs-card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Flussi annuali sulle linee di trasmissione</h3>
              <div className="flex gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm inline-block bg-blue-500" />
                  Da → A
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm inline-block bg-orange-400" />
                  A → Da
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 10, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={44} unit=" TWh" />
                  <Tooltip
                    formatter={(v: unknown, name: string, entry: { payload?: { fromName: string; toName: string; util: number } }) => {
                      const d = entry.payload
                      const dir = name === 'fromTo' ? `${d?.fromName}→${d?.toName}` : `${d?.toName}→${d?.fromName}`
                      return [`${Number(v).toFixed(1)} TWh (util: ${d?.util ?? 0}%)`, dir]
                    }}
                    contentStyle={{ fontSize: 12 }}
                    wrapperStyle={{ zIndex: 9999 }}
                  />
                  <Bar dataKey="fromTo" name="fromTo" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="toFrom" name="toFrom" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        })()}
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
        <ControlsPanel layout="horizontal" showStorage />
      </div>

      <div className="print:hidden">
        <DataSources level={4} />
      </div>

      {/* Detail drawer backdrop */}
      {(selected || selectedLink) && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Detail drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${selected || selectedLink ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selected && (
          <ZoneDetail
            zoneId={selected}
            result={level4}
            flows={level4.flows}
            onClose={closeDrawer}
          />
        )}
        {selectedLink && (() => {
          const link = level4.transmissionLinks.find(l => l.key === selectedLink)
          return link ? <TransmissionDetail link={link} onClose={closeDrawer} /> : null
        })()}
      </div>
    </div>
    </>
  )
}
