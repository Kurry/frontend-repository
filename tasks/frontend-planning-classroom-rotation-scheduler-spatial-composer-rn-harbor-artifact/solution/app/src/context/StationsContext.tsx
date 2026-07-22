import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { ClassroomRotationSchedulerSession, StationRecord, DerivedState, Position } from '../types';

type Action =
  | { type: 'CREATE_RECORD'; payload: { title: string; status: string; capacity?: number; studentsAssigned?: number } }
  | { type: 'UPDATE_RECORD'; payload: { id: string; updates: Partial<StationRecord> } }
  | { type: 'DELETE_RECORD'; payload: { id: string } }
  | { type: 'PLACE_IN_COMPOSER'; payload: { id: string; position: Position; rebalance?: boolean } }
  | { type: 'UNDO' }
  | { type: 'RESTORE_SESSION'; payload: ClassroomRotationSchedulerSession }
  | { type: 'CLEAR_SESSION' };

const calculateDerivedState = (records: StationRecord[]): DerivedState => {
  const readyStations = records.filter(r => r.status === 'ready' || r.status === 'changed');
  const totalCapacity = readyStations.reduce((sum, r) => sum + r.capacity, 0);
  const totalStudentsAssigned = readyStations.reduce((sum, r) => sum + r.studentsAssigned, 0);

  let overallStatus: 'balanced' | 'over_capacity' | 'under_capacity' = 'balanced';
  if (totalStudentsAssigned > totalCapacity) overallStatus = 'over_capacity';
  else if (totalStudentsAssigned < totalCapacity) overallStatus = 'under_capacity';

  return {
    totalCapacity,
    totalStudentsAssigned,
    overallStatus,
    readyStationsCount: readyStations.length
  };
};

const getInitialState = (): ClassroomRotationSchedulerSession => {
  const initialRecords: StationRecord[] = [
    { id: '1', title: 'Math Station 1', status: 'ready', capacity: 5, studentsAssigned: 5, position: { x: 50, y: 50 } },
    { id: '2', title: 'Reading Nook', status: 'ready', capacity: 4, studentsAssigned: 2, position: { x: 250, y: 50 } },
    { id: '3', title: 'Science Lab', status: 'draft', capacity: 6, studentsAssigned: 0 },
    { id: '4', title: 'Empty Station', status: 'empty', capacity: 0, studentsAssigned: 0 }
  ];
  return {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: initialRecords,
    derived: calculateDerivedState(initialRecords),
    history: []
  };
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const reducer = (state: ClassroomRotationSchedulerSession, action: Action): ClassroomRotationSchedulerSession => {
  switch (action.type) {
    case 'CREATE_RECORD': {
      const newRecord: StationRecord = {
        id: generateId(),
        title: action.payload.title,
        status: action.payload.status as any,
        capacity: action.payload.capacity ?? 0,
        studentsAssigned: action.payload.studentsAssigned ?? 0
      };
      const newRecords = [...state.records, newRecord];
      return {
        ...state,
        records: newRecords,
        derived: calculateDerivedState(newRecords),
        history: [...state.history, state.records]
      };
    }
    case 'UPDATE_RECORD': {
      const newRecords = state.records.map(r =>
        r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
      );
      return {
        ...state,
        records: newRecords,
        derived: calculateDerivedState(newRecords),
        history: [...state.history, state.records]
      };
    }
    case 'DELETE_RECORD': {
      const newRecords = state.records.filter(r => r.id !== action.payload.id);
      return {
        ...state,
        records: newRecords,
        derived: calculateDerivedState(newRecords),
        history: [...state.history, state.records]
      };
    }
    case 'PLACE_IN_COMPOSER': {
      let newRecords = state.records.map(r => {
        if (r.id === action.payload.id) {
          return {
            ...r,
            position: action.payload.position,
            status: r.status === 'draft' || r.status === 'empty' ? 'ready' : (r.status === 'ready' ? 'changed' : r.status)
          } as StationRecord;
        }
        return r;
      });

      if (action.payload.rebalance) {
         const targetRecord = newRecords.find(r => r.id === action.payload.id);
         if (targetRecord) {
            // simplistic rebalance logic for demonstration: try to max out capacity of target record by pulling from others
            let needed = targetRecord.capacity - targetRecord.studentsAssigned;
            if (needed > 0) {
               newRecords = newRecords.map(r => {
                 if (r.id !== action.payload.id && r.status === 'changed' && needed > 0 && r.studentsAssigned > 0) {
                   const pull = Math.min(r.studentsAssigned, needed);
                   needed -= pull;
                   return { ...r, studentsAssigned: r.studentsAssigned - pull };
                 }
                 return r;
               });
               const actualPulled = (targetRecord.capacity - targetRecord.studentsAssigned) - needed;
               targetRecord.studentsAssigned += actualPulled;
            }
         }
      }

      return {
        ...state,
        records: newRecords,
        derived: calculateDerivedState(newRecords),
        history: [...state.history, state.records]
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previousRecords = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        ...state,
        records: previousRecords,
        derived: calculateDerivedState(previousRecords),
        history: newHistory
      };
    }
    case 'RESTORE_SESSION': {
      return { ...action.payload, history: [] }; // Reset history on import
    }
    case 'CLEAR_SESSION': {
      return {
        schemaVersion: 'v1',
        exportedAt: new Date().toISOString(),
        records: [],
        derived: calculateDerivedState([]),
        history: [...state.history, state.records]
      };
    }
    default:
      return state;
  }
};

const StationsContext = createContext<{
  state: ClassroomRotationSchedulerSession;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const StationsProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  return (
    <StationsContext.Provider value={{ state, dispatch }}>
      {children}
    </StationsContext.Provider>
  );
};

export const useStations = () => {
  const context = useContext(StationsContext);
  if (!context) throw new Error('useStations must be used within a StationsProvider');
  return context;
};
