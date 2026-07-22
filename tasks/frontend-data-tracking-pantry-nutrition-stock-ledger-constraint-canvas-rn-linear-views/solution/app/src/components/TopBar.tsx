import React from "react";
import { useAppStore } from "../store";
import { Undo, Download, Upload } from "lucide-react";
import { exportArtifact, importArtifact } from "../utils/artifact";

export const TopBar = () => {
  const { state, dispatch } = useAppStore();

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleExport = () => {
    exportArtifact(state);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importArtifact(file, dispatch);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
      <h1 className="text-xl font-bold tracking-tight text-slate-800">Pantry Stock Ledger</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={handleUndo}
          disabled={state.undoStack.length === 0}
          className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded hover:bg-slate-100"
        >
          <Download size={16} /> Export
        </button>
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded hover:bg-slate-100 cursor-pointer">
          <Upload size={16} /> Import
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </div>
    </header>
  );
};
