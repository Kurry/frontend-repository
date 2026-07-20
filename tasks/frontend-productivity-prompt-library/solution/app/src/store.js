import { create } from 'zustand';
import {
  ATTACHMENT_CATALOG,
  createSeedPrompts,
  librarySchema,
  promptRequestSchema,
  requestFromPrompt,
  summarizeChanges,
} from './models';


let returnFocusNode = null;
const saveFocus = () => { if (!returnFocusNode) returnFocusNode = document.activeElement; };
const restoreFocus = () => {
  if (returnFocusNode) {
    const node = returnFocusNode;
    returnFocusNode = null;
    setTimeout(() => node.focus(), 10);
  }
};

let idCounter = 100;
let toastTimer;
let copyTimer;

const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(idCounter += 1).toString(36)}`;

const showTimedToast = (set, toast) => {
  window.clearTimeout(toastTimer);
  set({ toast: { id: makeId('toast'), ...toast } });
  toastTimer = window.setTimeout(() => set({ toast: null }), 3600);
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

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTechniqueFilter: (techniqueFilter) => set({ techniqueFilter }),
  clearFilters: () => set({ searchQuery: '', techniqueFilter: 'all' }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setMobileActionsOpen: (mobileActionsOpen) => set({ mobileActionsOpen }),

  toggleSelected: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((selectedId) => selectedId !== id)
      : [...state.selectedIds, id],
  })),
  setSelected: (ids) => set({ selectedIds: [...new Set(ids)] }),
  clearSelection: () => set({ selectedIds: [] }),

  openModal: (activeModal) => { saveFocus(); set({ activeModal }); },
  closeModal: () => { set({ activeModal: null }); restoreFocus(); },
  openDetail: (detailPromptId) => { saveFocus(); set({ detailPromptId, sourceListPromptId: null }); },
  closeDetail: () => { set({ detailPromptId: null }); restoreFocus(); },
  openHistory: (historyPromptId) => { saveFocus(); set({ historyPromptId }); },
  closeHistory: () => { set({ historyPromptId: null }); restoreFocus(); },
  openSources: (sourceListPromptId) => { saveFocus(); set({ sourceListPromptId }); },
  closeSources: () => { set({ sourceListPromptId: null }); restoreFocus(); },

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
      activeModal: null,
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
      activeModal: null,
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
      activeModal: null,
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

  importLibrary: (rawPayload) => {
    const document = librarySchema.parse(typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload);
    const prompts = document.prompts.map((item) => {
      const data = promptRequestSchema.parse(item);
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
      activeModal: null,
      detailPromptId: null,
      historyPromptId: null,
    });
    showTimedToast(set, { kind: 'success', title: 'Library imported', subtitle: `${prompts.length} prompts restored from JSON.` });
    return prompts;
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
