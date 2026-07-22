import { For, createSignal } from 'solid-js';
import { state, moveCue, resizeCue, toggleReadiness } from '../store';
import { computeTimeline } from '../analyzer';

const PIXELS_PER_SECOND = 2;
export default function Timeline() {
  const lanes = ["stage", "audio", "lighting", "video", "guest"];
  const timelineData = () => computeTimeline(state.cues, state.branchState);
  let containerRef;
  const handleDragEnd = (cueId, newLeft, laneIdx) => {
    const newTime = Math.max(0, Math.round(newLeft / PIXELS_PER_SECOND));
    moveCue(cueId, newTime, lanes[laneIdx]);
  };
  return (
    <div class="relative w-full h-full bg-white border rounded shadow overflow-auto" ref={containerRef}>
      <div class="absolute top-0 left-0 bottom-0 flex flex-col min-w-max" style={{ width: `${4200 * PIXELS_PER_SECOND}px` }}>
        <For each={lanes}>
          {(lane, idx) => (
            <div class="relative flex-1 border-b border-gray-200 min-h-[120px] bg-gray-50 flex items-center">
              <div class="absolute left-0 top-0 bottom-0 w-24 bg-gray-100 border-r z-10 flex items-center justify-center font-bold text-gray-500 uppercase text-xs">{lane}</div>
              <For each={timelineData().filter(t => t.cue.lane === lane)}>
                {({cue, actualStart, end}) => (
                  <div class={`absolute top-2 bottom-2 rounded border shadow-sm p-2 text-xs flex flex-col justify-between cursor-move ${cue.ready ? 'bg-green-100 border-green-300' : 'bg-yellow-50 border-yellow-300'} ${cue.isFixed ? 'opacity-80 border-dashed' : ''}`}
                    style={{left: `${(actualStart * PIXELS_PER_SECOND) + 96}px`, width: `${(end - actualStart) * PIXELS_PER_SECOND}px`}}
                    onDblClick={() => toggleReadiness(cue.id)}>
                    <div class="font-bold truncate">{cue.name}</div>
                    <div class="truncate text-gray-500">{cue.ownerId}</div>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
