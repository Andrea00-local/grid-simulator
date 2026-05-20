import { X } from 'lucide-react'
import type { ScenarioId } from '@/store/simulationStore'

interface ScenarioInfo {
  label: string
  year: string
  color: string
  tagline: string
  description: string
  keyNumbers: { label: string; value: string; note?: string }[]
  tradeoffs: { pro: string; con: string }[]
}

const SCENARIO_INFO: Record<ScenarioId, ScenarioInfo> = {
  italy2023: {
    label: 'Italia 2023',
    year: '2023',
    color: '#6b7280',
    tagline: 'Il punto di partenza reale',
    description:
      'Il mix energetico effettivo dell\'Italia nell\'anno 2023, basato sui dati ufficiali Terna. ' +
      'È il punto di partenza per studiare il sistema e modificare quello che si vuole.',
    keyNumbers: [
      { label: 'Solare', value: '30.3 GW' },
      { label: 'Eolico onshore', value: '12.3 GW' },
      { label: 'Idroelettrico', value: '23.2 GW' },
      { label: 'Geotermico', value: '0.8 GW' },
      { label: 'Biomasse', value: '4.1 GW' },
      { label: 'Gas naturale', value: '121 TWh' },
      { label: 'Carbone', value: '12 TWh' },
      { label: 'Importazioni', value: '51 TWh' },
      { label: 'Domanda', value: '306 TWh' },
    ],
    tradeoffs: [],
  },
  pniec2030: {
    label: 'PNIEC 2030',
    year: '2030',
    color: '#059669',
    tagline: 'Gli obiettivi ufficiali dell\'Italia',
    description:
      'Il Piano Nazionale Integrato per l\'Energia e il Clima (PNIEC), è il Piano che il governo italiano ha redatto per rispettare i propri obiettivi climatici al 2030. ' +
      'E\' stato riscritto nel 2024 per poter centrare gli obiettivi europei noti come "Fit for 55" e si basa su un forte aumento di solare ed eolico.',
    keyNumbers: [
      { label: 'Solare', value: '79.2 GW' },
      { label: 'Eolico onshore', value: '26 GW' },
      { label: 'Eolico offshore', value: '2.1 GW' },
      { label: 'Gas naturale', value: '107 TWh' },
      { label: 'Carbone', value: '0 TWh' },
      { label: 'Importazioni', value: '43 TWh' },
      { label: 'Batterie', value: '71 GWh' },
      { label: 'Domanda', value: '359 TWh' },
    ],
    tradeoffs: [],
  },
  netzero2050: {
    label: 'Net Zero 2050',
    year: '2050',
    color: '#7c3aed',
    tagline: 'Neutralità climatica al 2050',
    description:
      'Scenario ipotetico compatibile con gli impegni presi dall\'Italia in sede europea di azzerare le proprie emissioni entro il 2050. ' +
      'Richiede un aumento non solo della potenza eolica e fotovoltaica ma anche del dispiegamento di batterie e dell\'adeguamento della rete di trasmissione.',
    keyNumbers: [
      { label: 'Solare', value: '170 GW' },
      { label: 'Eolico onshore', value: '35 GW' },
      { label: 'Eolico offshore', value: '30 GW' },
      { label: 'Geotermico', value: '2 GW' },
      { label: 'Biomasse', value: '5 GW' },
      { label: 'Nucleare (SMR)', value: '57 TWh' },
      { label: 'Gas naturale', value: '12 TWh' },
      { label: 'Importazioni', value: '50 TWh' },
      { label: 'Batterie', value: '120 GW' },
      { label: 'Capacità di rete', value: '1.5×' },
      { label: 'Domanda', value: '400 TWh' },
    ],
    tradeoffs: [],
  },
}

interface Props {
  scenarioId: ScenarioId | null
  onClose: () => void
}

export function ScenarioExplanationModal({ scenarioId, onClose }: Props) {
  if (!scenarioId) return null
  const info = SCENARIO_INFO[scenarioId]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
            style={{ borderTop: `4px solid ${info.color}` }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: info.color }}
                >
                  Scenario · {info.year}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{info.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5 italic">{info.tagline}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-3"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed">{info.description}</p>

            {/* Key numbers */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Parametri principali
              </h3>
              <div className="space-y-2">
                {info.keyNumbers.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-bold" style={{ color: info.color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {info.tradeoffs.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Punti di forza e criticità
                </h3>
                <div className="space-y-2">
                  {info.tradeoffs.map(({ pro, con }) => (
                    <div key={pro} className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex items-start gap-2 px-3 py-2 bg-green-50">
                        <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-xs text-green-800">{pro}</span>
                      </div>
                      <div className="flex items-start gap-2 px-3 py-2 bg-red-50">
                        <span className="text-red-500 flex-shrink-0 mt-0.5">✗</span>
                        <span className="text-xs text-red-800">{con}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
