export type DomainStatus = "empty" | "draft" | "ready" | "changed" | "archived";

export interface IngredientRecord {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: DomainStatus;
  notes?: string;
  constraintCanvasState: {
    x: number;
    y: number;
  };
}

export interface DerivedState {
  summary: {
    totalIngredients: number;
    statusCounts: Record<DomainStatus, number>;
  };
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  recordId?: string;
  details?: any;
}

export interface PantryNutritionStockLedgerSession {
  schemaVersion: "nutrition-stock-v1";
  exportedAt: string;
  records: IngredientRecord[];
  derived: DerivedState;
  history: HistoryEvent[];
}
