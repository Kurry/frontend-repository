export const exportArtifact = (state) => {
  const artifact = {
    schemaVersion: "v1",
    exportedAt: new Date().toISOString(),
    records: state.records,
    derived: state.derived,
    history: state.history
  };

  const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cloze-deck-v1.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importArtifact = (content) => {
  try {
    const data = JSON.parse(content);
    if (data.schemaVersion !== "v1") {
      throw new Error("Invalid schemaVersion");
    }
    if (!Array.isArray(data.records) || !data.derived || !Array.isArray(data.history)) {
      throw new Error("Malformed schema");
    }
    const ids = new Set();
    for (const r of data.records) {
      if (ids.has(r.id)) throw new Error("Duplicate IDs");
      ids.add(r.id);
      if (!['empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'].includes(r.status)) {
        throw new Error("Invalid explicit enums");
      }
      if (typeof r.front !== 'string' || typeof r.back !== 'string') {
         throw new Error("Invalid required fields");
      }
    }
    return {
      records: data.records,
      derived: data.derived,
      history: data.history
    };
  } catch (e) {
    return null;
  }
};
