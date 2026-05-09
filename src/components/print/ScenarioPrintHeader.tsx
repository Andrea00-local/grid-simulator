import { useSimStore } from '@/store/simulationStore'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'
import type { Source } from '@/models/types'

const RENEWABLE_SOURCES: Source[] = [
  'solar', 'wind_onshore', 'wind_offshore',
  'hydro_run', 'hydro_reservoir', 'geothermal', 'biomass',
]
const DIRECT_SOURCES: Source[] = ['nuclear', 'gas_ccgt', 'gas_ocgt', 'coal', 'imports']

interface Props {
  level: 1 | 2 | 3 | 4
  levelName: string
  coverage: number        // 0–1
  renewableShare: number  // 0–1
  avoidedMt: number
  extraParams?: { label: string; value: string }[]
}

export function ScenarioPrintHeader({ level, levelName, coverage, renewableShare, avoidedMt, extraParams }: Props) {
  const renewableCapacity = useSimStore(s => s.renewableCapacity)
  const directProduction  = useSimStore(s => s.directProduction)
  const demandTWh         = useSimStore(s => s.demandTWh)
  const result            = useSimStore(s => s.result)

  const totalProd = Object.values(result.totalProductionBySource).reduce((a, b) => a + b, 0) / 1_000_000
  const now = new Date().toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const baselineMt = ITALY_CO2_BASELINE_MT

  return (
    <div className="hidden print:block mb-6 text-[#1e293b] text-sm">
      {/* Title bar */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-gray-300 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">⚡</span>
            <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Grid Simulator
            </span>
          </div>
          <p className="text-xs text-gray-500">Simulatore Rete Elettrica Italiana</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p className="font-semibold text-gray-800 mb-0.5">Livello {level} — {levelName}</p>
          <p>Generato il {now}</p>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          {
            label: 'Copertura domanda',
            value: `${(coverage * 100).toFixed(1)}%`,
            ok: coverage >= 0.99,
            note: coverage >= 0.99 ? 'Obiettivo raggiunto' : `Deficit ${((1 - coverage) * demandTWh).toFixed(1)} TWh`,
          },
          {
            label: 'Quota rinnovabili',
            value: `${(renewableShare * 100).toFixed(1)}%`,
            ok: renewableShare >= 0.65,
            note: 'Obiettivo PNIEC 2030: 65%',
          },
          {
            label: 'CO₂ evitata',
            value: `${avoidedMt.toFixed(1)} Mt/anno`,
            ok: avoidedMt >= baselineMt * 0.55,
            note: `Su baseline ${baselineMt} Mt (EU -55%)`,
          },
        ].map(({ label, value, ok, note }) => (
          <div key={label} className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold mb-0.5" style={{ color: ok ? '#16a34a' : '#ea580c' }}>{value}</p>
            <p className="text-xs text-gray-400">{note}</p>
          </div>
        ))}
      </div>

      {/* Extra level-specific params (L3 scenario/storage, L4 plan/boost) */}
      {extraParams && extraParams.length > 0 && (
        <div className="flex gap-6 mb-5 border border-gray-100 rounded-lg p-3 bg-gray-50">
          {extraParams.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Parameter table */}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Parametri scenario</p>
      <table className="w-full text-xs border-collapse mb-1">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-1.5 text-gray-500 font-medium w-44">Fonte</th>
            <th className="text-right py-1.5 text-gray-500 font-medium">Configurazione</th>
            <th className="text-right py-1.5 text-gray-500 font-medium">Produzione annua</th>
            <th className="text-right py-1.5 text-gray-500 font-medium">% mix</th>
          </tr>
        </thead>
        <tbody>
          {RENEWABLE_SOURCES
            .filter(src => (renewableCapacity[src] ?? 0) > 0)
            .map(src => {
              const gw  = renewableCapacity[src] ?? 0
              const mwh = result.totalProductionBySource[src] ?? 0
              const twh = mwh / 1_000_000
              const pct = totalProd > 0 ? (twh / totalProd * 100) : 0
              return (
                <tr key={src} className="border-b border-gray-100">
                  <td className="py-1.5 flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SOURCE_DEFINITIONS[src].color }}
                    />
                    {SOURCE_DEFINITIONS[src].label}
                  </td>
                  <td className="py-1.5 text-right font-mono text-gray-700">{gw.toFixed(1)} GW</td>
                  <td className="py-1.5 text-right font-mono text-gray-700">{twh.toFixed(1)} TWh</td>
                  <td className="py-1.5 text-right font-mono text-gray-500">{pct.toFixed(1)}%</td>
                </tr>
              )
            })}
          {DIRECT_SOURCES
            .filter(src => (directProduction[src] ?? 0) > 0)
            .map(src => {
              const twh = directProduction[src] ?? 0
              const pct = totalProd > 0 ? (twh / totalProd * 100) : 0
              return (
                <tr key={src} className="border-b border-gray-100">
                  <td className="py-1.5 flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SOURCE_DEFINITIONS[src].color }}
                    />
                    {SOURCE_DEFINITIONS[src].label}
                  </td>
                  <td className="py-1.5 text-right font-mono text-gray-700">{twh.toFixed(1)} TWh</td>
                  <td className="py-1.5 text-right font-mono text-gray-700">{twh.toFixed(1)} TWh</td>
                  <td className="py-1.5 text-right font-mono text-gray-500">{pct.toFixed(1)}%</td>
                </tr>
              )
            })}
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-1.5">Domanda totale</td>
            <td className="py-1.5 text-right font-mono">—</td>
            <td className="py-1.5 text-right font-mono">{demandTWh.toFixed(0)} TWh</td>
            <td className="py-1.5 text-right font-mono">—</td>
          </tr>
        </tbody>
      </table>

      <div className="border-t-2 border-gray-300 mt-4 mb-6" />
    </div>
  )
}
