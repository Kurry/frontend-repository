import { atom, computed } from 'nanostores';
import type { Status } from '@/lib/schema';

export type { Status };

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
  /** Decorative card artwork index (1–8). Never exported, never part of the contract. */
  image: number;
  /** Canvas tabletop position — session-local working state, never exported. */
  canvasX?: number;
  canvasY?: number;
}

export type ViewMode = 'tile' | 'list' | 'slide' | 'canvas';

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${idCounter.toString(36)}-${rand}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function seedVersion(scene: { title: string; body: string; cameraNote?: string; status: Status }, stamp: string): SceneVersion {
  return {
    id: uid('v'),
    timestamp: stamp,
    title: scene.title,
    body: scene.body,
    cameraNote: scene.cameraNote,
    status: scene.status,
  };
}

function seed(
  n: number,
  title: string,
  body: string,
  status: Status,
  cameraNote?: string
): Scene {
  const stamp = new Date(Date.now() - (8 - n) * 36e5).toISOString();
  return {
    id: uid('s'),
    title,
    body,
    cameraNote,
    status,
    order: n,
    image: ((n - 1) % 8) + 1,
    versions: [seedVersion({ title, body, cameraNote, status }, stamp)],
  };
}

export function buildSeedScenes(): Scene[] {
  return [
    seed(
      1,
      'Welcome to Docs!',
      'Welcome to Docs!\n\nThis text is a **scene description**. You can edit it by clicking directly on the text — try it now. We have kept it simple to show you how the product works.',
      'ready'
    ),
    seed(
      2,
      'Meet the Header',
      'The header displays the **storyboard title** and your essential tools:\n\n**• Kebab menu**: Rename, duplicate, or share this storyboard.\n\n**• Notifications bell**: See activity across your storyboards.\n\n**• Account**: Manage storyboards, settings, and your profile.',
      'draft',
      'Wide shot of the workspace header'
    ),
    seed(
      3,
      'Notifications & Dashboard',
      'The right side of the header gives quick access to updates and management:\n\n**• Bell icon**: Stay updated with notifications about your storyboards and activities.\n\n**• Dashboard icon**: Manage all your storyboards, invite members, and review archived content.',
      'review'
    ),
    seed(
      4,
      'Account Tabs',
      'Click the user icon to reveal three tabs:\n\n**• Storyboards**: Manage all storyboards.\n\n**• Settings**: Customize appearance and functionality.\n\n**• Account**: Adjust account preferences.\n\nEach tab offers additional tools to control appearance and manage the account.',
      'draft'
    ),
    seed(
      5,
      'View Modes',
      'Control how scenes are displayed:\n\n- [ ] Tile\n- [ ] List\n- [x] Slide\n\nSwitch modes from the toggle group in the storyboard bar — the same scene set re-lays instantly, no reload needed.',
      'draft',
      'Close-up on the Tile / List / Slide toggle'
    ),
    seed(
      6,
      'Checklists',
      'Use checklists to track progress inside any scene description:\n\n- [x] Create scene\n- [ ] Edit text\n- [ ] Add image\n\nClick a rendered checkbox to toggle it — the progress readout updates immediately.',
      'review'
    ),
    seed(
      7,
      'Add Scene',
      'The **Add Scene** control opens the create flow:\n\n- [ ] Fill in a title (2–80 characters)\n- [ ] Write a description (8–2,000 characters)\n- [ ] Optionally add a camera note\n\nSubmitting adds one numbered card to the end of the board.',
      'draft'
    ),
    seed(
      8,
      'Keep Learning',
      'Keep learning — check out the next demo: **Create Your First Storyboard**. For answers to common questions, visit the FAQ, or contact our support team for help with anything else.',
      'ready'
    ),
  ];
}

/* ------------------------------------------------------------------ */
/* Stores — one shared source of truth for every view and the WebMCP. */
/* ------------------------------------------------------------------ */

