import { ChevronRight, X } from 'lucide-react'

interface LevelIntroConfig {
  level: 1 | 2 | 3 | 4
  badge: string
  badgeColor: string
  title: string
  description: string
  concepts?: string[]
  gradient: string
  what: string[]
  why?: string
}

const INTROS: Record<number, LevelIntroConfig> = {
  1: {
    level: 1,
    badge: 'Livello 1',
    badgeColor: 'bg-blue-600',
    title: 'Bilancio Annuale',
    description:
      'Questo è il livello più semplice di tutti in cui cerchiamo di capire le basi del nostro sistema elettrico. Alla base di tutto stanno la produzione e la domanda elettrica. Ogni volta che consumiamo elettricità, accendendo una lampadina o un forno o caricando la nostra macchina elettrica, lo possiamo fare poichè da qualche parte c\'è una centrale che sta producendo quell\'elettricità che arriva fino a noi. L\'elettricità può essere prodotta in tanti modi diversi, puoi cliccare sulle fonti che trovi nella dashboard per scoprire di più su ciascuna di esse. Alcune di quelle fonti, quelle dette fossili, utilizzano appunto dei combustibili fossili per produrre elettricità e di conseguenza comportano emissione di anidride carbonica nell\'atmosfera, andando a peggiorare il cambiamento climatico in atto. L\'Italia, all\'interno degli accordi europei, si è prefissata alcuni obiettivi importanti: azzerare completamente le proprie emissioni entro il 2050. Questo però non basta, ha anche fissato alcuni obiettivi intermedi per il 2030 ed il 2040. Nella dashboard che vedrete potrete scegliere in quale anno volete operare, così da vedere riportati gli obiettivi relativi a quell\'anno. Gli obiettivi consistono in un valore di emissioni evitate e in una percentuale di energia prodotta dalle fonti rinnovabili. Ma attenzione, dovrete sempre assicurare di produrre tanta elettricità quanta ne serve, altrimenti lascerete le case al buio!',
    gradient: 'from-blue-500 to-indigo-600',
    what: [
      'Regola i cursori per ogni fonte (solare, eolico, gas, nucleare…)',
      'Osserva come cambia il grafico del mix energetico in tempo reale',
      'Occhio agli obiettivi, riuscirai a soddisfarli tutti?',
    ],
  },
  2: {
    level: 2,
    badge: 'Livello 2',
    badgeColor: 'bg-emerald-600',
    title: 'Stagionalità Mensile',
    description:
      'Un bilancio annuale in pareggio può nascondere mesi di surplus estivo e mesi di pesante deficit invernale. In questo livello scopri come la variabilità mensile della produzione rinnovabile e della domanda crei squilibri che non si annullano tra loro.',
    concepts: ['Profili mensili', 'Deficit invernale', 'Surplus estivo', 'Stagionalità solare', 'Capacity factor mensile'],
    gradient: 'from-emerald-500 to-teal-600',
    what: [
      'Esplora il grafico mensile: mesi verdi = surplus, rossi = deficit',
      'Clicca su un mese per vedere il dettaglio completo della produzione',
      'Osserva come il solare collassi in inverno e esploda in estate',
      'Confronta surplus lordo e deficit lordo — non si compensano senza storage',
    ],
    why: 'Il disallineamento stagionale è il problema centrale della transizione: serve storage o trasmissione. Livello 3 introduce le batterie.',
  },
  3: {
    level: 3,
    badge: 'Livello 3',
    badgeColor: 'bg-amber-600',
    title: 'Risoluzione Oraria e Storage',
    description:
      'Scendi alla granularità di un\'ora. Ogni mese ha un "giorno tipo lavorativo" simulato a 24 ore: vedi come la produzione solare crei il famoso "duck curve" a mezzogiorno e come le batterie BESS possano spostare quel surplus verso la sera.',
    concepts: ['Duck curve', 'Profilo giornaliero', 'BESS / MegaPack', 'Picco serale', 'Stato di carica'],
    gradient: 'from-amber-500 to-orange-600',
    what: [
      'Seleziona il mese e le condizioni meteo (ottima / media / pessima)',
      'Osserva il grafico a 24 ore: le barre colorate sono la produzione, la linea scura è la domanda',
      'Aggiungi batterie con il cursore BESS e vedi come il duck curve si appiattisce',
      'Monitora lo stato di carica (SOC) della batteria nel mini-grafico sotto',
    ],
    why: 'Le giornate pessime con poca produzione rinnovabile sono il vero collo di bottiglia: richiedono storage di lunga durata o gas di backup.',
  },
  4: {
    level: 4,
    badge: 'Livello 4',
    badgeColor: 'bg-violet-600',
    title: 'Distribuzione Territoriale',
    description:
      'L\'Italia non è un sistema uniforme: Puglia e Sicilia producono molto più di quanto consumano, mentre il Nord è strutturalmente importatore. In questo livello distribuisci le rinnovabili tra le 20 regioni e osserva come i limiti delle linee Terna determinano chi riceve energia e chi rimane in deficit.',
    concepts: ['Zone Terna', 'Limiti di trasmissione', 'Routing Dijkstra', 'Distribuzione per CF', 'Flussi inter-regionali'],
    gradient: 'from-violet-500 to-purple-600',
    what: [
      'Scegli il piano di distribuzione: attuale 2023, PNIEC, uniforme o massimizza CF',
      'La mappa colora le regioni in verde (surplus) o rosso (deficit) dopo il routing',
      'Aumenta il potenziamento rete per sbloccare più flussi verso Nord',
      'Clicca su una regione per vedere domanda, produzione, import/export e profilo orario',
    ],
    why: 'Il corridoio Sud→Centro è il collo di bottiglia storico dell\'elettricità italiana: senza più trasmissione, il surplus del Sud non raggiunge il Nord.',
  },
}

interface Props {
  level: 1 | 2 | 3 | 4
  onStart: () => void
}

export function LevelIntro({ level, onStart }: Props) {
  const cfg = INTROS[level]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onStart} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Top gradient strip */}
        <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${cfg.gradient}`} />

        {/* Close button */}
        <button
          onClick={onStart}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Badge + title */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`${cfg.badgeColor} text-white text-xs font-semibold rounded-full px-3 py-1`}>
              {cfg.badge}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{cfg.title}</h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{cfg.description}</p>

          {/* What you'll do */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cosa farai</h2>
            <ul className="space-y-2">
              {cfg.what.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br ${cfg.gradient} text-white text-xs flex items-center justify-center flex-shrink-0 font-semibold`}>
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Concepts */}
          {cfg.concepts && cfg.concepts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Concetti chiave</h2>
              <div className="flex flex-wrap gap-2">
                {cfg.concepts.map((c) => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Why it matters */}
          {cfg.why && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Perché importa</p>
              <p className="text-sm text-gray-700 leading-relaxed">{cfg.why}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onStart}
            className={`w-full py-3 px-6 rounded-xl bg-gradient-to-r ${cfg.gradient} text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
          >
            Inizia il simulatore <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
