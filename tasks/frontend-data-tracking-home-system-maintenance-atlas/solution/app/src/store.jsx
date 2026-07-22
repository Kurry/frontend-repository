import React, { createContext, useContext, useReducer } from 'react';

const INITIAL_STATE = {
  rooms: [
    { id: 'r1', name: 'Basement', floor: 1 }, { id: 'r2', name: 'Utility Room', floor: 1 }, { id: 'r3', name: 'Garage', floor: 1 },
    { id: 'r4', name: 'Kitchen', floor: 2 }, { id: 'r5', name: 'Living Room', floor: 2 }, { id: 'r6', name: 'Master Bath', floor: 2 },
    { id: 'r7', name: 'Master Bedroom', floor: 2 }, { id: 'r8', name: 'Guest Bath', floor: 2 }, { id: 'r9', name: 'Guest Bedroom', floor: 2 },
    { id: 'r10', name: 'Hallway', floor: 2 }, { id: 'r11', name: 'Attic', floor: 3 }, { id: 'r12', name: 'Roof', floor: 3 },
    { id: 'r13', name: 'Front Yard', floor: 1 }, { id: 'r14', name: 'Back Yard', floor: 1 }, { id: 'r15', name: 'Dining Room', floor: 2 },
    { id: 'r16', name: 'Office', floor: 2 },
  ],
  assets: [
    { id: 'a1', name: 'Main Water Valve', type: 'plumbing', roomId: 'r1' }, { id: 'a2', name: 'Water Heater', type: 'plumbing', roomId: 'r2' },
    { id: 'a3', name: 'Furnace', type: 'hvac', roomId: 'r2' }, { id: 'a4', name: 'Electrical Panel', type: 'electrical', roomId: 'r3' },
    { id: 'a5', name: 'Kitchen Sink', type: 'plumbing', roomId: 'r4' }, { id: 'a6', name: 'Dishwasher', type: 'appliance', roomId: 'r4' },
    { id: 'a7', name: 'Refrigerator', type: 'appliance', roomId: 'r4' }, { id: 'a8', name: 'Thermostat', type: 'hvac', roomId: 'r5' },
    { id: 'a9', name: 'Master Shower', type: 'plumbing', roomId: 'r6' }, { id: 'a10', name: 'Master Toilet', type: 'plumbing', roomId: 'r6' },
    { id: 'a11', name: 'Master Sink', type: 'plumbing', roomId: 'r6' }, { id: 'a12', name: 'Guest Tub', type: 'plumbing', roomId: 'r8' },
    { id: 'a13', name: 'Guest Toilet', type: 'plumbing', roomId: 'r8' }, { id: 'a14', name: 'Guest Sink', type: 'plumbing', roomId: 'r8' },
    { id: 'a15', name: 'Washing Machine', type: 'appliance', roomId: 'r2' }, { id: 'a16', name: 'Dryer', type: 'appliance', roomId: 'r2' },
    { id: 'a17', name: 'AC Condenser', type: 'hvac', roomId: 'r14' }, { id: 'a18', name: 'Sump Pump', type: 'plumbing', roomId: 'r1' },
    { id: 'a19', name: 'Garage Door Opener', type: 'electrical', roomId: 'r3' }, { id: 'a20', name: 'Attic Fan', type: 'hvac', roomId: 'r11' },
    { id: 'a21', name: 'Solar Inverter', type: 'electrical', roomId: 'r2' }, { id: 'a22', name: 'Irrigation Controller', type: 'plumbing', roomId: 'r3' },
  ],
  edges: [
    { id: 'e1', source: 'a1', target: 'a2', type: 'supplies' }, { id: 'e2', source: 'a1', target: 'a5', type: 'supplies' },
    { id: 'e3', source: 'a2', target: 'a5', type: 'supplies' }, { id: 'e4', source: 'a1', target: 'a6', type: 'supplies' },
    { id: 'e19', source: 'a4', target: 'a2', type: 'powers' }, { id: 'e20', source: 'a4', target: 'a3', type: 'powers' },
    { id: 'e24', source: 'a8', target: 'a3', type: 'controls' }, { id: 'e25', source: 'a8', target: 'a17', type: 'controls' },
  ],
  readings: [
    { id: 'rd1', assetId: 'a2', measure: 'Temperature', value: 120, unit: 'F', observedTime: '2023-01-10T10:00:00Z', provenance: 'User', note: 'Normal' },
    { id: 'rd2', assetId: 'a2', measure: 'Pressure', value: 50, unit: 'psi', observedTime: '2023-01-10T10:05:00Z', provenance: 'User', note: 'Normal' },
    { id: 'rd7', assetId: 'a2', measure: 'Temperature', value: 95, unit: 'F', observedTime: '2023-10-01T10:00:00Z', provenance: 'User', note: 'Abnormal low' },
  ],
  symptoms: [
    { id: 'sy1', assetId: 'a9', type: 'Low Pressure', severity: 'Medium', interval: 'Continuous', evidence: ['rd7'] },
    { id: 'sy2', assetId: 'a17', type: 'Short Cycling', severity: 'High', interval: 'Intermittent', evidence: [] },
  ],
  parts: [
    { id: 'p1', name: '10x20x1 Air Filter', quantity: 4, compatibleWith: ['a3'], lot: 'L1', expiry: '2025-01-01' },
    { id: 'p2', name: 'Water Heater Element', quantity: 2, compatibleWith: ['a2'], lot: 'L2', expiry: null },
    { id: 'p3', name: 'Sump Pump Check Valve', quantity: 1, compatibleWith: ['a18'], lot: 'L3', expiry: null },
  ],
  hypotheses: [
    { id: 'h1', symptomId: 'sy1', cause: 'Failing Water Heater Element', status: 'suspected', test: 'Multimeter resistance test', result: null },
    { id: 'h2', symptomId: 'sy1', cause: 'Clogged Shower Cartridge', status: 'rejected', test: 'Visual inspection', result: 'Clear' },
  ],
  series: [
    { id: 'sr1', assetId: 'a3', type: 'Replace Filter', intervalDays: 90, partsRequired: ['p1'] },
    { id: 'sr2', assetId: 'a2', type: 'Flush Tank', intervalDays: 365, partsRequired: [] },
  ],
  occurrences: [
    { id: 'o1', seriesId: 'sr2', date: '2023-10-15', status: 'overdue' },
    { id: 'o2', seriesId: 'sr1', date: '2023-11-15', status: 'due' },
  ],
  workOrders: [],
  reservations: [],
  certifications: [],
  activeTime: null,
};

