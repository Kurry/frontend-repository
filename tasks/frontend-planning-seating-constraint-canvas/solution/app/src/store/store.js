import { useReducer } from 'react';
import { INITIAL_GUESTS, INITIAL_RELATIONSHIPS } from './fixture';

export const ROOM_WIDTH = 24;
export const ROOM_HEIGHT = 18;
export const GRID_SIZE = 0.25;

export const OBSTACLES = [
  { id: 'stage', x: 8, y: 0, width: 8, height: 3, type: 'stage' },
  { id: 'col1', x: 6, y: 8, width: 1, height: 1, type: 'column' },
  { id: 'col2', x: 12, y: 8, width: 1, height: 1, type: 'column' },
  { id: 'col3', x: 18, y: 8, width: 1, height: 1, type: 'column' },
  { id: 'service', x: 0, y: 14, width: 4, height: 4, type: 'service-zone' },
  { id: 'door1', x: 0, y: 2, width: 1, height: 2, type: 'door' },
  { id: 'door2', x: 23, y: 2, width: 1, height: 2, type: 'door' },
  { id: 'acc-entrance', x: 11, y: 17, width: 2, height: 1, type: 'accessible-entrance' },
];

export const getSeatOffsets = (type, capacity, width, height) => {
  const seats = [];
  if (type === 'round') {
    const radius = width / 2 + 0.5;
    for (let i = 0; i < capacity; i++) {
      const angle = (i * 2 * Math.PI) / capacity;
      seats.push({ x: width/2 + radius * Math.cos(angle), y: height/2 + radius * Math.sin(angle) });
    }
  } else {
    // rectangle
    const numTop = Math.floor(capacity / 2);
    const numBottom = capacity - numTop;
    for(let i=0; i<numTop; i++) {
        seats.push({ x: (width / (numTop+1)) * (i+1), y: -0.5 });
    }
    for(let i=0; i<numBottom; i++) {
        seats.push({ x: (width / (numBottom+1)) * (i+1), y: height + 0.5 });
    }
  }
  return seats;
};

export const getTableSeats = (table) => {
  const offsets = getSeatOffsets(table.type, table.capacity, table.width, table.height);
  const rad = table.rotation * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return offsets.map((off, i) => {
    // translate relative to center, rotate, translate back, add table position
    const cx = table.width / 2;
    const cy = table.height / 2;
    const rx = (off.x - cx) * cos - (off.y - cy) * sin + cx;
    const ry = (off.x - cx) * sin + (off.y - cy) * cos + cy;
    return {
      id: `${table.id}-seat-${i}`,
      tableId: table.id,
      x: table.x + rx,
      y: table.y + ry
    };
  });
};

const initialState = {
  tables: [],
  guests: INITIAL_GUESTS,
  assignments: [], // { guestId, seatId }
  relationships: INITIAL_RELATIONSHIPS,
  aisles: [],
  serviceStations: [],
  layouts: {
    'layout-1': { id: 'layout-1', tables: [], assignments: [], aisles: [] },
    'layout-2': { id: 'layout-2', tables: [], assignments: [], aisles: [] }
  },
  activeLayoutId: 'layout-1',
  lenses: {
    accessibility: false,
    sightline: false,
    service: false
  },
  history: [],
  historyIndex: -1,
};

const saveHistory = (state) => {
  const history = state.history.slice(0, state.historyIndex + 1);
  history.push({
    tables: state.tables,
    assignments: state.assignments,
    aisles: state.aisles,
    relationships: state.relationships,
    serviceStations: state.serviceStations
  });
  return { ...state, history, historyIndex: history.length - 1 };
};

const overlaps = (r1, r2) => {
  return !(r2.x >= r1.x + r1.width ||
           r2.x + r2.width <= r1.x ||
           r2.y >= r1.y + r1.height ||
           r2.y + r2.height <= r1.y);
};

