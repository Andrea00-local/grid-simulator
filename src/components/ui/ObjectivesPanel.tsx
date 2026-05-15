import { useSimStore, type TargetYear } from '@/store/simulationStore'
import { TargetBar } from './TargetBar'
import { ITALY_CO2_BASELINE_MT } from '@/models/constants'

const RENEWABLE_TARGETS: Record<TargetYear, { value: number; label: string; noTarget?: boolean }> = {
  2030: { value: 63,  label: 'Target PNIEC 2030: 63%'          },
  2040: { value: 100, label: 'Nessun obiettivo specifico', noTarget: true },
  2050: { value: 100, label: 'Nessun obiettivo specifico', noTarget: true },
}

const EMISSIONS_TARGETS: Record<TargetYear, { target: number; max: number; label: string }> = {
  2030: { target: 49.3, max: 100, label: 'Target PNIEC 2030: 49,3 MtCO₂' },
  2040: { target: 12.5, max: 100, label: 'Target 2040: 12,5 MtCO₂'        },
  2050: { target:  0,   max:  50, label: 'Target net-zero 2050: 0 MtCO₂'  },
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
          tooltip="Misura quanta domanda elettrica nazionale è coperta dalla tua produzione. Sotto il 100% devi importare o rischi blackout."
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
          tooltip="Quota di elettricità prodotta da fonti rinnovabili (solare, eolico, idro, geotermico, biomasse) sul totale del mix energetico nazionale."
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
          tooltip="Emissioni totali di CO₂ del sistema elettrico nazionale. Per il net-zero al 2050 devono arrivare a zero."
        />

      </div>
    </div>
  )
}
