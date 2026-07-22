export type EnergyReadingStatus = 'draft' | 'ready' | 'changed' | 'archived' | 'quarantined';

export interface LineageEntry {
  id: string;
  source: string;
  timestamp: string;
  status: 'valid' | 'conflict' | 'quarantined';
}

export interface EnergyReading {
  id: string;
  value: number;
  timestamp: string;
  status: EnergyReadingStatus;
  lineage: LineageEntry[];
  notes?: string;
}

export interface SessionData {
  schemaVersion: 'v1';
  exportedAt: string;
  records: EnergyReading[];
  derived: {
    summary: {
      totalReadings: number;
      averageValue: number;
      quarantinedCount: number;
    }
  };
  history: any[];
  selectedRecordId: string | null;
}
