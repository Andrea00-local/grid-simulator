import type { RegionId, Level4Result } from '@/models/types'
import { REGIONS, REGION_IDS, TRANSMISSION_LINKS } from '@/models/italianRegions'

interface Props {
  result: Level4Result
  selected: RegionId | null
  onSelect: (id: RegionId) => void
}

function balanceColor(routedBalance: number, demandMWh: number): string {
  const pct = demandMWh > 0 ? routedBalance / demandMWh : 0
  if (pct >  0.20) return '#16a34a'  // green-600
  if (pct >  0.05) return '#4ade80'  // green-400
  if (pct > -0.05) return '#facc15'  // yellow-400
  if (pct > -0.20) return '#f87171'  // red-400
  return '#dc2626'                    // red-600
}

function textColorForBalance(routedBalance: number, demandMWh: number): string {
  const pct = demandMWh > 0 ? routedBalance / demandMWh : 0
  if (pct > 0.05 || pct < -0.05) return 'white'
  return '#1e293b'
}

export function ItalySchematicMap({ result, selected, onSelect }: Props) {
  // Tile centers for drawing transmission flow lines
  const center = (id: RegionId) => {
    const t = REGIONS[id]
    return { x: t.tileX + t.tileW / 2, y: t.tileY + t.tileH / 2 }
  }

  // Maximum flow for line thickness scaling
  const maxFlow = Math.max(...result.flows.map(f => f.energyMWh), 1)

  return (
    <svg viewBox="0 0 438 566" className="w-full h-auto" style={{ maxHeight: 560 }}>
      {/* Transmission flow lines — drawn behind tiles */}
      {TRANSMISSION_LINKS.map(([a, b]) => {
        const ca = center(a), cb = center(b)
        const flow = result.flows
          .filter(f => (f.path.includes(a) && f.path.includes(b)))
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

      {/* Region tiles */}
      {REGION_IDS.map(id => {
        const t = REGIONS[id]
        const r = result.regions[id]
        const bg = balanceColor(r.routedBalance, r.demandMWh)
        const fg = textColorForBalance(r.routedBalance, r.demandMWh)
        const isSelected = selected === id
        const pctLabel = ((r.routedBalance / r.demandMWh) * 100).toFixed(0)
        const sign = r.routedBalance >= 0 ? '+' : ''

        return (
          <g key={id} onClick={() => onSelect(id)} style={{ cursor: 'pointer' }}>
            <rect
              x={t.tileX}
              y={t.tileY}
              width={t.tileW}
              height={t.tileH}
              rx={5}
              fill={bg}
              stroke={isSelected ? '#0f172a' : 'white'}
              strokeWidth={isSelected ? 2.5 : 1}
              opacity={0.92}
            />
            <text
              x={t.tileX + t.tileW / 2}
              y={t.tileY + t.tileH / 2 - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={t.tileW < 65 ? 9 : 10}
              fontWeight="600"
              fill={fg}
            >
              {t.abbr}
            </text>
            <text
              x={t.tileX + t.tileW / 2}
              y={t.tileY + t.tileH / 2 + 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={8}
              fill={fg}
              opacity={0.85}
            >
              {sign}{pctLabel}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}
