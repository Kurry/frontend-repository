export const exportSession = (sessionData) => {
  const data = {
    ...sessionData,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'practice-loop-v1-replay-timeline.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const validateImport = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (data.schemaVersion !== 'v1') return false;
  if (!Array.isArray(data.records)) return false;
  if (!data.derived || typeof data.derived !== 'object') return false;
  if (!Array.isArray(data.history)) return false;

  const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived', 'conflict'];
  const ids = new Set();
  for (const record of data.records) {
    if (!record.id || ids.has(record.id)) return false;
    ids.add(record.id);
    if (!validStatuses.includes(record.status)) return false;
  }
  return true;
};
