import { atom, computed } from 'nanostores';

export type Status = 'draft' | 'review' | 'ready';

export interface SceneVersion {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  cameraNote?: string;
  status: Status;
}

export interface Scene {
  id: string;
  title: string;
  body: string;
  cameraNote?: string;
  status: Status;
  order: number;
  versions: SceneVersion[];
  canvasX?: number;
  canvasY?: number;
}

export const initialScenes: Scene[] = [
  {
    id: 'a491c841-a671-4863-8f74-00dd3cf64b63',
    title: 'Welcome to Docs!',
    body: 'Welcome to Docs!\n\nThis text is a **scene description**. You can edit it by clicking directly on the text. We have kept it simple to show you how the product works.',
    status: 'ready',
    order: 1,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Welcome to Docs!', body: 'Welcome to Docs!\n\nThis text is a **scene description**. You can edit it by clicking directly on the text. We have kept it simple to show you how the product works.', status: 'ready' }],
  },
  {
    id: 'c8421774-eec9-4cf0-bce3-3bbc56324f74',
    title: 'Scene 2',
    body: 'The header on the left displays the **storyboard title** and essential tools:\n\n**• Edit**: Modify your storyboard.\n\n**• Duplicate**: Create a copy.\n\n**• Share**: Collaborate with others.\n\n**• Lock**: Prevent edits.\n\n**• Archive**: Organize completed storyboards.',
    status: 'draft',
    order: 2,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Scene 2', body: 'The header on the left displays the **storyboard title** and essential tools:\n\n**• Edit**: Modify your storyboard.\n\n**• Duplicate**: Create a copy.\n\n**• Share**: Collaborate with others.\n\n**• Lock**: Prevent edits.\n\n**• Archive**: Organize completed storyboards.', status: 'draft' }],
  },
  {
    id: '5440a337-3be8-4aaf-b78d-eefa55f7ccd3',
    title: 'Scene 3',
    body: 'The right side of the header provides quick access to important updates and management tools:\n\n**• Bell icon**: Stay updated with notifications about your storyboards and activities.\n\n**• Dashboard icon**: Manage all your storyboards, invite members, and review archived content.',
    status: 'review',
    order: 3,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Scene 3', body: 'The right side of the header provides quick access to important updates and management tools:\n\n**• Bell icon**: Stay updated with notifications about your storyboards and activities.\n\n**• Dashboard icon**: Manage all your storyboards, invite members, and review archived content.', status: 'review' }],
  },
  {
    id: '6b811db0-bbf2-4aec-a4f7-e7f84257e188',
    title: 'Scene 4',
    body: 'Click the User icon to reveal three tabs:\n\n**• Storyboards**: Manage all storyboards.\n\n**• Settings**: Customize appearance and functionality.\n\n**• Account**: Adjust account preferences.\n\nEach tab provide with additional tools and options to control appearance and to manage the account.',
    status: 'draft',
    order: 4,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Scene 4', body: 'Click the User icon to reveal three tabs:\n\n**• Storyboards**: Manage all storyboards.\n\n**• Settings**: Customize appearance and functionality.\n\n**• Account**: Adjust account preferences.\n\nEach tab provide with additional tools and options to control appearance and to manage the account.', status: 'draft' }],
  },
  {
    id: '0e34f67e-584b-4b29-9ca8-632c9f600b96',
    title: 'Scene 5',
    body: 'Control how scenes are displayed:\n\n- [ ] Tile\n- [ ] List\n- [x] Slide',
    status: 'draft',
    order: 5,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Scene 5', body: 'Control how scenes are displayed:\n\n- [ ] Tile\n- [ ] List\n- [x] Slide', status: 'draft' }],
  },
  {
    id: 's6',
    title: 'Scene 6',
    body: 'Use checklists to track progress:\n\n- [x] Create scene\n- [ ] Edit text\n- [ ] Add image',
    status: 'review',
    order: 6,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Scene 6', body: 'Use checklists to track progress:\n\n- [x] Create scene\n- [ ] Edit text\n- [ ] Add image', status: 'review' }],
  },
  {
    id: 's7',
    title: 'Scene 7',
    body: 'A seventh scene to show grid wrapping and more content.',
    status: 'draft',
    order: 7,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Scene 7', body: 'A seventh scene to show grid wrapping and more content.', status: 'draft' }],
  },
  {
    id: 's8',
    title: 'Scene 8',
    body: 'Keep learning—check out the next demo: Create Your First Storyboard. For answers to common questions, visit the FAQ, or contact our support team for help with anything else.',
    status: 'ready',
    order: 8,
    versions: [{ id: 'v1', timestamp: new Date().toISOString(), title: 'Scene 8', body: 'Keep learning—check out the next demo: Create Your First Storyboard. For answers to common questions, visit the FAQ, or contact our support team for help with anything else.', status: 'ready' }],
  }
];

export const scenesStore = atom<Scene[]>([...initialScenes]);
export const viewModeStore = atom<'tile' | 'list' | 'slide' | 'canvas'>('tile');
export const activeSlideIndexStore = atom<number>(0);
export const searchFilterStore = atom<string>('');
export const statusFilterStore = atom<Status | 'all'>('all');

export interface HistoryState {
    past: Scene[][];
    future: Scene[][];
}
export const historyStore = atom<HistoryState>({ past: [], future: [] });

export const filteredScenes = computed([scenesStore, searchFilterStore, statusFilterStore], (scenes, search, status) => {
  return scenes
    .filter(scene => status === 'all' || scene.status === status)
    .filter(scene => search === '' || [scene.title, scene.body].some(value => value.toLowerCase().includes(search.toLowerCase())));
});

