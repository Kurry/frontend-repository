import type { SessionRecord, DerivedSummary } from './types';

export const computeDerived = (records: SessionRecord[]): DerivedSummary => {
  return records.reduce((acc, record) => {
    const currentState = record.history[record.currentIndex];
    if (!currentState) return acc;

    acc.totalAmount += currentState.amount || 0;

    if (currentState.status === 'ready') acc.readyCount++;
    if (currentState.status === 'draft') acc.draftCount++;
    if (currentState.status === 'archived') acc.archivedCount++;

    return acc;
  }, { totalAmount: 0, readyCount: 0, draftCount: 0, archivedCount: 0 });
};

export const generateId = () => Math.random().toString(36).substring(2, 9);
