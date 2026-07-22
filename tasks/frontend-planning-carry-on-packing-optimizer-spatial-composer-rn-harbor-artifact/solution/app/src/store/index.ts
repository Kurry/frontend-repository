import { createStore } from 'zustand';

export type Status = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface PackingItem {
  id: string;
  name: string;
  status: Status;
  weight: number;
  volume: number;
  placed: boolean;
  x?: number;
  y?: number;
}

export interface ArtifactSchema {
  schemaVersion: 'v1';
  exportedAt: string;
  records: PackingItem[];
  derived: {
    totalWeight: number;
    totalVolume: number;
    placedItemsCount: number;
    capacityStatus: 'under' | 'optimal' | 'over';
  };
  history: string[];
}

interface State {
  items: PackingItem[];
  history: State[];
  pastActions: string[];
  selectedItemId: string | null;
  addItem: (item: Omit<PackingItem, 'id'>) => void;
  updateItem: (id: string, item: Partial<PackingItem>) => void;
  deleteItem: (id: string) => void;
  placeItem: (id: string, x: number, y: number) => void;
  unplaceItem: (id: string) => void;
  undo: () => void;
  importArtifact: (artifact: ArtifactSchema) => void;
  clearSession: () => void;
  getDerivedState: () => ArtifactSchema['derived'];
  setSelectedItemId: (id: string | null) => void;
}

export const createPackingStore = () => createStore<State>((set, get) => ({
  items: [
    { id: 'item-1', name: 'Laptop', status: 'ready', weight: 1.5, volume: 2, placed: false },
    { id: 'item-2', name: 'Shoes', status: 'draft', weight: 0.8, volume: 3, placed: false },
    { id: 'item-3', name: 'Jacket', status: 'changed', weight: 1.2, volume: 4, placed: false },
    { id: 'item-4', name: 'Camera', status: 'empty', weight: 0.5, volume: 1, placed: false }
  ],
  history: [],
  pastActions: [],
  selectedItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  addItem: (item) => set((state) => {
    const newItem = { ...item, id: `item-${Date.now()}` };
    return {
      items: [...state.items, newItem],
      history: [...state.history, state],
      pastActions: [...state.pastActions, `Created item: ${item.name}`]
    };
  }),
  updateItem: (id, updates) => set((state) => {
    const itemToUpdate = state.items.find(i => i.id === id);
    if (!itemToUpdate) return state;
    return {
      items: state.items.map(i => i.id === id ? { ...i, ...updates } : i),
      history: [...state.history, state],
      pastActions: [...state.pastActions, `Updated item: ${itemToUpdate.name}`]
    };
  }),
  deleteItem: (id) => set((state) => {
    const itemToDelete = state.items.find(i => i.id === id);
    if (!itemToDelete) return state;
    return {
      items: state.items.filter(i => i.id !== id),
      history: [...state.history, state],
      pastActions: [...state.pastActions, `Deleted item: ${itemToDelete.name}`]
    };
  }),
  placeItem: (id, x, y) => set((state) => {
    const itemToPlace = state.items.find(i => i.id === id);
    if (!itemToPlace) return state;
    // Conflict resolution logic: if cell is occupied, reject
    const occupied = state.items.some(i => i.placed && i.x === x && i.y === y && i.id !== id);
    if (occupied) return state;

    return {
      items: state.items.map(i => i.id === id ? { ...i, placed: true, x, y, status: 'ready' } : i),
      history: [...state.history, state],
      pastActions: [...state.pastActions, `Placed item: ${itemToPlace.name} at (${x}, ${y})`]
    };
  }),
  unplaceItem: (id) => set((state) => {
    const itemToUnplace = state.items.find(i => i.id === id);
    if (!itemToUnplace) return state;
    return {
      items: state.items.map(i => i.id === id ? { ...i, placed: false, x: undefined, y: undefined, status: 'changed' } : i),
      history: [...state.history, state],
      pastActions: [...state.pastActions, `Unplaced item: ${itemToUnplace.name}`]
    };
  }),
  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousState = state.history[state.history.length - 1];
    return {
      items: previousState.items,
      selectedItemId: previousState.selectedItemId,
      history: state.history.slice(0, -1),
      pastActions: state.pastActions.slice(0, -1)
    };
  }),
  importArtifact: (artifact) => set({
    items: artifact.records,
    history: [],
    pastActions: artifact.history,
    selectedItemId: null
  }),
  clearSession: () => set({
    items: [],
    history: [],
    pastActions: [],
    selectedItemId: null
  }),
  getDerivedState: () => {
    const state = get();
    const placedItems = state.items.filter(i => i.placed);
    const totalWeight = placedItems.reduce((sum, item) => sum + item.weight, 0);
    const totalVolume = placedItems.reduce((sum, item) => sum + item.volume, 0);

    // Simple capacity logic: max weight 10, max volume 15
    const MAX_WEIGHT = 10;
    const MAX_VOLUME = 15;
    let capacityStatus: 'under' | 'optimal' | 'over' = 'under';

    if (totalWeight > MAX_WEIGHT || totalVolume > MAX_VOLUME) {
      capacityStatus = 'over';
    } else if (totalWeight > MAX_WEIGHT * 0.8 || totalVolume > MAX_VOLUME * 0.8) {
      capacityStatus = 'optimal';
    }

    return {
      totalWeight,
      totalVolume,
      placedItemsCount: placedItems.length,
      capacityStatus
    };
  }
}));

// Export a singleton instance for simplicity
export const usePackingStore = createPackingStore();
