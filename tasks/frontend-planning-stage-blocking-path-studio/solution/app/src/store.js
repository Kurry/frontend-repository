import { create } from 'zustand';

// Deterministic Fixture Data
const FIXTURE = {
  stage: { width: 12, height: 8, gridSize: 0.1 },
  entrances: [
    { id: 'e1', name: 'Upstage Left', x: 0, y: 0, width: 2, height: 1 },
    { id: 'e2', name: 'Upstage Right', x: 10, y: 0, width: 2, height: 1 },
    { id: 'e3', name: 'Downstage Right', x: 10, y: 7, width: 2, height: 1 },
  ],
  obstacles: [
    { id: 'o1', name: 'Sofa', x: 4, y: 4, width: 2, height: 1 },
    { id: 'o2', name: 'Table', x: 6, y: 4, width: 1.5, height: 1.5 },
    { id: 'o3', name: 'Chair 1', x: 5.5, y: 5, width: 0.5, height: 0.5 },
    { id: 'o4', name: 'Chair 2', x: 7.5, y: 5, width: 0.5, height: 0.5 },
    { id: 'o5', name: 'Bookshelf', x: 0, y: 2, width: 0.5, height: 3 },
    { id: 'o6', name: 'Rug', x: 3, y: 3, width: 6, height: 4 }, // Zone, not solid?
    { id: 'o7', name: 'Lamp', x: 8, y: 2, width: 0.5, height: 0.5 },
    { id: 'o8', name: 'Plant', x: 1, y: 6, width: 0.5, height: 0.5 },
    { id: 'o9', name: 'Window', x: 4, y: 0, width: 2, height: 0.2 },
    { id: 'o10', name: 'Fireplace', x: 11, y: 3, width: 1, height: 2 },
  ],
  actors: [
    { id: 'a1', name: 'Alice', radius: 0.25, color: '#ef4444' },
    { id: 'a2', name: 'Bob', radius: 0.25, color: '#3b82f6' },
    { id: 'a3', name: 'Charlie', radius: 0.25, color: '#10b981' },
    { id: 'a4', name: 'Diana', radius: 0.25, color: '#f59e0b' },
    { id: 'a5', name: 'Eve', radius: 0.25, color: '#8b5cf6' },
  ],
  props: [
    { id: 'p1', name: 'Lantern', radius: 0.1, color: '#fbbf24' },
    { id: 'p2', name: 'Letter', radius: 0.1, color: '#f3f4f6' },
    { id: 'p3', name: 'Dagger', radius: 0.1, color: '#9ca3af' },
    { id: 'p4', name: 'Key', radius: 0.1, color: '#fb923c' },
    { id: 'p5', name: 'Book', radius: 0.1, color: '#60a5fa' },
    { id: 'p6', name: 'Ring', radius: 0.1, color: '#a78bfa' },
  ],
  totalBeats: 48,
  audienceSamples: [
    { x: 2, y: 9 }, { x: 6, y: 9 }, { x: 10, y: 9 }
  ]
};

const getInitialBlocking = () => {
    // Basic initial state that is "flawed starter blocking"
    const waypoints = {};
    const handoffs = [];

    // Everyone starts somewhere
    FIXTURE.actors.forEach((a, i) => {
        waypoints[`${a.id}-b1`] = { entityId: a.id, beat: 1, x: 2 + i * 2, y: 1, facing: 180, type: 'walk', hold: false };
    });

    // Props start somewhere
    FIXTURE.props.forEach((p, i) => {
        waypoints[`${p.id}-b1`] = { entityId: p.id, beat: 1, x: 1 + i, y: 1, facing: 0, type: 'place', hold: true, custodian: null };
    });

    return {
        waypoints,
        handoffs,
        continuityEvents: [],
        cueAnchors: [],
        dialogue: [],
    };
};

