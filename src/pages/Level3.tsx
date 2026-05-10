import { useState, useEffect, useMemo } from 'react'
import { LevelIntro } from '@/components/layout/LevelIntro'
import { DataSources } from '@/components/ui/DataSources'
import { ObjectivesPanel } from '@/components/ui/ObjectivesPanel'
import { Zap, BatteryCharging } from 'lucide-react'
import { useSimStore } from '@/store/simulationStore'
import { LEVEL3_CONFIG } from '@/simulation/levels/level3'
import { computeLevel3 } from '@/models/balanceHourly'
import { MEGAPACK_HOURS } from '@/models/hourlyProfiles'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { HourlyDispatchChart } from '@/components/charts/HourlyDispatchChart'
import { SourceBreakdownPanel } from '@/components/charts/SourceBreakdownPanel'
import { PrintButton } from '@/components/print/PrintButton'
import { ScenarioPrintHeader } from '@/components/print/ScenarioPrintHeader'
import { YearSelector } from '@/components/ui/YearSelector'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import type { Scenario, Source } from '@/models/types'

const STACK_ORDER_L3: Source[] = [
  'nuclear', 'coal', 'imports', 'biomass', 'geothermal',
  'hydro_run', 'hydro_reservoir',
  'wind_offshore', 'wind_onshore', 'solar',
  'gas_ccgt',
]

const SCENARIO_CONFIG: Record<Scenario, { label: string; desc: string; color: string }> = {
  bad:     { label: 'Giornata pessima',  desc: 'Cielo coperto, vento calmo',       color: 'red'   },
  average: { label: 'Giornata media',    desc: 'Condizioni tipiche del mese',      color: 'blue'  },
  good:    { label: 'Giornata ottima',   desc: 'Soleggiato e ventoso',             color: 'green' },
}

const SCENARIO_RING: Record<string, string> = {
  red:   'bg-red-50   border-red-200   text-red-700',
  blue:  'bg-blue-50  border-blue-100  text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
}

const SCENARIO_ACTIVE: Record<string, string> = {
  red:   'bg-red-500   text-white border-red-500',
  blue:  'bg-blue-600  text-white border-blue-600',
  green: 'bg-green-500 text-white border-green-500',
}