export const scenesStore = atom<Scene[]>(buildSeedScenes());
export const viewModeStore = atom<ViewMode>('tile');
export const activeSlideIndexStore = atom<number>(0);
export const searchFilterStore = atom<string>('');
export const statusFilterStore = atom<Status | 'all'>('all');

export interface HistoryState {
  past: Scene[][];
  future: Scene[][];
}
export const historyStore = atom<HistoryState>({ past: [], future: [] });

/** Bumped before any mutation that should settle with a FLIP re-layout. */
export const layoutTickStore = atom<{ tick: number; scenes: Scene[] }>({ tick: 0, scenes: [] });

/** The single derived visible subset — Tile, List, Slide, and counters all agree. */
export const filteredScenes = computed(
  [scenesStore, searchFilterStore, statusFilterStore],
  (scenes, search, status) => {
    const q = search.trim().toLowerCase();
    return scenes
      .filter((s) => status === 'all' || s.status === status)
      .filter(
        (s) =>
          q === '' ||
          s.title.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q)
      )
      .sort((a, b) => a.order - b.order);
  }
);

/** Tutorial-wide checklist progress across every scene body. */
export const tutorialProgressStore = computed(scenesStore, (scenes) => {
  let total = 0;
  let checked = 0;
  for (const s of scenes) {
    for (const line of s.body.split('\n')) {
      const m = line.match(/^\s*[-*]\s*\[([ xX])\]/);
      if (m) {
        total++;
        if (m[1] !== ' ') checked++;
      }
    }
  }
  return { total, checked };
});

function deepCopy(scenes: Scene[]): Scene[] {
  return JSON.parse(JSON.stringify(scenes)) as Scene[];
}

function snapshotForHistory() {
  const history = historyStore.get();
  historyStore.set({
    past: [...history.past, deepCopy(scenesStore.get())],
    future: [],
  });
}

export function canUndo(): boolean {
  return historyStore.get().past.length > 0;
}
export function canRedo(): boolean {
  return historyStore.get().future.length > 0;
}

function announceLayoutChange(previous: Scene[]) {
  layoutTickStore.set({ tick: layoutTickStore.get().tick + 1, scenes: previous });
}

export function undo(): boolean {
  const history = historyStore.get();
  if (history.past.length === 0) return false;
  const previous = history.past[history.past.length - 1];
  const current = scenesStore.get();
  historyStore.set({
    past: history.past.slice(0, -1),
    future: [deepCopy(current), ...history.future],
  });
  announceLayoutChange(current);
  scenesStore.set(deepCopy(previous));
  clampSlideIndex();
  return true;
}

export function redo(): boolean {
  const history = historyStore.get();
  if (history.future.length === 0) return false;
  const next = history.future[0];
  const current = scenesStore.get();
  historyStore.set({
    past: [...history.past, deepCopy(current)],
    future: history.future.slice(1),
  });
  announceLayoutChange(current);
  scenesStore.set(deepCopy(next));
  clampSlideIndex();
  return true;
}

function clampSlideIndex() {
  const visible = filteredScenes.get();
  const idx = activeSlideIndexStore.get();
  if (visible.length === 0) {
    if (idx !== 0) activeSlideIndexStore.set(0);
  } else if (idx > visible.length - 1) {
    activeSlideIndexStore.set(visible.length - 1);
  }
}

export function addScene(payload: {
  title: string;
  body: string;
  cameraNote?: string;
  status: Status;
}): Scene {
  const current = scenesStore.get();
  snapshotForHistory();
  const maxOrder = current.reduce((m, s) => Math.max(m, s.order), 0);
  const scene: Scene = {
    id: uid('s'),
    title: payload.title,
    body: payload.body,
    cameraNote: payload.cameraNote || undefined,
    status: payload.status,
    order: maxOrder + 1,
    image: (maxOrder % 8) + 1,
    versions: [
      seedVersion(
        {
          title: payload.title,
          body: payload.body,
          cameraNote: payload.cameraNote || undefined,
          status: payload.status,
        },
        nowIso()
      ),
    ],
  };
  scenesStore.set([...current, scene]);
  return scene;
}

