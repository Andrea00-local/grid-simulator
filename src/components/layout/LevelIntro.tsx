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
      'Purtroppo le cose non sono così semplici come presentate nella Fase 1. Infatti non è sufficiente installare tante fonti rinnovabili per soddisfare la domanda elettrica. Esse infatti dipendono da elementi naturali, ovvero la presenza del vento e del sole, che sappiamo non essere sempre presenti. In particolare adesso ci occupiamo della problematica stagionale: il solare produce molto più d\'estate, mentre l\'eolico d\'inverno. Le potenze installe nella Fase 1 potrebbero quindi non essere sufficienti a garantire ogni mese la presenza di elettricità. ',
    gradient: 'from-emerald-500 to-teal-600',
    what: [
      'Osserva l\'andamento della domanda e delle produzioni nei diversi mesi',
      'Clicca su un mese per vedere il dettaglio completo della produzione',
      'Trova il giusto bilanciamento per raggiungere gli obiettivi e confrontalo con quello trovato nella Fase 1',
    ],
  },
  3: {
    level: 3,
    badge: 'Livello 3',
    badgeColor: 'bg-amber-600',
    title: 'Risoluzione Oraria e Storage',
    description:
      'Aggiungiamo un altro gradino di difficoltà: il bilancio non deve valere solo per le diverse stagioni, ma in ogni momento, per ogni singola ora. Questo complica ulteriormente le cose, perchè come sappiamo bene il solo non splende sempre su di noi. Di conseguenza sarà necessario utilizzare delle batterie, per accumulare l\'energia quando è prodotta in eccesso e utilizzarla quando serve maggiormente. Per ogni mese dell\'anno viene mostrata una giornata lavorativa tipo, come al solito a te toccherà il compito di trovare un equilibrio che permetta di raggiungere gli obiettivi prefissati. Ricorda che le fonti rinnovabili sono dipendenti dalle condizioni climatiche di quella specifica giornata, perciò saranno selezionabili tre diverse ipotesi di condizioni meteo.',
    gradient: 'from-amber-500 to-orange-600',
    what: [
      'Osserva l\'andamento giornaliero delle diversi fonti e dei consumi elettrici',
      'Sperimenta l\'aggiunta di batterie e guardane il loro ciclo di carica e scarica',
      'Prova a cambiare le condizioni meteo e osserva come cambiano le potenze richieste',
    ],
  },
  4: {
    level: 4,
    badge: 'Livello 4',
    badgeColor: 'bg-violet-600',
    title: 'Distribuzione Territoriale',
    description:
      'Adesso arriva la fase più difficile di tutte. L\'Italia non è un sistema uniforme: al Nord si consuma molta più elettricità mentre la presenza di vento e l\'irraggiamento è più elevato al Sud. L\'elettricità prodotta in un luogo può viaggiare, ma solo se non supera i limiti di trasmissione della linee esistenti. In questo livello distribuisci le rinnovabili tra le 20 regioni e osserva come si creano squilibri tra le diverse regioni. Stai attento però, a seconda di dove posizioni le fonti, esse produrranno più o meno elettricità ma in alcune regioni proprio non c\'è vento e non puoi installare turbine eoliche. Per ovviare a questo problema potrai migliorare anche le linee di trasmissione se lo desideri.',
    gradient: 'from-violet-500 to-purple-600',
    what: [
      'Scegli come distribuire le rinnovabili tra le regioni',
      'Osserva quali sono autosufficienti e quali invece rischiano di andare in deficit',
      'Potenzia la rete per evitare di sovraccaricare una linea',
    ],
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
