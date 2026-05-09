import { Slider } from '@/components/ui/slider'
import { useSimStore } from '@/store/simulationStore'

const RUN_FRACTION       = 8.2 / (8.2 + 14.5)
const RESERVOIR_FRACTION = 14.5 / (8.2 + 14.5)
const COLOR = '#0891b2'

export function HydroSlider() {
  const hydroRun       = useSimStore((s) => s.renewableCapacity['hydro_run'] ?? 0)
  const hydroReservoir = useSimStore((s) => s.renewableCapacity['hydro_reservoir'] ?? 0)
  const setMultiple    = useSimStore((s) => s.setMultipleRenewable)

  const total = hydroRun + hydroReservoir

  function handleChange([v]: number[]) {
    setMultiple({
      hydro_run:       parseFloat((v * RUN_FRACTION).toFixed(2)),
      hydro_reservoir: parseFloat((v * RESERVOIR_FRACTION).toFixed(2)),
    })
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLOR }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-700">Idroelettrico</span>
          <span className="text-sm font-mono font-medium text-gray-900 ml-2 flex-shrink-0">
            {total.toFixed(1)} GW
          </span>
        </div>
        <Slider
          min={0}
          max={40}
          step={0.5}
          value={[total]}
          onValueChange={handleChange}
          accentColor={COLOR}
        />
      </div>
    </div>
  )
}
