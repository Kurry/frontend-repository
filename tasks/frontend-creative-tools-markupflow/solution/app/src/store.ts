import { createStore, reconcile } from 'solid-js/store';
import { createSignal } from 'solid-js';

export type ToolType = 
  | 'select'
  | 'rectangle' 
  | 'oval' 
  | 'line' 
  | 'arrow' 
  | 'text' 
  | 'blur' 
  | 'pixelate' 
  | 'spotlight' 
  | 'loupe' 
  | 'highlighter';

export type TextStyle = 'plain' | 'bold-caption' | 'outline' | 'highlight-box' | 'shadow';
export type StrokeWidth = 'thin' | 'medium' | 'thick';

export interface Annotation {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: StrokeWidth;
  text?: string;
  textStyle?: TextStyle;
  fontSize?: number;
  loupeZoom?: number;
  highlightColor?: string;
  blurRadius?: number;
  pixelSize?: number;
  // For loupe - center point
  cx?: number;
  cy?: number;
  // For text editing
  editing?: boolean;
}

export interface SavedProject {
  id: string;
  name: string;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  annotations: Annotation[];
  updatedAt: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  // Annotation state immediately after this entry's action, so the entry can be restored.
  annotationsSnapshot: Annotation[];
}

export interface VersionSnapshot {
  id: string;
  name: string;
  timestamp: number;
  annotations: Annotation[];
}

export interface AppState {
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  annotations: Annotation[];
  activeTool: ToolType;
  activeColor: string;
  activeStrokeWidth: StrokeWidth;
  activeTextStyle: TextStyle;
  activeFontSize: number;
  copiedStyleBuffer: { color: string; strokeWidth: StrokeWidth } | null;
  undoStack: Annotation[][];
  redoStack: Annotation[][];
  history: HistoryEntry[];
  versions: VersionSnapshot[];
  selectedAnnotationId: string | null;
  isOffline: boolean;
  offlineQueue: { action: string; data: any }[];
  collaborationState: 'online' | 'offline' | 'syncing';
  savedProjects: SavedProject[];
  compareMode: boolean;
  viewMode: 'edit' | 'preview';
  sharedContent: string;
  remoteContent: string;
  sharedContentMerged: string;
  mergeConflict: { local: string; remote: string } | null;
}

const STORAGE_KEY = 'markupflow-state';

function generateId(): string {
  return 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function safeGetLocalStorage(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic validation
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return null;
  }
}

