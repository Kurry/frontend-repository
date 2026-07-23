import { useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  appStateAtom,
  importDataAtom,
  importMalformedDataAtom,
  malformedSample,
  recoveryAtom,
  validateWorkspaceDoc,
} from "../store";
import { toast } from "sonner";
import Modal from "./ui/modal";

export default function ImportExport() {
  const [state] = useAtom(appStateAtom);
  const [, importData] = useAtom(importDataAtom);
  const [, importMalformedData] = useAtom(importMalformedDataAtom);
  const [, setRecovery] = useAtom(recoveryAtom);
  const fileRef = useRef<HTMLInputElement>(null);
  const importBtnRef = useRef<HTMLButtonElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<unknown>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [restoreFocusEl, setRestoreFocusEl] = useState<HTMLElement | null>(null);

  const closeConfirm = () => {
    setShowConfirm(false);
    setPendingData(null);
  };

  const handleExport = () => {
    const data = {
      schemaVersion: "loopdaily.workspace.v1",
      exportedAt: new Date().toISOString(),
      habits: state.habits,
      categories: state.categories,
      activeCategoryFilter: state.activeCategoryFilter,
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
    toast.success("Data exported successfully!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        setPendingData(parsed);
        setRestoreFocusEl(importBtnRef.current);
        setShowConfirm(true);
        setImportResult(null);
      } catch {
        toast.error("Invalid JSON file. Please check the format.");
        setImportResult("Invalid JSON file. Import failed.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    const precheck = validateWorkspaceDoc(pendingData);
    if (precheck.length) {
      const message = precheck.join("; ");
      toast.error(`Import failed — field contract: ${precheck[0]}`);
      setImportResult(`Import failed — ${message}`);
      closeConfirm();
      return;
    }

    const result = importData(pendingData);
    if (result.success) {
      toast.success(`Imported ${result.habitCount} habits and ${result.categoryCount} categories!`);
      setImportResult(
        `Successfully imported ${result.habitCount} habits and ${result.categoryCount} categories.`
      );
    } else {
      const message = result.errors.join("; ") || "invalid data format";
      toast.error(`Import failed — ${message}`);
      setImportResult(`Import failed — ${message}`);
    }
    closeConfirm();
  };

  const handleLoadMalformed = () => {
    const result = importMalformedData(malformedSample);
    if (result.success) {
      const message = `Recovery import: imported ${result.habitCount} valid habits and ${result.categoryCount} valid categories. Invalid entries were skipped.`;
      setImportResult(message);
      setRecovery({
        active: true,
        message:
          "Malformed sample loaded. Some entries were skipped during recovery. Use Retry to restore your previous snapshot or Reset to clear all data.",
      });
      toast.info(`Malformed sample loaded. ${result.habitCount} valid habits recovered.`);
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
    <div className="bg-[#FFFFFF] rounded-[8px] p-4 md:p-6">
      <h2 className="text-lg font-bold text-[#1B2430] mb-2">Export and import</h2>
      <p className="text-sm text-[#64748B] mb-4">
        Export downloads your portable Workspace JSON. Import always asks for confirmation before
        current habits, categories, history, and filter are replaced.
      </p>

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
          ref={importBtnRef}
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
          onClick={(e) => { e.currentTarget.value = ""; }}
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
        <div
          role="alert"
          aria-live="assertive"
          className="mt-3 px-3 py-2 bg-[#F4F7F6] rounded-[8px] text-sm text-[#1B2430]"
        >
          {importResult}
        </div>
      )}

      <Modal
        open={showConfirm}
        onClose={closeConfirm}
        restoreFocus={restoreFocusEl}
        title="Confirm import"
        description="This will replace all your current habits, categories, history, and active filter with the imported Workspace JSON. Cancel leaves your current data untouched."
      >
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeConfirm}
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
            Replace and import
          </button>
        </div>
      </Modal>
    </div>
  );
}
