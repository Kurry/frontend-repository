import { useSyncExternalStore } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Simple lightweight store for strictly in-memory state
let state = {
    records: [],
    timelineState: {
        selectedRecordId: null,
        currentCheckpointIndex: null,
        status: 'idle', // idle | selected | changed | conflict | resolved
    },
    history: [], // For global undo
    derived: {
        summary: {}
    }
};

const listeners = new Set();

function emitChange() {
    // Recompute derived state before emitting
    state.derived.summary = {
        total: state.records.length,
        ready: state.records.filter(r => r.status === 'ready').length,
    };
    for (let listener of listeners) {
        listener();
    }
}

// Deep clone for history
function cloneState(s) {
    return JSON.parse(JSON.stringify(s));
}

function pushHistory() {
    state.history.push(cloneState({
        records: state.records,
        timelineState: state.timelineState
    }));
}

export const getRawState = () => state;

export const storeActions = {
    seedData: () => {
        const now = new Date();
        state.records = Array.from({ length: 120 }).map((_, i) => {
            const time = new Date(now.getTime() - i * 3600000);

            // Create some realistic checkpoint history for a few records
            let checkpoints = [];
            let val = Math.round((Math.random() * 5 + 1) * 10) / 10;
            let status = ['draft', 'ready', 'archived'][Math.floor(Math.random() * 3)];

            if (i < 5) {
                checkpoints = [
                    { value: val - 1 > 0 ? val - 1 : 0, status: 'draft', timestamp: new Date(time.getTime() - 600000).toISOString() },
                    { value: val, status: status, timestamp: time.toISOString() }
                ];
                status = 'changed'; // Flag one as changed
            }

            return {
                id: uuidv4(),
                timestamp: time.toISOString(),
                value: val,
                status: status,
                checkpoints: checkpoints
            };
        });
        emitChange();
    },

    addRecord: (record) => {
        pushHistory();
        state.records = [record, ...state.records];
        emitChange();
    },

    updateRecord: (id, updates) => {
        pushHistory();
        state.records = state.records.map(r => {
            if (r.id === id) {
                const newRec = { ...r, ...updates };
                // Automatically add to checkpoints on major mutation if not scrubbing
                if (!newRec.checkpoints) newRec.checkpoints = [];
                if (updates.value !== undefined || updates.status !== undefined) {
                    newRec.checkpoints.push({
                        value: newRec.value,
                        status: newRec.status,
                        timestamp: new Date().toISOString()
                    });
                }
                return newRec;
            }
            return r;
        });
        emitChange();
    },

    deleteRecord: (id) => {
        pushHistory();
        state.records = state.records.filter(r => r.id !== id);
        if (state.timelineState.selectedRecordId === id) {
            state.timelineState = { selectedRecordId: null, currentCheckpointIndex: null, status: 'idle' };
        }
        emitChange();
    },

    // Timeline Scrub specific actions
    selectRecord: (id) => {
        pushHistory();
        const record = state.records.find(r => r.id === id);
        state.timelineState = {
            selectedRecordId: id,
            currentCheckpointIndex: record && record.checkpoints ? record.checkpoints.length - 1 : 0,
            status: 'selected'
        };
        emitChange();
    },

    scrubTimeline: (id, checkpointIndex) => {
        // We don't push to global history for every scrub step to avoid blowing up undo
        if (state.timelineState.selectedRecordId === id) {
            state.timelineState.currentCheckpointIndex = checkpointIndex;
            state.timelineState.status = 'changed';
            emitChange();
        }
    },

    restoreCheckpoint: (id) => {
        pushHistory();
        const record = state.records.find(r => r.id === id);
        const cpIndex = state.timelineState.currentCheckpointIndex;

        if (record && record.checkpoints && record.checkpoints[cpIndex]) {
            const cp = record.checkpoints[cpIndex];
            state.records = state.records.map(r => r.id === id ? {
                ...r,
                value: cp.value,
                status: cp.status,
                // We preserve checkpoints but add this restoration as a new event conceptually,
                // or just truncate checkpoints. Let's truncate for simplicity of 'restore'.
                checkpoints: record.checkpoints.slice(0, cpIndex + 1)
            } : r);
            state.timelineState.status = 'resolved';
            emitChange();
        }
    },

    undo: () => {
        if (state.history.length > 0) {
            const previous = state.history.pop();
            state.records = previous.records;
            state.timelineState = previous.timelineState;
            emitChange();
        }
    },

    clear: () => {
        state.records = [];
        state.timelineState = { selectedRecordId: null, currentCheckpointIndex: null, status: 'idle' };
        state.history = [];
        emitChange();
    },

    importSession: (data) => {
        state.records = data.records;
        if (data.timelineState) {
             state.timelineState = data.timelineState;
        } else {
             state.timelineState = { selectedRecordId: null, currentCheckpointIndex: null, status: 'idle' };
        }
        state.history = [];
        emitChange();
    }
};

export function useStore() {
    const currentState = useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => state
    );

    // Add keyboard listener for global undo inside the hook scope
    // A bit hacky but keeps it localized without extra components
    if (typeof window !== 'undefined' && !window._undoListenerBound) {
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                storeActions.undo();
            }
        });
        window._undoListenerBound = true;
    }

    return {
        ...currentState,
        ...storeActions
    };
}
