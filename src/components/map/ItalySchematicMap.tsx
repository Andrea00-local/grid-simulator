import type { MarketZoneId, Level4Result } from '@/models/types'
import { ZONE_IDS, ZONE_TRANSMISSION_LINKS, REGION_TO_ZONE } from '@/models/italianZones'
import { REGIONS, REGION_IDS } from '@/models/italianRegions'

interface Props {
  result: Level4Result
  selected: MarketZoneId | null
  onSelect: (id: MarketZoneId) => void
}

function balanceColor(routedBalance: number, demandMWh: number): string {
  const pct = demandMWh > 0 ? routedBalance / demandMWh : 0
  if (pct >  0.20) return '#16a34a'
  if (pct >  0.05) return '#4ade80'
  if (pct > -0.05) return '#facc15'
  if (pct > -0.20) return '#f87171'
  return '#dc2626'
}

function textColorForBalance(routedBalance: number, demandMWh: number): string {
  const pct = demandMWh > 0 ? routedBalance / demandMWh : 0
  if (pct > 0.05 || pct < -0.05) return 'white'
  return '#1e293b'
}

export function ItalySchematicMap({ result, selected, onSelect }: Props) {
  const maxFlow = Math.max(...result.flows.map(f => f.energyMWh), 1)

  // Tile center for a region (used to draw transmission line anchors)
  const center = (id: (typeof REGION_IDS)[number]) => {
    const t = REGIONS[id]
    return { x: t.tileX + t.tileW / 2, y: t.tileY + t.tileH / 2 }
  }

  // Zone centroid in tile space: average of region tile centers in the zone
  const zoneTileCenters: Record<MarketZoneId, { x: number; y: number }> = {} as Record<MarketZoneId, { x: number; y: number }>
  for (const zoneId of ZONE_IDS) {
    const regionIds = REGION_IDS.filter(rid => REGION_TO_ZONE[rid] === zoneId)
    const xs = regionIds.map(rid => center(rid).x)
    const ys = regionIds.map(rid => center(rid).y)
    zoneTileCenters[zoneId] = {
      x: xs.reduce((a, b) => a + b, 0) / xs.length,
      y: ys.reduce((a, b) => a + b, 0) / ys.length,
    }
  }

  return (
    <svg viewBox="0 0 438 566" className="w-full h-auto" style={{ maxHeight: 560 }}>
      {/* Zone-to-zone flow lines */}
      {ZONE_TRANSMISSION_LINKS.map(([a, b]) => {
        const ca = zoneTileCenters[a], cb = zoneTileCenters[b]
        const flow = result.flows
          .filter(f => (f.from === a && f.to === b) || (f.from === b && f.to === a))
          .reduce((s, f) => s + f.energyMWh, 0)
        const thickness = flow > 0 ? 1 + (flow / maxFlow) * 5 : 0.5
        const color = flow > 0 ? '#3b82f6' : '#e2e8f0'
        return (
          <line
            key={`${a}-${b}`}
            x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
            stroke={color}
            strokeWidth={thickness}
            strokeOpacity={flow > 0 ? 0.7 : 0.4}
          />
        )
      })}

      {/* Region tiles — colored by zone balance */}
      {REGION_IDS.map(id => {
        const zoneId = REGION_TO_ZONE[id]
        const t = REGIONS[id]
        const z = result.zones[zoneId]
        const bg = balanceColor(z.routedBalance, z.demandMWh)
        const fg = textColorForBalance(z.routedBalance, z.demandMWh)
        const isSelected = selected === zoneId
        const pctLabel = ((z.routedBalance / z.demandMWh) * 100).toFixed(0)
        const sign = z.routedBalance >= 0 ? '+' : ''

        return (
          <g key={id} onClick={() => onSelect(zoneId)} style={{ cursor: 'pointer' }}>
            <rect
              x={t.tileX} y={t.tileY} width={t.tileW} height={t.tileH}
              rx={5}
              fill={bg}
              stroke={isSelected ? '#0f172a' : 'white'}
              strokeWidth={isSelected ? 2.5 : 1}
              opacity={0.92}
            />
            <text
              x={t.tileX + t.tileW / 2}
              y={t.tileY + t.tileH / 2 - 5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={t.tileW < 65 ? 9 : 10} fontWeight="600" fill={fg}
            >
              {t.abbr}
            </text>
            <text
              x={t.tileX + t.tileW / 2}
              y={t.tileY + t.tileH / 2 + 7}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={8} fill={fg} opacity={0.85}
            >
              {sign}{pctLabel}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}
