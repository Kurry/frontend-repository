export interface Transaction {
  id: string;
  date: string;
  payee: string;
  category: string;
  account: string;
  amount: number;
  income: boolean;
  status: 'cleared' | 'pending';
}

export interface AppState {
  transactions: Transaction[];
  chartMode: 'breakdown' | 'trends';
  burnRateCeiling: number;
  filters: {
    category: string | null;
    type: string | null;
    dateRange: string | null;
    payee: string | null;
  };
  selection: string[]; // transaction ids
  toast: { show: boolean, message: string } | null;
  drawerOpen: boolean;
  commandPaletteOpen: boolean;
  importDiagnosticRows: any[];
}
