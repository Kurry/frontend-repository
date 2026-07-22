import { useStore, getDerivedState } from '../store';
import type { Session } from '../types';
import { SessionSchema as SessionSchemaValidator } from '../types';

export const exportSession = (): Session => {
  const state = useStore.getState();
  const derived = getDerivedState();

  return {
    schemaVersion: 'glaze-atlas-session-v1',
    exportedAt: new Date().toISOString(),
    records: state.records,
    derived,
    history: state.history
  };
};

export const validateAndImportSession = (jsonString: string): { success: boolean; error?: string } => {
  try {
    const data = JSON.parse(jsonString);
    const result = SessionSchemaValidator.safeParse(data);

    if (!result.success) {
      const fieldError = result.error.issues[0];
      return { success: false, error: `Invalid import: ${fieldError.path.join('.')} - ${fieldError.message}` };
    }

    // Check for duplicate IDs
    const ids = new Set<string>();
    for (const record of result.data.records) {
      if (ids.has(record.id)) {
        return { success: false, error: `Invalid import: Duplicate record ID ${record.id}` };
      }
      ids.add(record.id);
    }

    useStore.getState().importSession({
        ...result.data,
        exportedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: "Invalid import: Malformed JSON" };
  }
};
