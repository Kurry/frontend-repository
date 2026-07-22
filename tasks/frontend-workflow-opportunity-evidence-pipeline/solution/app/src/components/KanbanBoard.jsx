import { state, setState } from '../store';
import { stages } from '../fixtures';
import { For, createSignal } from 'solid-js';

export default function KanbanBoard() {
  const handleDragStart = (e, oppId) => {
    e.dataTransfer.setData('text/plain', oppId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain');
    if (!oppId) return;

    // Check transitions
    const opp = state.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    // Transition constraints: can only go to submitted if ready
    if (targetStage === 'submitted' && opp.stage !== 'ready' && opp.stage !== 'submitted') {
        alert('Card must be in Ready state before submitting.');
        return; // Snap back
    }

    setState('opportunities', oppIndex => state.opportunities[oppIndex].id === oppId, 'stage', targetStage);

    if (targetStage === 'submitted' && opp.stage !== 'submitted') {
        // Create snapshot
        setState('opportunities', oppIndex => state.opportunities[oppIndex].id === oppId, 'snapshots', s => [...s, {
            id: `snap_${Date.now()}`,
            timestamp: new Date().toISOString(),
            bindings: JSON.parse(JSON.stringify(opp.bindings)),
            packet: JSON.parse(JSON.stringify(opp.packet))
        }]);
    }
  };

  return (
    <div class="w-[300px] shrink-0 border-r bg-gray-100/50 flex flex-col h-full overflow-y-auto">
        <div class="p-4 border-b bg-white sticky top-0 font-semibold text-sm text-gray-500 uppercase tracking-wider z-10">
            Stage Board
        </div>
        <div class="p-4 flex-1 flex flex-col gap-6">
            <For each={stages}>
                {(stage) => {
                    const opps = () => state.opportunities.filter(o => o.stage === stage);

                    return (
                        <div
                            class="flex flex-col gap-2 min-h-[60px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
                        >
                            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">{stage}</h3>
                            <div class={`flex flex-col gap-2 p-2 rounded-lg bg-gray-200/50 min-h-[60px] ${opps().length === 0 ? 'border-2 border-dashed border-gray-300' : ''}`}>
                                <For each={opps()}>
                                    {(opp) => (
                                        <div
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(e, opp.id)}
                                            onClick={() => setState('selectedOpportunityId', opp.id)}
                                            class={`p-3 rounded-md shadow-sm cursor-grab active:cursor-grabbing border-l-4 transition-all
                                                ${state.selectedOpportunityId === opp.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'}
                                                ${opp.stage === 'submitted' ? 'border-l-purple-500' : opp.stage === 'ready' ? 'border-l-green-500' : 'border-l-blue-500'}
                                            `}
                                        >
                                            <div class="text-sm font-medium leading-tight">{opp.name}</div>
                                            <div class="text-xs text-gray-500 mt-1 flex justify-between">
                                                <span>{opp.requirements.length} reqs</span>
                                                <span class="text-gray-400">{opp.deadline}</span>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    )
                }}
            </For>
        </div>
    </div>
  );
}
