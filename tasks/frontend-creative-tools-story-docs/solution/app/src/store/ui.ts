import { atom } from 'nanostores';

export const isExportDrawerOpenStore = atom<boolean>(false);
export const isCommandPaletteOpenStore = atom<boolean>(false);
export const isNotificationsDrawerOpenStore = atom<boolean>(false);
export const isAccountDrawerOpenStore = atom<boolean>(false);
export const isImportModalOpenStore = atom<boolean>(false);

export const activeToastStore = atom<{ message: string, id: number } | null>(null);

let toastIdCounter = 0;
export function showToast(message: string) {
    activeToastStore.set({ message, id: toastIdCounter++ });
    setTimeout(() => {
        const current = activeToastStore.get();
        if (current && current.id === toastIdCounter - 1) {
            activeToastStore.set(null);
        }
    }, 1600);
}