export const useStore = create((set, get) => ({
  fixture: FIXTURE,

  // Logical state
  score: {
    schemaVersion: "stage-blocking-score/v1",
    activeBranch: 'main',
    branches: {
      main: getInitialBlocking(),
    },
    rehearsals: [],
    reviews: [],
    approval: null,
    exportedAt: null,
  },

  // UI State
  currentBeat: 1,
  selectedEntity: null,
  selectedWaypoint: null,
  hoveredEntity: null,
  reducedMotion: false,
  analysisFindings: [],
  activeTool: 'select', // select, path, face, handoff

  // Actions
  setBeat: (beat) => set({ currentBeat: beat }),
  selectEntity: (id) => set({ selectedEntity: id }),
  selectWaypoint: (key) => set({ selectedWaypoint: key }),
  setTool: (tool) => set({ activeTool: tool }),
  setReducedMotion: (val) => set({ reducedMotion: val }),

  // Score actions
  updateWaypoint: (key, data) => set(state => {
    const branch = state.score.branches[state.score.activeBranch];
    return {
      score: {
        ...state.score,
        branches: {
          ...state.score.branches,
          [state.score.activeBranch]: {
            ...branch,
            waypoints: { ...branch.waypoints, [key]: { ...branch.waypoints[key], ...data } }
          }
        }
      }
    };
  }),

  addWaypoint: (data) => set(state => {
      const branch = state.score.branches[state.score.activeBranch];
      const key = `${data.entityId}-b${data.beat}`;
      return {
          score: {
              ...state.score,
              branches: {
                  ...state.score.branches,
                  [state.score.activeBranch]: {
                      ...branch,
                      waypoints: { ...branch.waypoints, [key]: data }
                  }
              }
          }
      };
  }),

  removeWaypoint: (key) => set(state => {
      const branch = state.score.branches[state.score.activeBranch];
      const newWaypoints = { ...branch.waypoints };
      delete newWaypoints[key];
      return {
          score: {
              ...state.score,
              branches: {
                  ...state.score.branches,
                  [state.score.activeBranch]: {
                      ...branch,
                      waypoints: newWaypoints
                  }
              }
          }
      };
  }),

  addHandoff: (data) => set(state => {
      const branch = state.score.branches[state.score.activeBranch];
      return {
          score: {
              ...state.score,
              branches: {
                  ...state.score.branches,
                  [state.score.activeBranch]: {
                      ...branch,
                      handoffs: [...branch.handoffs, data]
                  }
              }
          }
      };
  }),

  createBranch: (name, from) => set(state => {
      return {
          score: {
              ...state.score,
              branches: {
                  ...state.score.branches,
                  [name]: JSON.parse(JSON.stringify(state.score.branches[from || state.score.activeBranch]))
              },
              activeBranch: name
          }
      };
  }),

  checkoutBranch: (name) => set(state => ({ score: { ...state.score, activeBranch: name } })),

  addRehearsalEvent: (event) => set(state => ({
      score: { ...state.score, rehearsals: [...state.score.rehearsals, event] }
  })),

  approveScore: () => set(state => ({
      score: { ...state.score, approval: { at: new Date().toISOString() } }
  })),

  exportState: () => {
      const state = get();
      return JSON.stringify({
          ...state.score,
          exportedAt: new Date().toISOString()
      }, null, 2);
  },

  importState: (jsonStr) => {
      try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.schemaVersion !== "stage-blocking-score/v1") throw new Error("Invalid schema");
          set({ score: parsed });
      } catch (e) {
          console.error(e);
      }
  },

  setAnalysisFindings: (findings) => set({ analysisFindings: findings }),

  reset: () => set({
      score: {
        schemaVersion: "stage-blocking-score/v1",
        activeBranch: 'main',
        branches: {
          main: getInitialBlocking(),
        },
        rehearsals: [],
        reviews: [],
        approval: null,
        exportedAt: null,
      },
      currentBeat: 1,
      selectedEntity: null,
      selectedWaypoint: null,
      analysisFindings: [],
  })
}));
