import { useMemo, useRef, useState } from "react";
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
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // The Workspace JSON document, compiled live from the store — the same
  // object Export as JSON downloads. Rendering it in the preview keeps the
  // schemaVersion, field-contract keys, and session mutations directly
  // observable in the browser.
  const workspaceDoc = useMemo(
    () => ({
      schemaVersion: "loopdaily.workspace.v1",
      exportedAt: new Date().toISOString(),
      habits: [...state.habits].sort((a, b) => a.order - b.order),
      categories: state.categories,
      activeCategoryFilter: state.activeCategoryFilter,
    }),
    [state]
  );
  const previewJson = useMemo(() => JSON.stringify(workspaceDoc, null, 2), [workspaceDoc]);

  const closeConfirm = () => {
    setShowConfirm(false);
    setPendingData(null);
    setPendingSummary(null);
  };

  const handleExport = () => {
    const doc = { ...workspaceDoc, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loopdaily-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Workspace JSON exported");
  };

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewJson);
      toast.success("Workspace JSON copied to clipboard");
    } catch {
      toast.error("Copy failed — your browser blocked clipboard access");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const errors = validateWorkspaceDoc(parsed);
        if (errors.length) {
          // Field-contract failure: nothing is replaced; the offending field is
          // named in the alert live region.
          toast.error(`Import rejected — ${errors[0]}`);
          setImportResult(`Import rejected — ${errors.join("; ")}. Your current data is unchanged.`);
          closeConfirm();
          return;
        }
        const doc = parsed as { habits?: unknown[]; categories?: unknown[] };
        setPendingData(parsed);
        setPendingSummary(
          `File contains ${doc.habits?.length ?? 0} habits and ${doc.categories?.length ?? 0} categories.`
        );
        setImportResult(null);
        setShowConfirm(true);
      } catch {
        toast.error("Invalid JSON file. Please check the format.");
        setImportResult("Import rejected — the file is not valid JSON. Your current data is unchanged.");
        closeConfirm();
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    const result = importData(pendingData);
    if (result.success) {
      toast.success(`Imported ${result.habitCount} habits and ${result.categoryCount} categories!`);
      setImportResult(
        `Successfully imported ${result.habitCount} habits and ${result.categoryCount} categories.`
      );
    } else {
      const message = result.errors.join("; ") || "invalid data format";
      toast.error(`Import rejected — ${message}`);
      setImportResult(`Import rejected — ${message}. Your current data is unchanged.`);
    }
    closeConfirm();
  };

  const handleLoadMalformed = () => {
    const result = importMalformedData(malformedSample);
    if (result.success) {
      const detail = result.notes.length
        ? ` Details: ${result.notes.slice(0, 4).join("; ")}.`
        : "";
      const message = `Recovery outcome: kept ${result.habitCount} valid habits and ${result.categoryCount} valid categories; ${result.skippedCount} entries were skipped and ${result.repairedCount} were repaired.${detail}`;
      setImportResult(message);
      setRecovery({
        active: true,
        message:
          "Malformed sample loaded. Some entries were skipped or repaired during recovery. Use Retry to restore your previous snapshot or Reset to clear all data.",
      });
      toast.info(`Malformed sample loaded. ${result.habitCount} valid habits recovered.`);
    } else {
      setImportResult("Recovery outcome: no valid data could be recovered from the malformed sample.");
      setRecovery({
        active: true,
        message:
          "Malformed sample could not be imported. Use Retry to restore your previous snapshot or Reset to clear all data.",
      });
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-[8px] p-4 md:p-6">
      <h2 className="text-xl font-bold text-[#1B2430] mb-2">Export and import</h2>
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
          onClick={() => {
            setPendingData(null);
            setPendingSummary(null);
            setShowConfirm(true);
          }}
          className="btn-secondary px-4 py-2 text-sm font-medium"
          data-action="import-trigger"
        >
          Import from JSON
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
          onClick={() => setShowPreview((v) => !v)}
          className="btn-secondary px-4 py-2 text-sm font-medium"
          aria-expanded={showPreview}
          data-action="toggle-preview"
        >
          {showPreview ? "Hide JSON preview" : "Preview workspace JSON"}
        </button>

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

      {showPreview && (
        <div className="mb-3 rounded-[8px] border border-[#E2E8F0] bg-[#F4F7F6]">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#64748B]">
              Live Workspace JSON — exactly what Export as JSON downloads
            </span>
            <button
              type="button"
              onClick={handleCopyPreview}
              className="btn-secondary px-3 py-1 text-xs font-medium min-h-8"
              data-action="copy-preview"
            >
              Copy preview
            </button>
          </div>
          <pre
            className="max-h-80 overflow-auto px-3 py-2 text-xs leading-relaxed text-[#1B2430] whitespace-pre"
            data-export-preview
          >
            {previewJson}
          </pre>
        </div>
      )}

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
        restoreFocus={importBtnRef.current}
        title="Confirm import"
        description={
          pendingData
            ? `${pendingSummary ?? ""} Importing will replace all your current habits, categories, history, and active filter. Cancel leaves your current data untouched.`
            : "Importing a Workspace JSON file will replace all your current habits, categories, history, and active filter. Cancel leaves your current data untouched."
        }
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
          {pendingData ? (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="btn-primary px-4 py-2 text-sm font-medium"
              data-action="confirm-import"
            >
              Replace and import
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-primary px-4 py-2 text-sm font-medium"
              data-action="choose-import-file"
            >
              Choose file to import
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
