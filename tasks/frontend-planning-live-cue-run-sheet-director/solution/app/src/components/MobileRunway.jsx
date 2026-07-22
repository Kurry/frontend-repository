import { createMemo, For } from 'solid-js';
import { state, toggleReadiness } from '../store';
import { computeTimeline } from '../analyzer';
import { liveCallGo, liveCallHold, liveCallSkip } from '../clock';
export default function MobileRunway() {
  const timeline = createMemo(() => computeTimeline(state.cues, state.branchState).sort((a, b) => a.actualStart - b.actualStart));
  const currentCueIndex = createMemo(() => {
    const liveTime = state.liveState.clockTime;
    let idx = timeline().findIndex(t => t.actualStart >= liveTime);
    if (idx === -1) idx = timeline().length - 1;
    return Math.max(0, idx);
  });
  const nowCue = createMemo(() => timeline()[currentCueIndex()]?.cue);
  const nextCue = createMemo(() => timeline()[currentCueIndex() + 1]?.cue);
  return (
    <div class="flex flex-col h-full bg-gray-900 text-white">
      <div class="p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div class="text-sm text-blue-400 font-mono mb-2">Live: {state.liveState.clockTime}s</div>
        {nowCue() ? (
          <div class="bg-gray-700 p-4 rounded-lg mb-4">
            <div class="text-xs text-green-400 font-bold uppercase tracking-wide mb-1">Now</div>
            <div class="text-2xl font-bold mb-4">{nowCue().name}</div>
            <div class="grid grid-cols-3 gap-2">
              <button class={`py-3 rounded font-bold ${nowCue().ready ? 'bg-green-600' : 'bg-green-900'}`} onClick={() => liveCallGo(nowCue().id)}>GO</button>
              <button class="bg-yellow-600 py-3 rounded font-bold" onClick={() => liveCallHold(nowCue().id)}>HOLD</button>
              <button class="bg-gray-600 py-3 rounded font-bold" onClick={() => liveCallSkip(nowCue().id)}>SKIP</button>
            </div>
          </div>
        ) : (<div class="text-gray-500 italic mb-4">No active cue</div>)}
        {nextCue() && (
          <div class="bg-gray-800 border border-gray-600 p-3 rounded-lg opacity-80">
            <div class="text-xs text-blue-400 font-bold uppercase tracking-wide mb-1">Next</div>
            <div class="text-lg font-bold">{nextCue().name}</div>
          </div>
        )}
      </div>
      <div class="flex-1 overflow-auto p-4 bg-gray-900">
        <h3 class="text-gray-400 font-bold mb-4 text-sm uppercase tracking-widest">Upcoming Runway</h3>
        <div class="space-y-3 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-700">
          <For each={timeline().slice(currentCueIndex() + 2)}>
            {(t) => (
              <div class="relative pl-8 pr-2 py-2" onDblClick={() => toggleReadiness(t.cue.id)}>
                <div class={`absolute left-[9px] top-1/2 -mt-2 w-4 h-4 rounded-full border-2 border-gray-900 ${t.cue.ready ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div class="bg-gray-800 rounded p-3">
                  <div class="font-bold text-lg mb-1">{t.cue.name}</div>
                  <div class="text-sm text-gray-400 flex justify-between"><span>{t.cue.lane}</span><span class="font-mono">{t.actualStart}s</span></div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
