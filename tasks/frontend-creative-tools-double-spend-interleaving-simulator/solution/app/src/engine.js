// engine.js: Rules for isolation strategies and conflict detection

export function detectConflicts(transactions, strategy) {
  let edges = []; // { sourceId, targetId, type: 'RW' | 'WR' | 'WW', account }
  let waits = []; // { txId, waitForTxId, resource }

  // Extract all scheduled phases ordered by slot, then by lane (tx index)
  let scheduled = [];
  transactions.forEach((tx, txIndex) => {
    tx.phases.forEach(p => {
      if (p.slot !== null) {
        scheduled.push({ ...p, txIndex, txStatus: tx.status });
      }
    });
  });

  scheduled.sort((a, b) => {
    if (a.slot === b.slot) return a.txIndex - b.txIndex;
    return a.slot - b.slot;
  });

  let lastWrite = {}; // acc -> { txId, phaseId, slot }
  let lastRead = {};  // acc -> [{ txId, phaseId, slot }]

  for (let phase of scheduled) {
    if (phase.txStatus === 'cancelled' || phase.txStatus === 'invalid') continue;

    if (phase.type === 'read' && phase.account) {
      const acc = phase.account;
      if (lastWrite[acc] && lastWrite[acc].txId !== phase.txId) {
        edges.push({
          sourceId: lastWrite[acc].phaseId,
          targetId: phase.id,
          type: 'WR',
          account: acc
        });
      }
      if (!lastRead[acc]) lastRead[acc] = [];
      lastRead[acc].push({ txId: phase.txId, phaseId: phase.id, slot: phase.slot });
    }

    if ((phase.type === 'debit' || phase.type === 'credit') && phase.account) {
      const acc = phase.account;
      if (lastWrite[acc] && lastWrite[acc].txId !== phase.txId) {
        edges.push({
          sourceId: lastWrite[acc].phaseId,
          targetId: phase.id,
          type: 'WW',
          account: acc
        });
      }
      if (lastRead[acc]) {
        lastRead[acc].forEach(lr => {
          if (lr.txId !== phase.txId) {
            edges.push({
              sourceId: lr.phaseId,
              targetId: phase.id,
              type: 'RW',
              account: acc
            });
          }
        });
      }
      lastWrite[acc] = { txId: phase.txId, phaseId: phase.id, slot: phase.slot };
    }
  }

  // Strategy specific waits (pessimistic lock)
  if (strategy === 'pessimistic-lock') {
    // Basic strict 2PL simulation for waits
    let locks = {}; // acc -> ownerTxId
    for (let phase of scheduled) {
      if (['read', 'debit', 'credit'].includes(phase.type) && phase.account) {
         if (locks[phase.account] && locks[phase.account] !== phase.txId) {
            waits.push({ txId: phase.txId, waitForTxId: locks[phase.account], resource: phase.account });
         } else {
            locks[phase.account] = phase.txId;
         }
      }
      if (phase.type === 'commit') {
         // release locks
         Object.keys(locks).forEach(k => {
           if (locks[k] === phase.txId) delete locks[k];
         });
      }
    }
  }

  return { edges, waits };
}

export function isAcyclic(edges) {
  const adj = {};
  edges.forEach(e => {
    const u = e.sourceId.split('-')[0];
    const v = e.targetId.split('-')[0];
    if (u === v) return;
    if (!adj[u]) adj[u] = [];
    if (!adj[u].includes(v)) adj[u].push(v);
  });

  const visited = new Set();
  const recStack = new Set();
  let cycle = null;

  function dfs(node, path) {
    if (recStack.has(node)) {
      cycle = path.slice(path.indexOf(node));
      return false;
    }
    if (visited.has(node)) return true;

    visited.add(node);
    recStack.add(node);
    path.push(node);

    if (adj[node]) {
      for (let neighbor of adj[node]) {
        if (!dfs(neighbor, path)) return false;
      }
    }

    recStack.delete(node);
    path.pop();
    return true;
  }

  for (let node of Object.keys(adj)) {
    if (!visited.has(node)) {
      if (!dfs(node, [])) return { acyclic: false, cycle };
    }
  }

  return { acyclic: true };
}
