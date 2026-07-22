import { For } from 'solid-js';
import { state } from '../store';
import { computeTimeline, deriveConflicts } from '../analyzer';
const PIXELS_PER_SECOND = 2;
export default function ResourceMatrix() {
  const timelineData = () => computeTimeline(state.cues, state.branchState);
  const conflicts = () => deriveConflicts(state.cues, state.resources, state.branchState);
  return (
    <div class="relative w-full h-full bg-white border rounded shadow overflow-auto">
      <div class="absolute top-0 left-0 bottom-0 flex flex-col min-w-max" style={{ width: `${4200 * PIXELS_PER_SECOND}px` }}>
        <For each={state.resources}>
          {(resource) => (
            <div class="relative flex-1 border-b border-gray-200 min-h-[80px] flex items-center bg-gray-50">
              <div class="absolute left-0 top-0 bottom-0 w-32 bg-gray-100 border-r z-10 flex flex-col p-2 justify-center text-xs">
                <span class="font-bold truncate">{resource.name}</span>
                <span class="text-gray-500">{resource.shared ? 'Shared' : 'Exclusive'}</span>
              </div>
              <For each={timelineData().filter(t => t.cue.resourceIds.includes(resource.id))}>
                {({cue, actualStart, end}) => (
                  <div class="absolute top-2 bottom-2 rounded bg-blue-100 border border-blue-300 shadow-sm p-1 text-[10px] truncate" style={{left: `${(actualStart * PIXELS_PER_SECOND) + 128}px`, width: `${(end - actualStart) * PIXELS_PER_SECOND}px`}}>{cue.name}</div>
                )}
              </For>
              <For each={conflicts().filter(c => c.type === 'resource_collision' && c.resourceId === resource.id)}>
                {(conflict) => (<div class="absolute top-0 bottom-0 w-4 bg-red-500 opacity-50 z-20 pointer-events-none" style={{ left: `${(conflict.time * PIXELS_PER_SECOND) + 128}px` }}/>)}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
