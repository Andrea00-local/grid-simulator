import { useState } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart,
} from 'recharts'
import type { TransmissionLinkData } from '@/models/types'
import { ZONES } from '@/models/italianZones'
import { MONTH_LABELS } from '@/models/profiles'
import { DAYS_PER_MONTH } from '@/models/hourlyProfiles'

interface Props {
  link:    TransmissionLinkData
  onClose: () => void
}

type Tab = 'annual' | 'monthly' | 'hourly'

const COLOR_FT = '#3b82f6'   // from→to: blue
const COLOR_TF = '#f97316'   // to→from: orange

const fmtGWh = (v: unknown) => `${Number(v).toFixed(0)} GWh`
const fmtMWh = (v: unknown) => `${Number(v).toFixed(0)} MWh`

export function TransmissionDetail({ link, onClose }: Props) {
  const [tab, setTab]               = useState<Tab>('monthly')
  const [hourlyMonth, setHourlyMonth] = useState(6)

  const fromName = ZONES[link.from].name
  const toName   = ZONES[link.to].name

  // Monthly chart data: fromTo positive, toFrom negative for visual separation
  const monthlyData = MONTH_LABELS.map((label, m) => ({
    label,
    fromTo:  Math.round(link.monthlyGWhFromTo[m] * 10) / 10,
    toFrom: -Math.round(link.monthlyGWhToFrom[m] * 10) / 10,
  }))

  // Annual summary bar chart
  const annualData = [
    { label: `${fromName}→${toName}`, value: Math.round(link.annualFromToTWh * 1000) },
    { label: `${toName}→${fromName}`, value: Math.round(link.annualToFromTWh * 1000) },
  ]

  // Hourly chart for selected month
  const hourlyData = link.hourlyMWh[hourlyMonth].map((mwh, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    flow: Math.round(mwh),
  }))

  const capMW = Math.round(link.capacityGW * 1000)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'annual',  label: 'Annuale'  },
    { id: 'monthly', label: 'Mensile'  },
    { id: 'hourly',  label: 'Orario'   },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{fromName} ↔ {toName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Linea di trasmissione — {link.capacityGW.toFixed(2)} GW</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Chiudi"
        >✕</button>
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
          >{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* KPI cards — always visible */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Capacità</p>
            <p className="text-lg font-bold text-gray-900">
              {link.capacityGW.toFixed(2)}
              <span className="text-xs font-normal text-gray-400 ml-1">GW</span>
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Utilizzo medio</p>
            <p className="text-lg font-bold text-gray-900">
              {link.utilizationPct.toFixed(1)}
              <span className="text-xs font-normal text-gray-400 ml-1">%</span>
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-400 mb-1">{fromName} → {toName}</p>
            <p className="text-lg font-bold text-blue-700">
              {link.annualFromToTWh.toFixed(2)}
              <span className="text-xs font-normal text-blue-400 ml-1">TWh</span>
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-xs text-orange-400 mb-1">{toName} → {fromName}</p>
            <p className="text-lg font-bold text-orange-700">
              {link.annualToFromTWh.toFixed(2)}
              <span className="text-xs font-normal text-orange-400 ml-1">TWh</span>
            </p>
          </div>
        </div>

        {/* ── ANNUAL TAB ──────────────────────────────────────────────────────── */}
        {tab === 'annual' && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Flusso annuale per direzione (GWh)
            </h3>
            {link.annualFromToTWh + link.annualToFromTWh < 0.001 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                Nessun flusso su questa linea nello scenario corrente
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={annualData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} width={44} unit=" GWh" />
                  <Tooltip formatter={fmtGWh} contentStyle={{ fontSize: 12 }} wrapperStyle={{ zIndex: 9999 }} />
                  <Bar dataKey="value" name="Energia" radius={[4, 4, 0, 0]}>
                    {annualData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? COLOR_FT : COLOR_TF} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ── MONTHLY TAB ─────────────────────────────────────────────────────── */}
        {tab === 'monthly' && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Flusso mensile (GWh)
            </h3>
            <div className="flex gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLOR_FT }} />
                {fromName}→{toName}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLOR_TF }} />
                {toName}→{fromName}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={44} />
                <Tooltip
                  formatter={(v, name) => [`${Math.abs(Number(v)).toFixed(1)} GWh`, name]}
                  contentStyle={{ fontSize: 12 }}
                  wrapperStyle={{ zIndex: 9999 }}
                />
                <ReferenceLine y={0} stroke="#d1d5db" />
                <Bar dataKey="fromTo" name={`${fromName}→${toName}`} fill={COLOR_FT} />
                <Bar dataKey="toFrom" name={`${toName}→${fromName}`} fill={COLOR_TF} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Monthly table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-2 pr-2 font-medium">Mese</th>
                    <th className="text-right py-2 px-1 font-medium" style={{ color: COLOR_FT }}>→</th>
                    <th className="text-right py-2 px-1 font-medium" style={{ color: COLOR_TF }}>←</th>
                    <th className="text-right py-2 pl-1 font-medium">Utilizzo</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTH_LABELS.map((label, m) => {
                    const maxGWh = link.capacityGW * 1000 * 24 * DAYS_PER_MONTH[m] / 1000
                    const used   = link.monthlyGWhFromTo[m] + link.monthlyGWhToFrom[m]
                    const utilPct = maxGWh > 0 ? (used / maxGWh * 100).toFixed(0) : '0'
                    return (
                      <tr key={m} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 pr-2 font-medium text-gray-700">{label}</td>
                        <td className="py-1.5 px-1 text-right tabular-nums" style={{ color: COLOR_FT }}>
                          {link.monthlyGWhFromTo[m].toFixed(1)}
                        </td>
                        <td className="py-1.5 px-1 text-right tabular-nums" style={{ color: COLOR_TF }}>
                          {link.monthlyGWhToFrom[m].toFixed(1)}
                        </td>
                        <td className="py-1.5 pl-1 text-right tabular-nums text-gray-500">{utilPct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HOURLY TAB ──────────────────────────────────────────────────────── */}
        {tab === 'hourly' && (
          <>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seleziona mese</h3>
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
                  >{label}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Profilo orario — {MONTH_LABELS[hourlyMonth]} (MWh)
              </h3>
              <div className="flex gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLOR_FT }} />
                  {fromName}→{toName}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLOR_TF }} />
                  {toName}→{fromName}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hourlyData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} width={54} axisLine={false} tickLine={false} />
                  <Tooltip formatter={fmtMWh} contentStyle={{ fontSize: 12 }} wrapperStyle={{ zIndex: 9999 }} />
                  <ReferenceLine y={0}      stroke="#9ca3af" strokeWidth={1.5} />
                  <ReferenceLine y={ capMW} stroke={COLOR_FT} strokeDasharray="3 2" strokeOpacity={0.45} />
                  <ReferenceLine y={-capMW} stroke={COLOR_TF} strokeDasharray="3 2" strokeOpacity={0.45} />
                  <Bar dataKey="flow" name="Flusso" maxBarSize={18}>
                    {hourlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.flow >= 0 ? COLOR_FT : COLOR_TF} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Linee tratteggiate = capacità massima ±{link.capacityGW.toFixed(2)} GW
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
