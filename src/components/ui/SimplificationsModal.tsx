import { useState } from 'react'
import { X, FlaskConical, XCircle } from 'lucide-react'

const NOT_INCLUDED = [
  'Componente economica. Ciascuna fonte ha costi differenti, che le può rendere molto sconvenienti da installare, ma qui non sono presenti considerazioni economiche.',
  'Variabilità meteorologica. È possibile simulare una giornata con le condizioni meteo avverse, ma ci possono essere ulteriori eventi non considerati, come siccità che incidono anche sull\'idroelettrico.',
  'Capacità limitata. Per alcune fonti rinnovabili non è possibile aumentare la capacità installata, semplicemente perché non c\'è più la fonte naturale disponibile. Tuttavia nel simulatore non c\'è nessun limite di installazione.',
  'Stabilità di rete. Qui si considera il bilancio ogni ora, ma in una rete reale lo si fa ad ogni secondo, per mantenere la frequenza e la tensione sempre stabile.',
  'Congestioni. La rete reale porta elettricità a milioni di utenti da milioni di punti di produzione, ed è quindi molto più complessa e può dare origine anche a congestioni locali.',
  'Emissioni complessive. Si è utilizzata la metodologia di ISPRA per misurare le emissioni, ma questa considera solo quelle derivanti da combustione diretta, tralasciando quindi quelle derivanti dall\'elettricità importata o indirettamente per le fonti rinnovabili.',
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
                  Ecco cosa non modella.
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
              {/* What is NOT modelled */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                    Semplificazioni principali
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
                  Nonostante le semplificazioni, questo modello permette di capire{' '}
                  <strong>gli ordini di grandezza</strong> delle sfide della transizione: quanti GW servono,
                  quanto pesa la stagionalità, come funziona lo storage, perché la rete di trasmissione è
                  un collo di bottiglia. Questi meccanismi sono reali e i numeri sono calibrati su dati
                  ufficiali, anche se non sempre precisi al millimetro. Per approfondire i modelli reali,
                  si utilizzano strumenti molto più complessi come <em>PyPSA</em> o EnergyScope.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
