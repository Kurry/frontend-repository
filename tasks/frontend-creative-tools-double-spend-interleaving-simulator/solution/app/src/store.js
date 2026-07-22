import { createStore, reconcile } from 'solid-js/store';

const initialAccounts = [
  { id: 'A', balance: 100, version: 1 },
  { id: 'B', balance: 40, version: 1 },
  { id: 'C', balance: 10, version: 1 },
];

// 4 transactions, each with begin, read, validate, debit, credit, commit
const generatePhases = (txId, fromAcc, toAcc, amount) => [
  { id: `${txId}-begin`, txId, type: 'begin', slot: null },
  { id: `${txId}-read-from`, txId, type: 'read', account: fromAcc, slot: null },
  { id: `${txId}-read-to`, txId, type: 'read', account: toAcc, slot: null },
  { id: `${txId}-validate`, txId, type: 'validate', slot: null },
  { id: `${txId}-debit`, txId, type: 'debit', account: fromAcc, amount, slot: null },
  { id: `${txId}-credit`, txId, type: 'credit', account: toAcc, amount, slot: null },
  { id: `${txId}-commit`, txId, type: 'commit', slot: null }
];

// Fixture includes a lost-update double-spend potential, deadlock, and valid retry
const initialTransactions = [
  { id: 'tx1', attempt: 0, fromAccount: 'A', toAccount: 'B', amount: 30, status: 'pending', phases: generatePhases('tx1', 'A', 'B', 30) },
  { id: 'tx2', attempt: 0, fromAccount: 'A', toAccount: 'C', amount: 40, status: 'pending', phases: generatePhases('tx2', 'A', 'C', 40) },
  { id: 'tx3', attempt: 0, fromAccount: 'B', toAccount: 'C', amount: 10, status: 'pending', phases: generatePhases('tx3', 'B', 'C', 10) },
  { id: 'tx4', attempt: 0, fromAccount: 'C', toAccount: 'A', amount: 5,  status: 'pending', phases: generatePhases('tx4', 'C', 'A', 5)  },
];

const initialState = {
  accounts: initialAccounts,
  transactions: initialTransactions,
  strategy: 'none', // none, optimistic-version, pessimistic-lock, serializable
  decisions: [],
  currentStep: 0,
  maxStep: 0,
  history: [], // For undo/redo
  compareScenarios: [], // Two scenarios for comparison
  activeScenarioId: null,
  focusedNode: null,
  focusedEdge: null,
};

export const [state, setState] = createStore(initialState);

export const resetStore = () => {
  setState(reconcile(initialState));
};

export const updateStrategy = (newStrategy) => {
  setState('strategy', newStrategy);
  // Re-eval step 0 dependencies based on strategy logic...
};

export const movePhase = (txId, phaseId, slot) => {
  setState('transactions', (txs) => txs.map(tx => {
    if (tx.id === txId) {
      return {
        ...tx,
        phases: tx.phases.map(p => p.id === phaseId ? { ...p, slot } : p)
      };
    }
    return tx;
  }));
};
