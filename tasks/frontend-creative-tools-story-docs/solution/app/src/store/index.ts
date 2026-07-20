import { atom } from 'nanostores';
import { v4 as uuidv4 } from 'uuid';

export type SceneStatus = 'draft' | 'review' | 'ready';

export interface SceneVersion {
  id: string;
  timestamp: number;
  title: string;
  body: string;
  cameraNote?: string;
  status: SceneStatus;
  order: number;
}

export interface Scene {
  id: string;
  title: string;
  body: string;
  cameraNote?: string;
  status: SceneStatus;
  order: number;
  image?: string;
  history: SceneVersion[];
  // Canvas specifics
  canvasX?: number;
  canvasY?: number;
}

export type ViewMode = 'tile' | 'list' | 'slide' | 'canvas';

// Helper to create an initial version history
function createInitialHistory(scene: Omit<Scene, 'history' | 'id'> & { id: string }): SceneVersion[] {
  return [{
    id: uuidv4(),
    timestamp: Date.now(),
    title: scene.title,
    body: scene.body,
    cameraNote: scene.cameraNote,
    status: scene.status,
    order: scene.order
  }];
}

// Ensure 8 seeded scenes
const initialScenesData: Omit<Scene, 'history'>[] = [
  {
    id: uuidv4(),
    title: 'Welcome to Docs',
    body: 'Welcome to Docs!\n\nThis text is a **scene description**. You can edit it by clicking directly on the text. We have kept it simple to show you how the product works.\n- [ ] Unchecked item\n- [x] Checked item',
    status: 'ready',
    order: 1,
    image: '/assets/scenes/scene-01.webp'
  },
  {
    id: uuidv4(),
    title: 'Storyboard Header',
    body: 'The header on the left displays the **storyboard title** and essential tools:\n\n**• Edit**: Modify your storyboard.\n**• Duplicate**: Create a copy.',
    status: 'review',
    order: 2,
    image: '/assets/scenes/scene-02.webp'
  },
  {
    id: uuidv4(),
    title: 'Notifications',
    body: 'The right side of the header provides quick access to important updates and management tools:\n\n**• Bell icon**: Stay updated with notifications.',
    status: 'draft',
    order: 3,
    image: '/assets/scenes/scene-03.webp'
  },
  {
    id: uuidv4(),
    title: 'User Menu',
    body: 'Click the User icon to reveal three tabs:\n\n**• Storyboards**: Manage all storyboards.',
    status: 'ready',
    order: 4,
    image: '/assets/scenes/scene-04.webp'
  },
  {
    id: uuidv4(),
    title: 'View Modes',
    body: 'Control how scenes are displayed:\n\n**• Grid view**: View your scenes in a grid layout.\n- [ ] Item 1\n- [ ] Item 2',
    status: 'review',
    order: 5,
    image: '/assets/scenes/scene-05.webp'
  },
  {
    id: uuidv4(),
    title: 'Scene Options',
    body: 'Each scene has its own menu:\n\n**• Edit**: Modify the scene content.\n**• Delete**: Remove the scene from the storyboard.',
    status: 'draft',
    order: 6,
    image: '/assets/scenes/scene-06.webp'
  },
  {
    id: uuidv4(),
    title: 'Keyboard Shortcuts',
    body: 'Use keyboard shortcuts to work faster:\n\n**• Ctrl+Z**: Undo the last action.',
    status: 'ready',
    order: 7,
    image: '/assets/scenes/scene-07.webp'
  },
  {
    id: uuidv4(),
    title: 'Exporting',
    body: 'Export your storyboard in various formats:\n\n**• PDF**: Share your storyboard as a document.',
    status: 'review',
    order: 8,
    image: '/assets/scenes/scene-08.webp'
  }
];

const seededScenes: Scene[] = initialScenesData.map(s => ({
  ...s,
  history: createInitialHistory(s as any)
}));

// Atoms
export const scenesStore = atom<Scene[]>(seededScenes);
export const viewModeStore = atom<ViewMode>('tile');
export const activeSlideStore = atom<number>(0);
export const filterStatusStore = atom<SceneStatus | 'all'>('all');
export const searchQueryStore = atom<string>('');

// Undo/Redo stack for the whole collection
export const collectionHistoryStore = atom<Scene[][]>([JSON.parse(JSON.stringify(seededScenes))]);
export const collectionHistoryIndexStore = atom<number>(0);

// Actions
export function pushToHistory(scenes: Scene[]) {
  const history = collectionHistoryStore.get();
  const currentIndex = collectionHistoryIndexStore.get();

  const newHistory = history.slice(0, currentIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(scenes)));

  collectionHistoryStore.set(newHistory);
  collectionHistoryIndexStore.set(newHistory.length - 1);
}

