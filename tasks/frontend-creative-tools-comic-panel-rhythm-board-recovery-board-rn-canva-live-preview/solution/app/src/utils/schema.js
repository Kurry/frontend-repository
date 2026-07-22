export const validateSession = (data) => {
  if (!data || typeof data !== 'object') throw new Error("Invalid session data format");
  if (data.schemaVersion !== 'v1') throw new Error("Invalid schemaVersion, expected 'v1'");
  if (!Array.isArray(data.records)) throw new Error("Missing or invalid records array");

  const validStatuses = ['empty', 'draft', 'ready', 'changed', 'conflict', 'resolved'];
  const ids = new Set();

  for (const record of data.records) {
    if (!record.id || typeof record.id !== 'string') throw new Error("Invalid record id");
    if (ids.has(record.id)) throw new Error(`Duplicate record id: ${record.id}`);
    ids.add(record.id);

    if (typeof record.content !== 'string') throw new Error(`Invalid content in record ${record.id}`);
    if (typeof record.timing !== 'number' || record.timing < 0) throw new Error(`Invalid timing in record ${record.id}`);
    if (!validStatuses.includes(record.status)) throw new Error(`Invalid status in record ${record.id}`);
  }

  // Derived and history are optional or computed, but we check type if present
  if (data.history && !Array.isArray(data.history)) throw new Error("Invalid history array");

  return true;
};
