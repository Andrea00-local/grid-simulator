import type { RegionId } from './types'

export interface RegionData {
  id: RegionId
  name: string
  abbr: string
  populationM: number        // millions, 2023
  solarCF: number            // annual regional average CF
  windCF: number             // annual regional average CF
  hydroGW: number            // fixed installed hydro (run + reservoir)
  current2023SolarGW: number
  current2023WindGW: number
  demandPerCapitaFactor: number  // relative to national average (1.0)
  // SVG tile position
  tileX: number
  tileY: number
  tileW: number
  tileH: number
}

export const REGIONS: Record<RegionId, RegionData> = {
  vda: { id:'vda', name:"Valle d'Aosta", abbr:'VDA', populationM:0.12, solarCF:0.10, windCF:0.10, hydroGW:0.7, current2023SolarGW:0.05, current2023WindGW:0.01, demandPerCapitaFactor:0.90, tileX:20, tileY:12, tileW:52, tileH:38 },
  pie: { id:'pie', name:'Piemonte', abbr:'PIE', populationM:4.35, solarCF:0.12, windCF:0.18, hydroGW:3.0, current2023SolarGW:1.0, current2023WindGW:0.15, demandPerCapitaFactor:1.05, tileX:14, tileY:58, tileW:80, tileH:72 },
  lig: { id:'lig', name:'Liguria', abbr:'LIG', populationM:1.52, solarCF:0.13, windCF:0.20, hydroGW:0.3, current2023SolarGW:0.2, current2023WindGW:0.05, demandPerCapitaFactor:0.95, tileX:100, tileY:66, tileW:94, tileH:32 },
  lom: { id:'lom', name:'Lombardia', abbr:'LOM', populationM:10.0, solarCF:0.12, windCF:0.15, hydroGW:4.8, current2023SolarGW:3.0, current2023WindGW:0.10, demandPerCapitaFactor:1.30, tileX:104, tileY:8, tileW:94, tileH:52 },
  taa: { id:'taa', name:'Trentino-A.A.', abbr:'TAA', populationM:1.08, solarCF:0.11, windCF:0.18, hydroGW:3.5, current2023SolarGW:0.3, current2023WindGW:0.05, demandPerCapitaFactor:0.95, tileX:208, tileY:4, tileW:64, tileH:54 },
  ven: { id:'ven', name:'Veneto', abbr:'VEN', populationM:5.08, solarCF:0.12, windCF:0.18, hydroGW:2.0, current2023SolarGW:2.3, current2023WindGW:0.15, demandPerCapitaFactor:1.10, tileX:282, tileY:14, tileW:78, tileH:52 },
  fvg: { id:'fvg', name:'Friuli-V.G.', abbr:'FVG', populationM:1.21, solarCF:0.12, windCF:0.22, hydroGW:0.8, current2023SolarGW:0.4, current2023WindGW:0.05, demandPerCapitaFactor:1.05, tileX:370, tileY:14, tileW:58, tileH:52 },
  emr: { id:'emr', name:'Emilia-Romagna', abbr:'EMR', populationM:4.45, solarCF:0.13, windCF:0.20, hydroGW:0.2, current2023SolarGW:2.0, current2023WindGW:0.2, demandPerCapitaFactor:1.10, tileX:198, tileY:64, tileW:140, tileH:48 },
  tos: { id:'tos', name:'Toscana', abbr:'TOS', populationM:3.73, solarCF:0.14, windCF:0.22, hydroGW:0.3, current2023SolarGW:1.5, current2023WindGW:0.2, demandPerCapitaFactor:1.00, tileX:66, tileY:158, tileW:92, tileH:70 },
  umb: { id:'umb', name:'Umbria', abbr:'UMB', populationM:0.87, solarCF:0.14, windCF:0.18, hydroGW:0.15, current2023SolarGW:0.3, current2023WindGW:0.1, demandPerCapitaFactor:0.95, tileX:166, tileY:162, tileW:64, tileH:58 },
  mar: { id:'mar', name:'Marche', abbr:'MAR', populationM:1.53, solarCF:0.14, windCF:0.22, hydroGW:0.1, current2023SolarGW:0.5, current2023WindGW:0.2, demandPerCapitaFactor:0.95, tileX:240, tileY:128, tileW:64, tileH:75 },
  laz: { id:'laz', name:'Lazio', abbr:'LAZ', populationM:5.82, solarCF:0.15, windCF:0.20, hydroGW:0.2, current2023SolarGW:1.2, current2023WindGW:0.3, demandPerCapitaFactor:1.00, tileX:76, tileY:238, tileW:88, tileH:72 },
  abr: { id:'abr', name:'Abruzzo', abbr:'ABR', populationM:1.30, solarCF:0.14, windCF:0.24, hydroGW:0.5, current2023SolarGW:0.5, current2023WindGW:0.4, demandPerCapitaFactor:0.90, tileX:210, tileY:214, tileW:76, tileH:64 },
  mol: { id:'mol', name:'Molise', abbr:'MOL', populationM:0.29, solarCF:0.15, windCF:0.24, hydroGW:0.1, current2023SolarGW:0.2, current2023WindGW:0.3, demandPerCapitaFactor:0.80, tileX:210, tileY:286, tileW:76, tileH:38 },
  cam: { id:'cam', name:'Campania', abbr:'CAM', populationM:5.65, solarCF:0.16, windCF:0.26, hydroGW:0.4, current2023SolarGW:1.0, current2023WindGW:1.2, demandPerCapitaFactor:0.90, tileX:108, tileY:320, tileW:90, tileH:68 },
  pug: { id:'pug', name:'Puglia', abbr:'PUG', populationM:4.00, solarCF:0.17, windCF:0.28, hydroGW:0.05, current2023SolarGW:3.5, current2023WindGW:2.5, demandPerCapitaFactor:0.90, tileX:256, tileY:274, tileW:82, tileH:106 },
  bas: { id:'bas', name:'Basilicata', abbr:'BAS', populationM:0.55, solarCF:0.16, windCF:0.28, hydroGW:0.3, current2023SolarGW:0.4, current2023WindGW:0.6, demandPerCapitaFactor:0.85, tileX:210, tileY:332, tileW:60, tileH:46 },
  cal: { id:'cal', name:'Calabria', abbr:'CAL', populationM:1.88, solarCF:0.16, windCF:0.30, hydroGW:0.5, current2023SolarGW:0.6, current2023WindGW:0.8, demandPerCapitaFactor:0.80, tileX:186, tileY:392, tileW:74, tileH:82 },
  sic: { id:'sic', name:'Sicilia', abbr:'SIC', populationM:5.02, solarCF:0.18, windCF:0.30, hydroGW:0.1, current2023SolarGW:1.1, current2023WindGW:1.8, demandPerCapitaFactor:0.80, tileX:158, tileY:492, tileW:122, tileH:62 },
  sar: { id:'sar', name:'Sardegna', abbr:'SAR', populationM:1.61, solarCF:0.17, windCF:0.30, hydroGW:0.6, current2023SolarGW:0.8, current2023WindGW:1.1, demandPerCapitaFactor:0.85, tileX:8, tileY:302, tileW:72, tileH:104 },
}

