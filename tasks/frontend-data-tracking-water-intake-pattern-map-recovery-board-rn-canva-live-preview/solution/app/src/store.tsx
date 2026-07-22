import React, { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { IntakeEvent, EventStatus, WaterIntakePatternMapSession } from './types'

export interface State {
  records: IntakeEvent[]
  history: IntakeEvent[][]
  selectedRecordId: string | null
  filter: EventStatus | 'all'
}

type Action =
  | { type: 'ADD_RECORD'; record: IntakeEvent }
  | { type: 'UPDATE_RECORD'; record: IntakeEvent }
  | { type: 'DELETE_RECORD'; id: string }
  | { type: 'SET_FILTER'; filter: EventStatus | 'all' }
  | { type: 'SELECT_RECORD'; id: string | null }
  | { type: 'MOVE_RECOVERY'; id: string; status: EventStatus }
  | { type: 'UNDO' }
  | { type: 'IMPORT_SESSION'; session: WaterIntakePatternMapSession }
  | { type: 'CLEAR_ALL' }

const initialState: State = {
  records: [
    { id: '1', title: 'Morning Water', amount: 500, status: 'ready' },
    { id: '2', title: 'Lunch Intake', amount: 300, status: 'draft' },
    { id: '3', title: 'Failed Coffee', amount: 0, status: 'empty' },
    { id: '4', title: 'Workout Hydration', amount: 750, status: 'ready' },
  ],
  history: [],
  selectedRecordId: null,
  filter: 'all',
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_RECORD':
      return {
        ...state,
        history: [...state.history, state.records],
        records: [...state.records, action.record],
      }
    case 'UPDATE_RECORD':
      return {
        ...state,
        history: [...state.history, state.records],
        records: state.records.map((r) =>
          r.id === action.record.id ? action.record : r
        ),
      }
    case 'DELETE_RECORD':
      return {
        ...state,
        history: [...state.history, state.records],
        records: state.records.filter((r) => r.id !== action.id),
        selectedRecordId: state.selectedRecordId === action.id ? null : state.selectedRecordId
      }
    case 'SET_FILTER':
      return { ...state, filter: action.filter }
    case 'SELECT_RECORD':
      return { ...state, selectedRecordId: action.id }
    case 'MOVE_RECOVERY': {
      const record = state.records.find((r) => r.id === action.id)
      if (!record) return state

      const newRecords = state.records.map((r) =>
        r.id === action.id ? { ...r, status: action.status } : r
      )

      return {
        ...state,
        history: [...state.history, state.records],
        records: newRecords,
      }
    }
    case 'UNDO':
      if (state.history.length === 0) return state
      const previousRecords = state.history[state.history.length - 1]
      return {
        ...state,
        records: previousRecords,
        history: state.history.slice(0, -1),
      }
    case 'IMPORT_SESSION':
      return {
        ...state,
        records: action.session.records,
        history: action.session.history || [],
        selectedRecordId: null
      }
    case 'CLEAR_ALL':
      return {
        ...state,
        records: [],
        history: [...state.history, state.records],
        selectedRecordId: null
      }
    default:
      return state
  }
}

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
