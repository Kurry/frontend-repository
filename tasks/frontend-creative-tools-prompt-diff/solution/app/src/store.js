import { create } from 'zustand';
import { cloneSeedAnnotations, cloneSeedData } from './data.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const snapshot = (state) => clone({
  prompts: state.prompts,
  selectedPromptId: state.selectedPromptId,
  baseVersionId: state.baseVersionId,
  compareVersionId: state.compareVersionId,
  mergeSession: state.mergeSession,
  annotations: state.annotations,
  mergedHeads: state.mergedHeads,
  historySelection: state.historySelection,
  activeMode: state.activeMode,
  newNodeId: state.newNodeId,
});

const restoreSnapshot = (saved) => ({ ...clone(saved), selectedRange: null, annotationComposerOpen: false, mergeConfirmOpen: false, threadOpenId: null, threadCollapsed: false });

function toast(message, kind = 'success') {
  return { id: `${Date.now()}-${Math.random()}`, message, kind, leaving: false };
}

function activePrompt(state) {
  return state.prompts.find((prompt) => prompt.id === state.selectedPromptId);
}

export function createMergeSession(prompt) {
  if (!prompt?.branchConfig) return null;
  return {
    promptId: prompt.id,
    ...clone(prompt.branchConfig),
    regions: prompt.branchConfig.regions.map((region) => ({ ...clone(region), resolution: null, manualText: null })),
  };
}

const RESOLUTIONS = ['choose-left', 'choose-right', 'edit-manually'];

const initialPrompts = cloneSeedData();

