import { createSlice } from '@reduxjs/toolkit'
import { computeRosterChecksum } from '../utils/checksum'

const initialState = {
  edges: [], // { sourceVolunteerId, targetVolunteerId, shiftId }
  responses: {}, // volunteerId -> 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'withdrawn'
  status: 'draft', // 'draft', 'awaiting_responses', 'awaiting_approval', 'stale', 'committing', 'committed', 'rolled-back', 'failed'
  failureSimulated: false,
  reservationsActive: false,
  baseChecksum: null
}

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    addEdge(state, action) {
      if (state.status !== 'draft' && state.status !== 'stale') return;
      state.edges.push(action.payload);
      state.responses[action.payload.sourceVolunteerId] = 'draft';
      state.responses[action.payload.targetVolunteerId] = 'draft';
    },
    removeEdge(state, action) {
      if (state.status !== 'draft' && state.status !== 'stale') return;
      state.edges = state.edges.filter((_, i) => i !== action.payload);
    },
    sendProposal(state, action) {
      if (state.edges.length === 0) return;
      state.status = 'awaiting_responses';
      state.reservationsActive = true;
      state.baseChecksum = computeRosterChecksum(action.payload.rosterState);
      Object.keys(state.responses).forEach(vId => {
        state.responses[vId] = 'sent';
      });
    },
    setResponse(state, action) {
      const { volunteerId, response } = action.payload;
      if (state.responses[volunteerId]) {
        state.responses[volunteerId] = response;
      }

      if (response === 'declined' || response === 'expired' || response === 'withdrawn') {
        state.reservationsActive = false;
        state.status = 'failed';
        return;
      }

      const allAccepted = Object.values(state.responses).every(r => r === 'accepted');
      if (allAccepted && state.status === 'awaiting_responses') {
        state.status = 'awaiting_approval';
      }
    },
    reviseProposal(state) {
      state.status = 'draft';
      state.reservationsActive = false;
      Object.keys(state.responses).forEach(vId => {
        state.responses[vId] = 'draft';
      });
    },
    checkStale(state, action) {
      if (state.status === 'awaiting_approval') {
         const currentChecksum = computeRosterChecksum(action.payload.rosterState);
         if (currentChecksum !== state.baseChecksum) {
            state.status = 'stale';
         }
      }
    },
    approveAndCommit(state, action) {
      if (state.status !== 'awaiting_approval' && state.status !== 'rolled-back') return;

      if (action.payload?.simulateFailure && !state.failureSimulated) {
        state.status = 'failed';
        state.failureSimulated = true;
      } else {
        state.status = 'committed';
        state.reservationsActive = false;
        state.failureSimulated = false;
      }
    },
    rollback(state) {
      if (state.status === 'failed') {
        state.status = 'rolled-back';
      }
    },
    resetExchange(state) {
      return initialState;
    }
  }
})

export const {
  addEdge,
  removeEdge,
  sendProposal,
  setResponse,
  reviseProposal,
  checkStale,
  approveAndCommit,
  rollback,
  resetExchange
} = exchangeSlice.actions
export default exchangeSlice.reducer