export default function Level3() {
  const [showIntro, setShowIntro] = useState(true)
  const setLevelConfig       = useSimStore(s => s.setLevelConfig)
  const renewableCapacity    = useSimStore(s => s.renewableCapacity)
  const directProduction     = useSimStore(s => s.directProduction)
  const demandTWh            = useSimStore(s => s.demandTWh)
  const scenario             = useSimStore(s => s.scenario)
  const setScenario          = useSimStore(s => s.setScenario)
  const storagePowerGW       = useSimStore(s => s.storagePowerGW)

  const [selectedMonth, setSelectedMonth] = useState<number>(6)  // default: July
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  useEffect(() => { setLevelConfig(LEVEL3_CONFIG) }, [setLevelConfig])

  const level3 = useMemo(
    () => computeLevel3(renewableCapacity, directProduction, demandTWh, scenario, storagePowerGW),
    [renewableCapacity, directProduction, demandTWh, scenario, storagePowerGW],
  )

  const storageCapacityGWh = storagePowerGW * MEGAPACK_HOURS
  const selectedDay = level3.months[selectedMonth]
  const coverage    = Math.max(0, 1 - level3.annualDeficitTWh / level3.annualDemandTWh)
  const avoidedMt   = ITALY_CO2_BASELINE_MT - level3.emissionsMtAnnual

  const hasBattery = storagePowerGW > 0

  const breakdownEntries = useMemo(() => {
    const hours = selectedDay.hours
    const result: { key: string; label: string; color: string; value: number; unit: string }[] =
      STACK_ORDER_L3
        .map(src => ({
          key: src as string,
          label: SOURCE_DEFINITIONS[src].labelShort,
          color: SOURCE_DEFINITIONS[src].color,
          value: hours.reduce((s, hp) => s + (hp.production[src] ?? 0), 0) / 1_000,
          unit: 'GWh',
        }))
        .filter(e => e.value > 0.01)

    if (hasBattery) {
      const battValue = hours.reduce((s, hp) => s + hp.batteryDischarge, 0) / 1_000
      if (battValue > 0.01) {
        result.push({
          key: 'battery',
          label: 'Batteria',
          color: '#14b8a6',
          value: battValue,
          unit: 'GWh',
        })
      }
    }

    return result
  }, [selectedDay, hasBattery])

  return (
    <>
      {showIntro && <LevelIntro level={3} onStart={() => setShowIntro(false)} />}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <ScenarioPrintHeader
        level={3}
        levelName="Giorno Tipo Orario"
        coverage={coverage}
        renewableShare={level3.renewableShareAnnual}
        avoidedMt={avoidedMt}
        extraParams={[
          { label: 'Condizioni meteo', value: SCENARIO_CONFIG[scenario].label },
          { label: 'Mese visualizzato', value: level3.months[selectedMonth].monthLabel },
          { label: 'Storage BESS', value: storagePowerGW > 0 ? `${storagePowerGW} GW / ${storageCapacityGWh.toFixed(0)} GWh` : 'Non installato' },
        ]}
      />

      {/* Header */}
      <div className="mb-8 print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-amber-600 font-medium mb-1">
              <span className="bg-amber-600 text-white text-xs rounded-full px-2 py-0.5">Livello 3</span>
              Giorno Tipo Orario
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bilancio orario con storage</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Un giorno lavorativo tipo per ogni mese — scegli le condizioni meteo e installa batterie
              per ridurre i picchi di gas. Il duck curve del solare diventa visibile ora per ora.
            </p>
          </div>
          <PrintButton className="mt-1 flex-shrink-0" />
        </div>
        <YearSelector />
      </div>

      <ObjectivesPanel
        coverage={coverage}
        renewableShare={level3.renewableShareAnnual}
        avoidedMt={avoidedMt}
      />

      {/* Storage KPI */}
      <div className="gs-card p-4 flex items-center gap-3 mb-8 -mt-2">
        <BatteryCharging className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-500">Energia stoccata annua</span>
          <span className="ml-2 text-sm font-bold text-gray-800 tabular-nums">
            {level3.annualBatteryCycledTWh < 0.1 ? '—' : `${level3.annualBatteryCycledTWh.toFixed(1)} TWh`}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {storagePowerGW > 0 ? `${storagePowerGW} GW / ${storageCapacityGWh.toFixed(0)} GWh installati` : 'Nessuna batteria installata'}
        </span>
      </div>

      {/* Main layout */}
      <div className="space-y-5">

          {/* Scenario selector */}
          <div className="gs-card p-5 print:hidden">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Condizioni meteorologiche</h3>
            <div className="flex gap-2">
              {(Object.keys(SCENARIO_CONFIG) as Scenario[]).map(s => {
                const cfg = SCENARIO_CONFIG[s]
                const isActive = scenario === s
                return (
                  <button
                    key={s}
                    onClick={() => setScenario(s)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? SCENARIO_ACTIVE[cfg.color]
                        : `border-gray-200 text-gray-600 hover:${SCENARIO_RING[cfg.color]}`
                    }`}
                  >
                    <div>{cfg.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                      {cfg.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Month pills */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {level3.months.map((day, i) => {
              const netGWh = (day.dailyBatteryCycledMWh + day.dailyProductionMWh - day.dailyDemandMWh) / 1_000
              const hasDeficit = day.dailyDeficitMWh > 0.5
              const isSelected = selectedMonth === i
              return (
                <button
                  key={i}
                  onClick={() => setSelectedMonth(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-gray-900 text-white border-gray-900'
                      : hasDeficit
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  }`}
                >
                  {day.monthLabel}
                  {hasDeficit && (
                    <span className="ml-1 opacity-75">
                      -{(day.dailyDeficitMWh / 1_000).toFixed(1)}
                    </span>
                  )}
                  {!hasDeficit && netGWh > 0.1 && (
                    <span className="ml-1 opacity-75">+{netGWh.toFixed(1)}</span>
                  )}
                </button>
              )
            })}
            <span className="text-xs text-gray-400 self-center ml-1">GWh/giorno</span>
          </div>

          {/* Hourly dispatch chart with breakdown panel */}
          <div className="gs-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Dispacciamento orario — {selectedDay.monthLabel} ({SCENARIO_CONFIG[scenario].label.toLowerCase()})
              </h3>
              <div className="flex gap-3 text-xs text-gray-500">
                {selectedDay.dailyDeficitMWh > 0.5 && (
                  <span className="text-red-600 font-medium">
                    Deficit: {(selectedDay.dailyDeficitMWh / 1_000).toFixed(1)} GWh
                  </span>
                )}
                {selectedDay.dailySurplusMWh > 0.5 && (
                  <span className="text-amber-600 font-medium">
                    Surplus: {(selectedDay.dailySurplusMWh / 1_000).toFixed(1)} GWh
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-[1fr,220px] gap-4 items-start">
              <HourlyDispatchChart
                hours={selectedDay.hours}
                storageCapacityGWh={storageCapacityGWh > 0 ? storageCapacityGWh : undefined}
                selectedSource={selectedSource}
                onSelectSource={setSelectedSource}
              />
              <SourceBreakdownPanel
                entries={breakdownEntries}
                selectedSource={selectedSource}
                onSelectSource={setSelectedSource}
                title={selectedDay.monthLabel}
              />
            </div>
          </div>

          {/* Daily KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Domanda giornaliera',
                value: `${(selectedDay.dailyDemandMWh / 1_000).toFixed(0)} GWh`,
                sub: `≈ ${(selectedDay.dailyDemandMWh / 1_000 / 24).toFixed(1)} GW media`,
              },
              {
                label: 'Rinnovabili oggi',
                value: `${(selectedDay.renewableShareDay * 100).toFixed(1)}%`,
                sub: `${(selectedDay.dailyRenewMWh / 1_000).toFixed(0)} GWh`,
              },
              {
                label: 'Gas usato oggi',
                value: `${(selectedDay.hours.reduce((s, h) => s + h.production.gas_ccgt, 0) / 1_000).toFixed(1)} GWh`,
                sub: `${selectedDay.emissionsTonnes.toFixed(0)} tCO₂ oggi`,
              },
              {
                label: 'Batteria ciclata',
                value: storagePowerGW > 0
                  ? `${(selectedDay.dailyBatteryCycledMWh / 1_000).toFixed(1)} GWh`
                  : '—',
                sub: storagePowerGW > 0
                  ? `SOC finale: ${(selectedDay.hours[23].batterySOC / 1_000).toFixed(1)} GWh`
                  : 'Nessuna batteria',
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="gs-card p-4">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-base font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Annualization note */}
          <div className="gs-card p-5 print:hidden">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Proiezione annuale (giorno tipo × giorni)</h3>
            <div className="grid grid-cols-3 gap-4">
              {level3.months.map((day, i) => {
                const DAYS = [31,28,31,30,31,30,31,31,30,31,30,31]
                const monthDeficit = day.dailyDeficitMWh * DAYS[i] / 1_000
                const monthSurplus = day.dailySurplusMWh * DAYS[i] / 1_000
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedMonth(i)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedMonth === i
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : monthDeficit > 0.5
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <div className="font-semibold">{day.monthLabel}</div>
                    <div className="mt-0.5 opacity-75">
                      {monthDeficit > 0.5 ? `-${monthDeficit.toFixed(0)} GWh` : `+${monthSurplus.toFixed(0)} GWh`}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Educational callout */}
          <div className="gs-callout-amber p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Il duck curve e lo storage</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Nei mesi estivi il <strong>solare crea un surplus a mezzogiorno</strong> che spinge il gas
              verso zero — poi la domanda serale fa risalire il gas bruscamente:{' '}
              <em>questa è la "curva d'anatra"</em>.{' '}
              Aggiungendo <strong>batterie BESS</strong>, il surplus solare viene immagazzinato e
              scaricato la sera: il gas scala meno, le emissioni calano e il sistema è più stabile.
              Con più rinnovabili e meno gas, le giornate pessime (bassa produzione) diventano
              il collo di bottiglia — il vero caso d'uso per <strong>storage di lunga durata</strong>.
            </p>
          </div>

          {/* Zap note on missing gas_ocgt */}
          <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <Zap className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              Il modello usa il gas come fonte flessibile di ultimo ricorso. Nei mesi con molto solare
              il gas potrebbe raggiungere zero nelle ore centrali — visibile quando l'area arancione
              scompare sotto la curva di domanda. Il gas OCGT (peaker) è incluso nel totale gas ma
              non mostrato separatamente.
            </p>
          </div>
      </div>

      <div className="mt-8 print:hidden">
        <ControlsPanel showStorage layout="horizontal" />
      </div>

      <div className="print:hidden">
        <DataSources level={3} />
      </div>
    </div>
    </>
  )
}
