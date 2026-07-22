import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { nanoid } from 'nanoid';

const initialState = {
  records: [
    { id: nanoid(), name: 'Vanilla Extract', amount: 10, unit: 'ml', status: 'draft', ribbonState: { intensity: 50, note: 'Base' } },
    { id: nanoid(), name: 'Cinnamon', amount: 2, unit: 'g', status: 'ready', ribbonState: { intensity: 80, note: 'Warmth' } },
    { id: nanoid(), name: 'Lemon Zest', amount: 5, unit: 'g', status: 'changed', ribbonState: { intensity: 60, note: 'Bright' } }
  ],
  derived: { summary: "Balanced base with warm and bright notes." },
  history: [],
  undoStack: [],
  selectedRecordId: null,
};

export const StateContext = createContext();

export function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_RECORD': {
      const newRecords = [...state.records, action.payload];
      return saveHistory({ ...state, records: newRecords }, 'CREATE_RECORD');
    }
    case 'UPDATE_RECORD': {
      const newRecords = state.records.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r);
      return saveHistory({ ...state, records: newRecords }, 'UPDATE_RECORD');
    }
    case 'DELETE_RECORD': {
      const newRecords = state.records.filter(r => r.id !== action.payload);
      return saveHistory({ ...state, records: newRecords, selectedRecordId: state.selectedRecordId === action.payload ? null : state.selectedRecordId }, 'DELETE_RECORD');
    }
    case 'REORDER_RECORD': {
       const newRecords = [...state.records];
       const [moved] = newRecords.splice(action.payload.from, 1);
       newRecords.splice(action.payload.to, 0, moved);
       return saveHistory({ ...state, records: newRecords }, 'REORDER_RECORD');
    }
    case 'SET_SELECTED':
      return { ...state, selectedRecordId: action.payload };
    case 'UPDATE_RIBBON': {
      const { id, ribbonState } = action.payload;
      const newRecords = state.records.map(r => r.id === id ? { ...r, ribbonState: { ...r.ribbonState, ...ribbonState }, status: 'changed' } : r);
      return saveHistory({ ...state, records: newRecords, derived: updateDerived(newRecords) }, 'UPDATE_RIBBON');
    }
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return { ...prev, undoStack: state.undoStack.slice(0, -1) };
    }
    case 'IMPORT_SESSION': {
      const data = action.payload;
      if (data.schemaVersion !== 'shapeshift-session-v1' && data.schemaVersion !== 'flavor-balance-v1') return state;
      return { ...state, records: data.records, derived: data.derived || {}, history: data.history || [], undoStack: [] };
    }
    case 'CLEAR':
      return saveHistory({ ...state, records: [], derived: {}, selectedRecordId: null }, 'CLEAR');
    case '__INTERNAL_SET':
      return action.payload;
    default:
      return state;
  }
}

function updateDerived(records) {
  const count = records.length;
  const changed = records.filter(r => r.status === 'changed').length;
  return { summary: `Total components: ${count}. Modified: ${changed}.` };
}

function saveHistory(newState, actionName) {
   const currentHistory = [...newState.history, { action: actionName, timestamp: new Date().toISOString() }];
   return { ...newState, history: currentHistory };
}

export function RealStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const dispatchWithUndo = (action) => {
    if (['CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD', 'UPDATE_RIBBON', 'REORDER_RECORD', 'CLEAR'].includes(action.type)) {
       const nextState = reducer(state, action);
       dispatch({ type: '__INTERNAL_SET', payload: { ...nextState, undoStack: [...state.undoStack, state] }});
    } else if (action.type === 'UNDO') {
       if (state.undoStack.length === 0) return;
       const prev = state.undoStack[state.undoStack.length - 1];
       dispatch({ type: '__INTERNAL_SET', payload: { ...prev, undoStack: state.undoStack.slice(0, -1) } });
    } else {
       dispatch(action);
    }
  }

  useEffect(() => {
    window.webmcp_session_info = () => ({
      contract_version: "zto-webmcp-v1",
      supported_modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
    });

    window.webmcp_list_tools = () => [
      { name: "editor_select", module: "structured-editor-v1" },
      { name: "editor_update_property", module: "structured-editor-v1" },
      { name: "entity_create", module: "entity-collection-v1" },
      { name: "entity_select", module: "entity-collection-v1" },
      { name: "entity_update", module: "entity-collection-v1" },
      { name: "entity_delete", module: "entity-collection-v1" },
      { name: "artifact_export", module: "artifact-transfer-v1" },
      { name: "artifact_import", module: "artifact-transfer-v1" }
    ];

    window.webmcp_invoke_tool = (tool_name, args) => {
      if (tool_name === 'entity_create') {
         dispatchWithUndo({ type: 'CREATE_RECORD', payload: { id: nanoid(), name: args.name || 'New', amount: 0, status: 'draft', ribbonState: { intensity: 50, note: '' } }});
         return { success: true };
      }
      if (tool_name === 'entity_delete') {
         if (!args.confirm) return { success: false, error: 'confirm required' };
         dispatchWithUndo({ type: 'DELETE_RECORD', payload: args.id });
         return { success: true };
      }
      if (tool_name === 'editor_update_property') {
         if (args.property === 'ribbonState') {
            dispatchWithUndo({ type: 'UPDATE_RIBBON', payload: { id: args.id, ribbonState: args.value }});
            return { success: true };
         }
      }
      if (tool_name === 'artifact_export') {
         return { success: true, result: JSON.stringify({
            schemaVersion: 'flavor-balance-v1',
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived: state.derived,
            history: state.history
         }) };
      }
      return { success: false, error: 'unknown or unimplemented tool' };
    };
  }, [state]);

  return (
    <StateContext.Provider value={{ state, dispatch: dispatchWithUndo }}>
      {children}
    </StateContext.Provider>
  );
}
