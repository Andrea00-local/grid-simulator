import type { Source } from './types'

export type SourceKey = Source | 'hydro'

export interface HistoricalPoint { year: number; value: number }

export interface SourceDetail {
  label: string
  color: string
  unit: 'GW' | 'TWh'
  description: string
  capacityFactor?: {
    value: number
    range: string
    notes: string
  }
  italy2023: {
    value: number
    productionTWh?: number
    context: string
  }
  targets: Array<{ year: number; value: number; label: string }>
  recentGrowth: string
  historical: HistoricalPoint[]
  historicalLabel: string
}

export const SOURCE_DETAILS: Partial<Record<SourceKey, SourceDetail>> = {
  solar: {
    label: 'Solare fotovoltaico',
    color: '#FFB627',
    unit: 'GW',
    description:
      'Il fotovoltaico converte direttamente la luce solare in elettricità tramite celle in silicio. La produzione varia fortemente con le stagioni: in Italia raggiunge il picco in luglio e scende quasi a zero nelle notti e nelle giornate nuvolose invernali.',
    capacityFactor: {
      value: 0.121,
      range: '5–18%',
      notes: 'Media annua italiana (5.3% gen – 17.6% giu)',
    },
    italy2023: {
      value: 30.3,
      productionTWh: 28,
      context: 'Prima fonte rinnovabile per capacità installata in Italia al 2023.',
    },
    targets: [
      { year: 2030, value: 79.9, label: 'PNIEC 2030' },
      { year: 2050, value: 120.0, label: 'Net Zero 2050' },
    ],
    recentGrowth: '+5.2 GW/anno (2022→2023)',
    historical: [
      { year: 2005, value: 0 },
      { year: 2006, value: 0 },
      { year: 2007, value: 0.1 },
      { year: 2008, value: 0.4 },
      { year: 2009, value: 1.1 },
      { year: 2010, value: 3.5 },
      { year: 2011, value: 12.8 },
      { year: 2012, value: 16.4 },
      { year: 2013, value: 18.2 },
      { year: 2014, value: 18.6 },
      { year: 2015, value: 18.9 },
      { year: 2016, value: 19.3 },
      { year: 2017, value: 19.7 },
      { year: 2018, value: 20.1 },
      { year: 2019, value: 20.9 },
      { year: 2020, value: 21.7 },
      { year: 2021, value: 22.6 },
      { year: 2022, value: 25.1 },
      { year: 2023, value: 30.3 },
    ],
    historicalLabel: 'Capacità installata (GW)',
  },

  wind_onshore: {
    label: 'Eolico onshore',
    color: '#7DD3FC',
    unit: 'GW',
    description:
      'Le turbine eoliche convertono l\'energia cinetica del vento in elettricità. In Italia il vento è più forte e costante al Sud (Puglia, Calabria, Sicilia) e sui passi alpini. La produzione è massima in inverno e minima in estate.',
    capacityFactor: {
      value: 0.215,
      range: '12–30%',
      notes: 'Media annua italiana (11.8% giu – 30.4% dic)',
    },
    italy2023: {
      value: 12.3,
      productionTWh: 22,
      context: 'Concentrato principalmente in Puglia, Basilicata, Calabria e Sicilia.',
    },
    targets: [
      { year: 2030, value: 28.1, label: 'PNIEC 2030' },
      { year: 2050, value: 28.0, label: 'Net Zero 2050' },
    ],
    recentGrowth: '+0.4 GW/anno (2022→2023)',
    historical: [
      { year: 2005, value: 1.9 },
      { year: 2006, value: 1.9 },
      { year: 2007, value: 2.7 },
      { year: 2008, value: 3.5 },
      { year: 2009, value: 4.9 },
      { year: 2010, value: 5.8 },
      { year: 2011, value: 6.9 },
      { year: 2012, value: 8.1 },
      { year: 2013, value: 8.6 },
      { year: 2014, value: 8.7 },
      { year: 2015, value: 9.2 },
      { year: 2016, value: 9.4 },
      { year: 2017, value: 9.8 },
      { year: 2018, value: 10.3 },
      { year: 2019, value: 10.7 },
      { year: 2020, value: 10.9 },
      { year: 2021, value: 11.3 },
      { year: 2022, value: 11.9 },
      { year: 2023, value: 12.3 },
    ],
    historicalLabel: 'Capacità installata (GW)',
  },

  wind_offshore: {
    label: 'Eolico offshore',
    color: '#0EA5E9',
    unit: 'GW',
    description:
      'L\'eolico offshore installa turbine in mare aperto, dove il vento è più forte e più costante rispetto alla terraferma. L\'Italia ha zero installazioni offshore al 2023, ma il PNIEC prevede i primi impianti nel Mediterraneo entro il 2030.',
    capacityFactor: {
      value: 0.249,
      range: '17–33%',
      notes: 'Stima per il Mediterraneo (17% ago – 33% dic)',
    },
    italy2023: {
      value: 0,
      productionTWh: 0,
      context: 'Nessun impianto offshore operativo in Italia al 2023. Numerosi progetti in iter autorizzativo.',
    },
    targets: [
      { year: 2030, value: 2.0, label: 'PNIEC 2030' },
      { year: 2050, value: 8.0, label: 'Net Zero 2050' },
    ],
    recentGrowth: 'Nessuna installazione al 2023',
    historical: [
      { year: 2004, value: 0 },
      { year: 2005, value: 0 },
      { year: 2006, value: 0 },
      { year: 2007, value: 0 },
      { year: 2008, value: 0 },
      { year: 2009, value: 0 },
      { year: 2010, value: 0 },
      { year: 2011, value: 0 },
      { year: 2012, value: 0 },
      { year: 2013, value: 0 },
      { year: 2014, value: 0 },
      { year: 2015, value: 0 },
      { year: 2016, value: 0 },
      { year: 2017, value: 0 },
      { year: 2018, value: 0 },
      { year: 2019, value: 0 },
      { year: 2020, value: 0 },
      { year: 2021, value: 0 },
      { year: 2022, value: 0 },
      { year: 2023, value: 0 },
    ],
    historicalLabel: 'Capacità installata (GW)',
  },

  hydro: {
    label: 'Idroelettrico',
    color: '#14B8A6',
    unit: 'GW',
    description:
      'Le centrali idroelettriche sfruttano il dislivello dell\'acqua per far girare turbine. Le centrali a bacino (serbatoi) possono regolare la produzione quasi come un generatore termoelettrico; quelle ad acqua fluente seguono invece il regime dei fiumi. In Italia l\'idroelettrico è la principale fonte rinnovabile storica.',
    capacityFactor: {
      value: 0.212,
      range: '14–32%',
      notes: 'Media annua italiana (14.5% mar – 32.1% giu)',
    },
    italy2023: {
      value: 23.2,
      productionTWh: 37,
      context: '8.5 GW ad acqua fluente + 14.7 GW a serbatoio. Capacità sostanzialmente stabile dagli anni \'80.',
    },
    targets: [
      { year: 2030, value: 23.2, label: 'PNIEC 2030 (stabile)' },
    ],
    recentGrowth: 'Stabile (saturazione bacini italiani)',
    historical: [
      { year: 2005, value: 20.8 },
      { year: 2006, value: 20.9 },
      { year: 2007, value: 21.0 },
      { year: 2008, value: 21.3 },
      { year: 2009, value: 21.4 },
      { year: 2010, value: 21.5 },
      { year: 2011, value: 21.8 },
      { year: 2012, value: 22.0 },
      { year: 2013, value: 22.2 },
      { year: 2014, value: 22.2 },
      { year: 2015, value: 22.2 },
      { year: 2016, value: 22.4 },
      { year: 2017, value: 22.7 },
      { year: 2018, value: 22.7 },
      { year: 2019, value: 22.8 },
      { year: 2020, value: 23.0 },
      { year: 2021, value: 23.1 },
      { year: 2022, value: 23.2 },
      { year: 2023, value: 23.2 },
    ],
    historicalLabel: 'Capacità installata (GW)',
  },

  geothermal: {
    label: 'Geotermico',
    color: '#EA580C',
    unit: 'GW',
    description:
      'Le centrali geotermiche sfruttano il calore della terra per produrre vapore e generare elettricità. L\'Italia è pioniera mondiale: Larderello (Toscana) fu la prima centrale geotermica commerciale al mondo, inaugurata nel 1911. La produzione è praticamente costante tutto l\'anno.',
    capacityFactor: {
      value: 0.828,
      range: '81–84%',
      notes: 'Fattore di capacità quasi piatto — fonte baseload rinnovabile',
    },
    italy2023: {
      value: 0.8,
      productionTWh: 6.7,
      context: 'Concentrato in Toscana (Larderello, Amiata). Limitato dalla geologia.',
    },
    targets: [
      { year: 2030, value: 1.0, label: 'PNIEC 2030' },
      { year: 2050, value: 3.0, label: 'Net Zero 2050' },
    ],
    recentGrowth: 'Stabile (~0.8 GW dal 2010)',
    historical: [
      { year: 2005, value: 0.7 },
      { year: 2006, value: 0.7 },
      { year: 2007, value: 0.7 },
      { year: 2008, value: 0.7 },
      { year: 2009, value: 0.7 },
      { year: 2010, value: 0.8 },
      { year: 2011, value: 0.8 },
      { year: 2012, value: 0.8 },
      { year: 2013, value: 0.8 },
      { year: 2014, value: 0.8 },
      { year: 2015, value: 0.8 },
      { year: 2016, value: 0.8 },
      { year: 2017, value: 0.8 },
      { year: 2018, value: 0.8 },
      { year: 2019, value: 0.8 },
      { year: 2020, value: 0.8 },
      { year: 2021, value: 0.8 },
      { year: 2022, value: 0.8 },
      { year: 2023, value: 0.8 },
    ],
    historicalLabel: 'Capacità installata (GW)',
  },

  biomass: {
    label: 'Biomasse e biogas',
    color: '#22c55e',
    unit: 'GW',
    description:
      'Le centrali a biomassa bruciano materiale organico (legno, scarti agricoli, biogas da rifiuti) per generare vapore e produrre elettricità. Sono considerate a basse emissioni nette se la biomassa è rinnovabile, ma il loro impatto ambientale è dibattuto. Producono energia in modo programmabile, simile al gas.',
    capacityFactor: {
      value: 0.487,
      range: '44–53%',
      notes: 'Media annua italiana (44.4% nov – 52.9% mar)',
    },
    italy2023: {
      value: 4.1,
      productionTWh: 21,
      context: 'Stabile dal 2013. Il PNIEC prevede una riduzione per contenere l\'impatto ambientale delle biomasse solide.',
    },
    targets: [
      { year: 2030, value: 3.0, label: 'PNIEC 2030 (riduzione)' },
      { year: 2050, value: 2.0, label: 'Net Zero 2050' },
    ],
    recentGrowth: 'Stabile (~4.1 GW dal 2015)',
    historical: [
      { year: 2005, value: 1.2 },
      { year: 2006, value: 1.3 },
      { year: 2007, value: 1.3 },
      { year: 2008, value: 1.6 },
      { year: 2009, value: 2.0 },
      { year: 2010, value: 2.4 },
      { year: 2011, value: 2.8 },
      { year: 2012, value: 3.8 },
      { year: 2013, value: 4.0 },
      { year: 2014, value: 4.0 },
      { year: 2015, value: 4.1 },
      { year: 2016, value: 4.1 },
      { year: 2017, value: 4.1 },
      { year: 2018, value: 4.2 },
      { year: 2019, value: 4.1 },
      { year: 2020, value: 4.1 },
      { year: 2021, value: 4.1 },
      { year: 2022, value: 4.0 },
      { year: 2023, value: 4.1 },
    ],
    historicalLabel: 'Capacità installata (GW)',
  },

  nuclear: {
    label: 'Nucleare',
    color: '#8B5CF6',
    unit: 'TWh',
    description:
      'Le centrali nucleari sfruttano la fissione di atomi di uranio per generare calore, vapore e infine elettricità. Hanno fattori di capacità elevatissimi (~90%) e zero emissioni operative di CO₂. L\'Italia ha chiuso tutte le sue centrali tra il 1987 e il 1990 dopo il referendum post-Chernobyl.',
    italy2023: {
      value: 0,
      productionTWh: 0,
      context: 'Decommissionato nel 1987–1990 (Latina, Garigliano, Trino Vercellese, Caorso). Dibattito in corso sul ritorno al nucleare.',
    },
    targets: [
      { year: 2035, value: 0, label: 'Nessun piano' },
      { year: 2050, value: 57, label: 'Net Zero 2050 (ipotetico)' },
    ],
    recentGrowth: 'Decommissionato nel 1987–1990',
    historical: [
      { year: 2004, value: 0 },
      { year: 2005, value: 0 },
      { year: 2006, value: 0 },
      { year: 2007, value: 0 },
      { year: 2008, value: 0 },
      { year: 2009, value: 0 },
      { year: 2010, value: 0 },
      { year: 2011, value: 0 },
      { year: 2012, value: 0 },
      { year: 2013, value: 0 },
      { year: 2014, value: 0 },
      { year: 2015, value: 0 },
      { year: 2016, value: 0 },
      { year: 2017, value: 0 },
      { year: 2018, value: 0 },
      { year: 2019, value: 0 },
      { year: 2020, value: 0 },
      { year: 2021, value: 0 },
      { year: 2022, value: 0 },
      { year: 2023, value: 0 },
    ],
    historicalLabel: 'Produzione annua (TWh)',
  },

  gas_ccgt: {
    label: 'Gas naturale (CCGT)',
    color: '#94a3b8',
    unit: 'TWh',
    description:
      'Le centrali a ciclo combinato (CCGT) bruciano gas naturale prima in una turbina a gas, poi recuperano il calore residuo per una turbina a vapore — raggiungendo efficienze del 55–60%. Sono molto flessibili: possono partire e spegnersi in poche ore, bilanciando le oscillazioni delle rinnovabili.',
    italy2023: {
      value: 128,
      context: 'Prima fonte di produzione elettrica in Italia al 2023. In calo progressivo grazie alla crescita delle rinnovabili.',
    },
    targets: [
      { year: 2030, value: 60, label: 'PNIEC 2030' },
      { year: 2050, value: 12, label: 'Net Zero 2050' },
    ],
    recentGrowth: '−8 TWh/anno (2022→2023, in calo)',
    historical: [
      { year: 2004, value: 186 },
      { year: 2005, value: 190 },
      { year: 2006, value: 197 },
      { year: 2007, value: 202 },
      { year: 2008, value: 193 },
      { year: 2009, value: 180 },
      { year: 2010, value: 190 },
      { year: 2011, value: 187 },
      { year: 2012, value: 178 },
      { year: 2013, value: 165 },
      { year: 2014, value: 157 },
      { year: 2015, value: 154 },
      { year: 2016, value: 144 },
      { year: 2017, value: 143 },
      { year: 2018, value: 141 },
      { year: 2019, value: 143 },
      { year: 2020, value: 129 },
      { year: 2021, value: 132 },
      { year: 2022, value: 136 },
      { year: 2023, value: 128 },
    ],
    historicalLabel: 'Produzione annua (TWh)',
  },

  gas_ocgt: {
    label: 'Gas OCGT (peaker)',
    color: '#C2410C',
    unit: 'TWh',
    description:
      'Le turbine a gas a ciclo aperto (OCGT o "peaker") sono impianti veloci da avviare, usati solo nelle ore di picco della domanda. Hanno efficienza inferiore al CCGT (~35%) ma costi di investimento minori. Il loro ruolo è garantire la sicurezza del sistema nelle ore critiche.',
    italy2023: {
      value: 7,
      context: 'Usato principalmente come riserva di picco. Produzione limitata e decrescente.',
    },
    targets: [
      { year: 2030, value: 5, label: 'PNIEC 2030' },
      { year: 2050, value: 4, label: 'Net Zero 2050' },
    ],
    recentGrowth: '−1 TWh/anno (2022→2023)',
    historical: [
      { year: 2004, value: 12 },
      { year: 2005, value: 12 },
      { year: 2006, value: 13 },
      { year: 2007, value: 13 },
      { year: 2008, value: 12 },
      { year: 2009, value: 11 },
      { year: 2010, value: 12 },
      { year: 2011, value: 12 },
      { year: 2012, value: 11 },
      { year: 2013, value: 10 },
      { year: 2014, value: 10 },
      { year: 2015, value: 9 },
      { year: 2016, value: 9 },
      { year: 2017, value: 8 },
      { year: 2018, value: 8 },
      { year: 2019, value: 8 },
      { year: 2020, value: 7 },
      { year: 2021, value: 7 },
      { year: 2022, value: 8 },
      { year: 2023, value: 7 },
    ],
    historicalLabel: 'Produzione annua (TWh)',
  },

  coal: {
    label: 'Carbone',
    color: '#475569',
    unit: 'TWh',
    description:
      'Le centrali a carbone bruciano carbone per generare vapore ad alta pressione che fa girare turbine. Sono la fonte energetica con le maggiori emissioni di CO₂ per kWh (~1100 gCO₂/kWh). L\'Italia sta progressivamente chiudendo i suoi impianti: il piano di phase-out è previsto entro il 2025.',
    italy2023: {
      value: 12,
      context: 'In forte calo rispetto al picco di ~47 TWh degli anni 2000. Obiettivo phase-out entro il 2025.',
    },
    targets: [
      { year: 2025, value: 0, label: 'Phase-out previsto' },
      { year: 2030, value: 0, label: 'PNIEC 2030' },
    ],
    recentGrowth: '−8 TWh/anno (2022→2023, phase-out)',
    historical: [
      { year: 2004, value: 44 },
      { year: 2005, value: 44 },
      { year: 2006, value: 47 },
      { year: 2007, value: 45 },
      { year: 2008, value: 46 },
      { year: 2009, value: 40 },
      { year: 2010, value: 42 },
      { year: 2011, value: 41 },
      { year: 2012, value: 46 },
      { year: 2013, value: 41 },
      { year: 2014, value: 36 },
      { year: 2015, value: 34 },
      { year: 2016, value: 30 },
      { year: 2017, value: 28 },
      { year: 2018, value: 25 },
      { year: 2019, value: 21 },
      { year: 2020, value: 17 },
      { year: 2021, value: 22 },
      { year: 2022, value: 20 },
      { year: 2023, value: 12 },
    ],
    historicalLabel: 'Produzione annua (TWh)',
  },

  imports: {
    label: 'Importazioni nette',
    color: '#a855f7',
    unit: 'TWh',
    description:
      'L\'Italia importa elettricità principalmente da Francia (nucleare), Svizzera (idro) e Austria. Gli interconnector transalpini hanno una capacità di circa 25 GW. L\'importazione è storicamente conveniente ma crea dipendenza da produttori esteri.',
    italy2023: {
      value: 51,
      context: 'L\'Italia importa principalmente da Francia (nucleare), Svizzera (idro) e Austria. Nel 2023 le importazioni nette sono rimaste elevate a causa del ridotto apporto idroelettrico e dei prezzi favorevoli sul mercato europeo.',
    },
    targets: [
      { year: 2030, value: 10, label: 'PNIEC 2030' },
      { year: 2050, value: 15, label: 'Net Zero 2050' },
    ],
    recentGrowth: '+2 TWh/anno (2022→2023, stabile)',
    historical: [
      { year: 2004, value: 43 },
      { year: 2005, value: 40 },
      { year: 2006, value: 37 },
      { year: 2007, value: 40 },
      { year: 2008, value: 38 },
      { year: 2009, value: 42 },
      { year: 2010, value: 44 },
      { year: 2011, value: 37 },
      { year: 2012, value: 38 },
      { year: 2013, value: 42 },
      { year: 2014, value: 44 },
      { year: 2015, value: 46 },
      { year: 2016, value: 46 },
      { year: 2017, value: 45 },
      { year: 2018, value: 47 },
      { year: 2019, value: 46 },
      { year: 2020, value: 44 },
      { year: 2021, value: 47 },
      { year: 2022, value: 49 },
      { year: 2023, value: 51 },
    ],
    historicalLabel: 'Produzione annua (TWh)',
  },
}