function saveHistory(currentScenes: Scene[]) {
    const history = historyStore.get();
    historyStore.set({
        past: [...history.past, JSON.parse(JSON.stringify(currentScenes))],
        future: []
    });
}

export function undo() {
    const history = historyStore.get();
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    const current = scenesStore.get();
    historyStore.set({
        past: newPast,
        future: [JSON.parse(JSON.stringify(current)), ...history.future]
    });

    scenesStore.set(previous);
}

export function redo() {
    const history = historyStore.get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    const current = scenesStore.get();
    historyStore.set({
        past: [...history.past, JSON.parse(JSON.stringify(current))],
        future: newFuture
    });

    scenesStore.set(next);
}

export function addScene(scene: Omit<Scene, 'id' | 'order' | 'versions'>) {
    const current = scenesStore.get();
    saveHistory(current);
    const newScene: Scene = {
        ...scene,
        id: crypto.randomUUID(),
        order: current.length + 1,
        versions: [{
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            title: scene.title,
            body: scene.body,
            cameraNote: scene.cameraNote,
            status: scene.status,
        }]
    };
    scenesStore.set([...current, newScene]);

    // Auto-advance active slide if adding while at the end
    const currentSlide = activeSlideIndexStore.get();
    if (viewModeStore.get() === 'slide' && currentSlide === current.length - 1) {
        activeSlideIndexStore.set(current.length);
    }
}

export function editScene(id: string, updates: Partial<Pick<Scene, 'title' | 'body' | 'cameraNote' | 'status'>>) {
    const current = scenesStore.get();
    const sceneIndex = current.findIndex(s => s.id === id);
    if (sceneIndex === -1) return;

    saveHistory(current);

    const scene = current[sceneIndex];
    const newVersion: SceneVersion = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        title: updates.title ?? scene.title,
        body: updates.body ?? scene.body,
        cameraNote: updates.cameraNote ?? scene.cameraNote,
        status: updates.status ?? scene.status,
    };

    const updatedScene = {
        ...scene,
        ...updates,
        versions: [newVersion, ...scene.versions]
    };

    const newScenes = [...current];
    newScenes[sceneIndex] = updatedScene;
    scenesStore.set(newScenes);
}

export function toggleCheckbox(sceneId: string, text: string) {
    // This action doesn't create a version snapshot
    const current = scenesStore.get();
    const sceneIndex = current.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    const scene = current[sceneIndex];
    const updatedScene = { ...scene, body: text };

    const newScenes = [...current];
    newScenes[sceneIndex] = updatedScene;
    scenesStore.set(newScenes);
}

export function deleteScene(id: string) {
    const current = scenesStore.get();
    saveHistory(current);
    const filtered = current.filter(s => s.id !== id);
    const reordered = filtered.map((s, index) => ({ ...s, order: index + 1 }));
    scenesStore.set(reordered);

    // adjust active slide index if needed
    const currentSlide = activeSlideIndexStore.get();
    if (currentSlide >= reordered.length && reordered.length > 0) {
        activeSlideIndexStore.set(reordered.length - 1);
    }
}

export function reorderScenes(startIndex: number, endIndex: number) {
    const current = scenesStore.get();
    saveHistory(current);
    const result = Array.from(current);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reordered = result.map((s, index) => ({ ...s, order: index + 1 }));
    scenesStore.set(reordered);
}

export function restoreVersion(sceneId: string, versionId: string) {
    const current = scenesStore.get();
    const sceneIndex = current.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    const scene = current[sceneIndex];
    const version = scene.versions.find(v => v.id === versionId);
    if (!version) return;

    saveHistory(current);

    const newVersion: SceneVersion = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        title: version.title,
        body: version.body,
        cameraNote: version.cameraNote,
        status: version.status,
    };

    const updatedScene = {
        ...scene,
        title: version.title,
        body: version.body,
        cameraNote: version.cameraNote,
        status: version.status,
        versions: [newVersion, ...scene.versions]
    };

    const newScenes = [...current];
    newScenes[sceneIndex] = updatedScene;
    scenesStore.set(newScenes);
}

export function setCanvasPosition(id: string, x: number, y: number) {
    const current = scenesStore.get();
    const sceneIndex = current.findIndex(s => s.id === id);
    if (sceneIndex === -1) return;

    // Canvas changes do not trigger history push to avoid polluting it with drags
    const updatedScene = { ...current[sceneIndex], canvasX: x, canvasY: y };
    const newScenes = [...current];
    newScenes[sceneIndex] = updatedScene;
    scenesStore.set(newScenes);
}

export function resetCanvasPositions() {
    const current = scenesStore.get();
    saveHistory(current);
    const newScenes = current.map(s => {
        const { canvasX, canvasY, ...rest } = s;
        return rest;
    });
    scenesStore.set(newScenes);
}

export function injectTemplate(templateScenes: Omit<Scene, 'id' | 'order' | 'versions'>[]) {
    const current = scenesStore.get();
    saveHistory(current);

    const newScenes = templateScenes.map((ts, i) => ({
        ...ts,
        id: crypto.randomUUID(),
        order: current.length + i + 1,
        versions: [{
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            title: ts.title,
            body: ts.body,
            cameraNote: ts.cameraNote,
            status: ts.status,
        }]
    }));

    scenesStore.set([...current, ...newScenes]);
}

export function replaceAllScenes(newScenes: Scene[]) {
    // No history for whole replacement by import to avoid issues, or save it?
    // Let's save it.
    saveHistory(scenesStore.get());
    scenesStore.set(newScenes);
}