function safeSetLocalStorage(state: Partial<AppState>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

const savedState = safeGetLocalStorage();

const defaultAnnotations: Annotation[] = [];

const [state, setState] = createStore<AppState>({
  imageDataUrl: savedState?.imageDataUrl ?? null,
  imageWidth: savedState?.imageWidth ?? 0,
  imageHeight: savedState?.imageHeight ?? 0,
  annotations: savedState?.annotations ?? defaultAnnotations,
  activeTool: 'rectangle',
  activeColor: '#FF0000',
  activeStrokeWidth: 'medium',
  activeTextStyle: 'plain',
  activeFontSize: 16,
  copiedStyleBuffer: null,
  undoStack: [],
  redoStack: [],
  history: [],
  versions: savedState?.versions ?? [],
  selectedAnnotationId: null,
  isOffline: false,
  offlineQueue: [],
  collaborationState: 'online',
  savedProjects: savedState?.savedProjects ?? [],
  compareMode: false,
  viewMode: (savedState?.viewMode === 'preview' || savedState?.viewMode === 'edit') ? savedState.viewMode : 'edit',
  sharedContent: savedState?.sharedContent ?? '',
  remoteContent: savedState?.remoteContent ?? '',
  sharedContentMerged: savedState?.sharedContentMerged ?? '',
  mergeConflict: null,
});

// Save to localStorage whenever relevant state changes
function persistState() {
  safeSetLocalStorage({
    imageDataUrl: state.imageDataUrl,
    imageWidth: state.imageWidth,
    imageHeight: state.imageHeight,
    annotations: state.annotations,
    savedProjects: state.savedProjects,
    versions: state.versions,
    sharedContent: state.sharedContent,
    remoteContent: state.remoteContent,
    sharedContentMerged: state.sharedContentMerged,
    viewMode: state.viewMode,
  });
}

export function useAppStore() {
  return {
    state,
    setState,
    generateId,
    persistState,
    
    pushHistory(action: string) {
      // Captured after the caller has already applied its mutation, so this is the
      // resulting annotation state — what restoreHistoryEntry() rewinds back to.
      const annotationsSnapshot = state.annotations.map(a => ({ ...a }));
      setState('history', prev => [{ id: generateId(), timestamp: Date.now(), action, annotationsSnapshot }, ...prev]);
    },

    setImage(imageDataUrl: string, width: number, height: number) {
      setState('imageDataUrl', imageDataUrl);
      setState('imageWidth', width);
      setState('imageHeight', height);
      setState('annotations', []);
      setState('undoStack', []);
      setState('redoStack', []);
      this.pushHistory('Image loaded');
      persistState();
    },
    
    setActiveTool(tool: ToolType) {
      setState('activeTool', tool);
    },
    
    setActiveColor(color: string) {
      setState('activeColor', color);
    },
    
    setActiveStrokeWidth(width: StrokeWidth) {
      setState('activeStrokeWidth', width);
    },
    
    setActiveTextStyle(style: TextStyle) {
      setState('activeTextStyle', style);
    },
    
    setActiveFontSize(size: number) {
      setState('activeFontSize', size);
    },
    
    addAnnotation(annotation: Annotation) {
      const snapshot = [...state.annotations];
      setState('undoStack', prev => [...prev, snapshot]);
      setState('redoStack', []);
      setState('annotations', prev => [...prev, annotation]);
      this.pushHistory(`${annotation.type} annotation added`);
      persistState();
    },
    
    updateAnnotation(id: string, updates: Partial<Annotation>, recordHistory = true) {
      if (recordHistory) {
        const snapshot = [...state.annotations];
        setState('undoStack', prev => [...prev, snapshot]);
        setState('redoStack', []);
      }
      setState('annotations', (ann) => ann.map(a => a.id === id ? { ...a, ...updates } : a));
      if (recordHistory) this.pushHistory('Annotation updated');
      persistState();
    },
    
    deleteAnnotation(id: string) {
      const snapshot = [...state.annotations];
      const annotation = state.annotations.find(a => a.id === id);
      setState('undoStack', prev => [...prev, snapshot]);
      setState('redoStack', []);
      setState('annotations', prev => prev.filter(a => a.id !== id));
      if (state.selectedAnnotationId === id) {
        setState('selectedAnnotationId', null);
      }
      if (annotation) this.pushHistory(`${annotation.type} annotation deleted`);
      persistState();
    },
    
    reorderAnnotations(fromIndex: number, toIndex: number) {
      const snapshot = [...state.annotations];
      setState('undoStack', prev => [...prev, snapshot]);
      setState('redoStack', []);
      
      const newAnnotations = [...state.annotations];
      const [moved] = newAnnotations.splice(fromIndex, 1);
      newAnnotations.splice(toIndex, 0, moved);
      setState('annotations', newAnnotations);
      this.pushHistory('Layer order changed');
      persistState();
    },
    
    setSelectedAnnotation(id: string | null) {
      setState('selectedAnnotationId', id);
    },

    setViewMode(mode: 'edit' | 'preview') {
      setState('viewMode', mode);
      persistState();
    },
    
    undo() {
      if (state.undoStack.length === 0) return;
      const currentSnapshot = [...state.annotations];
      const prevSnapshot = state.undoStack[state.undoStack.length - 1];
      setState('undoStack', prev => prev.slice(0, -1));
      setState('redoStack', prev => [...prev, currentSnapshot]);
      setState('annotations', reconcile(prevSnapshot));
      this.pushHistory('Undo performed');
      persistState();
    },
    
    redo() {
      if (state.redoStack.length === 0) return;
      const currentSnapshot = [...state.annotations];
      const nextSnapshot = state.redoStack[state.redoStack.length - 1];
      setState('redoStack', prev => prev.slice(0, -1));
      setState('undoStack', prev => [...prev, currentSnapshot]);
      setState('annotations', reconcile(nextSnapshot));
      this.pushHistory('Redo performed');
      persistState();
    },
    
    // Collaboration methods
    goOffline() {
      setState('isOffline', true);
      setState('collaborationState', 'offline');
      setState('offlineQueue', []);
    },
    
    goOnline() {
      setState('isOffline', false);
      setState('collaborationState', 'syncing');
      // Process offline queue
      const queue = state.offlineQueue;
      setState('offlineQueue', []);
      setState('collaborationState', 'online');
    },
    
    queueOfflineAction(action: string, data: any) {
      setState('offlineQueue', prev => [...prev, { action, data }]);
    },
    
    clearState() {
      setState('imageDataUrl', null);
      setState('imageWidth', 0);
      setState('imageHeight', 0);
      setState('annotations', []);
      setState('undoStack', []);
      setState('redoStack', []);
      setState('selectedAnnotationId', null);
      setState('compareMode', false);
      persistState();
    },

    saveProject(name: string) {
      const cleanName = name.trim();
      if (!cleanName || !state.imageDataUrl) return false;
      const existing = state.savedProjects.find(project => project.name.toLowerCase() === cleanName.toLowerCase());
      const project: SavedProject = {
        id: existing?.id ?? generateId(),
        name: cleanName,
        imageDataUrl: state.imageDataUrl,
        imageWidth: state.imageWidth,
        imageHeight: state.imageHeight,
        annotations: state.annotations.map(annotation => ({ ...annotation })),
        updatedAt: Date.now(),
      };
      setState('savedProjects', projects => existing
        ? projects.map(saved => saved.id === existing.id ? project : saved)
        : [...projects, project]);
      persistState();
      return true;
    },

    loadProject(id: string) {
      const project = state.savedProjects.find(saved => saved.id === id);
      if (!project) return false;
      setState('imageDataUrl', project.imageDataUrl);
      setState('imageWidth', project.imageWidth);
      setState('imageHeight', project.imageHeight);
      setState('annotations', project.annotations.map(annotation => ({ ...annotation })));
      setState('undoStack', []);
      setState('redoStack', []);
      setState('selectedAnnotationId', null);
      persistState();
      return true;
    },

    deleteProject(id: string) {
      setState('savedProjects', projects => projects.filter(project => project.id !== id));
      persistState();
    },

    saveSnapshot(name: string) {
      if (!name.trim()) return false;
      const snapshot: VersionSnapshot = {
        id: generateId(),
        name: name.trim(),
        timestamp: Date.now(),
        annotations: state.annotations.map(a => ({ ...a })),
      };
      setState('versions', prev => [...prev, snapshot]);
      this.pushHistory('Snapshot saved');
      persistState();
      return true;
    },

    restoreSnapshot(id: string) {
      const snapshot = state.versions.find(v => v.id === id);
      if (!snapshot) return false;

      const currentSnapshot = [...state.annotations];
      setState('undoStack', prev => [...prev, currentSnapshot]);
      setState('redoStack', []);

      setState('annotations', snapshot.annotations.map(a => ({ ...a })));
      this.pushHistory('Snapshot restored');
      persistState();
      return true;
    },

    // History is newest-first (unshift), so entries before `idx` are newer than the
    // clicked entry and entries after `idx` are older. Rebuild undo/redo so Undo
    // steps back through the older entries and Redo steps forward through the
    // newer ones that were just rewound past — both stacks are popped from the end.
    restoreHistoryEntry(id: string) {
      const idx = state.history.findIndex(entry => entry.id === id);
      if (idx === -1) return false;
      const entry = state.history[idx];

      const newerSnapshots = state.history.slice(0, idx).map(e => e.annotationsSnapshot.map(a => ({ ...a })));
      const olderSnapshots = state.history.slice(idx + 1).map(e => e.annotationsSnapshot.map(a => ({ ...a })));

      setState('redoStack', newerSnapshots);
      setState('undoStack', [...olderSnapshots].reverse());
      setState('annotations', entry.annotationsSnapshot.map(a => ({ ...a })));
      if (state.selectedAnnotationId && !entry.annotationsSnapshot.some(a => a.id === state.selectedAnnotationId)) {
        setState('selectedAnnotationId', null);
      }
      this.pushHistory('History entry restored');
      persistState();
      return true;
    },

    deleteSnapshot(id: string) {
      setState('versions', versions => versions.filter(v => v.id !== id));
      persistState();
    },

    setAnnotations(annotations: Annotation[]) {
      const currentSnapshot = [...state.annotations];
      setState('undoStack', prev => [...prev, currentSnapshot]);
      setState('redoStack', []);
      setState('annotations', annotations);
      this.pushHistory('Annotations replaced');
      persistState();
    },

    copyStyle() {
      const selected = state.annotations.find(a => a.id === state.selectedAnnotationId);
      if (selected) {
        setState('copiedStyleBuffer', {
          color: selected.color,
          strokeWidth: selected.strokeWidth
        });
      }
    },

    pasteStyle() {
      const selected = state.annotations.find(a => a.id === state.selectedAnnotationId);
      if (selected && state.copiedStyleBuffer) {
        this.updateAnnotation(selected.id, {
          color: state.copiedStyleBuffer.color,
          strokeWidth: state.copiedStyleBuffer.strokeWidth
        });
      }
    }
  };
}
