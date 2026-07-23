import { create } from 'zustand';
import { fixtureGraph, RAW_TRACE_FIXTURE } from './fixture';
import { parseTrace, computePath, computeMinimalLocus } from './utils';

let toastTimer = null;

export const useStore = create((set, get) => ({
  rawTrace: RAW_TRACE_FIXTURE,
  frames: [],
  hypotheses: [],
  activeHypothesisId: null,
  graph: fixtureGraph,
  path: [],
  valid: true,
  contradictions: [],
  unresolved: [],
  minimalLocus: null,
  annotations: [],
  history: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selection: null,
  focus: null,
  scrubIndex: null,
  reduceMotion: false,
  highContrast: false,
  fontScale: 1,
  compareOpen: false,
  editorOpen: true,
  onboardingOpen: true,
  onboardingStep: 0,
  shortcutsOpen: false,
  toast: null,

  log: (entry) => set((s) => ({ history: [...s.history, { at: new Date().toISOString(), ...entry }] })),

  showToast: (message, tone = 'info') => {
    clearTimeout(toastTimer);
    set({ toast: { message, tone } });
    toastTimer = setTimeout(() => set({ toast: null }), 4000);
  },

  setRawTrace: (text) => {
    const frames = parseTrace(text);
    set({ rawTrace: text, frames, scrubIndex: null, focus: null });
    get().recomputePath();
  },

  updateFrame: (id, updates) => {
    set((state) => ({ frames: state.frames.map((f) => (f.id === id ? { ...f, ...updates } : f)) }));
    get().log({ op: 'update_frame', id, updates });
    get().recomputePath();
  },

  toggleCollapse: (id) => {
    const frame = get().frames.find((f) => f.id === id);
    if (!frame) return;
    get().updateFrame(id, { collapsed: !frame.collapsed });
  },

  toggleNoise: (id) => {
    const frame = get().frames.find((f) => f.id === id);
    if (!frame) return;
    if (frame.type === 'noise' && frame.priorType) {
      get().updateFrame(id, { type: frame.priorType, priorType: undefined });
    } else if (frame.type !== 'noise') {
      get().updateFrame(id, { type: 'noise', priorType: frame.type });
    }
  },

  reorderFrames: (fromIndex, toIndex) => {
    const { frames } = get();
    if (toIndex < 0 || toIndex >= frames.length || fromIndex === toIndex) return;
    set((state) => {
      const newFrames = [...state.frames];
      const [moved] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, moved);
      return { frames: newFrames };
    });
    get().log({ op: 'reorder', fromIndex, toIndex });
    get().recomputePath();
  },

  moveFrame: (id, delta) => {
    const idx = get().frames.findIndex((f) => f.id === id);
    if (idx === -1) return;
    get().reorderFrames(idx, idx + delta);
  },

  mapCandidate: (frameId, nodeId) => {
    const frame = get().frames.find((f) => f.id === frameId);
    if (!frame) return;
    if (nodeId && (frame.rejected || []).includes(nodeId)) {
      get().showToast(`Candidate ${nodeId} is rejected for ${frameId} — restore it before mapping.`, 'error');
      return;
    }
    set((state) => ({
      frames: state.frames.map((f) => (f.id === frameId ? { ...f, mappedNode: nodeId, pinned: nodeId } : f)),
    }));
    get().log({ op: nodeId ? 'map' : 'unmap', frameId, nodeId });
    get().recomputePath();
  },

  rejectCandidate: (frameId, nodeId) => {
    const frame = get().frames.find((f) => f.id === frameId);
    if (!frame) return;
    const rejected = frame.rejected || [];
    const nowRejected = !rejected.includes(nodeId);
    set((state) => ({
      frames: state.frames.map((f) => {
        if (f.id !== frameId) return f;
        const next = {
          ...f,
          rejected: nowRejected ? [...rejected, nodeId] : rejected.filter((r) => r !== nodeId),
        };
        if (nowRejected && f.mappedNode === nodeId) {
          next.mappedNode = null;
          next.pinned = null;
        }
        return next;
      }),
    }));
    get().log({ op: nowRejected ? 'reject' : 'unreject', frameId, nodeId });
    get().recomputePath();
  },

  recomputePath: () => {
    const { frames, graph } = get();
    const { path, valid, contradictions, unresolved } = computePath(frames, graph.edges);
    const minimalLocus = valid && path.length > 0 ? computeMinimalLocus(frames) : null;
    set({ path, valid, contradictions, unresolved, minimalLocus });
  },

  setScrubIndex: (scrubIndex) => set({ scrubIndex }),

  scrubBy: (delta) => {
    const { frames, scrubIndex } = get();
    const mapped = frames.filter((f) => f.mappedNode && !f.collapsed && f.type === 'frame');
    if (mapped.length === 0) return;
    const next = scrubIndex === null ? (delta > 0 ? 0 : mapped.length - 1) : Math.min(mapped.length - 1, Math.max(0, scrubIndex + delta));
    set({ scrubIndex: next });
  },

  saveHypothesis: (name) => {
    const state = get();
    if (state.hypotheses.length >= 2) {
      state.showToast('Hypothesis limit reached — the workbench compares at most two. Delete one first.', 'error');
      return false;
    }
    const hyp = {
      id: Date.now().toString(),
      name,
      frames: state.frames,
      path: state.path,
      valid: state.valid,
      contradictions: state.contradictions,
    };
    set({ hypotheses: [...state.hypotheses, hyp], activeHypothesisId: hyp.id });
    get().log({ op: 'save_hypothesis', id: hyp.id, name });
    get().showToast(`Hypothesis "${name}" saved.`, 'success');
    return true;
  },

  loadHypothesis: (id) => {
    set((state) => {
      const hyp = state.hypotheses.find((h) => h.id === id);
      if (!hyp) return state;
      return {
        activeHypothesisId: id,
        frames: hyp.frames,
      };
    });
    get().log({ op: 'load_hypothesis', id });
    get().recomputePath();
  },

  deleteHypothesis: (id) => {
    set((state) => ({
      hypotheses: state.hypotheses.filter((h) => h.id !== id),
      activeHypothesisId: state.activeHypothesisId === id ? null : state.activeHypothesisId,
      compareOpen: state.hypotheses.length - 1 >= 2 ? state.compareOpen : false,
    }));
    get().log({ op: 'delete_hypothesis', id });
    get().showToast('Hypothesis deleted.');
  },

  toggleCompare: () => {
    const state = get();
    if (!state.compareOpen && state.hypotheses.length < 2) {
      state.showToast('Save two hypotheses to compare them side by side.', 'error');
      return;
    }
    set({ compareOpen: !state.compareOpen });
  },

  addAnnotation: ({ targetType, targetId, text }) => {
    const ann = { id: `a${Date.now()}`, targetType, targetId, text, createdAt: new Date().toISOString() };
    set((state) => ({ annotations: [...state.annotations, ann] }));
    get().log({ op: 'annotate', targetType, targetId });
    get().showToast('Annotation added.', 'success');
  },

  deleteAnnotation: (id) => {
    set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) }));
  },

  select: (selection) => set({ selection }),
  setFocus: (focus) => set({ focus }),

  toggleReduceMotion: () => set((s) => ({ reduceMotion: !s.reduceMotion })),
  toggleContrast: () => set((s) => ({ highContrast: !s.highContrast })),
  setFontScale: (fontScale) => set({ fontScale: Math.min(1.25, Math.max(0.85, fontScale)) }),
  setEditorOpen: (editorOpen) => set({ editorOpen }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  dismissOnboarding: () => set({ onboardingOpen: false }),
  restartOnboarding: () => set({ onboardingOpen: true, onboardingStep: 0 }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

  importSession: (data) => {
    if (!data || typeof data !== 'object') throw new Error('Import payload must be a StackPathHypothesisPack object.');
    const next = {};
    if (typeof data.rawTraceText === 'string') next.rawTrace = data.rawTraceText;
    if (typeof data.rawTrace?.text === 'string') next.rawTrace = data.rawTrace.text;
    if (Array.isArray(data.frames)) next.frames = data.frames;
    if (Array.isArray(data.hypotheses)) next.hypotheses = data.hypotheses;
    if (Array.isArray(data.annotations)) next.annotations = data.annotations;
    if (Array.isArray(data.history)) next.history = data.history;
    if (data.viewport && typeof data.viewport === 'object') next.viewport = data.viewport;
    if ('selection' in data) next.selection = data.selection;
    if (!next.frames && !next.rawTrace) throw new Error('Import payload has neither frames nor a raw trace.');
    if (!next.frames && next.rawTrace) next.frames = parseTrace(next.rawTrace);
    set(next);
    get().recomputePath();
    get().showToast('Session imported — state restored.', 'success');
  },
}));
