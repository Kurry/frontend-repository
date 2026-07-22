import { useStore } from '../store/store';

export function EvidencePanel() {
  const store = useStore();
  const { supportEdges, groups, steps, events } = store;

  return (
    <div className="w-80 bg-gray-50 border-l p-4 overflow-auto text-sm flex flex-col gap-6">
      <section>
        <h3 className="font-bold border-b pb-1 mb-2">Support Edges</h3>
        {Object.values(supportEdges).map(edge => (
          <div key={edge.id} className="flex justify-between py-1 border-b border-gray-200">
            <span>{edge.supporterBrickId} &rarr; {edge.supportedBrickId}</span>
            <span className={edge.ratioNumerator * 2 < edge.ratioDenominator ? "text-red-500 font-bold" : "text-green-600"}>
              {edge.ratioNumerator}/{edge.ratioDenominator}
            </span>
          </div>
        ))}
        {Object.values(supportEdges).length === 0 && <div className="text-gray-500 italic">No support edges derived.</div>}
      </section>

      <section>
        <h3 className="font-bold border-b pb-1 mb-2">Guide Groups</h3>
        {Object.values(groups).map(group => (
          <div key={group.id} className="mb-2">
            <div className="font-medium">{group.label}</div>
            <div className="text-gray-600 text-xs mt-1">Bricks: {group.brickIds.join(', ')}</div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="font-bold border-b pb-1 mb-2">Guide Steps</h3>
        {Object.values(steps).map(step => (
          <div key={step.id} className="mb-2">
            <div className="font-medium">{step.order}. {step.label}</div>
            <div className="text-gray-600 text-xs mt-1">Bricks: {step.brickIds.join(', ')}</div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="font-bold border-b pb-1 mb-2">Event History</h3>
        {events.slice(-5).map(evt => (
          <div key={evt.id} className="mb-1 text-xs font-mono text-gray-700 truncate">
            [{evt.kind}] {evt.targetId} {evt.stateHash}
          </div>
        ))}
      </section>
    </div>
  );
}
