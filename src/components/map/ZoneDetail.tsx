import { useState } from 'react'
import {
  BarChart, Bar, Area, AreaChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine,
} from 'recharts'
import type { MarketZoneId, Level4Result, MarketZoneFlow } from '@/models/types'
import { ZONES } from '@/models/italianZones'
import { MONTH_LABELS } from '@/models/profiles'
import { DAYS_PER_MONTH } from '@/models/hourlyProfiles'

interface Props {
  zoneId:  MarketZoneId
  result:  Level4Result
  flows:   MarketZoneFlow[]
  onClose: () => void
}

type Tab = 'annual' | 'monthly' | 'hourly'

function fmt1(v: number) { return v.toFixed(1) }
function fmtPct(v: number) { return (v * 100).toFixed(0) + '%' }

// ─── colour palette ────────────────────────────────────────────────────────────
const COLORS = {
  solar:    '#facc15',
  wind:     '#60a5fa',
  hydro:    '#34d399',
  nuclear:  '#a78bfa',
  biomass:  '#86efac',
  geo:      '#6ee7b7',
  gas:      '#fb923c',
  coal:     '#6b7280',
  imports:  '#94a3b8',
  regImp:   '#8b5cf6',  // same colour for both positive (import) and negative (export)
  demand:   '#ef4444',
  battery:  '#0d9488',
} as const

// ─── Chart tooltip formatters ─────────────────────────────────────────────────
const fmtTip    = (v: unknown) => `${Number(v).toFixed(0)} MWh`
const fmtTipGWh = (v: unknown) => `${Number(v).toFixed(0)} GWh`

