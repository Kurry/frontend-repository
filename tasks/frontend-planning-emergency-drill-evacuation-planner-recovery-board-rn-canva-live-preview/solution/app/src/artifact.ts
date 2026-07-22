import { formatISO } from 'date-fns';
import { EmergencyDrillEvacuationPlannerSessionSchema } from './types';
import type { EmergencyDrillEvacuationPlannerSession } from './types';
import { useStore, getDerivedState } from './store';

export function exportArtifact(): string {
  const state = useStore.getState();
  const derived = getDerivedState(state.records);

  const artifact: EmergencyDrillEvacuationPlannerSession = {
    schemaVersion: 'v1',
    exportedAt: formatISO(new Date()),
    records: state.records,
    derived: derived,
    history: state.history,
  };

  return JSON.stringify(artifact, null, 2);
}

export function downloadArtifact() {
  const json = exportArtifact();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'evacuation-drill-v1-recovery-board.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importArtifact(jsonString: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const parsed = EmergencyDrillEvacuationPlannerSessionSchema.safeParse(data);

    if (!parsed.success) {
      return { success: false, error: parsed.error.message };
    }

    const validatedData = parsed.data;

    const ids = new Set<string>();
    for (const record of validatedData.records) {
      if (ids.has(record.id)) {
        return { success: false, error: `Duplicate ID found: ${record.id}` };
      }
      ids.add(record.id);
    }

    useStore.getState().importSession({
        ...validatedData,
        exportedAt: formatISO(new Date())
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Invalid JSON' };
  }
}
