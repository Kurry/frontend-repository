export type IngredientStatus = 'draft' | 'ready' | 'changed' | 'archived' | 'conflict';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  status: IngredientStatus;
  recoveryBoardState?: {
    isFailed: boolean;
    reason?: string;
    proposedFix?: Partial<Ingredient>;
  };
}

export interface DerivedStats {
  totalIngredients: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  statusCounts: Record<IngredientStatus, number>;
}

export interface SessionHistoryEntry {
  action: string;
  timestamp: string;
  stateSnapshot: Ingredient[];
}

export interface PantrySession {
  schemaVersion: "v1";
  exportedAt: string;
  records: Ingredient[];
  derived: DerivedStats;
  history: SessionHistoryEntry[];
}