export function reducer(state, action) {
  let newState = state;
  switch (action.type) {
    case 'INIT':
      return { ...initialState };

    case 'ADD_TABLE': {
      const newTable = action.payload;
      const willCollide = OBSTACLES.some(obs => overlaps(obs, newTable)) || state.tables.some(t => overlaps(t, newTable));
      const inBounds = newTable.x >= 0 && newTable.y >= 0 && newTable.x + newTable.width <= ROOM_WIDTH && newTable.y + newTable.height <= ROOM_HEIGHT;
      if (!willCollide && inBounds) {
          newState = saveHistory({ ...state, tables: [...state.tables, newTable] });
      }
      break;
    }

    case 'UPDATE_TABLE': {
      const { id, updates } = action.payload;
      const updatedTable = { ...state.tables.find(t => t.id === id), ...updates };
      const otherTables = state.tables.filter(t => t.id !== id);

      const willCollide = OBSTACLES.some(obs => overlaps(obs, updatedTable)) || otherTables.some(t => overlaps(t, updatedTable));
      const inBounds = updatedTable.x >= 0 && updatedTable.y >= 0 && updatedTable.x + updatedTable.width <= ROOM_WIDTH && updatedTable.y + updatedTable.height <= ROOM_HEIGHT;

      if (!willCollide && inBounds) {
        // Also update seats, drop assignments if capacity shrinks
        const oldTable = state.tables.find(t => t.id === id);
        let newAssignments = state.assignments;
        if (updatedTable.capacity < oldTable.capacity) {
            const tableSeatIds = getTableSeats(updatedTable).map(s => s.id);
            newAssignments = state.assignments.filter(a => !a.seatId.startsWith(id) || tableSeatIds.includes(a.seatId));
        }

        newState = saveHistory({
            ...state,
            tables: state.tables.map(t => t.id === id ? updatedTable : t),
            assignments: newAssignments
        });
      }
      break;
    }

    case 'DELETE_TABLE': {
      const id = action.payload;
      newState = saveHistory({
          ...state,
          tables: state.tables.filter(t => t.id !== id),
          assignments: state.assignments.filter(a => !a.seatId.startsWith(id))
      });
      break;
    }

    case 'ASSIGN_GUEST': {
      const { guestId, seatId } = action.payload;
      const guest = state.guests.find(g => g.id === guestId);
      if (guest.rsvp === 'declined') break;

      const newAssignments = state.assignments.filter(a => a.guestId !== guestId && a.seatId !== seatId);
      newAssignments.push({ guestId, seatId });
      newState = saveHistory({ ...state, assignments: newAssignments });
      break;
    }

    case 'UNASSIGN_GUEST': {
      const { guestId } = action.payload;
      newState = saveHistory({
          ...state,
          assignments: state.assignments.filter(a => a.guestId !== guestId)
      });
      break;
    }

    case 'DRAW_AISLE': {
      newState = saveHistory({ ...state, aisles: [...state.aisles, action.payload] });
      break;
    }

    case 'UPDATE_AISLE': {
        const {id, updates} = action.payload;
        newState = saveHistory({...state, aisles: state.aisles.map(a => a.id === id ? {...a, ...updates} : a)});
        break;
    }

    case 'DELETE_AISLE': {
        const id = action.payload;
        newState = saveHistory({...state, aisles: state.aisles.filter(a => a.id !== id)});
        break;
    }

    case 'ADD_RELATIONSHIP': {
      // payload: {guest1, guest2, type}
      const { guest1, guest2, type } = action.payload;
      const conflicting = state.relationships.some(r => (r.guest1 === guest1 && r.guest2 === guest2) || (r.guest1 === guest2 && r.guest2 === guest1));
      if (!conflicting) {
          newState = saveHistory({ ...state, relationships: [...state.relationships, { id: `rel-${Date.now()}`, guest1, guest2, type }] });
      }
      break;
    }

    case 'TOGGLE_LENS': {
      newState = { ...state, lenses: { ...state.lenses, [action.payload]: !state.lenses[action.payload] } };
      break;
    }

    case 'UNDO': {
      if (state.historyIndex > 0) {
          const prev = state.history[state.historyIndex - 1];
          newState = { ...state, ...prev, historyIndex: state.historyIndex - 1 };
      }
      break;
    }

    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
          const next = state.history[state.historyIndex + 1];
          newState = { ...state, ...next, historyIndex: state.historyIndex + 1 };
      }
      break;
    }

    case 'SWITCH_LAYOUT': {
        const targetLayout = state.layouts[action.payload];
        // save current
        const updatedLayouts = {
            ...state.layouts,
            [state.activeLayoutId]: {
                id: state.activeLayoutId,
                tables: state.tables,
                assignments: state.assignments,
                aisles: state.aisles
            }
        };
        newState = saveHistory({
            ...state,
            layouts: updatedLayouts,
            activeLayoutId: action.payload,
            tables: targetLayout.tables,
            assignments: targetLayout.assignments,
            aisles: targetLayout.aisles
        });
        break;
    }

    case 'IMPORT_STATE': {
        newState = action.payload;
        break;
    }

    default:
      break;
  }
  return newState;
}

export function useSeatingStore() {
  return useReducer(reducer, initialState);
}
