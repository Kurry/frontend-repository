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
  undoStack: Annotation[][];
  redoStack: Annotation[][];
  selectedAnnotationId: string | null;
  isOffline: boolean;
  offlineQueue: { action: string; data: any }[];
  collaborationState: 'online' | 'offline' | 'syncing';
  savedProjects: SavedProject[];
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
  undoStack: [],
  redoStack: [],
  selectedAnnotationId: null,
  isOffline: false,
  offlineQueue: [],
  collaborationState: 'online',
  savedProjects: savedState?.savedProjects ?? [],
});

// Save to localStorage whenever relevant state changes
function persistState() {
  safeSetLocalStorage({
    imageDataUrl: state.imageDataUrl,
    imageWidth: state.imageWidth,
    imageHeight: state.imageHeight,
    annotations: state.annotations,
    savedProjects: state.savedProjects,
  });
}

export function useAppStore() {
  return {
    state,
    setState,
    generateId,
    persistState,
    
    setImage(imageDataUrl: string, width: number, height: number) {
      setState('imageDataUrl', imageDataUrl);
      setState('imageWidth', width);
      setState('imageHeight', height);
      setState('annotations', []);
      setState('undoStack', []);
      setState('redoStack', []);
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
      persistState();
    },
    
    updateAnnotation(id: string, updates: Partial<Annotation>, recordHistory = true) {
      if (recordHistory) {
        const snapshot = [...state.annotations];
        setState('undoStack', prev => [...prev, snapshot]);
        setState('redoStack', []);
      }
      setState('annotations', (ann) => ann.map(a => a.id === id ? { ...a, ...updates } : a));
      persistState();
    },
    
    deleteAnnotation(id: string) {
      const snapshot = [...state.annotations];
      setState('undoStack', prev => [...prev, snapshot]);
      setState('redoStack', []);
      setState('annotations', prev => prev.filter(a => a.id !== id));
      if (state.selectedAnnotationId === id) {
        setState('selectedAnnotationId', null);
      }
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
      persistState();
    },
    
    setSelectedAnnotation(id: string | null) {
      setState('selectedAnnotationId', id);
    },
    
    undo() {
      if (state.undoStack.length === 0) return;
      const currentSnapshot = [...state.annotations];
      const prevSnapshot = state.undoStack[state.undoStack.length - 1];
      setState('undoStack', prev => prev.slice(0, -1));
      setState('redoStack', prev => [...prev, currentSnapshot]);
      setState('annotations', reconcile(prevSnapshot));
      persistState();
    },
    
    redo() {
      if (state.redoStack.length === 0) return;
      const currentSnapshot = [...state.annotations];
      const nextSnapshot = state.redoStack[state.redoStack.length - 1];
      setState('redoStack', prev => prev.slice(0, -1));
      setState('undoStack', prev => [...prev, currentSnapshot]);
      setState('annotations', reconcile(nextSnapshot));
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
  };
}
