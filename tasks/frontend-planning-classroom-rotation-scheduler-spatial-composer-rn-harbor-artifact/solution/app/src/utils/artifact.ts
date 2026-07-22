import type { ClassroomRotationSchedulerSession } from '../types';

export const validateArtifact = (data: any): data is ClassroomRotationSchedulerSession => {
  if (!data || typeof data !== 'object') return false;
  if (data.schemaVersion !== 'v1') return false;

  if (!Array.isArray(data.records)) return false;

  const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
  const seenIds = new Set<string>();

  for (const record of data.records) {
    if (typeof record.id !== 'string') return false;
    if (seenIds.has(record.id)) return false;
    seenIds.add(record.id);

    if (typeof record.title !== 'string') return false;
    if (!validStatuses.includes(record.status)) return false;
    if (typeof record.capacity !== 'number' || record.capacity < 0) return false;
    if (typeof record.studentsAssigned !== 'number' || record.studentsAssigned < 0) return false;

    if (record.position) {
      if (typeof record.position.x !== 'number' || typeof record.position.y !== 'number') return false;
    }
  }

  if (!data.derived || typeof data.derived !== 'object') return false;
  if (typeof data.derived.totalCapacity !== 'number') return false;
  if (typeof data.derived.totalStudentsAssigned !== 'number') return false;
  if (!['balanced', 'over_capacity', 'under_capacity'].includes(data.derived.overallStatus)) return false;
  if (typeof data.derived.readyStationsCount !== 'number') return false;

  return true;
};

export const exportArtifact = (state: ClassroomRotationSchedulerSession) => {
  const exportData = {
    ...state,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `classroom-rotations-v1.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