const Reducer = (state, action) => {
  switch (action.type) {
    case 'MOVE_ASSET':
      return { ...state, assets: state.assets.map(a => a.id === action.payload.assetId ? { ...a, roomId: action.payload.roomId } : a) };
    case 'ADD_EDGE':
      return { ...state, edges: [...state.edges, { id: `e${Date.now()}`, ...action.payload }] };
    case 'ADD_READING':
      return { ...state, readings: [...state.readings, { id: `rd${Date.now()}`, ...action.payload }] };
    case 'ADD_SYMPTOM':
      return { ...state, symptoms: [...state.symptoms, { id: `sy${Date.now()}`, ...action.payload }] };
    case 'SET_ACTIVE_TIME':
      return { ...state, activeTime: action.payload };
    case 'UPDATE_HYPOTHESIS':
      return { ...state, hypotheses: state.hypotheses.map(h => h.id === action.payload.id ? { ...h, ...action.payload.updates } : h) };
    case 'ADD_HYPOTHESIS':
      return { ...state, hypotheses: [...state.hypotheses, { id: `h${Date.now()}`, ...action.payload }] };
    case 'RESCHEDULE_OCCURRENCE':
      return { ...state, occurrences: state.occurrences.map(o => o.id === action.payload.id ? { ...o, date: action.payload.newDate } : o) };
    case 'CREATE_WORK_ORDER':
      return { ...state, workOrders: [...state.workOrders, { id: `wo${Date.now()}`, status: 'queued', steps: [], ...action.payload }] };
    case 'UPDATE_WORK_ORDER':
      return { ...state, workOrders: state.workOrders.map(wo => wo.id === action.payload.id ? { ...wo, ...action.payload.updates } : wo) };
    case 'RESERVE_PART':
      return { ...state, reservations: [...state.reservations, { id: `res${Date.now()}`, ...action.payload }] };
    case 'CONSUME_PART': {
      const { reservationId } = action.payload;
      const reservation = state.reservations.find(r => r.id === reservationId);
      if (!reservation) return state;
      return {
        ...state,
        reservations: state.reservations.map(r => r.id === reservationId ? { ...r, status: 'consumed' } : r),
        parts: state.parts.map(p => p.id === reservation.partId ? { ...p, quantity: p.quantity - reservation.quantity } : p)
      };
    }
    case 'CERTIFY':
      return { ...state, certifications: [...state.certifications, { id: `cert${Date.now()}`, timestamp: new Date().toISOString(), ...action.payload }] };
    case 'IMPORT_STATE':
      return action.payload;
    default:
      return state;
  }
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, INITIAL_STATE);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};
export const useAppContext = () => useContext(AppContext);
