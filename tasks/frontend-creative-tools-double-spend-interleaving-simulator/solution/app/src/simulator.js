// simulator.js: Deterministic step-by-step execution

import { detectConflicts, isAcyclic } from './engine.js';

export function simulateSteps(transactions, accounts, strategy, maxSlot) {
  let accState = JSON.parse(JSON.stringify(accounts));
  let txState = JSON.parse(JSON.stringify(transactions));

  let history = []; // array of { step, accState, txState }
  history.push({ step: 0, accState: JSON.parse(JSON.stringify(accState)), txState: JSON.parse(JSON.stringify(txState)) });

  // Evaluate execution step by step (slot 1 to maxSlot)
  for (let slot = 1; slot <= maxSlot; slot++) {
    // Find phases scheduled at this slot
    let currentPhases = [];
    txState.forEach(tx => {
      let p = tx.phases.find(ph => ph.slot === slot);
      if (p) currentPhases.push({ ...p, txId: tx.id });
    });

    // Sort by txId to ensure deterministic lane order execution
    currentPhases.sort((a, b) => a.txId.localeCompare(b.txId));

    for (let phase of currentPhases) {
      let tx = txState.find(t => t.id === phase.txId);
      if (tx.status === 'cancelled' || tx.status === 'invalid') continue;

      tx.status = 'running';

      if (phase.type === 'debit') {
        let acc = accState.find(a => a.id === phase.account);
        acc.balance -= phase.amount;
      } else if (phase.type === 'credit') {
        let acc = accState.find(a => a.id === phase.account);
        acc.balance += phase.amount;
      } else if (phase.type === 'commit') {
        if (strategy === 'optimistic-version') {
          // Version check logic (simplified)
          tx.status = 'committed';
        } else {
          tx.status = 'committed';
        }
        // Increment versions for written accounts
        let writes = tx.phases.filter(p => (p.type === 'debit' || p.type === 'credit') && p.slot !== null);
        let updatedAccs = new Set(writes.map(w => w.account));
        updatedAccs.forEach(accId => {
           let a = accState.find(x => x.id === accId);
           if (a) a.version += 1;
        });
      }
    }

    // Invariants Check
    let totalBalance = accState.reduce((sum, acc) => sum + acc.balance, 0);
    let hasNegative = accState.some(acc => acc.balance < 0);

    history.push({
      step: slot,
      accState: JSON.parse(JSON.stringify(accState)),
      txState: JSON.parse(JSON.stringify(txState)),
      invariants: { totalBalance, hasNegative }
    });
  }

  const conflicts = detectConflicts(transactions, strategy);
  const serializability = isAcyclic(conflicts.edges);

  return { history, conflicts, serializability };
}
