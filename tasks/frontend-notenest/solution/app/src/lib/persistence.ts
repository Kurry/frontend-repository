const STORAGE_KEY = 'notenest_data';

export interface StoredData {
  folders: any[];
  notes: any[];
  lastNoteId: number;
  lastFolderId: number;
  lastChecklistBlockId: number;
  lastChecklistItemId: number;
  lastImageId: number;
}

export function loadData(): StoredData | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveData(data: StoredData): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}
