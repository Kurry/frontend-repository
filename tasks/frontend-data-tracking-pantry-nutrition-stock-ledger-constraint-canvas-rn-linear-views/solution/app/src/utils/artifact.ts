import type { AppState } from "../store";
import type { PantryNutritionStockLedgerSession, DomainStatus } from "../types";

export const exportArtifact = (state: AppState) => {
  const lanes: DomainStatus[] = ["empty", "draft", "ready", "changed", "archived"];
  const derived = {
    summary: {
      totalIngredients: state.records.length,
      statusCounts: lanes.reduce((acc, lane) => {
        acc[lane] = state.records.filter((r) => r.status === lane).length;
        return acc;
      }, {} as Record<DomainStatus, number>)
    }
  };

  const artifact: PantryNutritionStockLedgerSession = {
    schemaVersion: "nutrition-stock-v1",
    exportedAt: new Date().toISOString(),
    records: state.records,
    derived,
    history: state.history
  };

  const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nutrition-stock-v1-constraint-canvas.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importArtifact = (file: File, dispatch: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);

      // Validation
      if (data.schemaVersion !== "nutrition-stock-v1") {
        alert("Import Error: schemaVersion must be nutrition-stock-v1");
        return;
      }
      if (!Array.isArray(data.records) || !data.derived || !Array.isArray(data.history)) {
        alert("Import Error: Missing required fields (records, derived, history)");
        return;
      }

      const seenIds = new Set();
      for (const record of data.records) {
        if (!record.id || !record.name || record.quantity === undefined || !record.unit || !record.status) {
          alert(`Import Error: Missing required fields on record`);
          return;
        }
        if (record.quantity < 0) {
          alert(`Import Error: Quantity must be >= 0 for record ${record.name}`);
          return;
        }
        if (!["empty", "draft", "ready", "changed", "archived"].includes(record.status)) {
          alert(`Import Error: Invalid status ${record.status} on record ${record.name}`);
          return;
        }
        if (seenIds.has(record.id)) {
          alert(`Import Error: Duplicate record ID ${record.id}`);
          return;
        }
        seenIds.add(record.id);
      }

      const newState: AppState = {
        records: data.records,
        history: data.history,
        undoStack: [],
        selectedRecordId: null,
      };

      dispatch({ type: "IMPORT_STATE", payload: newState });

    } catch (err) {
      alert("Import Error: Malformed JSON");
    }
  };
  reader.readAsText(file);
};
