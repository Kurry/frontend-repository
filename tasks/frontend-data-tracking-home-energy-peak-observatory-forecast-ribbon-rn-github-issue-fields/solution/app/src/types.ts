export type ReadingStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface EnergyReading {
  id: string;
  value: number;
  status: ReadingStatus;
  notes?: string;
  forecastProjection?: number;
}

export interface DerivedSummary {
  totalReadings: number;
  averageValue: number;
  averageProjection: number;
}

export interface HomeEnergyPeakObservatorySession {
  schemaVersion: 'energy-peak-v1';
  exportedAt: string;
  records: EnergyReading[];
  derived: DerivedSummary;
  history: string[];
}
