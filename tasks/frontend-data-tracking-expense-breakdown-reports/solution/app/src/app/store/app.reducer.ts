import { createReducer, on } from '@ngrx/store';
import { AppState, Transaction } from './app.state';
import * as AppActions from './app.actions';

const initialTransactions: Transaction[] = [
  { id: '1', date: '2024-01-05', payee: 'Tech Corp', category: 'Salary', account: 'Checking', amount: 8000, income: true, status: 'cleared' },
  { id: '2', date: '2024-01-12', payee: 'Grocery Store', category: 'Food & Dining', account: 'Credit Card', amount: 150.50, income: false, status: 'cleared' },
  { id: '3', date: '2024-01-15', payee: 'Landlord', category: 'Housing', account: 'Checking', amount: 2000, income: false, status: 'cleared' },
  { id: '4', date: '2024-01-18', payee: 'Electric Co', category: 'Utilities', account: 'Credit Card', amount: 85.20, income: false, status: 'cleared' },
  { id: '5', date: '2024-02-01', payee: 'Gym', category: 'Health & Fitness', account: 'Credit Card', amount: 50, income: false, status: 'cleared' },
  { id: '6', date: '2024-02-10', payee: 'Online Retailer', category: 'Shopping', account: 'Credit Card', amount: 120, income: false, status: 'cleared' },
  { id: '7', date: '2024-02-15', payee: 'Tech Corp', category: 'Salary', account: 'Checking', amount: 8000, income: true, status: 'cleared' },
  { id: '8', date: '2024-02-20', payee: 'Restaurant', category: 'Food & Dining', account: 'Credit Card', amount: 75.80, income: false, status: 'pending' },
];

export const initialState: AppState = {
  transactions: initialTransactions,
  chartMode: 'breakdown',
  burnRateCeiling: 5000,
  filters: { category: null, type: null, dateRange: null, payee: null },
  selection: [],
  toast: null,
  drawerOpen: false,
  commandPaletteOpen: false,
  importDiagnosticRows: []
};

export const appReducer = createReducer(
  initialState,
  on(AppActions.createTransaction, (state, { transaction }) => ({
    ...state,
    transactions: [transaction, ...state.transactions]
  })),
  on(AppActions.updateTransaction, (state, { transaction }) => ({
    ...state,
    transactions: state.transactions.map(t => t.id === transaction.id ? transaction : t)
  })),
  on(AppActions.deleteTransaction, (state, { id }) => ({
    ...state,
    transactions: state.transactions.filter(t => t.id !== id),
    selection: state.selection.filter(sId => sId !== id)
  })),
  on(AppActions.deleteTransactions, (state, { ids }) => ({
    ...state,
    transactions: state.transactions.filter(t => !ids.includes(t.id)),
    selection: state.selection.filter(sId => !ids.includes(sId))
  })),
  on(AppActions.deleteAllTransactions, (state) => ({
    ...state,
    transactions: [],
    selection: []
  })),
  on(AppActions.selectTransaction, (state, { id }) => ({
    ...state,
    selection: [...new Set([...state.selection, id])]
  })),
  on(AppActions.deselectTransaction, (state, { id }) => ({
    ...state,
    selection: state.selection.filter(sId => sId !== id)
  })),
  on(AppActions.toggleTransactionSelection, (state, { id }) => ({
    ...state,
    selection: state.selection.includes(id) ? state.selection.filter(sId => sId !== id) : [...state.selection, id]
  })),
  on(AppActions.clearSelection, (state) => ({
    ...state,
    selection: []
  })),
  on(AppActions.setChartMode, (state, { mode }) => ({
    ...state,
    chartMode: mode
  })),
  on(AppActions.setBurnRateCeiling, (state, { ceiling }) => ({
    ...state,
    burnRateCeiling: ceiling
  })),
  on(AppActions.applyFilter, (state, { filterType, value }) => ({
    ...state,
    filters: { ...state.filters, [filterType]: value }
  })),
  on(AppActions.clearFilters, (state) => ({
    ...state,
    filters: { category: null, type: null, dateRange: null, payee: null }
  })),
  on(AppActions.showToast, (state, { message }) => ({
    ...state,
    toast: { show: true, message }
  })),
  on(AppActions.hideToast, (state) => ({
    ...state,
    toast: null
  })),
  on(AppActions.toggleDrawer, (state, { open }) => ({
    ...state,
    drawerOpen: open
  })),
  on(AppActions.toggleCommandPalette, (state, { open }) => ({
    ...state,
    commandPaletteOpen: open
  })),
  on(AppActions.importTransactions, (state, { transactions }) => ({
    ...state,
    transactions: [...transactions],
    selection: []
  }))
);
