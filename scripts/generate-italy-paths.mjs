import { readFileSync } from 'fs'

// Projection: Italy bounding box lon 6.6–18.6°E, lat 36.6–47.1°N
// viewBox: "0 0 560 640"
function project(lon, lat) {
  const x = ((lon - 6.6) / 12.0) * 520 + 20
  const y = ((47.1 - lat) / 10.5) * 610 + 15
  return [x, y]
}

// Map Italian region names to our RegionId
const NAME_TO_ID = {
  "Valle d'Aosta/Vallée d'Aoste": 'vda',
  "Valle d'Aosta": 'vda',
  "Valle D'Aosta": 'vda',
  'Piemonte': 'pie',
  'Liguria': 'lig',
  'Lombardia': 'lom',
  'Trentino-Alto Adige/Südtirol': 'taa',
  'Trentino-Alto Adige': 'taa',
  'Trentino Alto Adige': 'taa',
  'Veneto': 'ven',
  'Friuli-Venezia Giulia': 'fvg',
  'Friuli Venezia Giulia': 'fvg',
  'Emilia-Romagna': 'emr',
  'Emilia Romagna': 'emr',
  'Toscana': 'tos',
  'Umbria': 'umb',
  'Marche': 'mar',
  'Lazio': 'laz',
  'Abruzzo': 'abr',
  'Molise': 'mol',
  'Campania': 'cam',
  'Puglia': 'pug',
  'Basilicata': 'bas',
  'Calabria': 'cal',
  'Sicilia': 'sic',
  'Sardegna': 'sar',
}

// Convert a coordinate ring to an SVG path string
// Simplify by keeping every Nth point
function ringToPath(coords, N = 3) {
  const pts = []
  for (let i = 0; i < coords.length; i += N) {
    const [lon, lat] = coords[i]
    const [x, y] = project(lon, lat)
    pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10])
  }
  // Always include the last point to close
  if (pts.length > 0) {
    const [lon, lat] = coords[coords.length - 1]
    const [x, y] = project(lon, lat)
    pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10])
  }
  if (pts.length === 0) return ''
  const [fx, fy] = pts[0]
  let d = `M ${fx},${fy}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0]},${pts[i][1]}`
  }
  d += ' Z'
  return d
}

// Get the outer ring of a polygon geometry
function getOuterRingFromPolygon(coords) {
  // coords[0] is the outer ring
  return coords[0]
}

// For MultiPolygon: pick the largest ring by point count
function getLargestRingFromMultiPolygon(coords) {
  let largest = null
  let maxLen = 0
  for (const polygon of coords) {
    const ring = polygon[0] // outer ring
    if (ring.length > maxLen) {
      maxLen = ring.length
      largest = ring
    }
  }
  return largest
}

// Compute centroid from projected path points
function computeCentroid(ring) {
  let sumX = 0, sumY = 0, count = 0
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat)
    sumX += x
    sumY += y
    count++
  }
  return [Math.round(sumX / count), Math.round(sumY / count)]
}

const geojson = JSON.parse(readFileSync('/Users/andreaalberoni/grid-simulator/public/italy-regions.geojson', 'utf8'))

const paths = {}
const centroids = {}
const unmapped = []

for (const feature of geojson.features) {
  const regName = feature.properties.reg_name
  const id = NAME_TO_ID[regName]

  if (!id) {
    unmapped.push(regName)
    continue
  }

  const geom = feature.geometry
  let outerRing

  if (geom.type === 'Polygon') {
    outerRing = getOuterRingFromPolygon(geom.coordinates)
  } else if (geom.type === 'MultiPolygon') {
    outerRing = getLargestRingFromMultiPolygon(geom.coordinates)
  } else {
    console.error(`Unknown geometry type for ${regName}: ${geom.type}`)
    continue
  }

  if (!outerRing) {
    console.error(`No ring found for ${regName}`)
    continue
  }

  // Determine N based on ring size — target ~100-150 pts per region
  const N = outerRing.length > 1000 ? 30 : outerRing.length > 500 ? 15 : outerRing.length > 200 ? 8 : 4

  paths[id] = ringToPath(outerRing, N)
  centroids[id] = computeCentroid(outerRing)

  const pointCount = Math.ceil(outerRing.length / N)
  console.log(`${id} (${regName}): ${outerRing.length} pts -> ${pointCount} simplified (N=${N})`)
}

if (unmapped.length > 0) {
  console.warn('Unmapped regions:', unmapped)
}

// Output TypeScript snippet
console.log('\n\n// ===== PASTE THIS INTO ItalyGeoMap.tsx =====\n')

console.log('const PATHS: Record<RegionId, string> = {')
for (const [id, path] of Object.entries(paths)) {
  console.log(`  ${id}: "${path}",`)
}
console.log('}')

console.log('\nconst CENTROIDS: Record<RegionId, [number, number]> = {')
for (const [id, c] of Object.entries(centroids)) {
  console.log(`  ${id}: [${c[0]}, ${c[1]}],`)
}
console.log('}')
