import { useState } from 'react'
import { X, BookOpen } from 'lucide-react'

const PARAGRAPHS = [
  'Per prima cosa il modello calcola la produzione di tutte le fonti rinnovabili, che dipendendo da una fonte naturale non possono essere comandate a piacimento. L\'utente inserisce la potenza installata per ciascuna fonte e conoscendo l\'andamento il simulatore realizza il calcolo per ogni ora, mese e anno.',
  'Per le altre fonti, quelle che non dipendono da un fattore naturale, ovvero nucleare, fonti fossili e importazione dall\'estero, è l\'utente che decide quanto produrre in un anno. La distribuzione nei diversi mesi avviene seguendo il criterio di esigenza: si calcola per ciascun mese quanto rimane da coprire dopo l\'azione delle rinnovabili e sulla base di questo si distribuisce tra i mesi. Allo stesso modo si distribuisce anche per l\'andamento orario: nelle ore in cui le rinnovabili non producono si attiveranno le fonti fossili, che invece rimarranno spente quando le rinnovabili sono sufficienti.',
  'Per la produzione giornaliera un ulteriore elemento è da considerarsi: lo stoccaggio. Questo permette di stoccare l\'energia che si produce in eccesso in alcune ore, per usarla poi quando questa è mancante. Lo stoccaggio funziona come se operasse su due giornate: quando alla sera è ancora carico di energia, essa viene usata per le ore mattutine, immaginando che arrivi carico anche dalla sera del giorno prima.',
  'Infine per la distribuzione zonale viene divisa l\'Italia nelle 7 zone di mercato considerate da Terna. Ciascuna ha un proprio bilancio interno di consumi e produzione, che viene calcolato come in precedenza per una giornata tipo di ciascun mese. Quando una zona si trova in deficit può importare da un\'altra che si trova in surplus, ma solo rispettando i limiti di potenza dovuti alla rete di trasmissione elettrica.',
  'In ciascuna fase il simulatore valuta 3 obiettivi per capire se le scelte fatte sono vincenti. Il primo è la sicurezza energetica: se tutta l\'elettricità richiesta è prodotta. Il secondo è la percentuale di produzione rinnovabile nel mix complessivo. Il terzo sono le emissioni di CO₂ determinate dalla combustione di fossili.',
  'Il simulatore procede in ordine di complessità sempre maggiore. All\'inizio ti troverai a dover bilanciare la produzione e la domanda annuale che è piuttosto semplice. Tuttavia, scendendo al livello mensile e ancora di più a quello giornaliero, può succedere che gli obiettivi raggiunti scompaiono. Tranquillo, è normale: è come funziona la rete elettrica. Se utilizzi molto le fonti rinnovabili infatti devi stare attento al bilanciamento mensile e giornaliero, altrimenti rischi di lasciare i tuoi cittadini senza elettricità.',
]

export function ModelExplanationModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
        <span>Come funziona il modello?</span>
        <span className="text-xs text-green-600 group-hover:text-green-800 font-medium underline underline-offset-2 ml-1">
          Clicca e scoprilo →
        </span>
      </button>

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
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Come funziona</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Come funziona il modello?</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {PARAGRAPHS.map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
