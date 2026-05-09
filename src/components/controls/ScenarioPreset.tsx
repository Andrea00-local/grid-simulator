import { Button } from '@/components/ui/button'
import { useSimStore, SCENARIOS, type ScenarioId } from '@/store/simulationStore'

export function ScenarioPreset() {
  const loadScenario = useSimStore((s) => s.loadScenario)

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scenari preimpostati</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
          <Button
            key={id}
            variant="outline"
            size="sm"
            onClick={() => loadScenario(id)}
          >
            {SCENARIOS[id].label}
          </Button>
        ))}
      </div>
    </div>
  )
}
