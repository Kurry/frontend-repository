import { createSlice } from '@reduxjs/toolkit'
import { generateFixtureData } from './fixture'

const { initialShifts, initialVolunteers, initialOwnership } = generateFixtureData()

const initialState = {
  shifts: initialShifts,
  volunteers: initialVolunteers,
  ownership: initialOwnership,
  commitHistory: []
}

const rosterSlice = createSlice({
  name: 'roster',
  initialState,
  reducers: {
    commitExchange(state, action) {
      const { edges } = action.payload;
      edges.forEach(edge => {
        if (edge.shiftId && edge.targetVolunteerId) {
          state.ownership[edge.shiftId] = edge.targetVolunteerId;
        }
      });
      state.commitHistory.push({
        id: `commit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        edges
      });
    },
    resetRoster(state) {
      return initialState;
    }
  }
})

export const { commitExchange, resetRoster } = rosterSlice.actions
export default rosterSlice.reducer
