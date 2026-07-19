import { useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  appStateAtom,
  importDataAtom,
  addToastAtom,
  malformedSample,
  recoveryAtom,
} from "../store";

export default function ImportExport() {
  const [state] = useAtom(appStateAtom);
  const [, importData] = useAtom(importDataAtom);
  const [, addToast] = useAtom(addToastAtom);
  const [, setRecovery] = useAtom(recoveryAtom);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<unknown>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleExport = () => {
    const data = {
      habits: state.habits,
      categories: state.categories,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loopdaily-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Data exported successfully!", "success");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        setPendingData(parsed);
        setShowConfirm(true);
        setImportResult(null);
      } catch {
        addToast("Invalid JSON file. Please check the format.", "error");
        setImportResult("Invalid JSON file. Import failed.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    const result = importData(pendingData);
    if (result.success) {
      addToast(`Imported ${result.habitCount} habits and ${result.categoryCount} categories!`, "success");
      setImportResult(
        `Successfully imported ${result.habitCount} habits and ${result.categoryCount} categories.`
      );
    } else {
      addToast("Import failed — invalid data format.", "error");
      setImportResult("Import failed — no valid habits found in the file.");
    }
    setShowConfirm(false);
    setPendingData(null);
  };

  const handleLoadMalformed = () => {
    const result = importData(malformedSample);
    if (result.success) {
      const message = `Recovery import: imported ${result.habitCount} valid habits and ${result.categoryCount} valid categories. Invalid entries were skipped.`;
      setImportResult(message);
      setRecovery({
        active: true,
        message:
          "Malformed sample loaded. Some entries were skipped during recovery. Use Retry to restore your previous snapshot or Reset to clear all data.",
      });
      addToast(`Malformed sample loaded. ${result.habitCount} valid habits recovered.`, "info");
    } else {
      setImportResult("Recovery import: no valid data could be recovered from the malformed sample.");
      setRecovery({
        active: true,
        message:
          "Malformed sample could not be imported. Use Retry to restore your previous snapshot or Reset to clear all data.",
      });
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-lg p-4 md:p-6">
      <h2 className="text-lg font-bold text-[#1B2430] mb-4">Export and import</h2>

      <div className="flex flex-wrap gap-3 mb-3">
        <button
          type="button"
          onClick={handleExport}
          className="btn-primary px-4 py-2 text-sm font-medium"
          data-action="export"
        >
          Export as JSON
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-secondary px-4 py-2 text-sm font-medium"
          data-action="import-trigger"
        >
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import JSON file"
          data-field="import-file"
        />

        <button
          type="button"
          onClick={handleLoadMalformed}
          className="btn-danger px-4 py-2 text-sm font-medium"
          title="Load a deliberately malformed sample to test data recovery"
          data-action="load-malformed"
        >
          Load Malformed Sample
        </button>
      </div>

      {importResult && (
        <div role="alert" aria-live="assertive" className="mt-3 px-3 py-2 bg-[#F4F7F6] rounded-lg text-sm text-[#1B2430]">
          {importResult}
        </div>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#1B2430] mb-2">Confirm import</h3>
            <p className="text-sm text-[#475569] mb-4">
              This will replace all your current habits and categories with the imported data. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setPendingData(null);
                }}
                className="btn-secondary px-4 py-2 text-sm"
                data-action="cancel-import"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="btn-primary px-4 py-2 text-sm font-medium"
                data-action="confirm-import"
              >
                Import & replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
