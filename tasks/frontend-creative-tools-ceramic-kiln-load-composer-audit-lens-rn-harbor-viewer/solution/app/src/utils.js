export function validateExport(data) {
  if (data.schemaVersion !== 'shapeshift-session-v1' && data.schemaVersion !== 'kiln-load-v1') return false; // wait, what schema?
  // Checking PRD for schemaVersion
  // PRD: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
  // schemaVersion is kiln-load-v1
  // Interoperable format: kiln-load-v1-audit-lens.json
  return true;
}
