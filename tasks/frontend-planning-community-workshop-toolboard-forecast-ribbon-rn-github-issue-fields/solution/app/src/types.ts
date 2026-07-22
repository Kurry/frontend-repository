export type StationStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface WorkshopStation {
  id: string;
  title: string;
  status: StationStatus;
  forecastValue: number;
}

export interface DerivedSummary {
  totalCount: number;
  draftCount: number;
  readyCount: number;
  changedCount: number;
  archivedCount: number;
  totalForecast: number;
}

export interface CommunityWorkshopToolboardSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: WorkshopStation[];
  derived: DerivedSummary;
  history: WorkshopStation[][];
}
