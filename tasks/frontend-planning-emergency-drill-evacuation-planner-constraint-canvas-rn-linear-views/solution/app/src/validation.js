import { STATUSES } from './store.js';

export function validateRecord(record) {
  const errors = {};

  if (!record.id || typeof record.id !== 'string') {
    errors.id = "ID is required and must be a string.";
  }

  if (!record.title || typeof record.title !== 'string' || record.title.trim() === '') {
    errors.title = "Title is required and must be a non-empty string.";
  }

  if (!record.location || typeof record.location !== 'string' || record.location.trim() === '') {
    errors.location = "Location is required and must be a non-empty string.";
  }

  if (record.expectedHeadcount === undefined || record.expectedHeadcount === null || typeof record.expectedHeadcount !== 'number' || record.expectedHeadcount < 0) {
    errors.expectedHeadcount = "Expected Headcount is required and must be a non-negative number.";
  }

  if (!STATUSES.includes(record.constraintCanvasState)) {
    errors.constraintCanvasState = `State must be one of: ${STATUSES.join(', ')}.`;
  }

  // Cross-field constraint: If ready, it must have a headcount > 0
  if (record.constraintCanvasState === 'ready' && record.expectedHeadcount <= 0) {
    errors.expectedHeadcount = "Ready records require an expected headcount greater than 0.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateExportDocument(doc) {
  const errors = {};

  if (doc.schemaVersion !== 'evacuation-drill-v1') {
    errors.schemaVersion = "schemaVersion must be 'evacuation-drill-v1'.";
  }

  if (!doc.exportedAt || isNaN(Date.parse(doc.exportedAt))) {
    errors.exportedAt = "exportedAt must be a valid RFC3339 date string.";
  }

  if (!Array.isArray(doc.records)) {
    errors.records = "records must be an array.";
  } else {
    const ids = new Set();
    doc.records.forEach((record, index) => {
      const recValidation = validateRecord(record);
      if (!recValidation.valid) {
        errors[`records[${index}]`] = Object.values(recValidation.errors).join(" ");
      }
      if (ids.has(record.id)) {
        errors[`records[${index}].id`] = `Duplicate ID found: ${record.id}`;
      }
      ids.add(record.id);
    });
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
