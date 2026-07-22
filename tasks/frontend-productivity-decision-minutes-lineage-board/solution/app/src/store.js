import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const useStore = create((set, get) => ({
  schemaVersion: "decision-minutes-ledger/v1",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  logicalClock: 0,
  isClockRunning: false,

  participants: [
    { id: 'u1', name: 'Alice', role: 'Chair' },
    { id: 'u2', name: 'Bob', role: 'Member' },
    { id: 'u3', name: 'Charlie', role: 'Member' },
    { id: 'u4', name: 'Diana', role: 'Member' },
    { id: 'u5', name: 'Eve', role: 'Member' },
    { id: 'u6', name: 'Frank', role: 'Member' },
    { id: 'u7', name: 'Grace', role: 'Member' },
  ],
  attendanceEvents: [],

  agendaBlocks: [
    { id: 'a1', title: 'Opening Remarks', plannedStart: 0, plannedEnd: 15, actualStart: null, actualEnd: null, owner: 'u1', objective: 'Welcome', requiredParticipants: ['u1'], decisionRule: 'majority' },
    { id: 'a2', title: 'Review Action Items', plannedStart: 15, plannedEnd: 45, actualStart: null, actualEnd: null, owner: 'u1', objective: 'Review', requiredParticipants: ['u1'], decisionRule: 'majority' },
    { id: 'a3', title: 'New Business', plannedStart: 45, plannedEnd: 90, actualStart: null, actualEnd: null, owner: 'u2', objective: 'Discuss new items', requiredParticipants: ['u1', 'u2'], decisionRule: 'majority' }
  ],

  sources: [
    { id: 's1', title: 'Q3 Report', text: 'The Q3 report indicates a 10% increase in revenue.' },
    { id: 's2', title: 'Budget Proposal', text: 'The proposed budget for Q4 is $500,000.' },
  ],

  proposals: [
    { id: 'p1', title: 'Adopt Q3 Report', text: 'We move to adopt the Q3 report as presented.', author: 'u2', sourceId: 's1', evidenceType: 'supporting', status: 'draft', revision: 1, parentRevisionId: null }
  ],

  amendments: [],
  positions: [],
  decisions: [],
  actions: [],
  speakingQueue: [],

  // Clock Actions
  startClock: () => set({ isClockRunning: true }),
  pauseClock: () => set({ isClockRunning: false }),
  tick: () => set((state) => ({ logicalClock: state.logicalClock + 1 })),

  // Agenda Actions
  moveAgendaBlock: (id, newStart, newEnd) => set((state) => ({
    agendaBlocks: state.agendaBlocks.map(b => b.id === id ? { ...b, plannedStart: newStart, plannedEnd: newEnd } : b)
  })),
  startAgendaBlock: (id) => set((state) => ({
    agendaBlocks: state.agendaBlocks.map(b => b.id === id ? { ...b, actualStart: state.logicalClock } : b)
  })),
  endAgendaBlock: (id) => set((state) => ({
    agendaBlocks: state.agendaBlocks.map(b => b.id === id ? { ...b, actualEnd: state.logicalClock } : b)
  })),

  // Attendance Actions
  markAttendance: (userId, isPresent) => set((state) => ({
    attendanceEvents: [...state.attendanceEvents, { userId, isPresent, timestamp: state.logicalClock }]
  })),

  // Proposal Actions
  addProposal: (proposal) => set((state) => ({
    proposals: [...state.proposals, { ...proposal, id: uuidv4(), revision: 1, status: 'draft' }]
  })),
  introduceProposal: (id) => set((state) => ({
    proposals: state.proposals.map(p => p.id === id ? { ...p, status: 'introduced' } : p)
  })),
  amendProposal: (proposalId, amendment) => set((state) => {
    const parent = state.proposals.find(p => p.id === proposalId);
    if (!parent) return state;

    const newAmendment = { ...amendment, id: uuidv4(), targetId: proposalId, targetRevision: parent.revision, status: 'pending' };
    return {
      amendments: [...state.amendments, newAmendment]
    };
  }),
  acceptAmendment: (amendmentId) => set((state) => {
    const amendment = state.amendments.find(a => a.id === amendmentId);
    if (!amendment) return state;

    const parent = state.proposals.find(p => p.id === amendment.targetId && p.revision === amendment.targetRevision);
    if (!parent) return state;

    const newProposalRevision = {
      ...parent,
      id: uuidv4(),
      revision: parent.revision + 1,
      parentRevisionId: parent.id,
      text: amendment.type === 'substitute' ? amendment.text : parent.text,
      title: amendment.title || parent.title,
    };

    return {
      amendments: state.amendments.map(a => a.id === amendmentId ? { ...a, status: 'accepted' } : a),
      proposals: [...state.proposals, newProposalRevision]
    };
  }),

  // Positions and Decisions
  recordPosition: (userId, proposalId, position) => set((state) => ({
    positions: [...state.positions, { userId, proposalId, position, timestamp: state.logicalClock }]
  })),
  makeDecision: (proposalId, outcome, dissentText = '') => set((state) => {
    // Basic quorum check: need at least 4 out of 7 present based on latest attendance events.
    const latestAttendance = {};
    state.participants.forEach(p => { latestAttendance[p.id] = false; }); // Default absent initially
    state.attendanceEvents.forEach(e => {
        if (e.timestamp <= state.logicalClock) {
            latestAttendance[e.userId] = e.isPresent;
        }
    });

    const presentCount = Object.values(latestAttendance).filter(Boolean).length;
    if (presentCount < 4) {
        alert("Cannot make decision: Quorum not met.");
        return state;
    }

    const decision = { id: uuidv4(), proposalId, outcome, dissentText, timestamp: state.logicalClock, snapshot: {
        tally: state.positions.filter(p => p.proposalId === proposalId)
    }};

    return {
        decisions: [...state.decisions, decision],
        proposals: state.proposals.map(p => p.id === proposalId ? { ...p, status: outcome } : p)
    };
  }),
  supersedeDecision: (oldDecisionId, newProposalId) => set((state) => {
      const oldDecision = state.decisions.find(d => d.id === oldDecisionId);
      if(!oldDecision) return state;

      const updatedActions = state.actions.map(a =>
        a.authorizingDecisionId === oldDecisionId ? { ...a, status: 'review_required', superseded: true } : a
      );

      return {
          decisions: state.decisions.map(d => d.id === oldDecisionId ? { ...d, supersededBy: newProposalId } : d),
          actions: updatedActions
      };
  }),

  // Actions
  generateAction: (taskId, ownerId, authorizingDecisionId, dependencies = []) => set((state) => ({
    actions: [...state.actions, { id: uuidv4(), task: taskId, owner: ownerId, authorizingDecisionId, dependencies, status: 'pending', superseded: false }]
  })),

  // Queue
  addToQueue: (userId, topic) => set((state) => ({
    speakingQueue: [...state.speakingQueue, { id: uuidv4(), userId, topic, timestamp: state.logicalClock }]
  })),
  removeFromQueue: (id) => set((state) => ({
    speakingQueue: state.speakingQueue.filter(q => q.id !== id)
  })),

  // Export handling
  getLedgerState: () => get(),
  importLedgerState: (newState) => set(newState)
}));
