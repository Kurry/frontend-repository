import { useState, useCallback, useMemo } from 'react';
import type { PackingItem, ItemStatus, CarryOnPackingOptimizerSession, DerivedState } from '../types';

export const initialItems: PackingItem[] = [
  { id: 'item-1', name: 'Laptop', status: 'ready', category: 'Electronics', quantity: 1, weight: 1500 },
  { id: 'item-2', name: 'T-Shirts', status: 'draft', category: 'Clothing', quantity: 3, weight: 600 },
  { id: 'item-3', name: 'Toothbrush', status: 'ready', category: 'Toiletries', quantity: 1, weight: 50 },
  { id: 'item-4', name: 'Water Bottle', status: 'empty', category: 'Accessories', quantity: 1, weight: 250 },
];

export function usePacking() {
  const [records, setRecords] = useState<PackingItem[]>(initialItems);
  const [history, setHistory] = useState<PackingItem[][]>([]);
  const [filter, setFilter] = useState<ItemStatus | 'all'>('all');

  const derived: DerivedState = useMemo(() => {
    const totalWeight = records.filter(r => r.status !== 'archived').reduce((acc, curr) => acc + curr.weight * curr.quantity, 0);
    const totalItems = records.filter(r => r.status !== 'archived').reduce((acc, curr) => acc + curr.quantity, 0);
    const readyItems = records.filter(r => r.status === 'ready').length;

    const scenarioComparisons = records
      .filter(r => r.scenarioWeaverState?.isScenario && r.scenarioWeaverState.baseItemId)
      .map(scenario => {
        const baseItem = records.find(r => r.id === scenario.scenarioWeaverState!.baseItemId);
        return {
          baseItemId: baseItem?.id || '',
          scenarioItemId: scenario.id,
          weightDiff: baseItem ? (scenario.weight * scenario.quantity) - (baseItem.weight * baseItem.quantity) : 0,
        };
      }).filter(c => c.baseItemId);

    return { totalWeight, totalItems, readyItems, scenarioComparisons };
  }, [records]);

  const pushHistory = useCallback((newRecords: PackingItem[]) => {
    setHistory(prev => [...prev, records]);
    setRecords(newRecords);
  }, [records]);

  const addRecord = useCallback((record: Omit<PackingItem, 'id'>) => {
    const newRecord: PackingItem = { ...record, id: `item-${Date.now()}` };
    pushHistory([...records, newRecord]);
  }, [records, pushHistory]);

  const updateRecord = useCallback((id: string, updates: Partial<PackingItem>) => {
    const newRecords = records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || (r.status === 'empty' ? 'draft' : 'changed') as ItemStatus } : r);
    pushHistory(newRecords);
  }, [records, pushHistory]);

  const deleteRecord = useCallback((id: string) => {
    const newRecords = records.map(r => r.id === id ? { ...r, status: 'archived' as ItemStatus } : r);
    pushHistory(newRecords);
  }, [records, pushHistory]);

  const branchIntoScenario = useCallback((baseItemId: string, scenarioName: string) => {
    const baseItem = records.find(r => r.id === baseItemId);
    if (!baseItem) return;

    const newScenarioId = `scenario-${Date.now()}`;
    const newScenario: PackingItem = {
      ...baseItem,
      id: newScenarioId,
      name: `${baseItem.name} (${scenarioName})`,
      status: 'draft',
      scenarioWeaverState: {
        isScenario: true,
        baseItemId: baseItem.id,
        scenarioName: scenarioName,
        differences: []
      }
    };

    pushHistory([...records, newScenario]);
  }, [records, pushHistory]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const previousRecords = newHistory.pop()!;
    setRecords(previousRecords);
    setHistory(newHistory);
  }, [history]);

  const exportData = useCallback((): CarryOnPackingOptimizerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history: history.map(() => ({ type: 'mutation' }))
    };
  }, [records, derived, history]);

  const importData = useCallback((data: any) => {
    if (data && data.schemaVersion === 'v1' && Array.isArray(data.records)) {
      const validRecords = data.records.filter((r: any) => r.id && r.name && r.status && typeof r.weight === 'number');
      if (validRecords.length > 0) {
        setRecords(validRecords);
        setHistory([]);
      }
    }
  }, []);

  const filteredRecords = useMemo(() => {
    return filter === 'all' ? records : records.filter(r => r.status === filter);
  }, [records, filter]);

  return {
    records,
    filteredRecords,
    derived,
    filter,
    setFilter,
    addRecord,
    updateRecord,
    deleteRecord,
    branchIntoScenario,
    undo,
    exportData,
    importData,
    canUndo: history.length > 0
  };
}
