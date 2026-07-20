import { useLabStore } from './tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js';

const state = useLabStore.getState();
console.log("Initial undo stack:", state.undoStack.length);

state.saveAttribution({ trialId: 'trial-001', criterionId: 'c1', labelA: 'A', labelB: 'B', cause: 'scorer-noise', note: 'test' });
const state2 = useLabStore.getState();
console.log("After save, undo stack:", state2.undoStack.length, "attributions:", state2.attributions);

state2.undo();
const state3 = useLabStore.getState();
console.log("After undo, attributions:", state3.attributions);

state3.redo();
const state4 = useLabStore.getState();
console.log("After redo, attributions:", state4.attributions);
