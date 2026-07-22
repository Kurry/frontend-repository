import React, { createContext, useReducer, useContext } from 'react';
import { generateFixtures, initialClock, FIXTURE_HASH } from './fixtures';

const StateContext = createContext();
const DispatchContext = createContext();

const initialState = {
  ...generateFixtures(),
  clock: initialClock,
  allocations: [],
  outcomes: [],
  variance: [],
  branches: [],
  capacityPlan: [],
  notes: [],
  revisions: [],
  closed: false,
  hash: FIXTURE_HASH
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LINK_EVIDENCE':
      // action.payload: { commitmentId, eventId, percentage }
      return {
        ...state,
        allocations: [...state.allocations, action.payload]
      };
    case 'CLASSIFY_OUTCOME':
      // action.payload: { commitmentId, class: string, variance: object }
      return {
        ...state,
        outcomes: [...state.outcomes.filter(o => o.commitmentId !== action.payload.commitmentId), {
          id: `out-${Date.now()}`,
          ...action.payload
        }]
      };
    case 'BRANCH_SCENARIO':
      // action.payload: branch object
      return {
        ...state,
        branches: [...state.branches, action.payload]
      };
    case 'PLACE_CAPACITY':
      // action.payload: capacity placement object
      return {
        ...state,
        capacityPlan: [...state.capacityPlan, action.payload]
      };
    case 'CLOSE_REVIEW':
      return {
        ...state,
        closed: true,
        revisions: [...state.revisions, { id: `rev-${Date.now()}`, state: JSON.parse(JSON.stringify(state)) }]
      };
    case 'REBASE_REVIEW':
      return {
        ...state,
        closed: true,
        revisions: [...state.revisions, { id: `rev-${Date.now()}`, state: JSON.parse(JSON.stringify(state)) }]
      };
    case 'IMPORT_STATE':
      return action.payload;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}

export function useAppDispatch() {
  return useContext(DispatchContext);
}
