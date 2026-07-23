import { create } from 'zustand';
import {
  ATTACHMENT_CATALOG,
  createSeedPrompts,
  librarySchema,
  promptRequestSchema,
  requestFromPrompt,
  summarizeChanges,
} from './models';

let idCounter = 100;
let toastTimer;
let toastExitTimer;
let copyTimer;

const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(idCounter += 1).toString(36)}`;

const showTimedToast = (set, toast) => {
  window.clearTimeout(toastTimer);
  window.clearTimeout(toastExitTimer);
  set({ toast: { id: makeId('toast'), exiting: false, ...toast } });
  toastTimer = window.setTimeout(() => {
    set((state) => ({ toast: state.toast ? { ...state.toast, exiting: true } : null }));
    toastExitTimer = window.setTimeout(() => set({ toast: null }), 220);
  }, 3600);
};

const attachmentFromFilename = (filename) => {
  const known = ATTACHMENT_CATALOG.find((item) => item.filename === filename);
  return known || {
    id: makeId('attachment'),
    filename,
    type: 'Document',
    kind: 'document',
    src: '',
    detail: 'Imported attachment reference',
  };
};

export const useLibraryStore = create((set, get) => ({
  prompts: createSeedPrompts(),
  searchQuery: '',
  techniqueFilter: 'all',
  selectedIds: [],
  activeModal: null,
  historyPromptId: null,
  detailPromptId: null,
  sourceListPromptId: null,
  copyFeedback: null,
  toast: null,
  exportFormat: 'json',
  mobileActionsOpen: false,
  newPromptId: null,
  sortColumn: 'created',
  sortDirection: 'desc',
  theme: 'light',
  density: 'comfortable',
  onboardingStep: 0,
  onboardingComplete: false,
  draftPrompt: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTechniqueFilter: (techniqueFilter) => set({ techniqueFilter }),
  clearFilters: () => set({ searchQuery: '', techniqueFilter: 'all' }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setMobileActionsOpen: (mobileActionsOpen) => set({ mobileActionsOpen }),
  setSort: (col) => set((state) => ({ sortColumn: col, sortDirection: state.sortColumn === col && state.sortDirection === 'asc' ? 'desc' : 'asc' })),
  setTheme: (theme) => set({ theme }),
  setDensity: (density) => set({ density }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  completeOnboarding: () => set({ onboardingComplete: true, onboardingStep: 0 }),
  setDraftPrompt: (draftPrompt) => set({ draftPrompt }),
  clearDraftPrompt: () => set({ draftPrompt: null }),

  toggleSelected: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((selectedId) => selectedId !== id)
      : [...state.selectedIds, id],
  })),
  setSelected: (ids) => set({ selectedIds: [...new Set(ids)] }),
  clearSelection: () => set({ selectedIds: [] }),

  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
  openDetail: (detailPromptId) => set({ detailPromptId, sourceListPromptId: null }),
  closeDetail: () => set({ detailPromptId: null }),
  openHistory: (historyPromptId) => set({ historyPromptId }),
  closeHistory: () => set({ historyPromptId: null }),
  openSources: (sourceListPromptId) => set({ sourceListPromptId }),
  closeSources: () => set({ sourceListPromptId: null }),

  createPrompt: (draft, options = {}) => {
    const data = promptRequestSchema.parse(draft);
    const created = new Date().toISOString();
    const id = makeId('prompt');
    const prompt = {
      id,
      ...data,
      created,
      version: 1,
      sources: options.sources || [],
      attachments: options.attachments || [],
      versions: [{ id: `${id}-v1`, version: 1, timestamp: created, summary: 'Initial version', data }],
    };
    set((state) => ({
      prompts: [prompt, ...state.prompts],
      selectedIds: [],
      newPromptId: id,
    }));
    window.setTimeout(() => set({ newPromptId: null }), 450);
    showTimedToast(set, { kind: 'success', title: options.toastTitle || 'Prompt created', subtitle: `“${data.title}” is now in your library.` });
    return prompt;
  },

  updatePrompt: (id, draft, attachments) => {
    const data = promptRequestSchema.parse(draft);
    let updated;
    set((state) => ({
      prompts: state.prompts.map((prompt) => {
        if (prompt.id !== id) return prompt;
        const version = prompt.version + 1;
        const timestamp = new Date().toISOString();
        updated = {
          ...prompt,
          ...data,
          attachments: attachments ?? prompt.attachments,
          version,
          versions: [
            { id: `${id}-v${version}-${Date.now()}`, version, timestamp, summary: summarizeChanges(requestFromPrompt(prompt), data), data },
            ...prompt.versions,
          ],
        };
        return updated;
      }),
    }));
    if (updated) showTimedToast(set, { kind: 'success', title: 'Prompt updated', subtitle: `Version ${updated.version} saved.` });
    return updated;
  },

  deletePrompt: (id) => {
    const prompt = get().prompts.find((item) => item.id === id);
    if (!prompt) return false;
    set((state) => ({
      prompts: state.prompts.filter((item) => item.id !== id),
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
      detailPromptId: state.detailPromptId === id ? null : state.detailPromptId,
      historyPromptId: state.historyPromptId === id ? null : state.historyPromptId,
    }));
    showTimedToast(set, { kind: 'success', title: 'Prompt deleted', subtitle: `“${prompt.title}” was removed.` });
    return true;
  },

  showAttachmentRemoved: (filename) => {
    showTimedToast(set, { kind: 'success', title: 'Attachment removed', subtitle: `${filename} will be removed when you save.` });
  },

  showCopyFeedback: (key, message = 'Copied to clipboard') => {
    window.clearTimeout(copyTimer);
    set({ copyFeedback: { key, message } });
    copyTimer = window.setTimeout(() => set({ copyFeedback: null }), 1800);
  },

  restoreVersionToEdit: (promptId, versionId) => {
    const prompt = get().prompts.find((item) => item.id === promptId);
    const version = prompt?.versions.find((item) => item.id === versionId);
    if (!prompt || !version) return;
    set({
      historyPromptId: null,
      activeModal: { type: 'edit', promptId, restoredData: version.data, restoredVersion: version.version },
    });
  },

  isLoading: false,
  importLibrary: async (rawPayload) => {
    set({ isLoading: true });
    try {
      await new Promise(r => setTimeout(r, 500));
      const document = librarySchema.parse(typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload);
      const prompts = document.prompts.map((item) => {
        // librarySchema already validates imported records, including the
        // intentionally preserved legacy seeded title allowance.
        const data = requestFromPrompt(item);
        return {
          id: item.id,
          ...data,
          created: item.created,
          version: item.version,
          sources: item.sources,
          attachments: item.attachments.map(attachmentFromFilename),
          versions: [{
            id: `${item.id}-v${item.version}-imported`,
            version: item.version,
            timestamp: document.generatedAt,
            summary: 'Imported library snapshot',
            data,
          }],
        };
      });
      set({
        prompts,
        selectedIds: [],
        searchQuery: '',
        techniqueFilter: 'all',
        detailPromptId: null,
        historyPromptId: null,
      });
      showTimedToast(set, { kind: 'success', title: 'Library imported', subtitle: `${prompts.length} prompts restored from JSON.` });
      return prompts;
    } finally {
      set({ isLoading: false });
    }
  },

  addPerformanceSample: () => {
    const source = get().prompts;
    if (!source.length) return 0;
    const additions = Array.from({ length: 120 }, (_, index) => {
      const original = source[index % source.length];
      const id = makeId('sample');
      const data = {
        ...requestFromPrompt(original),
        title: `Sample ${String(index + 1).padStart(3, '0')} · ${original.title}`.slice(0, 60),
      };
      const created = new Date(Date.now() - index * 1000).toISOString();
      return {
        ...original,
        ...data,
        id,
        created,
        version: 1,
        sources: [original.id],
        versions: [{ id: `${id}-v1`, version: 1, timestamp: created, summary: 'Performance sample', data }],
      };
    });
    set((state) => ({ prompts: [...state.prompts, ...additions] }));
    showTimedToast(set, { kind: 'success', title: 'Performance sample ready', subtitle: `${additions.length} prompts added without blocking the library.` });
    return additions.length;
  },
}));

export function selectVisiblePrompts(state) {
  const query = state.searchQuery.trim().toLocaleLowerCase();
  return state.prompts.filter((prompt) => {
    const matchesQuery = !query
      || prompt.title.toLocaleLowerCase().includes(query)
      || prompt.body.toLocaleLowerCase().includes(query);
    const matchesTechnique = state.techniqueFilter === 'all' || prompt.technique === state.techniqueFilter;
    return matchesQuery && matchesTechnique;
  }).sort((a, b) => {
    const valA = state.sortColumn === 'attachments' ? a.attachments.length : (a[state.sortColumn] || '');
    const valB = state.sortColumn === 'attachments' ? b.attachments.length : (b[state.sortColumn] || '');
    const factor = state.sortDirection === 'asc' ? 1 : -1;
    return valA > valB ? factor : (valA < valB ? -factor : 0);
  });
}

export function createExportDocument(prompts) {
  return {
    schemaVersion: 1,
    product: 'Prompt Library',
    prompts: prompts.map((prompt) => ({
      ...requestFromPrompt(prompt),
      id: prompt.id,
      created: prompt.created,
      version: prompt.version,
      sources: [...prompt.sources],
      attachments: prompt.attachments.map((attachment) => attachment.filename),
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function createMarkdownPackage(prompts) {
  const lines = ['# Prompt Library', '', `Generated: ${new Date().toISOString()}`, ''];
  prompts.forEach((prompt) => {
    lines.push(`## ${prompt.title}`, '');
    lines.push(`- Technique: ${prompt.technique}`);
    lines.push(`- Version: ${prompt.version}`);
    if (prompt.description) lines.push(`- Description: ${prompt.description}`);
    if (prompt.sources.length) lines.push(`- Sources: ${prompt.sources.join(', ')}`);
    if (prompt.attachments.length) lines.push(`- Attachments: ${prompt.attachments.map((item) => item.filename).join(', ')}`);
    lines.push('', '```text', prompt.body, '```', '');
  });
  return lines.join('\n');
}
