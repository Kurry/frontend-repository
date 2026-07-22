import { useAppStore } from '../store/store';

export function exportBatchJSON() {
  const state = useAppStore.getState();
  const payload = {
    schemaVersion: "allocation-reconciliation/v1",
    exportedAt: new Date().toISOString(),
    intents: state.intents,
    fills: state.fills,
    allocations: state.allocations,
    exceptions: state.exceptions,
    ruleOverrides: state.ruleOverrides,
    locates: state.locates
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'batch.json');
}

export function exportReconciliationCSV() {
  const state = useAppStore.getState();
  // Simplified CSV gen
  const header = "id,fillId,intentId,accountId,symbol,side,quantity,price,occurredAt\n";
  const rows = state.allocations.map(a => `${a.id},${a.fillId},${a.intentId},${a.accountId},${a.symbol},${a.side},${a.quantity},${a.price},${a.occurredAt}`).join("\n");
  const blob = new Blob([header + rows], { type: 'text/csv' });
  downloadBlob(blob, 'reconciliation.csv');
}

export function exportExceptionCSV() {
  const state = useAppStore.getState();
  const header = "id,rowId,rowType,reason\n";
  const rows = state.exceptions.map(e => `${e.id},${e.rowId},${e.rowType},${e.reason}`).join("\n");
  const blob = new Blob([header + rows], { type: 'text/csv' });
  downloadBlob(blob, 'exceptions.csv');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
