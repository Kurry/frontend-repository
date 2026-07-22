import { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type PackingStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface PackingItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  quantity: number;
  status: PackingStatus;
}

export interface Checkpoint {
  id: string;
  timestamp: string;
  state: PackingItem;
}

export interface PackingItemWithHistory extends PackingItem {
  history: Checkpoint[];
}

export interface DerivedSummary {
  totalWeight: number;
  totalItems: number;
  byStatus: Record<PackingStatus, number>;
}

export interface CarryOnPackingOptimizerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: PackingItemWithHistory[];
  derived: DerivedSummary;
  history: any[]; // global action history for undo
}

// Global action history for Ctrl+Z
type GlobalAction =
  | { type: 'CREATE'; item: PackingItemWithHistory }
  | { type: 'UPDATE'; previous: PackingItemWithHistory; current: PackingItemWithHistory }
  | { type: 'DELETE'; item: PackingItemWithHistory }
  | { type: 'RESTORE_CHECKPOINT'; itemId: string; previous: PackingItemWithHistory; current: PackingItemWithHistory };

interface StoreState {
  records: PackingItemWithHistory[];
  globalHistory: GlobalAction[];
}

export function usePackingStore() {
  const [state, setState] = useState<StoreState>(() => {
    // Seed records for performance constraints (at least 100 seeded records)
    const seed: PackingItemWithHistory[] = [];
    const categories = ['Clothes', 'Electronics', 'Toiletries', 'Documents'];
    const statuses: PackingStatus[] = ['draft', 'ready', 'changed', 'archived'];

    // Seed 100 items
    for (let i = 0; i < 100; i++) {
      const id = uuidv4();
      const status = statuses[i % 4];
      const item: PackingItem = {
        id,
        name: `Seed Item ${i + 1}`,
        category: categories[i % 4],
        weight: Math.floor(Math.random() * 500) + 10,
        quantity: Math.floor(Math.random() * 3) + 1,
        status,
      };

      const checkpoint: Checkpoint = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        state: { ...item },
      };

      seed.push({ ...item, history: [checkpoint] });
    }

    return { records: seed, globalHistory: [] };
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // State to hold the currently scrubbed checkpoint (if any) to live-update the derived summary
  const [scrubPreview, setScrubPreview] = useState<{ itemId: string; previewState: PackingItem } | null>(null);

  const derived = useMemo(() => {
    let totalWeight = 0;
    let totalItems = 0;
    const byStatus: Record<PackingStatus, number> = { draft: 0, ready: 0, changed: 0, archived: 0 };

    state.records.forEach(r => {
      // Use the preview state if this item is currently being scrubbed
      const activeState = (scrubPreview && scrubPreview.itemId === r.id) ? scrubPreview.previewState : r;

      if (activeState.status !== 'archived') {
        totalWeight += activeState.weight * activeState.quantity;
        totalItems += activeState.quantity;
      }
      byStatus[activeState.status] += activeState.quantity;
    });

    return { totalWeight, totalItems, byStatus };
  }, [state.records, scrubPreview]);

  const addRecord = useCallback((item: Omit<PackingItem, 'id'>) => {
    const id = uuidv4();
    const newItem: PackingItem = { ...item, id };
    const checkpoint: Checkpoint = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      state: { ...newItem },
    };
    const newItemWithHistory: PackingItemWithHistory = { ...newItem, history: [checkpoint] };

    setState(prev => ({
      records: [...prev.records, newItemWithHistory],
      globalHistory: [...prev.globalHistory, { type: 'CREATE', item: newItemWithHistory }]
    }));
    return id;
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<PackingItem>) => {
    setState(prev => {
      const idx = prev.records.findIndex(r => r.id === id);
      if (idx === -1) return prev;

      const current = prev.records[idx];
      const updatedState: PackingItem = { ...current, ...updates };
      const checkpoint: Checkpoint = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        state: { ...updatedState },
      };

      const updatedItemWithHistory: PackingItemWithHistory = {
        ...updatedState,
        history: [...current.history, checkpoint]
      };

      const newRecords = [...prev.records];
      newRecords[idx] = updatedItemWithHistory;

      return {
        records: newRecords,
        globalHistory: [...prev.globalHistory, { type: 'UPDATE', previous: current, current: updatedItemWithHistory }]
      };
    });
  }, []);

  const restoreCheckpoint = useCallback((itemId: string, checkpointId: string) => {
    setState(prev => {
      const idx = prev.records.findIndex(r => r.id === itemId);
      if (idx === -1) return prev;

      const current = prev.records[idx];
      const checkpoint = current.history.find(c => c.id === checkpointId);
      if (!checkpoint) return prev;

      const updatedState = { ...checkpoint.state };
      const newCheckpoint: Checkpoint = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        state: { ...updatedState },
      };

      const updatedItemWithHistory: PackingItemWithHistory = {
        ...updatedState,
        history: [...current.history, newCheckpoint]
      };

      const newRecords = [...prev.records];
      newRecords[idx] = updatedItemWithHistory;

      return {
        records: newRecords,
        globalHistory: [...prev.globalHistory, { type: 'RESTORE_CHECKPOINT', itemId, previous: current, current: updatedItemWithHistory }]
      };
    });
    // Clear preview after restore
    setScrubPreview(null);
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setState(prev => {
      const item = prev.records.find(r => r.id === id);
      if (!item) return prev;

      return {
        records: prev.records.filter(r => r.id !== id),
        globalHistory: [...prev.globalHistory, { type: 'DELETE', item }]
      };
    });

    if (selectedItemId === id) setSelectedItemId(null);
    if (scrubPreview?.itemId === id) setScrubPreview(null);
  }, [selectedItemId, scrubPreview]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.globalHistory.length === 0) return prev;
      const lastAction = prev.globalHistory[prev.globalHistory.length - 1];
      const restHistory = prev.globalHistory.slice(0, -1);

      let newRecords = [...prev.records];
      switch (lastAction.type) {
        case 'CREATE':
          newRecords = newRecords.filter(r => r.id !== lastAction.item.id);
          break;
        case 'UPDATE':
        case 'RESTORE_CHECKPOINT':
          newRecords = newRecords.map(r => r.id === lastAction.previous.id ? lastAction.previous : r);
          break;
        case 'DELETE':
          newRecords = [...newRecords, lastAction.item];
          break;
      }

      return { records: newRecords, globalHistory: restHistory };
    });
    setScrubPreview(null); // Clear preview on undo
  }, []);

  const exportSession = useCallback((): CarryOnPackingOptimizerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: state.globalHistory,
    };
  }, [state.records, derived, state.globalHistory]);

  const importSession = useCallback((data: any) => {
    try {
      if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
      if (!Array.isArray(data.records)) throw new Error('Invalid records');

      const validRecords = data.records.filter((r: any) =>
        r.id && r.name && r.category && typeof r.weight === 'number' && typeof r.quantity === 'number' && r.status && Array.isArray(r.history)
      );

      setState({
        records: validRecords,
        globalHistory: data.history || []
      });
      setSelectedItemId(null);
      setScrubPreview(null);
    } catch (e) {
      console.error('Import failed', e);
    }
  }, []);

  const clearSession = useCallback(() => {
    setState({ records: [], globalHistory: [] });
    setSelectedItemId(null);
    setScrubPreview(null);
  }, []);

  // Keyboard shortcut for Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return {
    records: state.records,
    derived,
    selectedItemId,
    setSelectedItemId,
    scrubPreview,
    setScrubPreview,
    addRecord,
    updateRecord,
    deleteRecord,
    restoreCheckpoint,
    undo,
    exportSession,
    importSession,
    clearSession,
  };
}
