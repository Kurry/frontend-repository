import { STATUSES } from '../store';

export function createExportPayload(state) {
  return {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: state.records,
    derived: state.derived,
    history: state.history
  };
}

export function validateImportPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error("Invalid payload format");
  }
  if (payload.schemaVersion !== 'v1') {
    throw new Error("Invalid schemaVersion");
  }

  if (!Array.isArray(payload.records)) {
    throw new Error("Records must be an array");
  }

  const ids = new Set();
  for (const r of payload.records) {
    if (!r.id || typeof r.title !== 'string') {
      throw new Error("Missing required record fields");
    }
    if (ids.has(r.id)) {
      throw new Error("Duplicate record ID found");
    }
    ids.add(r.id);

    if (typeof r.measurement !== 'number' || r.measurement < 0 || r.measurement > 200) {
      throw new Error("Invalid measurement bounds");
    }
    if (!STATUSES.includes(r.status)) {
      throw new Error(`Invalid status: ${r.status}`);
    }
  }

  return {
    ...payload,
    exportedAt: new Date().toISOString() // Regenerate on valid import
  };
}
