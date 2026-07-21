import { atom } from 'nanostores';
import type { ExportFormat } from '@/lib/exporters';

/* Drawer / overlay open state */
export const isExportDrawerOpenStore = atom<boolean>(false);
export const isCommandPaletteOpenStore = atom<boolean>(false);
export const isNotificationsDrawerOpenStore = atom<boolean>(false);
export const isAccountDrawerOpenStore = atom<boolean>(false);
export const isImportModalOpenStore = atom<boolean>(false);
export const isSidebarOpenStore = atom<boolean>(false);

/* Export drawer active format tab (WebMCP artifact_export drives it too). */
export const exportFormatStore = atom<ExportFormat>('markdown');

/* Add Scene create flow (shared by the board buttons, command palette, WebMCP). */
export type CreateStep = 'intro' | 'edit' | 'review';
export const isAddSceneOpenStore = atom<boolean>(false);
export const createStepStore = atom<CreateStep>('intro');
export const formDefaultsStore = atom<{ title: string; body: string; cameraNote: string; status: string } | null>(null);
export const formExternalErrorsStore = atom<Record<string, string> | null>(null);

export function openAddScene(step: CreateStep = 'intro') {
  createStepStore.set(step);
  if (step === 'intro') {
    formDefaultsStore.set(null);
    formExternalErrorsStore.set(null);
  }
  isAddSceneOpenStore.set(true);
}

export function closeAddScene() {
  isAddSceneOpenStore.set(false);
  formDefaultsStore.set(null);
  formExternalErrorsStore.set(null);
}

/* Kebab "Edit Scene" targets a specific scene's inline description editor. */
export const editingSceneIdStore = atom<string | null>(null);

/* Version history panel targets one scene at a time (workspace-level dialog). */
export const versionHistorySceneIdStore = atom<string | null>(null);

/* Toasts — a polite live region as well as visible feedback. */
export interface ToastState {
  message: string;
  id: number;
}
export const activeToastStore = atom<ToastState | null>(null);

let toastIdCounter = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, holdMs = 2200) {
  toastIdCounter += 1;
  const id = toastIdCounter;
  activeToastStore.set({ message, id });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    const current = activeToastStore.get();
    if (current && current.id === id) activeToastStore.set(null);
  }, holdMs);
}

export const DEMO_ONLY = '— Demo Only';
export function toastDemoOnly(label: string) {
  showToast(`${label} ${DEMO_ONLY}`);
}