export function undo() {
  const currentIndex = collectionHistoryIndexStore.get();
  if (currentIndex > 0) {
    collectionHistoryIndexStore.set(currentIndex - 1);
    const history = collectionHistoryStore.get();
    scenesStore.set(JSON.parse(JSON.stringify(history[currentIndex - 1])));
  }
}

export function redo() {
  const currentIndex = collectionHistoryIndexStore.get();
  const history = collectionHistoryStore.get();

  if (currentIndex < history.length - 1) {
    collectionHistoryIndexStore.set(currentIndex + 1);
    scenesStore.set(JSON.parse(JSON.stringify(history[currentIndex + 1])));
  }
}

export function addScene(sceneData: Omit<Scene, 'id' | 'order' | 'history'>) {
  const scenes = scenesStore.get();

  const newScene: Scene = {
    ...sceneData,
    id: uuidv4(),
    order: scenes.length + 1,
    history: []
  };

  newScene.history = createInitialHistory(newScene);

  const newScenes = [...scenes, newScene];
  scenesStore.set(newScenes);
  pushToHistory(newScenes);
}

export function updateScene(id: string, updates: Partial<Scene>, recordHistory: boolean = true) {
  const scenes = scenesStore.get();
  const sceneIndex = scenes.findIndex(s => s.id === id);

  if (sceneIndex === -1) return;

  const currentScene = scenes[sceneIndex];
  const updatedScene = { ...currentScene, ...updates };

  // Record version history if it's a "meaningful edit" (not just a checklist toggle)
  // And it's requested via recordHistory flag
  if (recordHistory) {
    const newVersion: SceneVersion = {
      id: uuidv4(),
      timestamp: Date.now(),
      title: updatedScene.title,
      body: updatedScene.body,
      cameraNote: updatedScene.cameraNote,
      status: updatedScene.status,
      order: updatedScene.order
    };
    updatedScene.history = [newVersion, ...(updatedScene.history || [])];
  }

  const newScenes = [...scenes];
  newScenes[sceneIndex] = updatedScene;
  scenesStore.set(newScenes);

  if (recordHistory) {
    pushToHistory(newScenes);
  }
}

export function deleteScene(id: string) {
  const scenes = scenesStore.get();

  const filteredScenes = scenes.filter(s => s.id !== id);

  // Renumber contiguously
  const renumberedScenes = filteredScenes.map((s, index) => ({
    ...s,
    order: index + 1
  }));

  scenesStore.set(renumberedScenes);
  pushToHistory(renumberedScenes);

  // Fix slide index if out of bounds
  const currentSlide = activeSlideStore.get();
  if (currentSlide >= renumberedScenes.length && renumberedScenes.length > 0) {
    activeSlideStore.set(renumberedScenes.length - 1);
  }
}

export function reorderScenes(startIndex: number, endIndex: number) {
  const scenes = [...scenesStore.get()];
  const [removed] = scenes.splice(startIndex, 1);
  scenes.splice(endIndex, 0, removed);

  // Renumber contiguously
  const renumberedScenes = scenes.map((s, index) => ({
    ...s,
    order: index + 1
  }));

  scenesStore.set(renumberedScenes);
  pushToHistory(renumberedScenes);
}

// Templates (requirement: ship at least two local named scene templates)
export const templates = [
  {
    name: 'Standard Sequence',
    scenes: [
      { title: 'Establishing Shot', body: 'Wide angle showing the environment', status: 'draft' as SceneStatus },
      { title: 'Close Up', body: 'Character reaction', status: 'draft' as SceneStatus },
      { title: 'Action', body: 'The main event occurs', status: 'draft' as SceneStatus }
    ]
  },
  {
    name: 'Interview Setup',
    scenes: [
      { title: 'Host Intro', body: 'Host introduces the guest', status: 'draft' as SceneStatus },
      { title: 'Guest Answer 1', body: 'Guest answers first question', status: 'draft' as SceneStatus },
      { title: 'B-Roll', body: 'Supporting footage', status: 'draft' as SceneStatus }
    ]
  }
];

export function applyTemplate(templateIndex: number) {
  const template = templates[templateIndex];
  if (!template) return;

  const scenes = scenesStore.get();
  const currentCount = scenes.length;

  const newScenes = template.scenes.map((ts, idx) => {
    const s: Scene = {
      id: uuidv4(),
      title: ts.title,
      body: ts.body,
      status: ts.status,
      order: currentCount + idx + 1,
      history: []
    };
    s.history = createInitialHistory(s);
    return s;
  });

  const combinedScenes = [...scenes, ...newScenes];
  scenesStore.set(combinedScenes);
  pushToHistory(combinedScenes);
}
