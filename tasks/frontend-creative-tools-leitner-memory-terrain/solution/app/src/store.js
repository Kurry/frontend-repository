import { create } from 'zustand'

export const FIXED_TODAY = '2026-03-10';

const BOX_INTERVALS = [1, 2, 4, 8, 16];

// The starter deck has 30 fictional cards across six topics.
// Twelve cards are due, four are new, and two contain intentionally malformed optional import fields in a separate diagnostic fixture.
const TOPICS = ['Astronomy', 'Biology', 'Chemistry', 'History', 'Physics', 'Geography'];
const STARTER_CARDS = Array.from({ length: 30 }, (_, i) => {
  const topic = TOPICS[i % TOPICS.length];

  // Distribute across boxes 1-5
  const box = (i % 5) + 1;
  const isNew = i >= 26; // 4 new cards
  const isDue = !isNew && i < 12; // 12 due cards

  let dueDateStr = null;
  if (!isNew) {
    const dueDate = new Date(FIXED_TODAY);
    if (isDue) {
      dueDate.setDate(dueDate.getDate() - (i % 3)); // overdue or due today
    } else {
      dueDate.setDate(dueDate.getDate() + (i % 3) + 1); // future
    }
    dueDateStr = dueDate.toISOString().split('T')[0];
  }

  return {
    id: `card-${i + 1}`,
    front: `What is the key concept ${i + 1} of ${topic}?`,
    back: `The concept relates to ${topic} principles.`,
    tags: [topic.toLowerCase()],
    box: box,
    due: dueDateStr,
    difficulty: 0,
    tabletopPosition: { x: (i % 10) * 100 + 50, y: Math.floor(i / 10) * 100 + 50 },
    createdAt: new Date(`2026-03-01T10:00:00Z`).getTime() + i, // immutable creation order
    manualAdjustments: []
  };
});

// Add 2 malformed diagnostic cards
const DIAGNOSTIC_CARDS = [
  {
    id: 'card-31-malformed',
    front: 'Malformed Card 1',
    back: 'Should be repaired',
    tags: ['diagnostic'],
    box: 99, // invalid
    due: '2026-15-40', // invalid date
    tabletopPosition: { x: -50, y: -50 }, // invalid position (not bounded positive multiple of 10)
    createdAt: new Date(`2026-03-01T10:00:00Z`).getTime() + 30,
    manualAdjustments: []
  },
  {
    id: 'card-32-malformed',
    front: 'Malformed Card 2',
    back: 'Another bad card',
    tags: ['diagnostic'],
    box: 0, // invalid
    due: 'not-a-date',
    tabletopPosition: { x: 1, y: 1 }, // not multiple of 10
    createdAt: new Date(`2026-03-01T10:00:00Z`).getTime() + 31,
    manualAdjustments: []
  }
];

