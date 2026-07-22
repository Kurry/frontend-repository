import { create } from 'zustand';
import { Revision, Patch, Comment, Source, GlossaryTerm, Event } from './data';
import { normalizeText, tokenize, generateHash, generateTokenIds } from '../utils/text';

interface AppState {
  logicalClock: string;
  activeLabelId: string;
  revisions: Record<string, Revision>;
  currentRevisionId: string;
  patches: Record<string, Patch>;
  comments: Record<string, Comment>;
  sources: Record<string, Source>;
  glossary: Record<string, GlossaryTerm>;
  events: Record<string, Event>;

  // UI State
  activeFormatId: string;
  proofZoom: number;
  diffMode: 'split' | 'unified' | 'none';
  selectedTokens: string[];
  lineBrush: number | null;
  proofRenderer: 'svg' | 'canvas';

  // Rebase State
  rebaseWorkspace: {
    patchId: string;
    baseRevisionId: string;
    currentRevisionId: string;
  } | null;

  // Actions
  initialize: () => void;
  advanceClock: () => void;
  applyPatch: (patchId: string, customRange?: [number, number]) => void;
  cancelRebase: () => void;
  commitRebase: (resolution: 'keep' | 'apply' | 'compose', composedText?: string) => void;
  setFormat: (formatId: string) => void;
  setZoom: (zoom: number) => void;
  setBrush: (line: number | null) => void;
}

const initialText = "The workshop ledger records a first varnish that glimmered under borrowed lamps, though later entries suggest it faded.";
const initialTokens = tokenize(normalizeText(initialText));
const initialHash = generateHash(initialText);
const initialRev: Revision = {
  id: 'rev-07-a',
  tokens: generateTokenIds('rev-07-a', initialTokens).map((id, i) => ({ id, value: initialTokens[i] })),
  hash: initialHash,
};

export const useStore = create<AppState>((set, get) => ({
  logicalClock: '2042-06-14T09:00:00Z',
  activeLabelId: 'lbl-07',
  revisions: { 'rev-07-a': initialRev },
  currentRevisionId: 'rev-07-a',
  patches: {},
  comments: {},
  sources: {},
  glossary: {},
  events: {},

  activeFormatId: 'wall',
  proofZoom: 100,
  diffMode: 'none',
  selectedTokens: [],
  lineBrush: null,
  proofRenderer: 'svg',

  rebaseWorkspace: null,

  initialize: () => {
    set({
      patches: {
        'patch-17': {
          id: 'patch-17',
          baseRevisionId: 'rev-07-a',
          range: [18, 22],
          originalText: 'glimmered under borrowed lamps',
          replacementText: 'held a dull sheen beneath loaned lamps',
          editorId: 'ena',
          rationale: 'tone',
          sourceIds: ['src-04'],
          status: 'pending',
          expectedBaseHash: 'b95f17'
        },
        'patch-22': {
          id: 'patch-22',
          baseRevisionId: 'rev-07-a',
          range: [1, 4],
          originalText: 'workshop ledger records',
          replacementText: 'maker\'s ledger records',
          editorId: 'ena',
          rationale: 'accuracy',
          sourceIds: [],
          status: 'pending',
          expectedBaseHash: 'dd0722'
        }
      }
    });
  },

  advanceClock: () => set((state) => {
    const d = new Date(state.logicalClock);
    d.setSeconds(d.getSeconds() + 1);
    return { logicalClock: d.toISOString() };
  }),

  applyPatch: (patchId, _customRange) => {
    const state = get();
    const patch = state.patches[patchId];
    if (!patch) return;

    const currentRev = state.revisions[state.currentRevisionId];
    if (patch.baseRevisionId !== state.currentRevisionId && patch.expectedBaseHash !== currentRev.hash) {
      set({ rebaseWorkspace: { patchId, baseRevisionId: patch.baseRevisionId, currentRevisionId: state.currentRevisionId } });
      return;
    }

    const currentText = currentRev.tokens.map(t => t.value).join('');
    const newText = currentText.replace(patch.originalText, patch.replacementText);
    const newTokens = tokenize(normalizeText(newText));
    const newRevId = `rev-${Date.now()}`;
    const newRev: Revision = {
      id: newRevId,
      tokens: generateTokenIds(newRevId, newTokens).map((id, i) => ({ id, value: newTokens[i] })),
      hash: generateHash(newText)
    };

    const eventId = `evt-${Date.now()}`;
    const newEvent: Event = {
      id: eventId,
      logicalTime: state.logicalClock,
      actorId: patch.editorId,
      type: 'apply_patch',
      labelId: state.activeLabelId,
      baseRevisionId: currentRev.id,
      resultRevisionId: newRevId,
      patchId: patch.id,
      range: patch.range,
      beforeHash: currentRev.hash,
      afterHash: newRev.hash,
      resolution: null,
      parentEventIds: [currentRev.id],
      payload: {}
    };

    set((state) => ({
      revisions: { ...state.revisions, [newRevId]: newRev },
      currentRevisionId: newRevId,
      patches: { ...state.patches, [patchId]: { ...patch, status: 'accepted' } },
      events: { ...state.events, [eventId]: newEvent }
    }));
  },

  cancelRebase: () => set({ rebaseWorkspace: null }),

  commitRebase: (resolution, composedText) => {
    const state = get();
    const workspace = state.rebaseWorkspace;
    if (!workspace) return;

    const patch = state.patches[workspace.patchId];
    const currentRev = state.revisions[workspace.currentRevisionId];

    let newRevId = currentRev.id;
    let newRev = currentRev;

    if (resolution === 'apply' || resolution === 'compose') {
      const currentText = currentRev.tokens.map(t => t.value).join('');
      let newText = currentText;
      if (resolution === 'apply') {
        newText = currentText.replace(patch.originalText, patch.replacementText);
      } else if (resolution === 'compose' && composedText) {
        newText = currentText.replace("workshop ledger records a first varnish that glimmered", composedText);
        if (newText === currentText) {
            newText = composedText;
        }
      }

      const newTokens = tokenize(normalizeText(newText));
      newRevId = `rev-${Date.now()}`;
      newRev = {
        id: newRevId,
        tokens: generateTokenIds(newRevId, newTokens).map((id, i) => ({ id, value: newTokens[i] })),
        hash: generateHash(newText)
      };
    }

    const eventId = `evt-${Date.now()}`;
    const newEvent: Event = {
      id: eventId,
      logicalTime: state.logicalClock,
      actorId: 'editor',
      type: 'resolve_rebase',
      labelId: state.activeLabelId,
      baseRevisionId: currentRev.id,
      resultRevisionId: resolution === 'keep' ? currentRev.id : newRevId,
      patchId: patch.id,
      range: patch.range,
      beforeHash: currentRev.hash,
      afterHash: newRev.hash,
      resolution: resolution,
      parentEventIds: [currentRev.id, patch.baseRevisionId],
      payload: {}
    };

    set((state) => ({
      rebaseWorkspace: null,
      revisions: { ...state.revisions, [newRevId]: newRev },
      currentRevisionId: newRevId,
      events: { ...state.events, [eventId]: newEvent },
      patches: { ...state.patches, [patch.id]: { ...patch, status: resolution === 'keep' ? 'rejected' : 'accepted' } }
    }));
  },

  setFormat: (formatId) => set({ activeFormatId: formatId }),
  setZoom: (zoom) => set({ proofZoom: zoom }),
  setBrush: (line) => set({ lineBrush: line }),
}));
