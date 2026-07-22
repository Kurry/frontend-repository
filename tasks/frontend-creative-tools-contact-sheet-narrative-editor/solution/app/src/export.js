import { useStore } from './store.js';

export function getExportState() {
  const state = useStore.getState();
  return {
    schemaVersion: "contact-sheet-edit/v1",
    exportedAt: new Date().toISOString(),
    frames: state.frames,
    bursts: state.bursts,
    decisions: state.decisions,
    crops: state.crops,
    sequenceSlots: state.sequenceSlots,
    reviewState: state.reviewState
  };
}

export function importExportState(data) {
  if (data.schemaVersion !== "contact-sheet-edit/v1") {
    throw new Error("Invalid schema version");
  }
  useStore.getState().importState(data);
}
