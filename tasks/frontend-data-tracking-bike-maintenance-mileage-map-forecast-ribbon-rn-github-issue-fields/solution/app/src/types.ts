export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface ServiceRecord {
  id: string;
  title: string;
  mileage: number;
  date: string;
  status: RecordStatus;
  projectedMileage?: number; // Used for forecast ribbon
}

export interface BikeMaintenanceMileageMapSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: ServiceRecord[];
  derived: {
    totalMileage: number;
    projectedTotalMileage: number;
    activeForecasts: number;
  };
  history: {
    action: string;
    timestamp: string;
    stateSnapshot: ServiceRecord[];
  }[];
}