export function editScene(
  id: string,
  updates: Partial<Pick<Scene, 'title' | 'body' | 'cameraNote' | 'status'>>
): boolean {
  const current = scenesStore.get();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return false;
  const scene = current[index];

  const nextTitle = updates.title ?? scene.title;
  const nextBody = updates.body ?? scene.body;
  const nextCamera = updates.cameraNote !== undefined ? updates.cameraNote || undefined : scene.cameraNote;
  const nextStatus = updates.status ?? scene.status;

  const changed =
    nextTitle !== scene.title ||
    nextBody !== scene.body ||
    nextCamera !== scene.cameraNote ||
    nextStatus !== scene.status;
  if (!changed) return false;

  snapshotForHistory();
  const version: SceneVersion = {
    id: uid('v'),
    timestamp: nowIso(),
    title: nextTitle,
    body: nextBody,
    cameraNote: nextCamera,
    status: nextStatus,
  };
  const updated: Scene = {
    ...scene,
    title: nextTitle,
    body: nextBody,
    cameraNote: nextCamera,
    status: nextStatus,
    versions: [version, ...scene.versions],
  };
  const next = [...current];
  next[index] = updated;
  scenesStore.set(next);
  return true;
}

/** Checkbox toggle rewrites the body source — never a version snapshot. */
export function toggleCheckbox(sceneId: string, newBody: string) {
  const current = scenesStore.get();
  const index = current.findIndex((s) => s.id === sceneId);
  if (index === -1 || current[index].body === newBody) return;
  const next = [...current];
  next[index] = { ...current[index], body: newBody };
  scenesStore.set(next);
}

export function deleteScene(id: string): boolean {
  const current = scenesStore.get();
  const removedIndex = current.findIndex((s) => s.id === id);
  if (removedIndex === -1) return false;
  snapshotForHistory();

  const visibleBefore = filteredScenes.get();
  const removedVisibleIndex = visibleBefore.findIndex((s) => s.id === id);

  const remaining = current.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
  announceLayoutChange(current);
  scenesStore.set(remaining);

  // Keep the active slide on a valid neighbor.
  if (remaining.length === 0) {
    activeSlideIndexStore.set(0);
  } else if (removedVisibleIndex !== -1) {
    const idx = activeSlideIndexStore.get();
    if (removedVisibleIndex < idx) activeSlideIndexStore.set(idx - 1);
    else if (removedVisibleIndex === idx) {
      activeSlideIndexStore.set(Math.min(idx, remaining.length - 1));
    }
  }
  return true;
}

/** Move the scene at `from` to slot `to` (0-based board positions). */
export function reorderScenes(from: number, to: number): boolean {
  const current = [...scenesStore.get()].sort((a, b) => a.order - b.order);
  if (from === to || from < 0 || from >= current.length || to < 0 || to >= current.length) {
    return false;
  }
  snapshotForHistory();
  const [moved] = current.splice(from, 1);
  current.splice(to, 0, moved);
  const renumbered = current.map((s, i) => ({ ...s, order: i + 1 }));
  announceLayoutChange(scenesStore.get());
  scenesStore.set(renumbered);
  return true;
}

export function restoreVersion(sceneId: string, versionId: string): boolean {
  const current = scenesStore.get();
  const index = current.findIndex((s) => s.id === sceneId);
  if (index === -1) return false;
  const scene = current[index];
  const version = scene.versions.find((v) => v.id === versionId);
  if (!version) return false;

  snapshotForHistory();
  const stamp: SceneVersion = {
    id: uid('v'),
    timestamp: nowIso(),
    title: version.title,
    body: version.body,
    cameraNote: version.cameraNote,
    status: version.status,
  };
  const updated: Scene = {
    ...scene,
    title: version.title,
    body: version.body,
    cameraNote: version.cameraNote,
    status: version.status,
    versions: [stamp, ...scene.versions],
  };
  const next = [...current];
  next[index] = updated;
  scenesStore.set(next);
  return true;
}

