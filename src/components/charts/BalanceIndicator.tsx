interface Props {
  /** Net balance in TWh (positive = surplus, negative = deficit) */
  balanceTWh: number
  /** Gross wasted energy in TWh (sum of positive period balances) */
  surplusTWh?: number
  /** Gross unmet demand in TWh (sum of |negative| period balances) */
  deficitTWh?: number
  /** When true, show gross surplus+deficit separately (Level 2 mode) */
  showGross?: boolean
}

export function BalanceIndicator({ balanceTWh, surplusTWh, deficitTWh, showGross }: Props) {
  const abs = Math.abs(balanceTWh)
  const isSurplus = balanceTWh >= 0
  const hasBoth = showGross && (surplusTWh ?? 0) > 0.05 && (deficitTWh ?? 0) > 0.05

  // Level 2: show gross figures prominently
  if (showGross && hasBoth) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Bilancio energetico (annuo)</h3>
        <div className="space-y-3">
          <div className="rounded-xl p-4 bg-green-50 border border-green-200">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
              Energia sprecata (surplus mensili)
            </p>
            <div className="text-2xl font-bold text-green-700 tabular-nums">
              +{surplusTWh!.toFixed(1)} <span className="text-sm font-normal">TWh</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Produzione in eccesso nei mesi con alta generazione rinnovabile
            </p>
          </div>
          <div className="rounded-xl p-4 bg-red-50 border border-red-200">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
              Domanda non coperta (deficit mensili)
            </p>
            <div className="text-2xl font-bold text-red-600 tabular-nums">
              -{deficitTWh!.toFixed(1)} <span className="text-sm font-normal">TWh</span>
            </div>
            <p className="text-xs text-red-500 mt-1">
              Fabbisogno non soddisfatto nei mesi critici
            </p>
          </div>
          <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 text-xs text-gray-500">
            Bilancio netto: <strong className="text-gray-700">{balanceTWh >= 0 ? '+' : ''}{balanceTWh.toFixed(1)} TWh</strong>
            {' — '}ma surplus e deficit non si annullano senza storage inter-stagionale
          </div>
        </div>
      </div>
    )
  }

  // Level 1 (or Level 2 when only one sign)
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {isSurplus ? 'Energia sprecata' : 'Domanda non coperta'}
      </h3>
      <div
        className={`rounded-xl p-5 border ${
          isSurplus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}
      >
        <div className={`text-3xl font-bold tabular-nums ${isSurplus ? 'text-green-700' : 'text-red-600'}`}>
          {isSurplus ? '+' : '-'}{abs.toFixed(1)} <span className="text-lg font-normal">TWh</span>
        </div>
        <p className={`text-sm mt-1 ${isSurplus ? 'text-green-600' : 'text-red-500'}`}>
          {isSurplus
            ? 'Produzione superiore alla domanda — energia sprecata o da esportare'
            : 'Produzione inferiore alla domanda — il sistema va in blackout o importa'}
        </p>
        {isSurplus && abs > 15 && (
          <p className="text-xs text-green-500 mt-2">
            ⚡ Con storage o interconnessioni questo surplus potrebbe essere valorizzato.
          </p>
        )}
        {!isSurplus && (
          <p className="text-xs text-red-400 mt-2">
            ⚠ Aggiungi produzione termica o riduci la domanda per coprire il deficit.
          </p>
        )}
      </div>
    </div>
  )
}
