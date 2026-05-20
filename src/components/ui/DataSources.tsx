import { useState, type ReactNode } from 'react'
import { X, ExternalLink, Database } from 'lucide-react'
import { SimplificationsModal } from './SimplificationsModal'
import { ModelExplanationModal } from './ModelExplanationModal'

interface DataEntry {
  name: string
  value?: string
  description: string
  source?: string
  sourceUrl?: string
}

interface DataSection {
  title: string
  entries: DataEntry[]
}

const DATA_BY_LEVEL: Record<number, { intro: ReactNode; sections: DataSection[] }> = {
  0: {
    intro: (
      <>
        In ciascuna pagina troverai la possibilità di vedere le fonti usate per i dati presenti su quella specifica pagina.
        In generale però quasi tutti i dati provengono da <strong>Terna</strong>, la società che gestisce la rete di trasmissione,
        anche detta TSO (transmission system operator). Per le emissioni invece sono stati usati i dati di{' '}
        <strong>ISPRA</strong> (Istituto Superiore per la Protezione e la Ricerca Ambientale).
        Sono presenti diversi riferimenti al <strong>PNIEC</strong> (Piano Nazionale Integrato per l'Energia e il Clima),
        ovvero la strategia presentata dall'Italia per rispettare i propri obiettivi emissivi presi in ambito europeo,
        e tutti si basano sui dati contenuti nel documento del Piano stesso.
      </>
    ),
    sections: [],
  },
  1: {
    intro:
      'Il modello del Livello 1 calcola la produzione annuale di ogni fonte e la confronta con la domanda nazionale. Ecco i parametri chiave e le loro fonti.',
    sections: [
      {
        title: 'Domanda elettrica',
        entries: [
          {
            name: 'Domanda baseline 2023',
            value: '306 TWh',
            description:
              'Consumo di energia elettrica dell\'Italia nel 2023, incluse le perdite di rete.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
        ],
      },
      {
        title: 'Capacity factor — rinnovabili',
        entries: [
          {
            name: 'Solare fotovoltaico',
            value: '~12.1% annuo',
            description:
              'Rapporto tra energia effettivamente prodotta e quella producibile se l\'impianto lavorasse sempre a piena potenza.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
          {
            name: 'Eolico onshore',
            value: '~21.5% annuo',
            description:
              'CF medio nazionale dell\'eolico a terra.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
          {
            name: 'Eolico offshore',
            value: '~30.5% annuo',
            description:
              'Non esistono dati reali, per cui il CF può essere solo stimato. In generale però sarà superiore rispetto a quello dell\'eolico di terra.',
            source: 'Floating Offshore Wind Farms in Italy beyond 2030 and beyond 2060: Preliminary Results of a Techno-Economic Assessment',
          },
          {
            name: 'Idroelettrico',
            value: '~21.2% annuo',
            description:
              'CF medio degli impianti idroelettrici italiani (fluente e serbatoio).',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
          {
            name: 'Geotermico',
            value: '~82.8% annuo',
            description:
              'Il geotermico italiano ha un CF elevatissimo perché opera quasi in continuo.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
          {
            name: 'Biomasse e biogas',
            value: '~48.7% annuo',
            description:
              'CF medio degli impianti a biomassa solida, biogas e bioliquidi.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
        ],
      },
      {
        title: 'Fattori di emissione CO₂',
        entries: [
          {
            name: 'Rinnovabili',
            value: '0 gCO₂/kWh',
            description:
              'Anche le rinnovabili comportano emissioni per via della costruzione delle tecnologie necessarie a produre elettricità. Tuttavia sono molto inferiori rispetto a quelle dei combustibili fossili ed ISPRA non le considera quando stima le emissioni della rete elettrica.',
            source: 'ISPRA 2023 — Le emissioni di CO₂ nel settore elettrico nazionale e regionale',
          },
          {
            name: 'Gas naturale',
            value: '425 gCO₂/kWh',
            description:
              'Fattore di emissione medio del gas naturale per la produzione elettrica in Italia. Include solo le emissioni di combustione diretta.',
            source: 'ISPRA 2023 — Le emissioni di CO₂ nel settore elettrico nazionale e regionale',
          },
          {
            name: 'Carbone',
            value: '1100 gCO₂/kWh',
            description:
              'Fattore di emissione del carbone per la produzione elettrica in Italia. È la fonte più emissiva; l\'Italia lo utilizza ancora in alcune centrali in dismissione.',
            source: 'ISPRA 2023 — Le emissioni di CO₂ nel settore elettrico nazionale e regionale',
          },
          {
            name: 'Importazioni',
            value: '0 gCO₂/kWh',
            description:
              'Le importazioni sono contabilizzate a emissioni zero secondo la metodologia ISPRA, in quanto le emissioni vengono attribuite al paese di produzione e non al paese importatore.',
            source: 'ISPRA 2023 — Le emissioni di CO₂ nel settore elettrico nazionale e regionale',
          },
          {
            name: 'Baseline CO₂ Italia 2023',
            value: '65 MtCO₂',
            description:
              'Emissioni totali del settore elettrico italiano nel 2023, usate come riferimento per calcolare il miglioramento o peggioramento rispetto allo scenario simulato.',
            source: 'ISPRA 2023 — Le emissioni di CO₂ nel settore elettrico nazionale e regionale',
          },
        ],
      },
    ],
  },
  2: {
    intro:
      'Il Livello 2 mostra come la produzione e la domanda varino mese per mese. I profili mensili sono derivati da dati storici reali del 2023.',
    sections: [
      {
        title: 'Produzione mensile',
        entries: [
          {
            name: 'Andamento mensile produzione',
            description:
              'Per tutte le fonti rinnovabili l\'andamento mensile è stato ricavato dall\'anno 2023, utilizzando i dati Terna.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
        ],
      },
      {
        title: 'Domanda mensile',
        entries: [
          {
            name: 'Andamento mensile domanda',
            description:
              'Anche per la domanda elettrica l\'andamento mensile è stato ricavato dall\'anno 2023, utilizzando i dati Terna.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
        ],
      },
    ],
  },
  3: {
    intro:
      'Il Livello 3 simula un giorno tipo a risoluzione oraria. I profili sono costruiti a partire da dati storici reali del 2023.',
    sections: [
      {
        title: 'Produzione oraria',
        entries: [
          {
            name: 'Andamento orario produzione',
            description:
              'Per tutte le fonti rinnovabili l\'andamento orario è stato ricavato dall\'anno 2023, utilizzando i dati Terna per ricavare la giornata tipo.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
        ],
      },
      {
        title: 'Domanda oraria',
        entries: [
          {
            name: 'Andamento orario domanda',
            description:
              'Anche per la domanda elettrica l\'andamento orario è stato ricavato dall\'anno 2023, utilizzando i dati Terna.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
        ],
      },
      {
        title: 'Condizioni meteorologiche',
        entries: [
          {
            name: 'Condizioni meteorologiche',
            description:
              'Per definire la giornata peggiore e quella migliore è stato utilizzato per ciascun mese il giorno in cui la somma delle produzioni eoliche e fotovoltaiche è stata rispettivamente più bassa e più alta.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://dati.terna.it/',
          },
        ],
      },
      {
        title: 'Batterie BESS',
        entries: [
          {
            name: 'Rapporto energia/potenza',
            value: '2.5 ore',
            description:
              'È stato utilizzato un rapporto tra potenza di picco e energia accumulabile pari a 2,5, valore simile a molte tecnologie oggi sul mercato.',
          },
          {
            name: 'Efficienza di carica/scarica',
            value: '95% per ciclo',
            description:
              'Il ciclo completo (carica + scarica) di un sistema BESS moderno ha un\'efficienza round-trip intorno al 90%, che è stato il valore considerato.',
          },
        ],
      },
    ],
  },
  4: {
    intro:
      'Il Livello 4 distribuisce la produzione rinnovabile nelle 20 regioni italiane e simula il routing energetico sulle linee di trasmissione Terna. I dati sono basati su statistiche regionali ufficiali.',
    sections: [
      {
        title: 'Dati regionali',
        entries: [
          {
            name: 'Capacity factor solare per regione',
            value: '10% (Piemonte) → 18% (Sicilia)',
            description:
              'Il CF solare varia significativamente da Nord a Sud Italia per via dell\'irraggiamento globale orizzontale (GHI). La Sicilia e il Salento hanno GHI tra i più alti d\'Europa, paragonabili al Nordafrica.',
            source: 'GSE — Atlante Italiano delle Risorse Rinnovabili / PVGIS JRC',
          },
          {
            name: 'Capacity factor eolico per regione',
            value: '10% (Valle d\'Aosta) → 30% (Calabria, Sicilia, Sardegna)',
            description:
              'Il potenziale eolico è concentrato nelle regioni costiere meridionali e insulari dove spirano venti costanti dal Mar Mediterraneo. La Puglia ha il più alto parco eolico installato d\'Italia (2.5 GW al 2023).',
            source: 'GSE — Atlante Eolico Italiano / ENEA Wind Atlas',
          },
          {
            name: 'Domanda regionale pro capite',
            value: 'Lombardia +30%, Molise -20% vs media',
            description:
              'La domanda per abitante non è uniforme: le regioni del Nord-Ovest con alta concentrazione industriale (Lombardia, Piemonte) consumano più della media, mentre quelle del Sud e le regioni alpine più piccole consumano meno.',
            source: 'Terna — Dati di prelievo regionali 2023',
          },
          {
            name: 'Capacità installata 2023 per regione',
            value: 'Puglia: 3.5 GW solar, 2.5 GW wind',
            description:
              'Distribuzione effettiva degli impianti FER al 31 dicembre 2023, usata come base del piano "Attuale 2023". La Puglia è la regione con più capacità rinnovabile d\'Italia.',
            source: 'GSE — Rapporto Statistico FER 2023 (dati regionali)',
            sourceUrl: 'https://www.gse.it/servizi-per-te/statistiche',
          },
        ],
      },
      {
        title: 'Rete di trasmissione',
        entries: [
          {
            name: 'Limiti di transito Terna (NTC)',
            value: 'Da 0.5 GW (SAR-TOS) a 6 GW (PIE-LOM)',
            description:
              'Le Net Transfer Capacity (NTC) sono i limiti fisici di quanto energia può transitare tra zone di rete adiacenti. Il corridoio Sud→Centro è storicamente il collo di bottiglia del sistema italiano: la capacità di trasporto dalla Puglia verso il Nord è insufficiente rispetto al potenziale produttivo meridionale.',
            source: 'Terna — Piano di Sviluppo della Rete 2023 / NTC annuali',
            sourceUrl: 'https://www.terna.it/it/sistema-elettrico/rete/piano-sviluppo-rete',
          },
          {
            name: 'Interconnessioni internazionali',
            value: '~11.7 GW totali',
            description:
              'Capacità di importazione/esportazione: Francia 3.6 GW (via Frejus e Alpi Marittime), Svizzera 4.7 GW (valichi alpini), Austria 1.2 GW (Brennero), Slovenia 0.6 GW, Montenegro 0.5 GW (cavo MONITA), Tunisia 0.6 GW (cavo ELMED, in costruzione), Sardegna-Corsica-Francia 0.3 GW (SACOI).',
            source: 'Terna — Rapporto Annuale sulle Interconnessioni 2023',
          },
          {
            name: 'Algoritmo di routing',
            value: 'Dijkstra su grafo pesato',
            description:
              'Il modello usa l\'algoritmo di Dijkstra con peso arco = 1/capacità per trovare il percorso preferenziale tra regioni in surplus e regioni in deficit. I flussi vengono calcolati iterativamente (massimo 200 iterazioni) finché non rimangono surplus/deficit significativi o la rete è satura.',
            source: 'Modello didattico originale — ispirato ai modelli di Power Flow DC semplificati',
          },
          {
            name: 'Piani di distribuzione PNIEC',
            value: 'Obiettivi al 2030: 80 GW solar, 28 GW wind',
            description:
              'Il Piano Nazionale Integrato per l\'Energia e il Clima (PNIEC) 2023 definisce gli obiettivi regionali di installazione. Il piano tende a concentrare gli impianti nelle regioni con miglior CF ma prevede anche il rafforzamento della rete per bilanciare i flussi.',
            source: 'MASE — PNIEC 2023 (revisione), Allegato tecnico regionale',
            sourceUrl: 'https://www.mase.gov.it/energia/pniec',
          },
        ],
      },
    ],
  },
}

interface Props {
  level: 0 | 1 | 2 | 3 | 4
}

export function DataSources({ level }: Props) {
  const [open, setOpen] = useState(false)
  const content = DATA_BY_LEVEL[level]

  return (
    <>
      {/* Trigger row */}
      <div className="mt-8 border-t border-gray-100 pt-5 flex flex-nowrap items-center gap-x-6 overflow-x-auto">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Database className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
          <span>Vuoi sapere da dove vengono i dati?</span>
          <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium underline underline-offset-2 ml-1">
            Scopri le fonti →
          </span>
        </button>
        <SimplificationsModal />
        <ModelExplanationModal />
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Fonti dei dati</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Da dove vengono i dati?</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{content.intro}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-7 max-h-[70vh] overflow-y-auto">
              {content.sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-3">
                    {section.entries.map((entry) => (
                      <div
                        key={entry.name}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <span className="text-sm font-semibold text-gray-800">{entry.name}</span>
                          {entry.value && (
                            <span className="text-xs font-mono bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 flex-shrink-0">
                              {entry.value}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-2">
                          {entry.description}
                        </p>
                        {entry.source && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span className="font-medium text-gray-500">Fonte:</span>
                            {entry.sourceUrl ? (
                              <a
                                href={entry.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-2"
                              >
                                {entry.source}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <span>{entry.source}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer disclaimer */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700 leading-relaxed">
                <strong>Nota metodologica:</strong> Questo è un simulatore didattico semplificato. I valori reali
                variano anno per anno, zona per zona, e dipendono da fattori non modellati (meteo estremo,
                manutenzioni, vincoli di mercato). I dati sono stati selezionati per rappresentare
                condizioni tipiche e medi storici, non per previsioni precise.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
