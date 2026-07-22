export function exportArtifact(patterns) {
  const artifact = {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: patterns,
    derived: {
      summary: {
        total: patterns.length,
        changed: patterns.filter(p => p.status === 'changed').length,
        ready: patterns.filter(p => p.status === 'ready').length
      }
    }
  };

  const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'drum-pattern-v1-forecast-ribbon.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importArtifact(fileContent, currentPatterns) {
  try {
    const data = JSON.parse(fileContent);
    if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
    if (!Array.isArray(data.records)) throw new Error('Missing or invalid records array');

    const ids = new Set();
    const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];

    for (const record of data.records) {
      if (!record.id) throw new Error('Missing record ID');
      if (ids.has(record.id)) throw new Error(`Duplicate record ID: ${record.id}`);
      ids.add(record.id);

      if (!validStatuses.includes(record.status)) throw new Error(`Invalid status enum on record ${record.id}`);
      if (typeof record.tempo !== 'number' || record.tempo < 60 || record.tempo > 200) throw new Error(`Invalid tempo on record ${record.id}`);
    }

    return data.records;
  } catch (err) {
    console.error('Artifact import failed:', err.message);
    return currentPatterns;
  }
}
