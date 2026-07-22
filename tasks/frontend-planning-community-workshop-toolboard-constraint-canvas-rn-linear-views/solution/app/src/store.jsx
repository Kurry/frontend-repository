import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  records: [
    {
      id: uuidv4(),
      name: 'Initial Station',
      status: 'draft',
      lane: 'backlog',
      capacity: 5
    },
    {
      id: uuidv4(),
      name: 'Workshop Alpha',
      status: 'ready',
      lane: 'in-progress',
      capacity: 3
    }
  ],
  history: [],
  undoStack: [],
  derived: {
    summary: 'Loaded 2 stations',
    totalStations: 2,
    activeLanes: {
      backlog: 1,
      'in-progress': 1,
      review: 0,
      done: 0,
    }
  }
};

const updateDerived = (records) => {
  const lanes = {
    backlog: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
  };
  records.forEach(r => {
    if (r.status !== 'archived') {
      lanes[r.lane] = (lanes[r.lane] || 0) + 1;
    }
  });

  return {
    summary: `Active stations: ${records.filter(r => r.status !== 'archived').length}`,
    totalStations: records.length,
    activeLanes: lanes,
  };
};

function reducer(state, action) {
  let nextRecords;
  let event;

  switch (action.type) {
    case 'CREATE_RECORD':
      nextRecords = [...state.records, { id: uuidv4(), ...action.payload }];
      event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action: 'CREATE',
        details: { recordId: nextRecords[nextRecords.length - 1].id }
      };
      break;
    case 'UPDATE_RECORD':
      nextRecords = state.records.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r);
      event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action: 'UPDATE',
        details: { recordId: action.payload.id }
      };
      break;
    case 'DELETE_RECORD':
      nextRecords = state.records.filter(r => r.id !== action.payload.id);
      event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action: 'DELETE',
        details: { recordId: action.payload.id }
      };
      break;
    case 'MOVE_LANE':
      // capacity check could be done before dispatching, or here
      nextRecords = state.records.map(r => r.id === action.payload.id ? { ...r, lane: action.payload.lane, status: 'changed' } : r);
      event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action: 'MOVE',
        details: { recordId: action.payload.id, toLane: action.payload.lane }
      };
      break;
    case 'LOAD_SESSION':
      return {
        records: action.payload.records,
        history: action.payload.history || [],
        derived: action.payload.derived || updateDerived(action.payload.records),
        undoStack: [],
      };
    case 'UNDO':
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...prev,
        undoStack: state.undoStack.slice(0, -1)
      };
    default:
      return state;
  }

  return {
    records: nextRecords,
    derived: updateDerived(nextRecords),
    history: [...state.history, event],
    undoStack: [...state.undoStack, { records: state.records, derived: state.derived, history: state.history }]
  };
}

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
