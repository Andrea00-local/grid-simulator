import { useState } from 'react'
import {
  BarChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts'
import type { RegionId, Level4Result, RegionFlow } from '@/models/types'
import { REGIONS } from '@/models/italianRegions'
import { MONTHLY_CF, MONTHLY_DEMAND_FACTORS, MONTH_LABELS, ANNUAL_CF } from '@/models/profiles'
import { HOURLY_SOLAR_CF, windHourlyCF, DAYS_PER_MONTH } from '@/models/hourlyProfiles'
import { HOURLY_DEMAND_PROFILE } from '@/models/profiles'

interface Props {
  regionId: RegionId
  result: Level4Result
  flows: RegionFlow[]
  onClose: () => void
}

type Tab = 'annual' | 'monthly' | 'hourly'

function fmt1(v: number) { return v.toFixed(1) }
function fmtPct(v: number) { return (v * 100).toFixed(0) + '%' }

export function RegionDetail({ regionId, result, flows, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('annual')
  const [hourlyMonth, setHourlyMonth] = useState(6) // July (0-indexed)

  const r = result.regions[regionId]
  const reg = REGIONS[regionId]

  const demandMWh = r.demandMWh
  const productionMWh = r.productionMWh
  const renewShare = productionMWh > 0 ? r.renewableMWh / productionMWh : 0
  const emissionsMt = r.emissionsTonnes / 1e6
  const netBalance = r.routedBalance / 1e6
  const balancePct = demandMWh > 0 ? r.routedBalance / demandMWh : 0

  const balanceColor = balancePct > 0.05 ? '#16a34a' : balancePct < -0.05 ? '#dc2626' : '#ca8a04'

  // ── Annual capacity bar data ──
  const capacityData = [
    { name: 'Solare', gw: r.solarGW, fill: '#facc15' },
    { name: 'Eolico', gw: r.windGW, fill: '#60a5fa' },
    { name: 'Idro', gw: reg.hydroGW, fill: '#34d399' },
  ]

  // ── Flows for this region ──
  const regionFlows = flows
    .filter(f => f.from === regionId || f.to === regionId)
    .sort((a, b) => b.energyMWh - a.energyMWh)
    .slice(0, 6)

  // ── Monthly data ──
  const windAnnualCF = ANNUAL_CF.wind_onshore ?? 0.201
  const hydroRunCF = MONTHLY_CF.hydro_run!

  const monthlyData = MONTH_LABELS.map((label, m) => {
    const solarMWh = r.solarGW * (MONTHLY_CF.solar![m]) * 730 * 1000
    const windCFMonthly = MONTHLY_CF.wind_onshore![m]
    const windScale = windAnnualCF > 0 ? reg.windCF / windAnnualCF : 1
    const windMWh = r.windGW * windCFMonthly * windScale * 730 * 1000
    const hydroMWh = reg.hydroGW * hydroRunCF[m] * 730 * 1000
    const demandMonthly = (demandMWh / 12) * MONTHLY_DEMAND_FACTORS[m]
    return {
      label,
      solar: Math.round(solarMWh / 1000),   // GWh
      wind: Math.round(windMWh / 1000),
      hydro: Math.round(hydroMWh / 1000),
      demand: Math.round(demandMonthly / 1000),
    }
  })

  // ── Hourly data ──
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const solarMWh = r.solarGW * HOURLY_SOLAR_CF[hourlyMonth][h] * 1000
    const windScale = windAnnualCF > 0 ? reg.windCF / windAnnualCF : 1
    const windHourly = windHourlyCF('wind_onshore', hourlyMonth)
    const windMWh = r.windGW * windHourly[h] * windScale * 1000
    const daysInMonth = DAYS_PER_MONTH[hourlyMonth]
    const demandHourly = (demandMWh / 8760) * HOURLY_DEMAND_PROFILE[h] * (daysInMonth * 24 / (365.25 * 24 / 12))
    const hydroMWh = reg.hydroGW * hydroRunCF[hourlyMonth] * 1000
    return {
      hour: `${h.toString().padStart(2, '0')}:00`,
      solar: Math.round(solarMWh),
      wind: Math.round(windMWh),
      hydro: Math.round(hydroMWh),
      demand: Math.round(demandHourly),
    }
  })

  const TABS: { id: Tab; label: string }[] = [
    { id: 'annual', label: 'Annuale' },
    { id: 'monthly', label: 'Mensile' },
    { id: 'hourly', label: 'Orario' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{reg.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Analisi energetica regionale</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Chiudi pannello"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* ── TAB: ANNUALE ── */}
        {tab === 'annual' && (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Domanda', value: fmt1(demandMWh / 1e6), unit: 'TWh' },
                { label: 'Produzione', value: fmt1(productionMWh / 1e6), unit: 'TWh' },
                { label: 'Quota rinnov.', value: fmtPct(renewShare), unit: '' },
                { label: 'Emissioni', value: emissionsMt.toFixed(2), unit: 'MtCO₂' },
                { label: 'Saldo netto', value: (netBalance >= 0 ? '+' : '') + fmt1(netBalance), unit: 'TWh', color: balanceColor },
                { label: 'Idro (fisso)', value: fmt1(reg.hydroGW), unit: 'GW' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-lg font-bold" style={{ color: color ?? '#111827' }}>
                    {value}
                    {unit && <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Installed capacity bar chart */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Capacità installata
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={capacityData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" unit=" GW" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={48} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toFixed(2)} GW`, 'Capacità']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="gw" radius={[0, 4, 4, 0]}>
                    {capacityData.map((entry) => (
                      <rect key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Energy flows */}
            {regionFlows.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Flussi di energia
                </h3>
                <div className="space-y-2">
                  {regionFlows.map((f, i) => {
                    const isExport = f.from === regionId
                    const other = isExport ? f.to : f.from
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            isExport
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isExport ? 'EXP' : 'IMP'}
                          </span>
                          <span className="text-gray-600 text-xs">{REGIONS[other].name}</span>
                        </div>
                        <span className={`font-semibold text-xs tabular-nums ${
                          isExport ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {isExport ? '-' : '+'}{(f.energyMWh / 1e6).toFixed(1)} TWh
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: MENSILE ── */}
        {tab === 'monthly' && (
          <>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Produzione mensile vs domanda (GWh)
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip
                    formatter={(v, name) => [`${v} GWh`, name as string]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="solar" name="Solare" stackId="prod" fill="#facc15" />
                  <Bar dataKey="wind" name="Eolico" stackId="prod" fill="#60a5fa" />
                  <Bar dataKey="hydro" name="Idro" stackId="prod" fill="#34d399" />
                  <Line
                    dataKey="demand"
                    name="Domanda"
                    type="monotone"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly summary table */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Riepilogo mensile
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 pr-2 font-medium">Mese</th>
                      <th className="text-right py-2 px-1 font-medium">Prod.</th>
                      <th className="text-right py-2 px-1 font-medium">Dom.</th>
                      <th className="text-right py-2 pl-1 font-medium">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map(d => {
                      const total = d.solar + d.wind + d.hydro
                      const balance = total - d.demand
                      return (
                        <tr key={d.label} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 pr-2 font-medium text-gray-700">{d.label}</td>
                          <td className="py-1.5 px-1 text-right tabular-nums text-gray-600">{total}</td>
                          <td className="py-1.5 px-1 text-right tabular-nums text-gray-600">{d.demand}</td>
                          <td className={`py-1.5 pl-1 text-right tabular-nums font-medium ${
                            balance >= 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {balance >= 0 ? '+' : ''}{balance}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: ORARIO ── */}
        {tab === 'hourly' && (
          <>
            {/* Month selector */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Seleziona mese
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {MONTH_LABELS.map((label, m) => (
                  <button
                    key={m}
                    onClick={() => setHourlyMonth(m)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      hourlyMonth === m
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Profilo orario — {MONTH_LABELS[hourlyMonth]} (MWh)
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 9 }}
                    interval={3}
                  />
                  <YAxis tick={{ fontSize: 10 }} width={44} />
                  <Tooltip
                    formatter={(v, name) => [`${v} MWh`, name as string]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    dataKey="solar"
                    name="Solare"
                    type="monotone"
                    stackId="prod"
                    fill="#fde68a"
                    stroke="#facc15"
                    strokeWidth={1}
                  />
                  <Area
                    dataKey="wind"
                    name="Eolico"
                    type="monotone"
                    stackId="prod"
                    fill="#bfdbfe"
                    stroke="#60a5fa"
                    strokeWidth={1}
                  />
                  <Area
                    dataKey="hydro"
                    name="Idro"
                    type="monotone"
                    stackId="prod"
                    fill="#a7f3d0"
                    stroke="#34d399"
                    strokeWidth={1}
                  />
                  <Line
                    dataKey="demand"
                    name="Domanda"
                    type="monotone"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Peak info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Statistiche orarie — {MONTH_LABELS[hourlyMonth]}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const maxSolar = Math.max(...hourlyData.map(d => d.solar))
                  const maxWind = Math.max(...hourlyData.map(d => d.wind))
                  const peakDemand = Math.max(...hourlyData.map(d => d.demand))
                  const peakSolarHour = hourlyData.findIndex(d => d.solar === maxSolar)
                  return [
                    { label: 'Picco solare', value: `${maxSolar} MWh`, sub: `ore ${peakSolarHour}:00` },
                    { label: 'Picco eolico', value: `${maxWind} MWh`, sub: 'ore notturne' },
                    { label: 'Picco domanda', value: `${peakDemand} MWh`, sub: 'ore 19-20' },
                    { label: 'Ore solari', value: `${hourlyData.filter(d => d.solar > 10).length}h`, sub: 'produzione' },
                  ]
                })().map(({ label, value, sub }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-gray-800">{value}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
