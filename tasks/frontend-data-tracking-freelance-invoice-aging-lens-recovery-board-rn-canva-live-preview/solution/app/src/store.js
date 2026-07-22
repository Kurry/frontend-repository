import { useState, useEffect, useCallback } from 'react';

// Single source of truth state structure based on FreelanceInvoiceAgingLensSession
export const initialState = {
    schemaVersion: "v1",
    exportedAt: new Date().toISOString(),
    records: [
        { id: "inv-001", client: "Acme Corp", amount: 1500, dueDate: "2026-06-01", status: "failed", recoveryStatus: "idle" },
        { id: "inv-002", client: "Globex", amount: 3200, dueDate: "2026-05-15", status: "ready", recoveryStatus: "idle" },
        { id: "inv-003", client: "Stark Ind", amount: 500, dueDate: "2026-06-10", status: "draft", recoveryStatus: "idle" }
    ],
    derived: {
        summary: {
            totalRecords: 3,
            totalAmount: 5200,
            failedAmount: 1500,
            recoveredAmount: 0
        }
    },
    history: []
};

// Global in-memory state object for WebMCP direct access
window.__APP_STATE__ = JSON.parse(JSON.stringify(initialState));

// Recalculate derived state based on records
const calculateDerivedState = (records) => {
    return {
        summary: {
            totalRecords: records.length,
            totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
            failedAmount: records.filter(r => r.status === 'failed').reduce((sum, r) => sum + r.amount, 0),
            recoveredAmount: records.filter(r => r.recoveryStatus === 'resolved').reduce((sum, r) => sum + r.amount, 0)
        }
    };
};

const reducer = (state, action) => {
    let newRecords;
    let newHistory = [...state.history];
    const timestamp = new Date().toISOString();

    switch (action.type) {
        case 'CREATE_RECORD':
            newRecords = [...state.records, action.payload];
            newHistory.push({ action: `Created invoice for ${action.payload.client}`, timestamp });
            break;
        case 'EDIT_RECORD':
            newRecords = state.records.map(r => r.id === action.payload.id ? action.payload : r);
            newHistory.push({ action: `Edited invoice ${action.payload.id}`, timestamp });
            break;
        case 'MOVE_TO_RECOVERY':
            // Signature mutation: move a failed record into a recovery path and repair its downstream consequences
            newRecords = state.records.map(r => {
                if (r.id === action.payload.id) {
                    const newStatus = action.payload.recoveryStatus === 'resolved' ? 'ready' : r.status;
                    return { ...r, recoveryStatus: action.payload.recoveryStatus, status: newStatus };
                }
                return r;
            });
            newHistory.push({ action: `Moved invoice ${action.payload.id} to ${action.payload.recoveryStatus}`, timestamp });
            break;
        case 'IMPORT_STATE':
            // Assume validation happens in utils.js
            return {
                ...action.payload,
                history: [...action.payload.history, { action: `Imported state`, timestamp }]
            };
        case 'CLEAR_RECORDS':
            newRecords = [];
            newHistory.push({ action: 'Cleared all records', timestamp });
            break;
        default:
            return state;
    }

    const newState = {
        ...state,
        records: newRecords,
        derived: calculateDerivedState(newRecords),
        history: newHistory
    };

    window.__APP_STATE__ = newState;
    return newState;
};

// Global listeners for React to sync with window.__APP_STATE__ mutations (from WebMCP)
const listeners = new Set();
export const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const dispatchGlobal = (action) => {
    reducer(window.__APP_STATE__, action);
    listeners.forEach(l => l());
};

export const useStore = () => {
    const [state, setState] = useState(window.__APP_STATE__);
    const [historyStack, setHistoryStack] = useState([JSON.parse(JSON.stringify(window.__APP_STATE__))]);

    useEffect(() => {
        const unsubscribe = subscribe(() => {
            const newState = JSON.parse(JSON.stringify(window.__APP_STATE__));
            setState(newState);
            setHistoryStack(prev => [...prev, newState]);
        });
        return unsubscribe;
    }, []);

    const dispatch = useCallback((action) => {
        dispatchGlobal(action);
    }, []);

    const undo = useCallback(() => {
        setHistoryStack(prev => {
            if (prev.length <= 1) return prev;
            const newStack = [...prev];
            newStack.pop(); // remove current state
            const previousState = newStack[newStack.length - 1];
            window.__APP_STATE__ = JSON.parse(JSON.stringify(previousState));
            setState(window.__APP_STATE__);
            return newStack;
        });
    }, []);

    return { state, dispatch, undo };
};