export const useStore = create((set, get) => ({
  cards: [...STARTER_CARDS, ...DIAGNOSTIC_CARDS],
  groupRegions: [], // { id, name, bounds: {x, y, w, h} }
  sessions: [], // active/completed sessions
  reviewEvents: [],
  stagedEdits: [],
  viewState: {
    selectedCardIds: [],
    mode: 'desktop', // desktop, tablet, mobile
    activeView: 'terrain', // terrain, review, radial, forecast, clusters, import
    filterTags: [],
    filterDate: null,
    filterWedge: null,
  },
  activeSession: null,

  // Tabletop Actions
  setCardPosition: (id, x, y) => set((state) => {
    // snapping to 10px grid, bounded 1600x1000
    const snapX = Math.max(0, Math.min(1600, Math.round(x / 10) * 10));
    const snapY = Math.max(0, Math.min(1000, Math.round(y / 10) * 10));

    const newCards = state.cards.map(c =>
      c.id === id ? { ...c, tabletopPosition: { x: snapX, y: snapY } } : c
    );

    // Check group regions intersection
    const card = newCards.find(c => c.id === id);
    if (card) {
      const cx = card.tabletopPosition.x;
      const cy = card.tabletopPosition.y;
      const newTags = [...card.tags];
      state.groupRegions.forEach(region => {
        const inRegion = cx >= region.bounds.x && cx <= region.bounds.x + region.bounds.w &&
                         cy >= region.bounds.y && cy <= region.bounds.y + region.bounds.h;
        if (inRegion && !newTags.includes(region.name)) {
          newTags.push(region.name);
        } else if (!inRegion && newTags.includes(region.name)) {
          // If moving out, we don't automatically remove tags assigned via region.
          // The instruction says "Moving a card across the border previews membership and commits on drop".
          // Re-evaluating containment:
        }
      });

      // Strict evaluation: card gets tag if it's in the region
      state.groupRegions.forEach(region => {
        const inRegion = cx >= region.bounds.x && cx <= region.bounds.x + region.bounds.w &&
                         cy >= region.bounds.y && cy <= region.bounds.y + region.bounds.h;
        if (inRegion && !card.tags.includes(region.name)) {
           newCards.find(c => c.id === id).tags.push(region.name);
        }
      });
    }

    return { cards: newCards };
  }),

  addGroupRegion: (region) => set((state) => ({ groupRegions: [...state.groupRegions, region] })),

  // Selection
  selectCards: (ids) => set((state) => ({ viewState: { ...state.viewState, selectedCardIds: ids } })),

  // Box assignment manual
  moveCardToBox: (id, box, reason) => set((state) => {
    if (state.activeSession) return state; // cannot manual move during session
    return {
      cards: state.cards.map(c => {
        if (c.id === id) {
          const newDue = new Date(FIXED_TODAY);
          newDue.setDate(newDue.getDate() + BOX_INTERVALS[box - 1]);
          return {
            ...c,
            box,
            due: newDue.toISOString().split('T')[0],
            manualAdjustments: [...(c.manualAdjustments || []), { box, reason, date: new Date().toISOString() }]
          };
        }
        return c;
      })
    };
  }),

  // Review Engine
  startReview: (tagFilter = null) => set((state) => {
    const today = new Date(FIXED_TODAY).toISOString().split('T')[0];
    let eligible = state.cards;
    if (tagFilter) eligible = eligible.filter(c => c.tags.includes(tagFilter));

    // overdue first, then due, then new, with creation-order tie break
    eligible.sort((a, b) => {
      const aNew = a.due === null;
      const bNew = b.due === null;
      if (aNew && !bNew) return 1;
      if (!aNew && bNew) return -1;

      if (!aNew && !bNew) {
        const aOverdue = a.due < today;
        const bOverdue = b.due < today;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        if (a.due !== b.due) return a.due.localeCompare(b.due);
      }
      return a.createdAt - b.createdAt;
    });

    // freeze queue
    return {
      activeSession: {
        queue: eligible.map(c => c.id),
        currentIndex: 0,
        revealed: false,
        ledger: [],
        stagedEdits: []
      }
    };
  }),

  revealCard: () => set((state) => {
    if (!state.activeSession) return state;
    return {
      activeSession: { ...state.activeSession, revealed: true }
    };
  }),

  rateCard: (rating) => set((state) => {
    if (!state.activeSession || !state.activeSession.revealed) return state;

    const cardId = state.activeSession.queue[state.activeSession.currentIndex];
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return state;

    let newBox = card.box;
    if (rating === 'again') newBox = 1;
    else if (rating === 'hard') newBox = Math.max(1, card.box - 1);
    else if (rating === 'good') newBox = Math.min(5, card.box + 1);
    else if (rating === 'easy') newBox = Math.min(5, card.box + 2);

    const newDue = new Date(FIXED_TODAY);
    if (rating === 'again') {
       newDue.setDate(newDue.getDate() + 1);
    } else {
       newDue.setDate(newDue.getDate() + BOX_INTERVALS[newBox - 1]);
    }
    const newDueStr = newDue.toISOString().split('T')[0];

    const event = {
      cardId,
      rating,
      beforeBox: card.box,
      afterBox: newBox,
      beforeDue: card.due,
      afterDue: newDueStr,
      timestamp: new Date().toISOString()
    };

    const nextIndex = state.activeSession.currentIndex + 1;
    const isFinished = nextIndex >= state.activeSession.queue.length;

    const newCards = state.cards.map(c => c.id === cardId ? { ...c, box: newBox, due: newDueStr } : c);

    if (isFinished) {
      return {
        cards: newCards,
        reviewEvents: [...state.reviewEvents, event],
        sessions: [...state.sessions, { ...state.activeSession, ledger: [...state.activeSession.ledger, event], completedAt: new Date().toISOString() }],
        activeSession: null
      };
    }

    return {
      cards: newCards,
      reviewEvents: [...state.reviewEvents, event],
      activeSession: {
        ...state.activeSession,
        currentIndex: nextIndex,
        revealed: false,
        ledger: [...state.activeSession.ledger, event]
      }
    };
  }),

  undoLastRating: () => set((state) => {
    if (!state.activeSession || state.activeSession.ledger.length === 0) return state;
    if (state.activeSession.currentIndex === 0) return state;

    const lastEvent = state.activeSession.ledger[state.activeSession.ledger.length - 1];
    const cardId = lastEvent.cardId;

    const newCards = state.cards.map(c => {
      if (c.id === cardId) {
        return { ...c, box: lastEvent.beforeBox, due: lastEvent.beforeDue };
      }
      return c;
    });

    const newLedger = state.activeSession.ledger.slice(0, -1);

    return {
      cards: newCards,
      reviewEvents: state.reviewEvents.slice(0, -1),
      activeSession: {
        ...state.activeSession,
        currentIndex: state.activeSession.currentIndex - 1,
        revealed: false, // have to reveal again to rate
        ledger: newLedger
      }
    };
  }),

  abandonSession: () => set((state) => {
    if (!state.activeSession) return state;
    return {
      sessions: [...state.sessions, { ...state.activeSession, abandonedAt: new Date().toISOString() }],
      activeSession: null
    };
  }),

  resumeSession: (sessionIndex) => set((state) => {
    const session = state.sessions[sessionIndex];
    if (!session || session.completedAt) return state;
    // remove from sessions
    const newSessions = [...state.sessions];
    newSessions.splice(sessionIndex, 1);
    return {
      sessions: newSessions,
      activeSession: session
    };
  }),

  // Views and State
  setView: (view) => set((state) => ({ viewState: { ...state.viewState, activeView: view } })),
  setFilter: (tags, date, wedge) => set((state) => ({ viewState: { ...state.viewState, filterTags: tags, filterDate: date, filterWedge: wedge } })),

  // Edit
  stageEdit: (id, updates) => set((state) => {
    if (state.activeSession) {
      return { activeSession: { ...state.activeSession, stagedEdits: [...state.activeSession.stagedEdits, { id, updates }] } };
    }
    return {
      cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
    };
  }),

  // Import/Export (State setting functions)
  setDeckState: (newState) => set(() => newState),
}));
