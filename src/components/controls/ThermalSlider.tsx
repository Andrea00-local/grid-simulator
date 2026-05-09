import { Slider } from '@/components/ui/slider'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import type { Source } from '@/models/types'
import { useSimStore } from '@/store/simulationStore'

const TWH_RANGES: Partial<Record<Source, { min: number; max: number; step: number }>> = {
  nuclear:  { min: 0, max: 80,  step: 1 },
  gas_ccgt: { min: 0, max: 200, step: 5 },
  gas_ocgt: { min: 0, max: 40,  step: 1 },
  coal:     { min: 0, max: 60,  step: 1 },
  imports:  { min: 0, max: 50,  step: 1 },
}

interface Props {
  source: Source
}

export function ThermalSlider({ source }: Props) {
  const def    = SOURCE_DEFINITIONS[source]
  const twh    = useSimStore((s) => s.directProduction[source] ?? 0)
  const setDir = useSimStore((s) => s.setDirectProduction)
  const range  = TWH_RANGES[source] ?? { min: 0, max: 100, step: 1 }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: def.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-700 truncate">{def.labelShort}</span>
          <span className="text-sm font-mono font-medium text-gray-900 ml-2 flex-shrink-0">
            {twh.toFixed(0)} TWh
          </span>
        </div>
        <Slider
          min={range.min}
          max={range.max}
          step={range.step}
          value={[twh]}
          onValueChange={([v]) => setDir(source, v)}
          accentColor={def.color}
        />
      </div>
    </div>
  )
}
