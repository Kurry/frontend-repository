import { create } from 'zustand';
import { INITIAL_COMPONENT_STATE } from './fixtures';

export const useStore = create((set, get) => ({
  // App Modes: desktop, tablet, mobile, rehearsal, compare
  activeMode: 'desktop',
  setActiveMode: (mode) => set({ activeMode: mode }),

  viewportWidth: 1440,
  setViewportWidth: (width) => set({ viewportWidth: width }),

  selectedComponentId: null,
  setSelectedComponentId: (id) => set({ selectedComponentId: id }),

  // Desktop (Base) Layout
  desktopLayout: INITIAL_COMPONENT_STATE,

  // Overrides (sparse maps keyed by component id)
  tabletOverrides: {},
  mobileOverrides: {},

  // Strategies (Compare Mode)
  strategyA: null,
  strategyB: null,

  semanticOrder: INITIAL_COMPONENT_STATE.map(c => c.id),

  contentPressure: 'localized', // short, long, localized

  updateDesktopLayout: (id, updates) => set(state => ({
    desktopLayout: state.desktopLayout.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
  })),

  updateOverride: (breakpoint, id, property, value) => set(state => {
    const overrideKey = `${breakpoint}Overrides`; // tabletOverrides or mobileOverrides
    const currentOverrides = state[overrideKey][id] || {};

    // If value is null, remove the override for inheritance
    if (value === null) {
      const { [property]: _, ...rest } = currentOverrides;
      if (Object.keys(rest).length === 0) {
        const { [id]: __, ...restOverrides } = state[overrideKey];
        return { [overrideKey]: restOverrides };
      }
      return { [overrideKey]: { ...state[overrideKey], [id]: rest } };
    }

    return {
      [overrideKey]: {
        ...state[overrideKey],
        [id]: { ...currentOverrides, [property]: value }
      }
    };
  }),

  setSemanticOrder: (newOrder) => set({ semanticOrder: newOrder }),
  setContentPressure: (pressure) => set({ contentPressure: pressure }),

  loadState: (newState) => set(newState)
}));
