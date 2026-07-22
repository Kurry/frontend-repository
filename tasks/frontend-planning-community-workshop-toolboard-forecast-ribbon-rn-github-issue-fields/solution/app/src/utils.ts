import type { WorkshopStation, DerivedSummary, CommunityWorkshopToolboardSession } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function calculateDerived(records: WorkshopStation[]): DerivedSummary {
  return {
    totalCount: records.length,
    draftCount: records.filter(r => r.status === 'draft').length,
    readyCount: records.filter(r => r.status === 'ready').length,
    changedCount: records.filter(r => r.status === 'changed').length,
    archivedCount: records.filter(r => r.status === 'archived').length,
    totalForecast: records.reduce((sum, r) => sum + r.forecastValue, 0),
  };
}

export function createEmptySession(): CommunityWorkshopToolboardSession {
  const emptyRecords: WorkshopStation[] = [
    { id: generateId(), title: 'Demo Station 1', status: 'draft', forecastValue: 10 },
    { id: generateId(), title: 'Demo Station 2', status: 'ready', forecastValue: 20 },
  ];
  return {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: emptyRecords,
    derived: calculateDerived(emptyRecords),
    history: [emptyRecords],
  };
}
