import { useState } from 'react'
import { X, FlaskConical, CheckCircle2, XCircle } from 'lucide-react'

const INCLUDED = [
  'Bilancio energetico annuale, mensile e orario tra produzione e domanda',
  'Capacity factor tipici italiani (mensili e per regione)',
  'Emissioni CO₂ operative per fonte (fattori ISPRA)',
  'Storage BESS: carica/scarica oraria con efficienza round-trip ~90%',
  'Distribuzione regionale e routing semplificato (Dijkstra) sulle linee Terna',
  'Stagionalità solare, eolica e idroelettrica (profili mensili da dati storici)',
]

const NOT_INCLUDED = [
  'Mercato elettrico e prezzi (PUN, MGP, dispacciamento economico)',
  'Variabilità meteorologica pluriennale (siccità, El Niño)',
  'Perdite di rete (~7% della produzione) e potenza reattiva',
  'Stabilità di frequenza e tensione (servizi ancillari)',
  'Tempi reali di costruzione e iter autorizzativi (5-10 anni per eolico offshore)',
  'Costi di investimento, LCOE e profittabilità degli impianti',
  'Demand response, smart grid e flessibilità industriale',
  'Storage di lungo periodo (idrogeno, pompaggio stagionale)',
  'Emissioni di ciclo di vita (upstream, costruzione impianti)',
  'Effetti di rete (congestioni interne alle zone Terna)',
]

interface Props {
  trigger?: React.ReactNode
}

export function SimplificationsModal({ trigger }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {trigger
        ? <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>
        : (
          <button
            onClick={() => setOpen(true)}
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <FlaskConical className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
            <span>Perché è una simulazione semplificata?</span>
            <span className="text-xs text-amber-600 group-hover:text-amber-800 font-medium underline underline-offset-2 ml-1">
              Scopri le limitazioni →
            </span>
          </button>
        )
      }

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Simulazione didattica</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Perché questo è un modello semplificato?</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Questo simulatore è stato progettato per <strong>capire i meccanismi chiave</strong> della
                  transizione energetica, non per replicare la complessità del sistema elettrico reale.
                  Ecco cosa modella e cosa non modella.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* What IS modelled */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                    Cosa modella questo simulatore
                  </h3>
                </div>
                <div className="space-y-2">
                  {INCLUDED.map(item => (
                    <div key={item} className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* What is NOT modelled */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                    Cosa NON modella (semplificazioni principali)
                  </h3>
                </div>
                <div className="space-y-2">
                  {NOT_INCLUDED.map(item => (
                    <div key={item} className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Why it's still useful */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Perché è utile comunque?</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Nonostante le semplificazioni, questo modello permette di capire <strong>gli ordini di grandezza</strong>
                  delle sfide della transizione: quanti GW servono, quanto pesa la stagionalità, come funziona
                  lo storage, perché la rete di trasmissione è un collo di bottiglia. Questi meccanismi sono
                  reali e i numeri sono calibrati su dati ufficiali (Terna, GSE, PNIEC 2023). Per approfondire
                  i modelli reali, si utilizzano strumenti come <em>PyPSA</em>, <em>PLEXOS</em> o i modelli
                  ENTSO-E Ten-Year Network Development Plan (TYNDP).
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 leading-relaxed">
                <strong>Fonti dati:</strong> Terna (capacità installata, profili di carico, NTC),
                GSE (statistiche FER, capacity factor), ISPRA (fattori di emissione), ENTSO-E (dati europei),
                MASE/PNIEC 2023 (obiettivi), IRENA (costi), JRC/PVGIS (irraggiamento). Tutti i dati
                si riferiscono all'anno 2023 ove non diversamente specificato.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
