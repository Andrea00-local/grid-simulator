import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { SOURCE_DEFINITIONS } from '@/models/sources'
import type { Source } from '@/models/types'
import { useSimStore } from '@/store/simulationStore'
import { SourceDetailModal } from '@/components/ui/SourceDetailModal'

interface Props {
  source: Source
}

export function RenewableSlider({ source }: Props) {
  const [open, setOpen] = useState(false)
  const def          = SOURCE_DEFINITIONS[source]
  const gw           = useSimStore((s) => s.renewableCapacity[source] ?? 0)
  const setRenewable = useSimStore((s) => s.setRenewableCapacity)

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: def.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => setOpen(true)}
            className="text-sm text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left truncate"
            title="Clicca per dettagli"
          >
            {def.labelShort}
          </button>
          <span className="text-sm font-mono font-medium text-gray-900 dark:text-slate-100 ml-2 flex-shrink-0">
            {gw.toFixed(gw < 10 ? 1 : 0)} GW
          </span>
        </div>
        <Slider
          min={def.sliderMin}
          max={def.sliderMax}
          step={def.sliderStep}
          value={[gw]}
          onValueChange={([v]) => setRenewable(source, v)}
          accentColor={def.color}
        />
      </div>
      <SourceDetailModal sourceKey={source} currentValue={gw} isOpen={open} onClose={() => setOpen(false)} />
    </div>
  )
}
