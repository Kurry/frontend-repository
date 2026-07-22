export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface PlantRecord {
  id: string;
  name: string;
  species: string;
  status: RecordStatus;
  heightCm: number;
  sourceEvidence: string;
  quarantined: boolean;
  notes: string;
}

export interface DerivedState {
  totalRecords: number;
  quarantinedCount: number;
  readyCount: number;
}

export interface IndoorPlantGrowthJournalSession {
  schemaVersion: 'plant-growth-v1';
  exportedAt: string;
  records: PlantRecord[];
  derived: DerivedState;
  history: HistoryEvent[];
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  action: string;
  recordId?: string;
  previousState?: any;
}

export interface ProvenanceAtlasState {
  selectedRecordId: string | null;
  mode: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
}

export const initialRecords: PlantRecord[] = [
  { id: 'REC-001', name: 'Fiddle Leaf Fig', species: 'Ficus lyrata', status: 'ready', heightCm: 150, sourceEvidence: 'src-001.jpg', quarantined: false, notes: 'Healthy growth.' },
  { id: 'REC-002', name: 'Monstera', species: 'Monstera deliciosa', status: 'draft', heightCm: 80, sourceEvidence: '', quarantined: false, notes: 'Needs more light.' },
  { id: 'REC-003', name: 'Snake Plant', species: 'Sansevieria', status: 'empty', heightCm: 0, sourceEvidence: '', quarantined: false, notes: '' },
  { id: 'REC-004', name: 'Pothos', species: 'Epipremnum aureum', status: 'archived', heightCm: 120, sourceEvidence: 'src-004.jpg', quarantined: true, notes: 'Yellowing leaves, quarantine requested.' },
  { id: 'REC-005', name: 'ZZ Plant', species: 'Zamioculcas zamiifolia', status: 'changed', heightCm: 65, sourceEvidence: 'src-005.jpg', quarantined: false, notes: 'Repotted yesterday.' },
];

export function calculateDerivedState(records: PlantRecord[]): DerivedState {
  return {
    totalRecords: records.length,
    quarantinedCount: records.filter(r => r.quarantined).length,
    readyCount: records.filter(r => r.status === 'ready').length,
  };
}
