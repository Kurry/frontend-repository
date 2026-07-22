export type ItemStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: ItemStatus;
  forecastQuantity?: number;
}

export interface Snapshot {
    records: PantryItem[];
    selectedItemId: string | null;
}

export interface SessionData {
  schemaVersion: 'v1';
  exportedAt: string;
  records: PantryItem[];
  derived: {
    totalItems: number;
    totalStockQty: number;
    projectedTotalStockQty: number;
  };
  history: Snapshot[];
}

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (toolName: string, args: any) => Promise<any>;
  }
}
