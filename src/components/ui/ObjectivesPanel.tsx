import { useSimStore, type TargetYear } from '@/store/simulationStore'
import { TargetBar } from './TargetBar'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

const RENEWABLE_TARGETS: Record<TargetYear, { value: number; label: string; noTarget?: boolean; tooltip: string }> = {
  2030: { value: 63,  label: 'Target PNIEC 2030: 63%',   tooltip: 'Quota di elettricità prodotta da fonti rinnovabili nel mix complessivo nazionale. Nel PNIEC l\'Italia si è imposta l\'obiettivo di raggiungere il 63%.' },
  2040: { value: 100, label: 'Nessun obiettivo specifico', noTarget: true, tooltip: 'Quota di elettricità prodotta da fonti rinnovabili nel mix complessivo nazionale. Negli impegni europei non c\'è un target obbligatorio.' },
  2050: { value: 100, label: 'Nessun obiettivo specifico', noTarget: true, tooltip: 'Quota di elettricità prodotta da fonti rinnovabili nel mix complessivo nazionale. Negli impegni europei non c\'è un target obbligatorio.' },
}

const EMISSIONS_TARGETS: Record<TargetYear, { target: number; max: number; label: string; tooltip: string }> = {
  2030: { target: 49,   max: 100, label: 'Target PNIEC 2030: 49 MtCO₂',        tooltip: 'Emissioni totali di CO₂ del sistema elettrico nazionale. L\'obiettivo è rispettare l\'impegno di ridurre del 55% rispetto al 1990.' },
  2040: { target: 12.5, max: 100, label: 'Target 2040: 12,5 MtCO₂',             tooltip: 'Emissioni totali di CO₂ del sistema elettrico nazionale. L\'obiettivo è rispettare l\'impegno di ridurre del 90% rispetto al 1990.' },
  2050: { target:  0,   max:  50, label: 'Target net-zero 2050: 0 MtCO₂',       tooltip: 'Emissioni totali di CO₂ del sistema elettrico nazionale. L\'obiettivo è rispettare l\'impegno di azzerarle completamente nel 2050.' },
}

interface Props {
  coverage: number       // 0–1
  renewableShare: number // 0–1
  avoidedMt: number      // MtCO₂ avoided vs 2023 baseline
}

export function ObjectivesPanel({ coverage, renewableShare, avoidedMt }: Props) {
  const targetYear = useSimStore(s => s.targetYear)

  const emissionsMt  = Math.max(0, ITALY_CO2_BASELINE_MT - avoidedMt)
  const coveragePct  = coverage * 100
  const renewablePct = renewableShare * 100

  const renewTarget = RENEWABLE_TARGETS[targetYear]
  const emisTarget  = EMISSIONS_TARGETS[targetYear]

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Sicurezza */}
        <TargetBar
          label="Sicurezza"
          valore={coveragePct}
          target={99}
          min={0}
          max={100}
          unita="%"
          targetLabel="Obiettivo: 100% — domanda coperta"
          direzione="alto-meglio"
          badThreshold={95}
          feedbackTesti={{
            bad:  'Rischio blackout: produzione insufficiente',
            ok:   'Copertura parziale, quasi al sicuro',
            good: '✓ Domanda completamente coperta',
          }}
          tooltip="Misura quanta domanda elettrica è coperta dalla tua produzione. Qualunque valore sotto il 100% è un problema per il sistema."
        />

        {/* Rinnovabili — centre, primary goal */}
        <TargetBar
          label="Rinnovabili"
          valore={renewablePct}
          target={renewTarget.value}
          min={0}
          max={100}
          unita="%"
          targetLabel={renewTarget.label}
          direzione="alto-meglio"
          noTarget={renewTarget.noTarget}
          feedbackTesti={{
            bad:  'Lontano dal target, serve più rinnovabile',
            ok:   'Sulla strada giusta',
            good: '✓ Target raggiunto',
          }}
          tooltip={renewTarget.tooltip}
        />

        {/* Emissioni */}
        <TargetBar
          label="Emissioni"
          valore={emissionsMt}
          target={emisTarget.target}
          min={0}
          max={emisTarget.max}
          unita="MtCO₂"
          targetLabel={emisTarget.label}
          direzione="basso-meglio"
          feedbackTesti={{
            bad:  'Emissioni troppo alte, serve decarbonizzare',
            ok:   'Vicino al target, riduci ancora',
            good: '✓ Target di emissioni raggiunto',
          }}
          tooltip={emisTarget.tooltip}
        />

      </div>
    </div>
  )
}
