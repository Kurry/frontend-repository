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

const restoreSnapshot = (saved) => ({ ...clone(saved), selectedRange: null, annotationComposerOpen: false, threadOpenId: null });

function toast(message, kind = 'success') {
  return { id: `${Date.now()}-${Math.random()}`, message, kind };
}

function activePrompt(state) {
  return state.prompts.find((prompt) => prompt.id === state.selectedPromptId);
}

function createMergeSession(prompt) {
  if (!prompt?.branchConfig) return null;
  return {
    promptId: prompt.id,
    ...clone(prompt.branchConfig),
    regions: prompt.branchConfig.regions.map((region) => ({ ...clone(region), resolution: null, manualText: null })),
  };
}

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
  annotations: cloneSeedAnnotations(),
  selectedRange: null,
  annotationComposerOpen: false,
  threadOpenId: null,
  historySelection: {},
  mergedHeads: {},
  restoreDialog: null,
  exportOpen: false,
  exportTab: 'history',
  importOpen: false,
  importDraft: '',
  importError: '',
  sidebarOpen: false,
  mobilePane: 'base',
  toasts: [],
  liveMessage: '',
  undoStack: [],
  redoStack: [],
  newNodeId: null,

  selectPrompt: (promptId) => set((state) => {
    const prompt = state.prompts.find((item) => item.id === promptId);
    if (!prompt) return {};
    const sorted = [...prompt.versions].sort((a, b) => a.versionNumber - b.versionNumber);
    const compare = sorted.at(-1);
    const base = sorted.at(-2) || compare;
    return {
      selectedPromptId: promptId, baseVersionId: base.versionId, compareVersionId: compare.versionId,
      mergeSession: createMergeSession(prompt), promptQuery: '', globalSearchQuery: '', selectedRange: null,
      threadOpenId: null, sidebarOpen: false,
    };
  }),
  setBaseVersion: (versionId) => set({ baseVersionId: versionId, selectedRange: null }),
  setCompareVersion: (versionId) => set({ compareVersionId: versionId, selectedRange: null }),
  setActiveMode: (mode) => set((state) => {
    const prompt = activePrompt(state);
    return { activeMode: mode, mergeSession: mode === 'compare-branches' && (!state.mergeSession || state.mergeSession.promptId !== prompt?.id) ? createMergeSession(prompt) : state.mergeSession, selectedRange: null };
  }),
  setDiffView: (diffView) => set({ diffView }),
  setIgnoreWhitespace: (ignoreWhitespace) => set({ ignoreWhitespace }),
  setIgnoreCase: (ignoreCase) => set({ ignoreCase }),
  setPromptQuery: (promptQuery) => set({ promptQuery }),
  setGlobalSearchQuery: (globalSearchQuery) => set({ globalSearchQuery }),
  setSelectedRange: (selectedRange) => set({ selectedRange }),
  setAnnotationComposerOpen: (annotationComposerOpen) => set({ annotationComposerOpen }),
  setThreadOpen: (threadOpenId) => set({ threadOpenId }),
  setRestoreDialog: (restoreDialog) => set({ restoreDialog }),
  setExportOpen: (exportOpen) => set({ exportOpen, importOpen: false, importError: '' }),
  setExportTab: (exportTab) => set({ exportTab }),
  setImportOpen: (importOpen) => set({ importOpen, importError: '' }),
  setImportDraft: (importDraft) => set({ importDraft, importError: '' }),
  setImportError: (importError) => set({ importError }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobilePane: (mobilePane) => set({ mobilePane }),
  setMergeFlowOpen: (mergeFlowOpen) => set({ mergeFlowOpen }),
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

  resolveMergeRegion: (regionId, resolution, manualText = null) => set((state) => {
    if (!state.mergeSession) return {};
    const existing = state.mergeSession.regions.find((region) => region.regionId === regionId);
    const nextManualText = resolution === 'edit-manually' ? String(manualText ?? '') : null;
    if (existing?.resolution === resolution && existing?.manualText === nextManualText) return {};
    const undoStack = [...state.undoStack, snapshot(state)].slice(-50);
    return {
      undoStack, redoStack: [],
      mergeSession: { ...state.mergeSession, regions: state.mergeSession.regions.map((region) => region.regionId === regionId ? { ...region, resolution, manualText: nextManualText } : region) },
    };
  }),
  setManualMergeText: (regionId, manualText) => set((state) => {
    if (!state.mergeSession) return {};
    const undoStack = [...state.undoStack, snapshot(state)].slice(-50);
    return {
      undoStack, redoStack: [],
      mergeSession: { ...state.mergeSession, regions: state.mergeSession.regions.map((region) => region.regionId === regionId ? { ...region, resolution: 'edit-manually', manualText } : region) },
    };
  }),
  bulkResolveMerge: (side) => set((state) => {
    if (!state.mergeSession) return {};
    const resolution = side === 'left' ? 'choose-left' : 'choose-right';
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      mergeSession: { ...state.mergeSession, regions: state.mergeSession.regions.map((region) => region.resolution ? region : { ...region, resolution, manualText: null }) },
    };
  }),

  completeMerge: () => set((state) => {
    const session = state.mergeSession;
    if (!session || session.regions.some((region) => !region.resolution)) return {};
    const prompt = activePrompt(state);
    if (!prompt || prompt.id !== session.promptId) return {};
    const base = prompt.versions.find((version) => version.versionId === session.baseVersionId);
    const left = prompt.versions.find((version) => version.versionId === session.leftBranchVersionId);
    const right = prompt.versions.find((version) => version.versionId === session.rightBranchVersionId);
    if (!base || !left || !right) return {};
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
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [], prompts: nextPrompts,
      compareVersionId: versionId, baseVersionId: left.versionId, activeMode: 'diff', mergeSession: null, mergeFlowOpen: false,
      mergedHeads: { ...state.mergedHeads, [prompt.id]: { mergeVersionId: versionId, leftBranchVersionId: left.versionId, rightBranchVersionId: right.versionId, resolutions } },
      historySelection: { ...state.historySelection, [prompt.id]: [] },
      toasts: [...state.toasts, toast(message)], liveMessage: message, newNodeId: versionId,
    };
  }),

  restoreVersion: (sourceVersionId, changeNote) => set((state) => {
    const prompt = activePrompt(state);
    const source = prompt?.versions.find((version) => version.versionId === sourceVersionId);
    if (!prompt || !source) return {};
    const versionNumber = Math.max(...prompt.versions.map((version) => version.versionNumber)) + 1;
    const versionId = `${prompt.id}-restore-${Date.now()}`;
    const currentHead = [...prompt.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
    const restored = {
      versionId, versionNumber, author: 'Iona Vale', timestamp: new Date().toISOString(), changeNote,
      text: source.text, kind: 'restore', parentIds: currentHead ? [currentHead.versionId] : [],
    };
    const message = `Restored v${source.versionNumber} as new head v${versionNumber}.`;
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      prompts: state.prompts.map((item) => item.id === prompt.id ? { ...item, versions: [...item.versions, restored] } : item),
      compareVersionId: versionId, restoreDialog: null, historySelection: { ...state.historySelection, [prompt.id]: [] },
      toasts: [...state.toasts, toast(message)], liveMessage: message, newNodeId: versionId,
    };
  }),

  postAnnotation: (payload) => set((state) => {
    const list = state.annotations[state.selectedPromptId] || [];
    const existing = list.find((item) => item.lineStart === payload.lineStart && item.lineEnd === payload.lineEnd);
    let next;
    let openId;
    if (existing) {
      openId = existing.annotationId;
      next = list.map((item) => item.annotationId === existing.annotationId ? { ...item, replies: [...item.replies, { bodyMarkdown: payload.bodyMarkdown, author: payload.author }], resolved: false } : item);
    } else {
      const record = { annotationId: `ann-${Date.now()}`, ...payload, resolved: false, timestamp: new Date().toISOString(), replies: [] };
      openId = record.annotationId; next = [...list, record];
    }
    const message = `Annotation posted on lines ${payload.lineStart}–${payload.lineEnd}.`;
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      annotations: { ...state.annotations, [state.selectedPromptId]: next }, annotationComposerOpen: false,
      selectedRange: null, threadOpenId: openId, toasts: [...state.toasts, toast(message)], liveMessage: message,
    };
  }),
  replyToAnnotation: (annotationId, bodyMarkdown, author = 'Mara Sol') => set((state) => {
    const list = state.annotations[state.selectedPromptId] || [];
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      annotations: { ...state.annotations, [state.selectedPromptId]: list.map((item) => item.annotationId === annotationId ? { ...item, replies: [...item.replies, { bodyMarkdown, author }] } : item) },
      liveMessage: 'Reply posted.',
    };
  }),
  toggleAnnotationResolved: (annotationId) => set((state) => {
    const list = state.annotations[state.selectedPromptId] || [];
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [],
      annotations: { ...state.annotations, [state.selectedPromptId]: list.map((item) => item.annotationId === annotationId ? { ...item, resolved: !item.resolved } : item) },
    };
  }),

  importPackage: (packageData) => set((state) => {
    const index = state.prompts.findIndex((prompt) => prompt.id === state.selectedPromptId);
    if (index < 0) return {};
    const previous = state.prompts[index];
    const imported = {
      id: packageData.promptId, title: packageData.promptTitle,
      description: `Imported version package with ${packageData.versions.length} versions.`,
      versions: clone(packageData.versions),
    };
    const prompts = [...state.prompts]; prompts[index] = imported;
    const annotations = { ...state.annotations };
    delete annotations[previous.id]; annotations[imported.id] = clone(packageData.annotations).map((annotation) => ({ ...annotation, timestamp: new Date().toISOString() }));
    const mergedHeads = { ...state.mergedHeads };
    delete mergedHeads[previous.id];
    if (packageData.merge) mergedHeads[imported.id] = clone(packageData.merge);
    const message = `Imported ${packageData.versions.length} versions for ${packageData.promptTitle}.`;
    return {
      undoStack: [...state.undoStack, snapshot(state)].slice(-50), redoStack: [], prompts, annotations, mergedHeads,
      selectedPromptId: imported.id, baseVersionId: packageData.baseVersionId, compareVersionId: packageData.compareVersionId,
      historySelection: { ...state.historySelection, [imported.id]: [] }, mergeSession: null,
      importOpen: false, importDraft: '', importError: '', toasts: [...state.toasts, toast(message)], liveMessage: message,
    };
  }),

  undo: () => set((state) => {
    if (!state.undoStack.length) return {};
    const prior = state.undoStack[state.undoStack.length - 1];
    return { ...restoreSnapshot(prior), undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, snapshot(state)].slice(-50), toasts: [...state.toasts, toast('Last edit undone.', 'info')], liveMessage: 'Last edit undone.' };
  }),
  redo: () => set((state) => {
    if (!state.redoStack.length) return {};
    const next = state.redoStack[state.redoStack.length - 1];
    return { ...restoreSnapshot(next), redoStack: state.redoStack.slice(0, -1), undoStack: [...state.undoStack, snapshot(state)].slice(-50), toasts: [...state.toasts, toast('Edit reapplied.', 'info')], liveMessage: 'Edit reapplied.' };
  }),
}));

export const studioActions = () => useStudioStore.getState();