export const REGION_IDS = Object.keys(REGIONS) as RegionId[]

// Adjacency list: [from, to, baseCapacityGW]
// Capacities approximate Terna NTCs for internal transmission sections
export const TRANSMISSION_LINKS: [RegionId, RegionId, number][] = [
  ['vda','pie',2.5], ['pie','lom',6.0], ['pie','lig',2.0],
  ['lom','lig',1.0], ['lom','taa',3.0], ['lom','ven',4.0], ['lom','emr',5.0],
  ['taa','ven',3.0], ['ven','fvg',2.0], ['ven','emr',3.0], ['fvg','emr',1.0],
  ['lig','emr',1.5], ['lig','tos',2.0],
  ['emr','tos',4.0], ['emr','mar',2.0],
  ['tos','umb',3.0], ['tos','laz',3.0], ['tos','mar',1.0],
  ['mar','umb',1.5], ['mar','abr',1.5],
  ['umb','laz',2.5], ['umb','abr',1.0],
  ['laz','abr',2.0], ['laz','mol',1.0], ['laz','cam',3.0],
  ['abr','mol',1.5],
  ['mol','cam',1.5], ['mol','pug',1.0],
  ['cam','pug',2.0], ['cam','bas',1.5], ['cam','cal',1.0],
  ['pug','bas',2.0],
  ['bas','cal',2.0],
  ['cal','sic',1.5],  // submarine cable
  ['sar','tos',1.0],  // SAPEI HVDC
  ['sar','laz',0.5],  // secondary cable
]

