import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSimStore, SCENARIOS, type ScenarioId } from '@/store/simulationStore'
import { ScenarioExplanationModal } from '@/components/ui/ScenarioExplanationModal'

export function ScenarioPreset() {
  const loadScenario = useSimStore((s) => s.loadScenario)
  const [openScenario, setOpenScenario] = useState<ScenarioId | null>(null)

  function handleScenario(id: ScenarioId) {
    loadScenario(id)
    setOpenScenario(id)
  }

  return (
    <>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scenari preimpostati</p>
        <p className="text-xs text-gray-400 mb-3">Clicca per caricare e scoprire lo scenario</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
            <Button
              key={id}
              variant="outline"
              size="sm"
              onClick={() => handleScenario(id)}
            >
              {SCENARIOS[id].label}
            </Button>
          ))}
        </div>
      </div>

      <ScenarioExplanationModal
        scenarioId={openScenario}
        onClose={() => setOpenScenario(null)}
      />
    </>
  )
}
