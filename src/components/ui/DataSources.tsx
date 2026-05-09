import { useState } from 'react'
import { X, ExternalLink, Database } from 'lucide-react'

interface DataEntry {
  name: string
  value?: string
  description: string
  source: string
  sourceUrl?: string
}

interface DataSection {
  title: string
  entries: DataEntry[]
}

const DATA_BY_LEVEL: Record<number, { intro: string; sections: DataSection[] }> = {
  1: {
    intro:
      'Il modello del Livello 1 calcola la produzione annuale di ogni fonte e la confronta con la domanda nazionale. Ecco i parametri chiave e le loro fonti.',
    sections: [
      {
        title: 'Domanda elettrica',
        entries: [
          {
            name: 'Domanda baseline 2023',
            value: '280 TWh',
            description:
              'Consumo netto di energia elettrica dell\'Italia nel 2023, escluse le perdite di rete. Include settore civile, industriale e trasporti.',
            source: 'Terna — Dati statistici sull\'energia elettrica in Italia 2023',
            sourceUrl: 'https://www.terna.it/it/sistema-elettrico/statistiche',
          },
        ],
      },
      {
        title: 'Capacity factor — rinnovabili',
        entries: [
          {
            name: 'Solare fotovoltaico',
            value: '~10.5% annuo',
            description:
              'Rapporto tra energia effettivamente prodotta e quella producibile se l\'impianto lavorasse sempre a piena potenza. In Italia varia da ~3% in gennaio a ~17% in luglio per via dell\'irraggiamento.',
            source: 'GSE — Rapporto Statistico Solare Fotovoltaico 2023',
            sourceUrl: 'https://www.gse.it/servizi-per-te/fotovoltaico',
          },
          {
            name: 'Eolico onshore',
            value: '~24% annuo',
            description:
              'CF medio nazionale dell\'eolico a terra. Le regioni del Sud (Puglia, Sicilia, Sardegna) raggiungono CF del 28-30%, mentre il Nord scende sotto il 20%.',
            source: 'GSE — Rapporto Statistico Eolico 2023 / ENTSO-E Transparency Platform',
            sourceUrl: 'https://www.gse.it/servizi-per-te/energia-da-fonti-rinnovabili',
          },
          {
            name: 'Eolico offshore',
            value: '~35% annuo',
            description:
              'CF stimato per impianti offshore in acque italiane (Adriatico e Stretto di Sicilia). L\'Italia non ha impianti offshore operativi al 2023; il valore è basato su dati europei.',
            source: 'IRENA — Renewable Power Generation Costs 2023',
          },
          {
            name: 'Idroelettrico (fluente)',
            value: '~29% annuo',
            description:
              'CF medio degli impianti run-of-river italiani. Fortemente stagionale: picco in primavera (scioglimento nevi) e settembre, minimo in estate.',
            source: 'Terna — Dati statistici 2023 / RSE — Atlante Italiano',
          },
          {
            name: 'Idroelettrico (serbatoio)',
            value: '~35% annuo',
            description:
              'CF medio degli impianti a serbatoio e pompaggio. Più flessibile del run-of-river perché l\'acqua viene rilasciata su richiesta del mercato.',
            source: 'Terna — Dati statistici 2023',
          },
          {
            name: 'Geotermico',
            value: '~85.5% annuo',
            description:
              'Il geotermico italiano (concentrato in Toscana, gestito da Enel Green Power) ha un CF elevatissimo perché opera quasi in continuo. È una delle fonti più stabili del sistema.',
            source: 'GSE — Rapporto Statistico Geotermoelettrico 2023',
          },
          {
            name: 'Biomasse e biogas',
            value: '~60% annuo',
            description:
              'CF medio degli impianti a biomassa solida, biogas e bioliquidi. Operano come "rinnovabili programmabili" con produzione abbastanza costante durante l\'anno.',
            source: 'GSE — Rapporto Statistico Bioenergie 2023',
          },
        ],
      },
      {
        title: 'Fattori di emissione CO₂',
        entries: [
          {
            name: 'Gas naturale (CCGT)',
            value: '400 gCO₂/kWh',
            description:
              'Emissioni operative di un ciclo combinato a gas (Combined Cycle Gas Turbine). Include solo la combustione, non il ciclo di vita completo.',
            source: 'ISPRA — Fattori di emissione per la produzione di elettricità 2023',
          },
          {
            name: 'Gas naturale (OCGT peaker)',
            value: '550 gCO₂/kWh',
            description:
              'I peaker a ciclo aperto (Open Cycle Gas Turbine) hanno efficienza inferiore ai CCGT e quindi emissioni maggiori. Vengono usati solo per i picchi.',
            source: 'ISPRA 2023 / IPCC Guidelines',
          },
          {
            name: 'Carbone',
            value: '820 gCO₂/kWh',
            description:
              'Emissioni di un impianto a carbone moderno a supercritique. Il carbone è la fonte più emissiva; l\'Italia lo utilizza ancora nella centrale di La Spezia e alcune in Sardegna.',
            source: 'ISPRA 2023',
          },
          {
            name: 'Importazioni',
            value: '~200 gCO₂/kWh',
            description:
              'Stima delle emissioni medie del mix elettrico europeo importato dall\'Italia (principalmente da Francia, Svizzera, Slovenia). Il nucleare francese abbassa significativamente questo valore.',
            source: 'ENTSO-E — Average CO₂ intensity of electricity 2023',
          },
          {
            name: 'Baseline CO₂ Italia 2023',
            value: '82 MtCO₂',
            description:
              'Emissioni totali del settore elettrico italiano nel 2023, usate come riferimento per calcolare il miglioramento o peggioramento rispetto allo scenario simulato.',
            source: 'ISPRA — Inventario Nazionale delle Emissioni 2023',
          },
        ],
      },
    ],
  },
  2: {
    intro:
      'Il Livello 2 mostra come la produzione e la domanda varino mese per mese. I profili mensili sono derivati da dati storici reali dell\'ultimo decennio.',
    sections: [
      {
        title: 'Profili mensili di produzione',
        entries: [
          {
            name: 'Capacity factor solare mensile',
            value: '3.4% (Gen) → 16.6% (Lug)',
            description:
              'L\'irraggiamento solare in Italia segue una curva fortemente stagionale. In luglio si produce circa 5 volte di più che in gennaio. I valori sono medie nazionali; il Sud Italia ha CF superiori del 15-20% rispetto al Nord.',
            source: 'GSE — Atlante Solare Italiano / PVGIS European Commission',
            sourceUrl: 'https://re.jrc.ec.europa.eu/pvg_tools/it/',
          },
          {
            name: 'Capacity factor eolico mensile',
            value: '14.4% (Lug) → 26.8% (Dic)',
            description:
              'Il vento in Italia è più forte in inverno e in primavera. Il CF estivo cala significativamente perché il Mar Mediterraneo in estate produce gradienti termici minori. Questo crea una complementarità parziale con il solare.',
            source: 'ENTSO-E Transparency Platform — Wind Generation 2018-2023',
          },
          {
            name: 'Capacity factor idroelettrico mensile',
            value: '22% (Gen) → 49% (Mag)',
            description:
              'Il picco idroelettrico avviene in aprile-maggio per lo scioglimento delle nevi alpine. Il minimo estivo (luglio-agosto) può creare stress sul sistema quando il solare non è sufficiente e le precipitazioni sono scarse.',
            source: 'Terna — Dati mensili produzione idroelettrica 2013-2023',
          },
        ],
      },
      {
        title: 'Profilo mensile della domanda',
        entries: [
          {
            name: 'Fattori di modulazione mensile',
            value: '±10% rispetto alla media',
            description:
              'La domanda è più alta in dicembre (+8%) per il riscaldamento elettrico e l\'illuminazione, e in luglio (+4%) per il condizionamento. Il minimo si registra ad agosto (-6%) per la chiusura delle industrie. Questi fattori sono moltiplicativi sulla domanda annuale impostata.',
            source: 'Terna — Profili di carico storici 2018-2023',
          },
        ],
      },
    ],
  },
  3: {
    intro:
      'Il Livello 3 simula un giorno tipo lavorativo a risoluzione oraria. I profili sono costruiti a partire da dati fisici di irraggiamento e misurazioni storiche di rete.',
    sections: [
      {
        title: 'Profilo solare orario',
        entries: [
          {
            name: 'Modello gaussiano di irraggiamento',
            value: 'Picco a 12:30, σ da 1.7h (Dic) a 3.2h (Giu)',
            description:
              'La produzione solare segue approssimativamente una curva gaussiana centrata a mezzogiorno. La larghezza (σ) varia stagionalmente perché in estate il sole è sopra l\'orizzonte per più ore. I valori di σ sono calibrati sui dati PVGIS per latitudine media italiana (42°N).',
            source: 'Joint Research Centre (JRC) — PVGIS Tool / NASA POWER Data',
            sourceUrl: 'https://re.jrc.ec.europa.eu/pvg_tools/it/',
          },
        ],
      },
      {
        title: 'Profilo di domanda orario',
        entries: [
          {
            name: 'Profilo giorno lavorativo tipico',
            value: 'Min a 04:00 (62%), picchi a 11:00 e 19:00 (114%)',
            description:
              'Il profilo di carico orario italiano mostra un minimo notturno, una risalita mattutina, un plateau a mezzogiorno, e un secondo picco serale tra le 19:00 e le 21:00. Questo doppio picco crea il famoso "duck curve" quando il solare copre il plateau di mezzogiorno ma non i picchi.',
            source: 'Terna — Profili di prelievo standard 2022-2023',
          },
        ],
      },
      {
        title: 'Batterie BESS (MegaPack)',
        entries: [
          {
            name: 'Rapporto energia/potenza',
            value: '2.5 ore (MegaPack 2)',
            description:
              'Il Tesla MegaPack 2 ha una capacità di ~3.9 MWh per unità da 1.5 MW, ovvero circa 2.6 ore di autonomia (arrotondato a 2.5h nel modello). Questo è il prodotto BESS più diffuso a livello mondiale per installazioni utility-scale.',
            source: 'Tesla Energy — MegaPack 2 Product Specifications',
          },
          {
            name: 'Efficienza di carica/scarica',
            value: '95% per ciclo',
            description:
              'Il ciclo completo (carica + scarica) di un sistema BESS moderno ha un\'efficienza round-trip del 90-92%. Nel modello si usa 95% per ogni direzione (carica o scarica singola) per semplicità, risultando in ~90% round-trip.',
            source: 'NREL — Utility-Scale Battery Storage Technology Assessment 2023',
          },
        ],
      },
      {
        title: 'Scenari meteorologici',
        entries: [
          {
            name: '"Giornata pessima"',
            value: 'Solare ×0.20, Eolico ×0.20',
            description:
              'Approssima il 10° percentile della distribuzione di produzione giornaliera. Corrisponde a un giorno di cielo coperto con vento debole — evento che si verifica circa 36 giorni/anno.',
            source: 'Elaborazione su dati ENTSO-E / Terna — percentili produzione FER 2018-2023',
          },
          {
            name: '"Giornata ottima"',
            value: 'Solare ×1.60, Eolico ×1.80',
            description:
              'Approssima il 90° percentile. Giornata soleggiata e ventosa: solare al picco stagionale, eolico sostenuto. Circa 36 giorni/anno si avvicina a questo scenario.',
            source: 'Elaborazione su dati ENTSO-E / Terna — percentili produzione FER 2018-2023',
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
  level: 1 | 2 | 3 | 4
}

export function DataSources({ level }: Props) {
  const [open, setOpen] = useState(false)
  const content = DATA_BY_LEVEL[level]

  return (
    <>
      {/* Trigger row */}
      <div className="mt-8 border-t border-gray-100 pt-5">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Database className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
          <span>
            Vuoi sapere da dove vengono i dati utilizzati per realizzare questo simulatore?
          </span>
          <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium underline underline-offset-2 ml-1">
            Scopri le fonti →
          </span>
        </button>
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
