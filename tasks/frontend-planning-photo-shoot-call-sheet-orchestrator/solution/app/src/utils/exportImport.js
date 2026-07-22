export function exportCanonicalJson(state) {
  const payload = {
    schemaVersion: "photo-shoot-plan/v1",
    exportedAt: new Date().toISOString(),
    locations: state.locations,
    shots: state.shots,
    resources: state.resources,
    personas: state.personas,
    releases: state.releases,
    handoffs: state.handoffs,
    disruptions: state.disruptions,
    branches: state.branches,
    currentBranchId: state.currentBranchId
  };
  return JSON.stringify(payload, null, 2);
}

export function parseImportJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.schemaVersion !== "photo-shoot-plan/v1") {
      throw new Error("Invalid schema version");
    }
    return data;
  } catch (err) {
    throw new Error("Failed to parse or validate import JSON");
  }
}
