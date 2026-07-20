import { signal, computed } from '@preact/signals';

// Base signals
export const transactions = signal([
  { id: '1', date: '2024-01-05', label: 'Ada Books', category: 'Books', account: 'Checking', amount: -25.50, status: 'cleared', note: '' },
  { id: '2', date: '2024-01-08', label: 'Evening Market', category: 'Groceries', account: 'Checking', amount: -145.20, status: 'cleared', note: '' },
  { id: '3', date: '2024-01-12', label: 'Salary', category: 'Income', account: 'Checking', amount: 3500.00, status: 'cleared', note: '' },
  { id: '4', date: '2024-01-15', label: 'Electric Bill', category: 'Utilities', account: 'Checking', amount: -85.00, status: 'cleared', note: '' },
  { id: '5', date: '2024-01-18', label: 'Coffee Shop', category: 'Dining', account: 'Credit Card', amount: -4.50, status: 'pending', note: '' },
  { id: '6', date: '2024-01-20', label: 'Movie Theater', category: 'Entertainment', account: 'Credit Card', amount: -32.00, status: 'cleared', note: '' },
  { id: '7', date: '2024-01-25', label: 'Gas Station', category: 'Transportation', account: 'Credit Card', amount: -45.00, status: 'cleared', note: '' },
  { id: '8', date: '2024-02-01', label: 'Rent', category: 'Housing', account: 'Checking', amount: -1500.00, status: 'cleared', note: '' },
]);

export const thresholds = signal([
  { category: 'Groceries', ceiling: 500 },
  { category: 'Dining', ceiling: 200 },
  { category: 'Entertainment', ceiling: 150 },
  { category: 'Utilities', ceiling: 250 }
]);

export const filters = signal({
  category: null,
  type: null,
  dateStart: null,
  dateEnd: null
});

export const displayCurrency = signal('USD');

export const chartTabMode = signal('breakdown'); // 'breakdown' | 'trends'

// Undo/Redo stacks
export const undoStack = signal([]);
export const redoStack = signal([]);

// Toast
export const toastMessage = signal(null);

// Mocks FX Rates (base USD)
export const fxRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79
};

// --- Computed State ---
export const filteredTransactions = computed(() => {
  let list = transactions.value;
  const f = filters.value;

  if (f.category) {
    list = list.filter(t => t.category === f.category);
  }
  if (f.type) {
    if (f.type === 'income') list = list.filter(t => t.amount > 0);
    if (f.type === 'expense') list = list.filter(t => t.amount < 0);
  }
  if (f.dateStart) {
    list = list.filter(t => t.date >= f.dateStart);
  }
  if (f.dateEnd) {
    list = list.filter(t => t.date <= f.dateEnd);
  }
  return list;
});

export const totals = computed(() => {
  const list = filteredTransactions.value;
  let income = 0;
  let expenses = 0;

  list.forEach(t => {
    if (t.amount > 0) income += t.amount;
    if (t.amount < 0) expenses += Math.abs(t.amount);
  });

  return {
    income,
    expenses,
    net: income - expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    count: list.length
  };
});

// Update thresholds based on current transactions
export const computedThresholds = computed(() => {
    return thresholds.value.map(th => {
        const spend = transactions.value
            .filter(t => t.category === th.category && t.amount < 0)
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        return {
            ...th,
            monthToDate: spend,
            status: spend > th.ceiling ? 'over' : 'under'
        };
    });
});

export const displayTotals = computed(() => {
    const rate = fxRates[displayCurrency.value];
    const t = totals.value;
    return {
        income: t.income * rate,
        expenses: t.expenses * rate,
        net: t.net * rate,
        count: t.count
    }
});

// --- Actions ---

function saveStateToUndo() {
  const state = {
    transactions: JSON.parse(JSON.stringify(transactions.value)),
    thresholds: JSON.parse(JSON.stringify(thresholds.value))
  };
  undoStack.value = [...undoStack.value, state];
  redoStack.value = [];
}

export function addTransaction(transaction) {
  saveStateToUndo();
  transactions.value = [...transactions.value, { ...transaction, id: crypto.randomUUID() }];
}

export function updateTransaction(id, updatedFields) {
  saveStateToUndo();
  transactions.value = transactions.value.map(t => t.id === id ? { ...t, ...updatedFields } : t);
}

export function deleteTransaction(id) {
  saveStateToUndo();
  transactions.value = transactions.value.filter(t => t.id !== id);
}

export function bulkCategorize(ids, newCategory) {
    if(ids.length === 0) return;
    saveStateToUndo();
    transactions.value = transactions.value.map(t => ids.includes(t.id) ? { ...t, category: newCategory } : t);
}

export function bulkDelete(ids) {
    if(ids.length === 0) return;
    saveStateToUndo();
    transactions.value = transactions.value.filter(t => !ids.includes(t.id));
}

export function updateThresholdCeiling(category, newCeiling) {
    saveStateToUndo();
    thresholds.value = thresholds.value.map(th => th.category === category ? { ...th, ceiling: newCeiling } : th);
}

export function undo() {
  if (undoStack.value.length === 0) return;
  const prevState = undoStack.value[undoStack.value.length - 1];

  redoStack.value = [...redoStack.value, {
    transactions: JSON.parse(JSON.stringify(transactions.value)),
    thresholds: JSON.parse(JSON.stringify(thresholds.value))
  }];

  transactions.value = prevState.transactions;
  thresholds.value = prevState.thresholds;

  undoStack.value = undoStack.value.slice(0, -1);
}

export function redo() {
  if (redoStack.value.length === 0) return;
  const nextState = redoStack.value[redoStack.value.length - 1];

  undoStack.value = [...undoStack.value, {
    transactions: JSON.parse(JSON.stringify(transactions.value)),
    thresholds: JSON.parse(JSON.stringify(thresholds.value))
  }];

  transactions.value = nextState.transactions;
  thresholds.value = nextState.thresholds;

  redoStack.value = redoStack.value.slice(0, -1);
}

export function resetState(newTransactions, newThresholds) {
    saveStateToUndo();
    transactions.value = newTransactions;
    thresholds.value = newThresholds;
}

export function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
}

export function setCurrency(currency) {
    displayCurrency.value = currency;
}

export function setChartTab(tab) {
    chartTabMode.value = tab;
}

let toastTimeout = null;
export function showToast(msg) {
    toastMessage.value = msg;
    if(toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastMessage.value = null;
    }, 3000);
}
