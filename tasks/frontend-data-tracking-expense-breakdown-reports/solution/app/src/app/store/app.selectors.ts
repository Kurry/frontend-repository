import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, Transaction } from './app.state';

export const selectAppState = createFeatureSelector<AppState>('app');

export const selectAllTransactions = createSelector(
  selectAppState,
  (state) => state.transactions
);

export const selectFilters = createSelector(
  selectAppState,
  (state) => state.filters
);

export const selectFilteredTransactions = createSelector(
  selectAllTransactions,
  selectFilters,
  (transactions, filters) => {
    return transactions.filter(t => {
      if (filters.category && t.category !== filters.category) return false;
      if (filters.type === 'income' && !t.income) return false;
      if (filters.type === 'expense' && t.income) return false;
      if (filters.payee && !t.payee.toLowerCase().includes(filters.payee.toLowerCase())) return false;
      // Date range filtering can be added here if necessary
      return true;
    });
  }
);

export const selectChartMode = createSelector(
  selectAppState,
  (state) => state.chartMode
);

export const selectBurnRateCeiling = createSelector(
  selectAppState,
  (state) => state.burnRateCeiling
);

export const selectTotals = createSelector(
  selectFilteredTransactions,
  (transactions) => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let maxTx = 0;
    transactions.forEach(t => {
      if (t.income) {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }
      if (t.amount > maxTx) maxTx = t.amount;
    });
    return {
      count: transactions.length,
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      max: maxTx,
      avg: transactions.length ? (totalIncome + totalExpenses) / transactions.length : 0
    };
  }
);

export const selectSelection = createSelector(
  selectAppState,
  (state) => state.selection
);

export const selectToast = createSelector(
  selectAppState,
  (state) => state.toast
);

export const selectDrawerOpen = createSelector(
  selectAppState,
  (state) => state.drawerOpen
);

export const selectCommandPaletteOpen = createSelector(
  selectAppState,
  (state) => state.commandPaletteOpen
);
