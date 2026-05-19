import { Link } from 'react-router-dom'
import { Zap, BarChart2, Clock, Map, ChevronRight, Lock } from 'lucide-react'

const LEVELS = [
  {
    n: 1,
    icon: BarChart2,
    title: 'Bilancio annuale',
    description:
      'Regola le fonti energetiche e osserva come cambia il mix energetico, la quota rinnovabile e le emissioni CO₂ della rete italiana.',
    available: true,
    to: '/level1',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    n: 2,
    icon: Clock,
    title: 'Stagionalità mensile',
    description:
      'Il sole non splende allo stesso modo tutto l\'anno. Scopri come la variabilità mensile della produzione rinnovabile e della domanda crei squilibri stagionali.',
    available: true,
    to: '/level2',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    n: 3,
    icon: Zap,
    title: 'Giornata tipo',
    description:
      'Affronta il problema di equilibrare ogni singola ora, cambiando il tuo mix o introducendo batterie per bilanciare domanda e offerta.',
    available: true,
    to: '/level3',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    n: 4,
    icon: Map,
    title: 'Distribuzione territoriale',
    description:
      'Le rinnovabili non sono presenti in tutta Italia. Gestisci la trasmissione di energia tra una regione e l\'altra, per avere un bilanciamento non solo temporale ma anche geografico.',
    available: true,
    to: '/level4',
    gradient: 'from-purple-500 to-pink-600',
  },
]

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          Simulatore didattico — Rete elettrica italiana
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
          Come funziona la rete elettrica<br />
          <span className="text-blue-600">e cosa serve per il net-zero?</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Quattro livelli di simulazione interattiva per capire le sfide della transizione energetica —
          dalla capacità installata ai vincoli di trasmissione inter-zonale.
        </p>
      </div>

      {/* Level cards */}
      <div className="grid sm:grid-cols-2 gap-6">
        {LEVELS.map((lvl) => {
          const Icon = lvl.icon
          return (
            <div
              key={lvl.n}
              className={`relative rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
                lvl.available
                  ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                  : 'opacity-60'
              }`}
            >
              {/* Top gradient bar */}
              <div className={`h-1.5 bg-gradient-to-r ${lvl.gradient}`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${lvl.gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Livello {lvl.n}</span>
                      <h2 className="text-base font-semibold text-gray-900 leading-tight">{lvl.title}</h2>
                    </div>
                  </div>
                  {!lvl.available && <Lock className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />}
                </div>

                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{lvl.description}</p>

                {lvl.available ? (
                  <Link
                    to={lvl.to}
                    className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${lvl.gradient} text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity`}
                  >
                    Inizia il livello <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm font-medium rounded-lg px-4 py-2 border border-gray-200">
                    <Lock className="w-3.5 h-3.5" /> Prossimamente
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