export function ZoneDetail({ zoneId, result, flows, onClose }: Props) {
  const [tab, setTab]               = useState<Tab>('annual')
  const [hourlyMonth, setHourlyMonth] = useState(6)

  const z    = result.zones[zoneId]
  const zone = ZONES[zoneId]
  const months = result.zoneMonths[zoneId]  // ZoneDailyResult[] — 12 entries

  const renewShare    = z.productionMWh > 0 ? z.renewableMWh / z.productionMWh : 0
  const balancePct    = z.demandMWh > 0 ? z.routedBalance / z.demandMWh : 0
  const balanceColor  = balancePct > 0.05 ? '#16a34a' : balancePct < -0.05 ? '#dc2626' : '#ca8a04'
  const netBalance    = z.routedBalance / 1e6

  const zoneFlows = flows
    .filter(f => f.from === zoneId || f.to === zoneId)
    .sort((a, b) => b.energyMWh - a.energyMWh)
    .slice(0, 6)

  // ── Monthly chart data (daily × days_in_month, in GWh) ────────────────────────
  const monthlyData = months.map((d, m) => {
    const days = DAYS_PER_MONTH[m]
    const scale = days / 1000  // MWh → GWh
    return {
      label:   MONTH_LABELS[m],
      solar:   Math.round(d.solarMWh    * scale),
      wind:    Math.round(d.windMWh     * scale),
      hydro:   Math.round(d.hydroMWh    * scale),
      nuclear: Math.round(d.nuclearMWh  * scale),
      biomass: Math.round(d.biomassMWh  * scale),
      geo:     Math.round(d.geothermalMWh * scale),
      gas:     Math.round(d.gasMWh      * scale),
      coal:    Math.round(d.coalMWh     * scale),
      imports: Math.round(d.importsMWh  * scale),
      regImp:  Math.round(d.regionalImportMWh * scale),
      demand:  Math.round(d.demandMWh   * scale),
      deficit: Math.round(d.deficitMWh  * scale),
      surplus: Math.round(d.curtailmentMWh * scale),
    }
  })

  // ── Annual summary (sum over 12 months) in GWh ────────────────────────────────
  const annualTotals = (() => {
    const t = { solar: 0, wind: 0, hydro: 0, nuclear: 0, biomass: 0, geo: 0, gas: 0, coal: 0, imports: 0, regImp: 0, demand: 0, deficit: 0, surplus: 0 }
    monthlyData.forEach(d => {
      t.solar   += d.solar;   t.wind  += d.wind;    t.hydro   += d.hydro
      t.nuclear += d.nuclear; t.biomass += d.biomass; t.geo    += d.geo
      t.gas     += d.gas;     t.coal  += d.coal;    t.imports += d.imports
      t.regImp  += d.regImp;  t.demand += d.demand
      t.deficit += d.deficit; t.surplus += d.surplus
    })
    return t
  })()

  // ── Hourly chart data (MWh, representative day of selected month) ──────────────
  const hourlyData = (months[hourlyMonth]?.hours ?? []).map(hp => ({
    hour:    `${String(hp.hour).padStart(2, '0')}:00`,
    solar:   Math.round(hp.solar),
    wind:    Math.round(hp.wind),
    hydro:   Math.round(hp.hydro),
    nuclear: Math.round(hp.nuclear),
    biomass: Math.round(hp.biomass),
    geo:     Math.round(hp.geothermal),
    gas:     Math.round(hp.gas),
    coal:    Math.round(hp.coal),
    imports: Math.round(hp.imports),
    regImp:  Math.round(hp.regionalImport),
    demand:  Math.round(hp.demand),
    deficit: Math.round(hp.deficit),
  }))

  const socData = (months[hourlyMonth]?.hours ?? []).map(hp => ({
    hour: `${String(hp.hour).padStart(2, '0')}:00`,
    charge:    -Math.round(hp.batteryCharge),
    discharge: Math.round(hp.batteryDischarge),
    soc:       Math.round(hp.batterySOC / 1000 * 10) / 10,  // GWh
  }))

  const hasBattery = socData.some(d => d.soc > 0 || d.charge < 0 || d.discharge > 0)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'annual',  label: 'Annuale' },
    { id: 'monthly', label: 'Mensile' },
    { id: 'hourly',  label: 'Orario'  },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{zone.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Zona di mercato Terna</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Chiudi pannello"
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

        {/* ── ANNUAL TAB ──────────────────────────────────────────────────────── */}
        {tab === 'annual' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Domanda',       value: fmt1(z.demandMWh / 1e6),     unit: 'TWh' },
                { label: 'Produzione',    value: fmt1(z.productionMWh / 1e6), unit: 'TWh' },
                { label: 'Quota rinnov.', value: fmtPct(renewShare),           unit: '' },
                { label: 'Emissioni',     value: (z.emissionsTonnes / 1e6).toFixed(2), unit: 'MtCO₂' },
                { label: 'Saldo netto',   value: (netBalance >= 0 ? '+' : '') + fmt1(netBalance), unit: 'TWh', color: balanceColor },
                { label: 'Idro (fisso)',  value: fmt1(zone.hydroGW),           unit: 'GW' },
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

            {/* Annual production bar chart */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Produzione annuale (GWh)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[annualTotals]}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis tick={{ fontSize: 10 }} width={44} />
                  <Tooltip formatter={fmtTipGWh} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="solar"   name="Solare"    stackId="s" fill={COLORS.solar}   />
                  <Bar dataKey="wind"    name="Eolico"    stackId="s" fill={COLORS.wind}    />
                  <Bar dataKey="hydro"   name="Idro"      stackId="s" fill={COLORS.hydro}   />
                  <Bar dataKey="nuclear" name="Nucleare"  stackId="s" fill={COLORS.nuclear} />
                  <Bar dataKey="biomass" name="Biomasse"  stackId="s" fill={COLORS.biomass} />
                  <Bar dataKey="geo"     name="Geotermico" stackId="s" fill={COLORS.geo}    />
                  <Bar dataKey="gas"     name="Gas"       stackId="s" fill={COLORS.gas}     />
                  <Bar dataKey="coal"    name="Carbone"   stackId="s" fill={COLORS.coal}    />
                  <Bar dataKey="imports" name="Import IT" stackId="s" fill={COLORS.imports} />
                  <Bar dataKey="regImp"  name="Import reg." fill={COLORS.regImp} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Flows */}
            {zoneFlows.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Flussi di energia
                </h3>
                <div className="space-y-2">
                  {zoneFlows.map((f, i) => {
                    const isExport = f.from === zoneId
                    const other    = isExport ? f.to : f.from
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            isExport ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>{isExport ? 'EXP' : 'IMP'}</span>
                          <span className="text-gray-600 text-xs">{ZONES[other].name}</span>
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

        {/* ── MONTHLY TAB ─────────────────────────────────────────────────────── */}
        {tab === 'monthly' && (
          <>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Produzione mensile (GWh)
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip formatter={fmtTipGWh} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="solar"   name="Solare"    stackId="s" fill={COLORS.solar}   />
                  <Bar dataKey="wind"    name="Eolico"    stackId="s" fill={COLORS.wind}    />
                  <Bar dataKey="hydro"   name="Idro"      stackId="s" fill={COLORS.hydro}   />
                  <Bar dataKey="nuclear" name="Nucleare"  stackId="s" fill={COLORS.nuclear} />
                  <Bar dataKey="biomass" name="Biomasse"  stackId="s" fill={COLORS.biomass} />
                  <Bar dataKey="geo"     name="Geotermico" stackId="s" fill={COLORS.geo}   />
                  <Bar dataKey="gas"     name="Gas"       stackId="s" fill={COLORS.gas}     />
                  <Bar dataKey="coal"    name="Carbone"   stackId="s" fill={COLORS.coal}    />
                  <Bar dataKey="imports" name="Import IT" stackId="s" fill={COLORS.imports} />
                  <Bar dataKey="regImp"  name="Import reg." fill={COLORS.regImp} />
                  <Line dataKey="demand" name="Domanda" type="monotone" stroke={COLORS.demand} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

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
                      <th className="text-right py-2 px-1 font-medium">Imp.reg.</th>
                      <th className="text-right py-2 px-1 font-medium">Dom.</th>
                      <th className="text-right py-2 pl-1 font-medium">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((d, i) => {
                      const prod = d.solar + d.wind + d.hydro + d.nuclear + d.biomass + d.geo + d.gas + d.coal + d.imports
                      const balance = prod + d.regImp - d.demand
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 pr-2 font-medium text-gray-700">{d.label}</td>
                          <td className="py-1.5 px-1 text-right tabular-nums text-gray-600">{prod}</td>
                          <td className={`py-1.5 px-1 text-right tabular-nums ${d.regImp >= 0 ? 'text-violet-600' : 'text-amber-600'}`}>
                            {d.regImp >= 0 ? '+' : ''}{d.regImp}
                          </td>
                          <td className="py-1.5 px-1 text-right tabular-nums text-gray-600">{d.demand}</td>
                          <td className={`py-1.5 pl-1 text-right tabular-nums font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
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

        {/* ── HOURLY TAB ──────────────────────────────────────────────────────── */}
        {tab === 'hourly' && (
          <>
            {/* Month picker */}
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
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Dispatch streamgraph */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Profilo orario — {MONTH_LABELS[hourlyMonth]} (MWh)
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} width={44} axisLine={false} tickLine={false} />
                  <Tooltip formatter={fmtTip} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {/* Stacked areas bottom → top */}
                  {([
                    ['coal',    'Carbone',    COLORS.coal],
                    ['gas',     'Gas',        COLORS.gas],
                    ['imports', 'Import IT',  COLORS.imports],
                    ['biomass', 'Biomasse',   COLORS.biomass],
                    ['geo',     'Geotermico', COLORS.geo],
                    ['nuclear', 'Nucleare',   COLORS.nuclear],
                    ['hydro',   'Idro',       COLORS.hydro],
                    ['wind',    'Eolico',     COLORS.wind],
                    ['solar',   'Solare',     COLORS.solar],
                  ] as [string, string, string][]).map(([key, name, color]) => (
                    <Area
                      key={key}
                      dataKey={key}
                      name={name}
                      stackId="s"
                      type="monotone"
                      fill={color}
                      stroke={color}
                      fillOpacity={0.88}
                      strokeWidth={0}
                      isAnimationActive={false}
                    />
                  ))}
                  {/* Regional import/export as a dashed line (can be negative) */}
                  <Line
                    dataKey="regImp"
                    name="Imp. reg."
                    type="monotone"
                    stroke={COLORS.regImp}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                  {/* Demand line on top */}
                  <Line
                    dataKey="demand"
                    name="Domanda"
                    type="monotone"
                    stroke={COLORS.demand}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Battery sub-chart */}
            {hasBattery && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Batteria — {MONTH_LABELS[hourlyMonth]}
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <ComposedChart data={socData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                    <YAxis yAxisId="batt" tick={{ fontSize: 10 }} width={36} />
                    <YAxis yAxisId="soc" orientation="right" tick={{ fontSize: 10 }} width={36} unit=" GWh" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={0} yAxisId="batt" stroke="#e5e7eb" />
                    <Bar yAxisId="batt" dataKey="discharge" name="Scarica (MWh)" fill={COLORS.battery} opacity={0.8} />
                    <Bar yAxisId="batt" dataKey="charge"    name="Carica (MWh)"  fill="#7c3aed" opacity={0.6} />
                    <Line yAxisId="soc" dataKey="soc" name="SOC (GWh)" type="monotone" stroke={COLORS.battery} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Daily stats */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Statistiche giornaliere — {MONTH_LABELS[hourlyMonth]}
              </h3>
              {(() => {
                const d = months[hourlyMonth]
                const prod = d.solarMWh + d.windMWh + d.hydroMWh + d.nuclearMWh + d.biomassMWh + d.geothermalMWh + d.gasMWh + d.coalMWh + d.importsMWh
                const renewFrac = prod > 0 ? (d.solarMWh + d.windMWh + d.hydroMWh) / prod : 0
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Produzione', value: `${Math.round(prod / 1000)} GWh` },
                      { label: 'Domanda',    value: `${Math.round(d.demandMWh / 1000)} GWh` },
                      { label: 'Rinnov.',    value: fmtPct(renewFrac) },
                      { label: 'Imp. reg.',  value: `${d.regionalImportMWh >= 0 ? '+' : ''}${Math.round(d.regionalImportMWh / 1000)} GWh`, color: d.regionalImportMWh >= 0 ? '#7c3aed' : '#d97706' },
                      { label: 'Deficit',    value: `${Math.round(d.deficitMWh / 1000)} GWh`,     color: d.deficitMWh > 0 ? '#dc2626' : undefined },
                      { label: 'Surplus',    value: `${Math.round(d.curtailmentMWh / 1000)} GWh`, color: d.curtailmentMWh > 0 ? '#16a34a' : undefined },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-bold" style={{ color: color ?? '#111827' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
