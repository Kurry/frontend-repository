export type ItemStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface PackingItem {
  id: string;
  name: string;
  status: ItemStatus;
  category: string;
  quantity: number;
  weight: number;
  scenarioWeaverState?: {
    isScenario: boolean;
    baseItemId?: string;
    scenarioName?: string;
    differences?: string[];
  };
}

export interface DerivedState {
  totalWeight: number;
  totalItems: number;
  readyItems: number;
  scenarioComparisons: Array<{
    baseItemId: string;
    scenarioItemId: string;
    weightDiff: number;
  }>;
}

export interface CarryOnPackingOptimizerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: PackingItem[];
  derived: DerivedState;
  history: any[];
}
