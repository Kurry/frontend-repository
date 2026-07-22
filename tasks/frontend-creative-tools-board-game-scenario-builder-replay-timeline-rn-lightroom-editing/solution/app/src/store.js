import { createStore } from 'solid-js/store';

const initialRecords = Array.from({ length: 110 }).map((_, i) => ({
  id: `rec-${i + 1}`,
  title: `Scenario ${i + 1}`,
  description: i % 10 === 0 ? `Important boundary scenario ${i}` : `Description for scenario ${i + 1}`,
  status: i % 5 === 0 ? 'archived' : i % 3 === 0 ? 'draft' : 'ready',
  history: [
    { timestamp: Date.now() - 10000, state: { timelineState: 0, status: 'draft' } },
    { timestamp: Date.now() - 5000, state: { timelineState: 50, status: 'changed' } },
    { timestamp: Date.now(), state: { timelineState: 100, status: i % 5 === 0 ? 'archived' : i % 3 === 0 ? 'draft' : 'ready' } },
  ],
  timelineState: 100, // 0 to 100 representing some continuous value
  derived: {
    summary: `End state of scenario ${i + 1}`
  }
}));

// Include one conflicting state and one empty state for edge cases testing
initialRecords[0].status = 'conflict';
initialRecords[0].title = 'Conflicting Scenario';
initialRecords[1].status = 'empty';
initialRecords[1].title = 'Empty State Scenario';
initialRecords[1].history = [{ timestamp: Date.now(), state: { timelineState: 0, status: 'empty' } }];
initialRecords[1].timelineState = 0;

export const [store, setStore] = createStore({
  schemaVersion: 'v1',
  exportedAt: null,
  records: initialRecords,
  activeRecordId: null,
  filterStatus: 'all', // all, draft, ready, changed, archived, conflict, empty
});

export function addRecord(record) {
  setStore('records', (records) => [...records, record]);
}

export function updateRecord(id, updates) {
  setStore('records', (r) => r.id === id, updates);
}

export function deleteRecord(id) {
  setStore('records', (records) => records.filter(r => r.id !== id));
}

export function setActiveRecord(id) {
  setStore('activeRecordId', id);
}

export function setFilterStatus(status) {
  setStore('filterStatus', status);
}

export function loadState(newState) {
  setStore(newState);
}

export function scrubTimeline(id, newTimelineState) {
  setStore('records', (r) => r.id === id, (record) => {
    // Check if new state is in history, otherwise just update current
    let matchingHistory = record.history.find(h => Math.abs(h.state.timelineState - newTimelineState) < 5);

    return {
      timelineState: newTimelineState,
      status: matchingHistory ? matchingHistory.state.status : 'changed',
      derived: {
        summary: `Timeline scrubbed to ${newTimelineState}`
      }
    };
  });
}

export function restoreCheckpoint(id, checkpointIndex) {
    setStore('records', (r) => r.id === id, (record) => {
        const checkpoint = record.history[checkpointIndex];
        if (!checkpoint) return record;

        return {
            timelineState: checkpoint.state.timelineState,
            status: checkpoint.state.status,
            derived: {
                summary: `Restored to checkpoint ${checkpointIndex}`
            }
        };
    });
}
