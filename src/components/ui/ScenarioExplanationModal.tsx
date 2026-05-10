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
      'Il mix energetico effettivo dell\'Italia nell\'anno 2023, basato sui dati ufficiali Terna e GSE. ' +
      'È il riferimento da cui parte ogni simulazione: capisci dove siamo prima di decidere dove vogliamo andare.',
    keyNumbers: [
      { label: 'Solare', value: '32.7 GW', note: '~30 TWh prodotti, CF 10.5%' },
      { label: 'Eolico onshore', value: '12.1 GW', note: '~22 TWh, CF 20.6%' },
      { label: 'Idroelettrico', value: '22.7 GW', note: '~37 TWh totali' },
      { label: 'Gas naturale', value: '125 TWh', note: '~45% della produzione totale' },
      { label: 'Carbone', value: '18 TWh', note: 'In fase di dismissione' },
      { label: 'Domanda', value: '280 TWh', note: 'Consumo netto 2023' },
    ],
    tradeoffs: [
      { pro: 'Riflette la realtà attuale del sistema', con: 'Alta dipendenza da gas e importazioni' },
      { pro: 'Base di calcolo verificabile con dati pubblici', con: 'Quota rinnovabili solo ~40%, sotto target 2030' },
    ],
  },
  pniec2030: {
    label: 'PNIEC 2030',
    year: '2030',
    color: '#059669',
    tagline: 'Gli obiettivi ufficiali dell\'Italia',
    description:
      'Il Piano Nazionale Integrato per l\'Energia e il Clima (PNIEC), aggiornato dal governo italiano nel 2023 ' +
      'in base alle direttive EU "Fit for 55". Triplica il solare, quasi triplica il vento, ' +
      'ed elimina il carbone entro il 2025. È lo scenario "politica attuale" dell\'Italia.',
    keyNumbers: [
      { label: 'Solare', value: '79.9 GW', note: '+2.4× rispetto al 2023' },
      { label: 'Eolico onshore', value: '28.1 GW', note: '+2.3× rispetto al 2023' },
      { label: 'Eolico offshore', value: '2.0 GW', note: 'Primi impianti in Mediterraneo' },
      { label: 'Gas naturale', value: '60 TWh', note: '−52% vs 2023, con CCS parziale' },
      { label: 'Carbone', value: '0 TWh', note: 'Phase-out previsto entro 2025' },
      { label: 'Domanda', value: '340 TWh', note: '+21% per elettrificazione trasporti' },
    ],
    tradeoffs: [
      { pro: 'Obiettivo vincolante EU Fit for 55 (-55% CO₂)', con: 'Richiede +6 GW/anno di solare: record da battere ogni anno' },
      { pro: 'Elimina il carbone e dimezza il gas', con: 'Iter autorizzativi attuali troppo lenti (2-7 anni)' },
      { pro: 'Riduzione importazioni e dipendenza dal gas russo', con: 'Rete di trasmissione non ancora adeguata al Sud→Nord' },
    ],
  },
  netzero2050: {
    label: 'Net Zero 2050',
    year: '2050',
    color: '#7c3aed',
    tagline: 'Neutralità climatica al 2050',
    description:
      'Scenario ipotetico di neutralità carbonica del settore elettrico italiano al 2050, ' +
      'coerente con gli obiettivi dell\'Accordo di Parigi (+1.5°C). Include un ritorno ipotetico ' +
      'del nucleare (SMR di nuova generazione), rinnovabili massicce e quasi zero fossili.',
    keyNumbers: [
      { label: 'Solare', value: '120 GW', note: '+3.7× vs 2023' },
      { label: 'Eolico onshore', value: '28 GW', note: 'Saturazione territoriale' },
      { label: 'Eolico offshore', value: '8 GW', note: 'Adriatico, Stretto, Canale di Sicilia' },
      { label: 'Nucleare (SMR)', value: '57 TWh', note: 'Ipotetico, non pianificato dall\'Italia' },
      { label: 'Gas naturale', value: '12 TWh', note: 'Solo backup estremo con CCS' },
      { label: 'Domanda', value: '450 TWh', note: '+60% per piena elettrificazione' },
    ],
    tradeoffs: [
      { pro: 'Zero emissioni nette dal settore elettrico', con: 'Il nucleare richiede 15-20 anni di costruzione' },
      { pro: 'Massima indipendenza energetica', con: 'Investimenti stimati in 800+ miliardi €' },
      { pro: 'Allineato agli obiettivi climatici internazionali', con: 'Nessun piano governativo italiano include nucleare al 2050' },
    ],
  },
  fullRenewable: {
    label: '100% Rinnovabili',
    year: 'Ipotetico',
    color: '#d97706',
    tagline: 'Solo rinnovabili, zero fossili e nucleare',
    description:
      'Scenario estremo: nessuna fonte fossile né nucleare. Tutta la domanda è coperta da ' +
      'rinnovabili. In questo simulatore non è modellato lo storage inter-stagionale ' +
      '(idrogeno, pompaggio), quindi il bilancio mostrerà potenziali deficit invernali ' +
      'non risolti. È un caso-studio per capire i limiti delle rinnovabili variabili.',
    keyNumbers: [
      { label: 'Solare', value: '90 GW', note: 'Principale fonte di energia' },
      { label: 'Eolico onshore', value: '35 GW', note: 'Oltre il massimo PNIEC' },
      { label: 'Eolico offshore', value: '6 GW', note: 'Espansione significativa' },
      { label: 'Geotermico', value: '3.5 GW', note: 'Espansione oltre Larderello' },
      { label: 'Gas naturale', value: '18 TWh', note: 'Residuo di backup (non zero)' },
      { label: 'Domanda', value: '380 TWh', note: 'Elettrificazione parziale' },
    ],
    tradeoffs: [
      { pro: 'Minime emissioni operative di CO₂', con: 'Deficit invernali quasi certi senza storage di lungo periodo' },
      { pro: 'Zero dipendenza da combustibili fossili', con: 'Richiede enormi capacità di storage non ancora esistenti' },
      { pro: 'Idealmente il più sostenibile a lungo termine', con: 'Costi di bilanciamento molto elevati' },
    ],
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
                {info.keyNumbers.map(({ label, value, note }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-600">{label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold" style={{ color: info.color }}>{value}</span>
                      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade-offs */}
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

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 leading-relaxed">
              Caricare questo scenario imposta tutti gli slider ai valori di riferimento.
              Puoi poi modificarli liberamente per esplorare varianti.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
