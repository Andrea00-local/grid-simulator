import { RenewableSlider } from './RenewableSlider'
import { ThermalSlider } from './ThermalSlider'
import { HydroSlider } from './HydroSlider'
import { DemandSlider } from './DemandSlider'
import { ScenarioPreset } from './ScenarioPreset'
import { StorageSlider } from './StorageSlider'
import type { Source } from '@/models/types'

const RENEWABLE_SOURCES: Source[] = ['solar', 'wind_onshore', 'wind_offshore', 'geothermal', 'biomass']
const FOSSIL_SOURCES: Source[]    = ['gas_ccgt', 'coal']

interface Props {
  showStorage?: boolean
  layout?: 'horizontal'
}

export function ControlsPanel({ showStorage, layout }: Props) {
  if (layout === 'horizontal') {
    const colCount = showStorage ? 'xl:grid-cols-6' : 'xl:grid-cols-5'
    return (
      <div className="space-y-4">
      <div className={`grid grid-cols-2 md:grid-cols-3 ${colCount} gap-4 items-start`}>

        {/* Demand */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Domanda elettrica</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
            Cresce con elettrificazione di trasporti e riscaldamento
          </p>
          <DemandSlider />
        </div>

        {/* Renewables (GW) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Fonti rinnovabili</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
            Capacità installata in GW — la produzione dipende dal capacity factor
          </p>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            <HydroSlider />
            {RENEWABLE_SOURCES.map((src) => (
              <RenewableSlider key={src} source={src} />
            ))}
          </div>
        </div>

        {/* Nuclear (TWh) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Nucleare</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
            Produzione annua in TWh
          </p>
          <ThermalSlider source="nuclear" />
        </div>

        {/* Fossil (TWh) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Fonti fossili</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
            Produzione annua in TWh
          </p>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {FOSSIL_SOURCES.map((src) => (
              <ThermalSlider key={src} source={src} />
            ))}
          </div>
        </div>

        {/* Imports (TWh) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Importazioni nette</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
            TWh importati dall'estero
          </p>
          <ThermalSlider source="imports" />
        </div>

        {/* Battery storage — Level 3 only */}
        {showStorage && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Stoccaggio</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
              Potenza installata / capacità di stoccaggio
            </p>
            <StorageSlider />
          </div>
        )}

      </div>

      {/* Scenarios — full-width row immediately below the grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
        <ScenarioPreset />
      </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Demand */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Domanda elettrica</h2>
        <p className="text-xs text-gray-400 mb-3">
          Cresce con elettrificazione di trasporti e riscaldamento
        </p>
        <DemandSlider />
      </div>

      {/* Renewables (GW) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Fonti rinnovabili</h2>
        <p className="text-xs text-gray-400 mb-3">
          Capacità installata in GW — la produzione dipende dal capacity factor
        </p>
        <div className="divide-y divide-gray-50">
          <HydroSlider />
          {RENEWABLE_SOURCES.map((src) => (
            <RenewableSlider key={src} source={src} />
          ))}
        </div>
      </div>

      {/* Nuclear (TWh) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Nucleare</h2>
        <p className="text-xs text-gray-400 mb-3">
          Produzione annua in TWh — ipotetico per l'Italia
        </p>
        <ThermalSlider source="nuclear" />
      </div>

      {/* Fossil (TWh) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Fonti fossili</h2>
        <p className="text-xs text-gray-400 mb-3">
          Produzione annua in TWh
        </p>
        <div className="divide-y divide-gray-50">
          {FOSSIL_SOURCES.map((src) => (
            <ThermalSlider key={src} source={src} />
          ))}
        </div>
      </div>

      {/* Imports (TWh) — own section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Importazioni nette</h2>
        <p className="text-xs text-gray-400 mb-3">
          TWh importati dall'estero (mix europeo ~200 gCO₂/kWh)
        </p>
        <ThermalSlider source="imports" />
      </div>

      {/* Battery storage — Level 3 only */}
      {showStorage && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Stoccaggio</h2>
          <p className="text-xs text-gray-400 mb-3">
            Potenza installata in GW — capacità calcolata col rapporto MegaPack (2.5 h)
          </p>
          <StorageSlider />
        </div>
      )}

      {/* Scenarios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <ScenarioPreset />
      </div>
    </div>
  )
}