export const useStudioStore = create((set, get) => ({
  prompts: initialPrompts,
  selectedPromptId: 'reply-editor',
  baseVersionId: 'reply-v3',
  compareVersionId: 'reply-v4',
  activeMode: 'diff',
  diffView: 'split',
  ignoreWhitespace: false,
  ignoreCase: false,
  promptQuery: '',
  globalSearchQuery: '',
  mergeSession: createMergeSession(initialPrompts[0]),
  mergeFlowOpen: false,
  mergeConfirmOpen: false,
  annotations: cloneSeedAnnotations(),
  selectedRange: null,
  annotationComposerOpen: false,
  threadOpenId: null,
  threadCollapsed: false,
  historySelection: {},
  mergedHeads: {},
  restoreDialog: null,
  exportOpen: false,
  exportTab: 'history',
  exportBusy: false,
  importOpen: false,
  importDraft: '',
  importError: '',
  importBusy: false,
  sidebarOpen: false,
  mobilePane: 'base',
  toasts: [],
  liveMessage: '',
  liveNonce: 0,
  undoStack: [],
  redoStack: [],
  newNodeId: null,
  prefs: { stampMode: 'relative', density: 'comfortable' },
  coachmarks: { studio: true, merge: true },
  shortcutsOpen: false,
  prefsOpen: false,

  announce: (message) => set((state) => ({ liveMessage: message, liveNonce: state.liveNonce + 1 })),
  pushToast: (message, kind = 'success') => set((state) => ({ toasts: [...state.toasts.slice(-3), toast(message, kind)] })),
  markToastLeaving: (id) => set((state) => ({ toasts: state.toasts.map((item) => item.id === id ? { ...item, leaving: true } : item) })),

  selectPrompt: (promptId) => set((state) => {
    const prompt = state.prompts.find((item) => item.id === promptId);
    if (!prompt) return {};
    const sorted = [...prompt.versions].sort((a, b) => a.versionNumber - b.versionNumber);
    const compare = sorted.at(-1);
    const base = sorted.at(-2) || compare;
    return {
      selectedPromptId: promptId, baseVersionId: base.versionId, compareVersionId: compare.versionId,
      mergeSession: createMergeSession(prompt), promptQuery: '', globalSearchQuery: '', selectedRange: null,
      threadOpenId: null, mergeConfirmOpen: false,
    };
  }),
  setBaseVersion: (versionId) => set({ baseVersionId: versionId, selectedRange: null }),
  setCompareVersion: (versionId) => set({ compareVersionId: versionId, selectedRange: null }),
  // Resolve a version that may belong to any prompt: switches prompts when
  // needed so picker selection always lands on a real, visible version.
  selectVersionAnywhere: (versionId, property) => {
    const state = get();
    for (const prompt of state.prompts) {
      const version = prompt.versions.find((item) => item.versionId === versionId);
      if (!version) continue;
      if (prompt.id !== state.selectedPromptId) {
        state.selectPrompt(prompt.id);
      }
      if (property === 'base-version') get().setBaseVersion(versionId);
      else get().setCompareVersion(versionId);
      return { ok: true, promptId: prompt.id, versionNumber: version.versionNumber };
    }
    return { ok: false, error: `versionId "${versionId}" does not match any saved version. Pass a versionId from the selected prompt's chain.` };
  },
  setActiveMode: (mode) => set((state) => {
    const prompt = activePrompt(state);
    return { activeMode: mode, mergeSession: mode === 'compare-branches' && (!state.mergeSession || state.mergeSession.promptId !== prompt?.id) ? createMergeSession(prompt) : state.mergeSession, selectedRange: null, mergeConfirmOpen: false };
  }),
  setDiffView: (diffView) => set({ diffView }),
  setIgnoreWhitespace: (ignoreWhitespace) => set({ ignoreWhitespace }),
  setIgnoreCase: (ignoreCase) => set({ ignoreCase }),
  setPromptQuery: (promptQuery) => set({ promptQuery }),
  setGlobalSearchQuery: (globalSearchQuery) => set({ globalSearchQuery }),
  setSelectedRange: (selectedRange) => set({ selectedRange }),
  setAnnotationComposerOpen: (annotationComposerOpen) => set({ annotationComposerOpen }),
  setThreadOpen: (threadOpenId) => set({ threadOpenId, threadCollapsed: false }),
  setThreadCollapsed: (threadCollapsed) => set({ threadCollapsed }),
  setRestoreDialog: (restoreDialog) => set({ restoreDialog }),
  setExportOpen: (exportOpen) => set({ exportOpen, importOpen: false, importError: '', exportBusy: false }),
  setExportTab: (exportTab) => set({ exportTab }),
  setExportBusy: (exportBusy) => set({ exportBusy }),
  setImportOpen: (importOpen) => set({ importOpen, importError: '' }),
  setImportDraft: (importDraft) => set({ importDraft, importError: '' }),
  setImportError: (importError) => set({ importError }),
  setImportBusy: (importBusy) => set({ importBusy }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobilePane: (mobilePane) => set({ mobilePane }),
  setMergeFlowOpen: (mergeFlowOpen) => set((state) => ({ mergeFlowOpen, mergeConfirmOpen: mergeFlowOpen ? false : state.mergeConfirmOpen })),
  setMergeConfirmOpen: (mergeConfirmOpen) => set({ mergeConfirmOpen }),
  setPrefs: (prefs) => set((state) => ({ prefs: { ...state.prefs, ...prefs } })),
  setCoachmark: (key, value) => set((state) => ({ coachmarks: { ...state.coachmarks, [key]: value } })),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setPrefsOpen: (prefsOpen) => set({ prefsOpen }),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),

  toggleHistorySelection: (versionId) => set((state) => {
    const current = new Set(state.historySelection[state.selectedPromptId] || []);
    const prompt = activePrompt(state);
    if (current.has(versionId)) {
      current.delete(versionId);
      prompt?.versions.filter((item) => item.kind === 'merge' && item.parentIds.includes(versionId)).forEach((merge) => current.delete(merge.versionId));
    } else current.add(versionId);
    const version = prompt?.versions.find((item) => item.versionId === versionId);
    if (version?.kind === 'merge' && current.has(versionId)) version.parentIds.forEach((parentId) => current.add(parentId));
    return { historySelection: { ...state.historySelection, [state.selectedPromptId]: [...current] } };
  }),

  ensureMergeSession: () => {
    const state = get();
    const prompt = activePrompt(state);
    if (!prompt?.branchConfig) return { ok: false, error: `The selected prompt "${prompt?.title || state.selectedPromptId}" has no seeded branches. Switch to "Context-aware reply editor" to run a merge.` };
    if (!state.mergeSession || state.mergeSession.promptId !== prompt.id) {
      set({ mergeSession: createMergeSession(prompt) });
    }
    return { ok: true };
  },

  resolveMergeRegion: (regionId, resolution, manualText = null) => {
    const state = get();
    if (!state.mergeSession) return { ok: false, error: 'No open merge session. Open Compare branches on a branched prompt first.' };
    if (!RESOLUTIONS.includes(resolution)) return { ok: false, error: `resolution must be one of choose-left, choose-right, edit-manually (got "${resolution}").` };
    const existing = state.mergeSession.regions.find((region) => region.regionId === regionId);
    if (!existing) return { ok: false, error: `regionId "${regionId}" is not a conflict region in the open merge session.` };
    const nextManualText = resolution === 'edit-manually' ? String(manualText ?? existing.manualText ?? existing.leftText) : null;
    if (existing.resolution === resolution && existing.manualText === nextManualText) return { ok: true, regionId, resolution, unchanged: true };
    set({
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      mergeSession: { ...state.mergeSession, regions: state.mergeSession.regions.map((region) => region.regionId === regionId ? { ...region, resolution, manualText: nextManualText } : region) },
    });
    return { ok: true, regionId, resolution };
  },
  setManualMergeText: (regionId, manualText) => {
    const state = get();
    if (!state.mergeSession) return { ok: false, error: 'No open merge session. Open Compare branches on a branched prompt first.' };
    const existing = state.mergeSession.regions.find((region) => region.regionId === regionId);
    if (!existing) return { ok: false, error: `regionId "${regionId}" is not a conflict region in the open merge session.` };
    set({
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      mergeSession: { ...state.mergeSession, regions: state.mergeSession.regions.map((region) => region.regionId === regionId ? { ...region, resolution: 'edit-manually', manualText: String(manualText ?? '') } : region) },
    });
    return { ok: true, regionId };
  },
  bulkResolveMerge: (side) => set((state) => {
    if (!state.mergeSession) return {};
    const resolution = side === 'left' ? 'choose-left' : 'choose-right';
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      mergeSession: { ...state.mergeSession, regions: state.mergeSession.regions.map((region) => region.resolution ? region : { ...region, resolution, manualText: null }) },
    };
  }),

  completeMerge: () => {
    const state = get();
    const session = state.mergeSession;
    if (!session) return { ok: false, error: 'No open merge session to complete. Open Compare branches on a branched prompt first.' };
    const unresolved = session.regions.filter((region) => !region.resolution).length;
    if (unresolved > 0) return { ok: false, error: `Complete merge stays unavailable until every conflict region is resolved — ${unresolved} of ${session.regions.length} regions still unresolved.` };
    const prompt = activePrompt(state);
    if (!prompt || prompt.id !== session.promptId) return { ok: false, error: 'The merge session belongs to a different prompt. Reopen Compare branches on the merged prompt.' };
    const base = prompt.versions.find((version) => version.versionId === session.baseVersionId);
    const left = prompt.versions.find((version) => version.versionId === session.leftBranchVersionId);
    const right = prompt.versions.find((version) => version.versionId === session.rightBranchVersionId);
    if (!base || !left || !right) return { ok: false, error: 'The merge session references missing versions.' };
    const lines = base.text.split('\n');
    const resolutions = session.regions.map((region) => {
      const manualText = region.resolution === 'edit-manually' ? String(region.manualText ?? '') : null;
      const chosen = region.resolution === 'choose-left' ? region.leftText : region.resolution === 'choose-right' ? region.rightText : manualText;
      lines[region.lineStart - 1] = chosen;
      return { regionId: region.regionId, resolution: region.resolution, ...(region.resolution === 'edit-manually' ? { manualText } : {}) };
    });
    const versionNumber = Math.max(...prompt.versions.map((version) => version.versionNumber)) + 1;
    const versionId = `${prompt.id}-merge-${Date.now()}`;
    const mergedVersion = {
      versionId, versionNumber, author: 'Mara Sol', timestamp: new Date().toISOString(),
      changeNote: `Merged v${left.versionNumber} and v${right.versionNumber} with region-level review.`,
      text: lines.join('\n'), kind: 'merge', parentIds: [left.versionId, right.versionId],
    };
    const nextPrompts = state.prompts.map((item) => item.id === prompt.id ? { ...item, versions: [...item.versions, mergedVersion] } : item);
    const message = `Merge complete — v${versionNumber} is now the head version.`;
    set({
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [], prompts: nextPrompts,
      compareVersionId: versionId, baseVersionId: left.versionId, activeMode: 'diff', mergeSession: null, mergeFlowOpen: false, mergeConfirmOpen: false,
      mergedHeads: { ...state.mergedHeads, [prompt.id]: { mergeVersionId: versionId, leftBranchVersionId: left.versionId, rightBranchVersionId: right.versionId, resolutions } },
      historySelection: { ...state.historySelection, [prompt.id]: [] },
      toasts: [...state.toasts.slice(-3), toast(message)], liveMessage: message, liveNonce: state.liveNonce + 1, newNodeId: versionId,
    });
    return { ok: true, versionId, versionNumber, changeNote: mergedVersion.changeNote };
  },

  restoreVersion: (sourceVersionId, changeNote) => {
    const state = get();
    const prompt = activePrompt(state);
    const source = prompt?.versions.find((version) => version.versionId === sourceVersionId);
    if (!prompt || !source) return { ok: false, error: `sourceVersionId "${sourceVersionId}" is not a version of the selected prompt.` };
    const note = String(changeNote ?? '').trim();
    if (!note) return { ok: false, error: 'changeNote is required (1–200 characters) and must name the restore source version.' };
    if (note.length > 200) return { ok: false, error: 'changeNote must be 200 characters or fewer.' };
    if (!note.toLocaleLowerCase().includes(`v${source.versionNumber}`.toLocaleLowerCase())) return { ok: false, error: `changeNote must name restore source v${source.versionNumber}.` };
    const versionNumber = Math.max(...prompt.versions.map((version) => version.versionNumber)) + 1;
    const versionId = `${prompt.id}-restore-${Date.now()}`;
    const currentHead = [...prompt.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
    const restored = {
      versionId, versionNumber, author: 'Iona Vale', timestamp: new Date().toISOString(), changeNote: note,
      text: source.text, kind: 'restore', parentIds: currentHead ? [currentHead.versionId] : [],
    };
    const message = `Restored v${source.versionNumber} as new head v${versionNumber}.`;
    set({
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      prompts: state.prompts.map((item) => item.id === prompt.id ? { ...item, versions: [...item.versions, restored] } : item),
      compareVersionId: versionId, restoreDialog: null, historySelection: { ...state.historySelection, [prompt.id]: [] },
      toasts: [...state.toasts.slice(-3), toast(message)], liveMessage: message, liveNonce: state.liveNonce + 1, newNodeId: versionId,
    });
    return { ok: true, versionId, versionNumber };
  },

  postAnnotation: (payload) => {
    const state = get();
    const bodyMarkdown = String(payload.bodyMarkdown ?? '').trim();
    const author = String(payload.author ?? '').trim();
    const lineStart = Number(payload.lineStart);
    const lineEnd = Number(payload.lineEnd);
    if (!bodyMarkdown) return { ok: false, error: 'bodyMarkdown is required (1–4000 characters after trim).' };
    if (bodyMarkdown.length > 4000) return { ok: false, error: 'bodyMarkdown must be 4000 characters or fewer.' };
    if (!author) return { ok: false, error: 'author is required (1–80 characters).' };
    if (author.length > 80) return { ok: false, error: 'author must be 80 characters or fewer.' };
    if (!Number.isInteger(lineStart) || lineStart < 1) return { ok: false, error: 'lineStart must be an integer greater than or equal to 1.' };
    if (!Number.isInteger(lineEnd) || lineEnd < 1) return { ok: false, error: 'lineEnd must be an integer greater than or equal to 1.' };
    if (lineEnd < lineStart) return { ok: false, error: 'lineEnd must be greater than or equal to lineStart.' };
    const list = state.annotations[state.selectedPromptId] || [];
    const existing = list.find((item) => item.lineStart === lineStart && item.lineEnd === lineEnd);
    let next;
    let openId;
    if (existing) {
      openId = existing.annotationId;
      next = list.map((item) => item.annotationId === existing.annotationId ? { ...item, replies: [...item.replies, { bodyMarkdown, author }], resolved: false } : item);
    } else {
      const record = { annotationId: `ann-${Date.now()}`, bodyMarkdown, lineStart, lineEnd, author, resolved: false, timestamp: new Date().toISOString(), replies: [] };
      openId = record.annotationId; next = [...list, record];
    }
    const message = existing ? `Annotation added to the existing thread on lines ${lineStart}–${lineEnd}.` : `Annotation posted on lines ${lineStart}–${lineEnd}.`;
    set({
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      annotations: { ...state.annotations, [state.selectedPromptId]: next }, annotationComposerOpen: false,
      selectedRange: null, threadOpenId: openId, threadCollapsed: false,
      toasts: [...state.toasts.slice(-3), toast(message)], liveMessage: message, liveNonce: state.liveNonce + 1,
    });
    return { ok: true, annotationId: openId, extendedExisting: Boolean(existing), lineStart, lineEnd };
  },
  replyToAnnotation: (annotationId, bodyMarkdown, author = 'Mara Sol') => {
    const state = get();
    const list = state.annotations[state.selectedPromptId] || [];
    const thread = list.find((item) => item.annotationId === annotationId);
    const body = String(bodyMarkdown ?? '').trim();
    if (!thread) return { ok: false, error: `annotationId "${annotationId}" is not a thread on the selected prompt.` };
    if (!body) return { ok: false, error: 'bodyMarkdown is required (1–4000 characters after trim).' };
    if (body.length > 4000) return { ok: false, error: 'bodyMarkdown must be 4000 characters or fewer.' };
    set({
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      annotations: { ...state.annotations, [state.selectedPromptId]: list.map((item) => item.annotationId === annotationId ? { ...item, replies: [...item.replies, { bodyMarkdown: body, author: String(author).trim() || 'Mara Sol' }] } : item) },
      liveMessage: 'Reply posted.', liveNonce: state.liveNonce + 1,
    });
    return { ok: true, annotationId, replies: thread.replies.length + 1 };
  },
  toggleAnnotationResolved: (annotationId) => {
    const state = get();
    const list = state.annotations[state.selectedPromptId] || [];
    const thread = list.find((item) => item.annotationId === annotationId);
    if (!thread) return { ok: false, error: `annotationId "${annotationId}" is not a thread on the selected prompt.` };
    set({
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      annotations: { ...state.annotations, [state.selectedPromptId]: list.map((item) => item.annotationId === annotationId ? { ...item, resolved: !item.resolved } : item) },
      threadCollapsed: !thread.resolved,
      liveMessage: thread.resolved ? 'Thread reopened.' : 'Thread resolved.', liveNonce: state.liveNonce + 1,
    });
    return { ok: true, annotationId, resolved: !thread.resolved };
  },

  importPackage: (packageData) => set((state) => {
    const index = state.prompts.findIndex((prompt) => prompt.id === state.selectedPromptId);
    // Defensive: if the selected prompt vanished, clear the busy flag the import
    // form set so the UI never sticks on "Validating…" with a disabled submit.
    if (index < 0) return { importBusy: false, importError: 'Import aborted: the selected prompt is missing from the library. Reload the studio and retry.' };
    const previous = state.prompts[index];
    const imported = {
      id: packageData.promptId, title: packageData.promptTitle,
      description: `Imported version package with ${packageData.versions.length} versions.`,
      versions: clone(packageData.versions),
      branchConfig: previous.id === packageData.promptId ? previous.branchConfig : undefined,
    };
    const prompts = [...state.prompts]; prompts[index] = imported;
    const annotations = { ...state.annotations };
    delete annotations[previous.id]; annotations[imported.id] = clone(packageData.annotations).map((annotation) => ({ ...annotation, timestamp: new Date().toISOString() }));
    const mergedHeads = { ...state.mergedHeads };
    delete mergedHeads[previous.id];
    if (packageData.merge) mergedHeads[imported.id] = clone(packageData.merge);
    const message = `Imported ${packageData.versions.length} versions for “${packageData.promptTitle}”.`;
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [], prompts, annotations, mergedHeads,
      selectedPromptId: imported.id, baseVersionId: packageData.baseVersionId, compareVersionId: packageData.compareVersionId,
      historySelection: { ...state.historySelection, [imported.id]: [] }, mergeSession: null,
      importOpen: false, importDraft: '', importError: '', importBusy: false,
      toasts: [...state.toasts.slice(-3), toast(message)], liveMessage: message, liveNonce: state.liveNonce + 1,
    };
  }),

  undo: () => set((state) => {
    if (!state.undoStack.length) return {};
    const prior = state.undoStack[state.undoStack.length - 1];
    const message = 'Last edit undone.';
    return { ...restoreSnapshot(prior), undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, snapshot(state)].slice(-50), toasts: [...state.toasts.slice(-3), toast(message, 'info')], liveMessage: message, liveNonce: state.liveNonce + 1 };
  }),
  redo: () => set((state) => {
    if (!state.redoStack.length) return {};
    const next = state.redoStack[state.redoStack.length - 1];
    const message = 'Edit reapplied.';
    return { ...restoreSnapshot(next), redoStack: state.redoStack.slice(0, -1), undoStack: [...state.undoStack, snapshot(state)].slice(-50), toasts: [...state.toasts.slice(-3), toast(message, 'info')], liveMessage: message, liveNonce: state.liveNonce + 1 };
  }),
}));

export const studioActions = () => useStudioStore.getState();
