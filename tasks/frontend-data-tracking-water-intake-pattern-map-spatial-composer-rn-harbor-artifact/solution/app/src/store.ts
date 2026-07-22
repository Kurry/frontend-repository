export type IntakeStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface SpatialPosition {
  x: number;
  y: number;
}

export interface IntakeEvent {
  id: string;
  status: IntakeStatus;
  amount: number;
  date: string;
  capacity: number;
  position: SpatialPosition | null;
}

export interface DerivedSummary {
  totalAmount: number;
  totalCapacity: number;
  draftCount: number;
  readyCount: number;
  changedCount: number;
  archivedCount: number;
  capacityRebalanced: boolean;
}

export interface HistoryEntry {
  action: string;
  timestamp: string;
  recordsSnapshot: IntakeEvent[];
  derivedSnapshot: DerivedSummary;
}

export interface WaterIntakePatternMapSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: IntakeEvent[];
  derived: DerivedSummary;
  history: HistoryEntry[];
}

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateDeterministicData = (): IntakeEvent[] => {
  const records: IntakeEvent[] = [];
  const statuses: IntakeStatus[] = ['draft', 'ready', 'changed', 'archived'];
  for (let i = 0; i < 100; i++) {
    records.push({
      id: `evt-${i.toString().padStart(3, '0')}`,
      status: statuses[i % 4],
      amount: 100 + (i * 10),
      date: new Date(`2026-01-01T12:00:00Z`).toISOString(),
      capacity: 50,
      position: null,
    });
  }
  records[0].amount = 0;
  records[1].amount = 5000;
  records[2].status = 'draft';
  records[2].position = { x: 0, y: 0 };

  return records;
};

export const computeDerivedSummary = (records: IntakeEvent[]): DerivedSummary => {
  return records.reduce((acc, r) => {
    acc.totalAmount += r.amount;
    acc.totalCapacity += r.capacity;
    if (r.status === 'draft') acc.draftCount++;
    if (r.status === 'ready') acc.readyCount++;
    if (r.status === 'changed') acc.changedCount++;
    if (r.status === 'archived') acc.archivedCount++;
    if (r.position !== null) acc.capacityRebalanced = true;
    return acc;
  }, {
    totalAmount: 0,
    totalCapacity: 0,
    draftCount: 0,
    readyCount: 0,
    changedCount: 0,
    archivedCount: 0,
    capacityRebalanced: false,
  });
};

export class Store {
  state: WaterIntakePatternMapSession;
  listeners: Set<() => void>;

  constructor() {
    this.listeners = new Set();
    this.state = this.getInitialState();
  }

  getInitialState(): WaterIntakePatternMapSession {
    const initialRecords = generateDeterministicData();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: initialRecords,
      derived: computeDerivedSummary(initialRecords),
      history: []
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    this.state.derived = computeDerivedSummary(this.state.records);
    for (const listener of this.listeners) {
      listener();
    }
  }

  pushHistory(action: string, recordsSnapshot: IntakeEvent[]) {
    this.state.history.push({
      action,
      timestamp: new Date().toISOString(),
      recordsSnapshot: JSON.parse(JSON.stringify(recordsSnapshot)),
      derivedSnapshot: computeDerivedSummary(recordsSnapshot)
    });
  }

  createEvent(event: Omit<IntakeEvent, 'id'>) {
    this.pushHistory('create', this.state.records);
    this.state.records = [...this.state.records, { ...event, id: generateId() }];
    this.emit();
  }

  updateEvent(id: string, updates: Partial<IntakeEvent>) {
    this.pushHistory('update', this.state.records);
    this.state.records = this.state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    this.emit();
  }

  deleteEvent(id: string) {
    this.pushHistory('delete', this.state.records);
    this.state.records = this.state.records.filter(r => r.id !== id);
    this.emit();
  }

  placeInComposer(id: string, position: SpatialPosition, newCapacity: number) {
    this.pushHistory('rebalance', this.state.records);
    this.state.records = this.state.records.map(r =>
      r.id === id
        ? { ...r, position, capacity: newCapacity, status: 'changed' as IntakeStatus }
        : r
    );
    this.emit();
  }

  undo() {
    if (this.state.history.length === 0) return;
    const lastState = this.state.history.pop()!;
    this.state.records = lastState.recordsSnapshot;
    this.emit();
  }

  clear() {
    this.state = this.getInitialState();
    this.emit();
  }

  import(sessionData: any): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    if (sessionData.schemaVersion !== 'v1') errors.push("schemaVersion must be 'v1'");
    if (!Array.isArray(sessionData.records)) errors.push("records must be an array");

    if (errors.length > 0) return { success: false, errors };

    const validStatuses = ['draft', 'ready', 'changed', 'archived'];
    const ids = new Set();

    for (let i = 0; i < sessionData.records.length; i++) {
      const r = sessionData.records[i];
      if (!r.id) errors.push(`Record ${i} missing id`);
      if (ids.has(r.id)) errors.push(`Duplicate id found: ${r.id}`);
      ids.add(r.id);

      if (!validStatuses.includes(r.status)) errors.push(`Record ${i} invalid status: ${r.status}`);
      if (typeof r.amount !== 'number' || r.amount < 0 || r.amount > 5000) errors.push(`Record ${i} invalid amount`);
      if (typeof r.capacity !== 'number' || r.capacity < 0 || r.capacity > 100) errors.push(`Record ${i} invalid capacity`);
      if (isNaN(Date.parse(r.date))) errors.push(`Record ${i} invalid date`);
    }

    if (errors.length > 0) return { success: false, errors };

    this.state = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: sessionData.records,
      derived: computeDerivedSummary(sessionData.records),
      history: sessionData.history || []
    };

    this.emit();
    return { success: true, errors: [] };
  }

  export() {
    return {
      ...this.state,
      exportedAt: new Date().toISOString()
    };
  }
}

export const store = new Store();
