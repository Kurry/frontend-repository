import { useStore } from '../store';
import type { RoutineStep } from '../store';

export function FocusRail() {
  const { sessionState, nestRequest, repairPreview, setFocusPosition } = useStore();

  const expandSteps = (state: typeof sessionState) => {
    const list: RoutineStep[] = [];
    state.rootSequence.forEach(id => {
      if (id.startsWith('CAP')) {
        const cap = state.capsules[id];
        cap.children.forEach(childId => {
          list.push(state.steps[childId]);
        });
      } else {
        list.push(state.steps[id]);
      }
    });
    return list;
  };

  const getProposedState = () => {
    if (!repairPreview || !nestRequest) return null;
    const newState = JSON.parse(JSON.stringify(sessionState)) as typeof sessionState;
    const req = nestRequest;

    const capsuleToDissolve = newState.capsules[req.entityId];
    const targetCapsule = newState.capsules[req.requestedParentId];

    if (!capsuleToDissolve || !targetCapsule) return null;

    const childrenToMove = [...capsuleToDissolve.children];
    const newChildren = [...targetCapsule.children];
    newChildren.splice(req.requestedIndex, 0, ...childrenToMove);

    targetCapsule.children = newChildren;
    newState.rootSequence = newState.rootSequence.filter(id => id !== capsuleToDissolve.id);
    capsuleToDissolve.status = 'dissolved';
    capsuleToDissolve.children = [];

    return newState;
  };

  const currentList = expandSteps(sessionState);
  const proposedState = getProposedState();
  const proposedList = proposedState ? expandSteps(proposedState) : null;

  let launchMin = 0;
  let readyMin = 0;
  let rootMin = 0;
  let transitionCount = 0;

  let pLaunchMin = 0;
  let pReadyMin = 0;
  let pRootMin = 0;
  let pTransitionCount = 0;

  const calcMetrics = (state: typeof sessionState, list: RoutineStep[], isProp: boolean) => {
    let tCount = 0;
    let lMin = 0, rMin = 0, rtMin = 0;

    let prevParent: string | null = null;
    list.forEach(step => {
      let currentParent = 'root';
      if (state.capsules['CAP-01'] && state.capsules['CAP-01'].children.includes(step.id)) currentParent = 'CAP-01';
      else if (state.capsules['CAP-02'] && state.capsules['CAP-02'].children.includes(step.id)) currentParent = 'CAP-02';

      if (prevParent !== null && prevParent !== currentParent) tCount++;
      prevParent = currentParent;

      if (currentParent === 'CAP-01') lMin += step.durationMinutes;
      else if (currentParent === 'CAP-02') rMin += step.durationMinutes;
      else rtMin += step.durationMinutes;
    });

    if (isProp) {
      pLaunchMin = lMin; pReadyMin = rMin; pRootMin = rtMin; pTransitionCount = tCount;
    } else {
      launchMin = lMin; readyMin = rMin; rootMin = rtMin; transitionCount = tCount;
    }
  };

  calcMetrics(sessionState, currentList, false);
  if (proposedState && proposedList) {
    calcMetrics(proposedState, proposedList, true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-[#B87333] flex items-center justify-center text-xs font-bold text-[#B87333]">
           {proposedState ? `${pLaunchMin}/${pReadyMin}/${pRootMin}` : `${launchMin}/${readyMin}/${rootMin}`}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Allocation (Launch / Ready / Root)</p>
          <p className="text-xs text-gray-500">Transitions: {proposedState ? pTransitionCount : transitionCount}</p>
        </div>
      </div>

      <div className="relative pt-4 pb-8 border-l-2 border-[#C89B7B] ml-2 pl-4">
        {nestRequest && !repairPreview && (
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cGF0aCBkPSJNMCA4TDggMCIgc3Ryb2tlPSJyZ2JhKDAuNSwgMC41LCAwLjUsIDAuMikiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50 pointer-events-none" />
        )}

        {proposedList ? (
           <>
             <div className="text-xs font-bold text-gray-400 mb-2">PROPOSED PLAYBACK</div>
             {proposedList.map((step) => (
               <div key={`prop-${step.id}`} className="mb-4">
                 <div className="flex justify-between text-sm">
                   <span className="font-medium text-green-700">{step.label}</span>
                   <span className="text-gray-500">{step.durationMinutes}m</span>
                 </div>
               </div>
             ))}
           </>
        ) : (
           <>
             <div className="text-xs font-bold text-gray-400 mb-2">COMMITTED PLAYBACK</div>
             {currentList.map((step, idx) => (
               <div
                 key={`curr-${step.id}`}
                 className="mb-4 cursor-pointer hover:bg-gray-50 p-1 rounded"
                 onClick={() => setFocusPosition(idx * 60)}
                 tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === ' ' || e.key === 'Enter') {
                     e.preventDefault();
                     setFocusPosition(idx * 60);
                   }
                 }}
               >
                 <div className="flex justify-between text-sm">
                   <span className="font-medium">{step.label}</span>
                   <span className="text-gray-500">{step.durationMinutes}m</span>
                 </div>
                 {sessionState.notes && Object.values(sessionState.notes).map(note => (
                   note.entityId === step.id ? (
                     <div key={note.id} className="text-xs text-indigo-600 bg-indigo-50 p-1 mt-1 rounded">
                       Note: {note.text}
                     </div>
                   ) : null
                 ))}
               </div>
             ))}
           </>
        )}
      </div>
    </div>
  );
}
