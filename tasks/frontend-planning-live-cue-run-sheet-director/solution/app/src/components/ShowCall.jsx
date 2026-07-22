import { createMemo } from 'solid-js';
import { state } from '../store';
import { computeTimeline } from '../analyzer';
import { startLiveShow, stopLiveShow, liveCallGo, liveCallHold, liveCallSkip, liveCallComplete } from '../clock';
export default function ShowCall() {
  const timeline = createMemo(() => computeTimeline(state.cues, state.branchState).sort((a, b) => a.actualStart - b.actualStart));
  const currentCueIndex = createMemo(() => {
    const liveTime = state.liveState.clockTime;
    let idx = timeline().findIndex(t => t.actualStart >= liveTime);
    if (idx === -1) idx = timeline().length - 1;
    return Math.max(0, idx);
  });
  const nowCue = createMemo(() => timeline()[currentCueIndex()]?.cue);
  const nextCue = createMemo(() => timeline()[currentCueIndex() + 1]?.cue);
  const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}`; };
  return (
    <div class="h-full flex flex-col p-4 bg-gray-900 text-white rounded">
      <div class="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h2 class="text-2xl font-bold">Show Call</h2>
        <div class="text-4xl font-mono text-blue-400">{formatTime(state.liveState.clockTime)}</div>
        <div class="flex gap-2">
          {!state.liveState.active ? (
            <button class="bg-green-600 px-6 py-2 rounded text-lg font-bold" onClick={startLiveShow}>Start Live</button>
          ) : (
            <button class="bg-red-600 px-6 py-2 rounded text-lg font-bold" onClick={stopLiveShow}>Stop</button>
          )}
        </div>
      </div>
      <div class="flex-1 flex gap-8">
        <div class="flex-1 flex flex-col bg-gray-800 p-6 rounded border-l-4 border-green-500">
          <h3 class="text-xl text-gray-400 mb-2 uppercase tracking-wider">Now</h3>
          {nowCue() ? (
            <div class="flex-1 flex flex-col">
              <div class="text-5xl font-bold mb-4">{nowCue().name}</div>
              <div class="text-xl text-gray-300 mb-2">Owner: {nowCue().ownerId}</div>
              <div class="text-xl text-gray-300 mb-auto">Resources: {nowCue().resourceIds.join(', ')}</div>
              <div class="grid grid-cols-2 gap-4 mt-8">
                <button class={`py-6 rounded text-3xl font-bold ${nowCue().ready ? 'bg-green-600 hover:bg-green-500' : 'bg-green-900 opacity-50'}`} onClick={() => liveCallGo(nowCue().id)}>GO</button>
                <button class="bg-yellow-600 hover:bg-yellow-500 py-6 rounded text-3xl font-bold" onClick={() => liveCallHold(nowCue().id)}>HOLD</button>
                <button class="bg-gray-600 hover:bg-gray-500 py-4 rounded text-xl font-bold" onClick={() => liveCallSkip(nowCue().id)}>SKIP</button>
                <button class="bg-blue-600 hover:bg-blue-500 py-4 rounded text-xl font-bold" onClick={() => liveCallComplete(nowCue().id)}>COMPLETE</button>
              </div>
            </div>
          ) : (<div class="text-gray-500 text-2xl">No active cue</div>)}
        </div>
        <div class="flex-1 flex flex-col bg-gray-800 p-6 rounded border-l-4 border-blue-500 opacity-70">
          <h3 class="text-xl text-gray-400 mb-2 uppercase tracking-wider">Next</h3>
          {nextCue() ? (
            <div>
              <div class="text-4xl font-bold mb-4">{nextCue().name}</div>
              <div class="text-lg text-gray-300">Owner: {nextCue().ownerId}</div>
              <div class="text-lg text-gray-300">Resources: {nextCue().resourceIds.join(', ')}</div>
              <div class="mt-4 text-2xl font-mono text-yellow-400">In: {formatTime(Math.max(0, (timeline()[currentCueIndex() + 1]?.actualStart || 0) - state.liveState.clockTime))}</div>
            </div>
          ) : (<div class="text-gray-500 text-2xl">End of show</div>)}
        </div>
      </div>
    </div>
  );
}