/* ---------------------------- Canvas ------------------------------ */

export function canvasGridPosition(index: number): { x: number; y: number } {
  return { x: 24 + (index % 4) * 264, y: 24 + Math.floor(index / 4) * 336 };
}

export function setCanvasPosition(id: string, x: number, y: number) {
  const current = scenesStore.get();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return;
  const scene = current[index];
  if (scene.canvasX === x && scene.canvasY === y) return;
  const next = [...current];
  next[index] = { ...scene, canvasX: x, canvasY: y };
  scenesStore.set(next);
}

export function resetCanvasPositions() {
  const current = scenesStore.get();
  if (!current.some((s) => s.canvasX !== undefined || s.canvasY !== undefined)) return;
  scenesStore.set(
    current.map((s) => {
      const { canvasX: _x, canvasY: _y, ...rest } = s;
      return rest;
    })
  );
}

/* --------------------------- Templates ---------------------------- */

export interface SceneTemplate {
  id: string;
  name: string;
  scenes: { title: string; body: string; status: Status }[];
}

export const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    id: 'feature-walkthrough',
    name: 'Feature Walkthrough',
    scenes: [
      {
        title: 'Feature Overview',
        body: 'Introduce the feature in one clear sentence that a first-time user can repeat back.',
        status: 'draft',
      },
      {
        title: 'Key Benefits',
        body: 'List the two or three outcomes this feature unlocks, with **bold keywords** at the start of each line.',
        status: 'draft',
      },
      {
        title: 'How to Use It',
        body: 'Walk through the steps in order:\n\n- [ ] Open the workspace\n- [ ] Activate the feature\n- [ ] Confirm the result',
        status: 'draft',
      },
    ],
  },
  {
    id: 'release-announcement',
    name: 'Release Announcement',
    scenes: [
      {
        title: 'Announcement',
        body: 'Open with the headline: what shipped, and the date it ships to everyone.',
        status: 'draft',
      },
      {
        title: 'What Changed',
        body: 'Describe the before-and-after so readers can map the change onto their own workflow.',
        status: 'draft',
      },
      {
        title: 'Rollout Plan',
        body: 'State who gets access first and when the rollout completes:\n\n- [ ] Internal team\n- [ ] Beta customers\n- [ ] Everyone',
        status: 'draft',
      },
    ],
  },
];

/** Inject atomically: every scene is validated first; if any fails, none are added. */
export function injectTemplate(templateId: string): { added: number; name: string } | null {
  const template = SCENE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;
  const current = scenesStore.get();
  snapshotForHistory();
  let order = current.reduce((m, s) => Math.max(m, s.order), 0);
  const additions: Scene[] = template.scenes.map((t) => {
    order += 1;
    return {
      id: uid('s'),
      title: t.title,
      body: t.body,
      status: t.status,
      order,
      image: ((order - 1) % 8) + 1,
      versions: [seedVersion(t, nowIso())],
    };
  });
  scenesStore.set([...current, ...additions]);
  return { added: additions.length, name: template.name };
}

/** Import replaces the collection; each scene starts a fresh version history at v1. */
export function importScenes(
  imported: { title: string; body: string; cameraNote?: string; status: Status; order: number }[]
): number {
  snapshotForHistory();
  const stamp = nowIso();
  const scenes: Scene[] = imported.map((s, i) => ({
    id: uid('s'),
    title: s.title,
    body: s.body,
    cameraNote: s.cameraNote || undefined,
    status: s.status,
    order: i + 1,
    image: (i % 8) + 1,
    versions: [seedVersion(s, stamp)],
  }));
  announceLayoutChange(scenesStore.get());
  scenesStore.set(scenes);
  activeSlideIndexStore.set(0);
  return scenes.length;
}

export function getScene(id: string): Scene | undefined {
  return scenesStore.get().find((s) => s.id === id);
}
