import { Slider } from '@/components/ui/slider'
import { useSimStore } from '@/store/simulationStore'

const BASELINE = 280

export function DemandSlider() {
  const demandTWh = useSimStore((s) => s.demandTWh)
  const setDemand = useSimStore((s) => s.setDemand)

  const delta = demandTWh - BASELINE
  const deltaLabel =
    delta === 0 ? 'baseline 2023' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)} TWh vs 2023`

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-400" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="text-sm text-gray-700">Domanda elettrica</span>
            <span className="text-xs text-gray-400 ml-1.5">({deltaLabel})</span>
          </div>
          <span className="text-sm font-mono font-medium text-gray-900 ml-2 flex-shrink-0">
            {demandTWh} TWh
          </span>
        </div>
        <Slider
          min={180}
          max={500}
          step={5}
          value={[demandTWh]}
          onValueChange={([v]) => setDemand(v)}
          accentColor="#6b7280"
        />
        <div className="flex justify-between text-xs text-gray-300 mt-0.5">
          <span>180 TWh</span>
          <span>500 TWh</span>
        </div>
      </div>
    </div>
  )
}
