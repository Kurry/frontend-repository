import { createMemo } from 'solid-js';
import { state, triggerContingencyBranch, saveCheckpoint } from '../store';
import { startRehearsal, stopRehearsal, injectRehearsalDelay } from '../clock';
import { computeTimeline, computeProjectedEnd, deriveConflicts } from '../analyzer';
export default function DriftContingency() {
  const projectedEnd = createMemo(() => computeProjectedEnd(state.cues, state.branchState));
  const conflicts = createMemo(() => deriveConflicts(state.cues, state.resources, state.branchState));
  const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}`; };
  return (
    <div class="h-full flex flex-col gap-4">
      <div class="bg-white p-4 rounded shadow border">
        <h3 class="font-bold text-lg mb-4">Rehearsal & Drift Simulation</h3>
        <div class="flex items-center gap-4 mb-4">
          <div class="text-2xl font-mono">{formatTime(state.rehearsalState.clockTime)}</div>
          {!state.rehearsalState.active ? (<button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={startRehearsal}>Start Rehearsal</button>) : (<button class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={stopRehearsal}>Pause</button>)}
          <button class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600" onClick={() => injectRehearsalDelay(40)}>Inject 40s Delay</button>
        </div>
        <div class="p-4 bg-gray-50 rounded border">
          <div class="font-bold text-gray-700">Projected End: <span class="text-blue-600 font-mono">{formatTime(projectedEnd())}</span></div>
          <div class="text-sm text-gray-500">Target: 70:00 (4200s)</div>
          {projectedEnd() > 4200 && (<div class="mt-2 text-red-600 font-bold">Drift: +{projectedEnd() - 4200}s</div>)}
        </div>
      </div>
      <div class="flex gap-4 flex-1">
        <div class="bg-white p-4 rounded shadow border flex-1 flex flex-col">
          <h3 class="font-bold text-lg mb-4">Contingency Branches</h3>
          <div class="space-y-4">
            {Object.keys(state.branchState).map(groupId => (
              <div class="border p-4 rounded">
                <div class="font-bold mb-2">Group {groupId}</div>
                <div class="flex gap-2">
                  <button class={`flex-1 py-2 rounded font-bold ${state.branchState[groupId] === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => triggerContingencyBranch(groupId, 'primary')}>Primary</button>
                  <button class={`flex-1 py-2 rounded font-bold ${state.branchState[groupId] === 'contingency' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => triggerContingencyBranch(groupId, 'contingency')}>Contingency</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div class="bg-white p-4 rounded shadow border w-1/3 flex flex-col">
          <h3 class="font-bold text-lg mb-4">Conflict Drawer</h3>
          <div class="flex-1 overflow-auto bg-gray-50 p-2 rounded border space-y-2">
            {conflicts().length === 0 ? (<div class="text-green-600 font-bold">No active conflicts.</div>) : (conflicts().map(c => (<div class="text-xs p-2 bg-red-50 border border-red-200 rounded text-red-800"><span class="font-bold capitalize">{c.type.replace('_', ' ')}</span>{c.resourceId && <div>Resource: {c.resourceId}</div>}{c.cues && <div>Cues: {c.cues.join(', ')}</div>}{c.cueId && <div>Cue: {c.cueId}</div>}</div>)))}
          </div>
          <div class="mt-4 pt-4 border-t"><button class="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700" onClick={() => saveCheckpoint("Pre-show Checkpoint")}>Save Checkpoint</button></div>
        </div>
      </div>
    </div>
  );
}
