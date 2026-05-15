import * as RadixSlider from '@radix-ui/react-slider'
import { useSimStore } from '@/store/simulationStore'
import { MEGAPACK_HOURS } from '@/models/hourlyProfiles'

const STORAGE_COLOR = '#14b8a6'  // teal-500

export function StorageSlider() {
  const storagePowerGW = useSimStore(s => s.storagePowerGW)
  const setStoragePower = useSimStore(s => s.setStoragePower)

  const capacityGWh = storagePowerGW * MEGAPACK_HOURS

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-sm flex-shrink-0"
            style={{ background: STORAGE_COLOR }}
          />
          <span className="text-xs font-medium text-gray-700">Batterie (BESS)</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-gray-800 tabular-nums">
            {storagePowerGW > 0 ? `${storagePowerGW.toFixed(0)} GW` : 'Nessuno'}
          </span>
          {storagePowerGW > 0 && (
            <span className="text-xs text-gray-400 ml-1">/ {capacityGWh.toFixed(0)} GWh</span>
          )}
        </div>
      </div>

      <RadixSlider.Root
        min={0}
        max={500}
        step={1}
        value={[storagePowerGW]}
        onValueChange={([v]) => setStoragePower(v)}
        className="relative flex items-center select-none touch-none w-full h-4"
      >
        <RadixSlider.Track className="bg-gray-200 relative grow rounded-full h-1">
          <RadixSlider.Range
            className="absolute rounded-full h-full"
            style={{ background: STORAGE_COLOR }}
          />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block w-3.5 h-3.5 rounded-full shadow focus:outline-none focus:ring-2 cursor-pointer"
          style={{ background: STORAGE_COLOR, boxShadow: `0 0 0 2px white, 0 0 0 3px ${STORAGE_COLOR}` }}
        />
      </RadixSlider.Root>

    </div>
  )
}
