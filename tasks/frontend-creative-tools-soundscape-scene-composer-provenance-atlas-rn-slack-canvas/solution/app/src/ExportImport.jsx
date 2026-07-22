import React, { useRef } from "react";
import { Download, Upload } from "lucide-react";

export default function ExportImport({ state, onImport }) {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const exportState = {
      ...state,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "soundscape-scene-v1-provenance-atlas.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Field-level schema validation
        if (data.schemaVersion !== "soundscape-scene-v1") throw new Error("Invalid schemaVersion");
        if (!Array.isArray(data.records)) throw new Error("Missing records array");

        const ids = new Set();
        data.records.forEach(r => {
          if (!r.id || !r.name || typeof r.volume !== 'number' || !r.status || !r.provenanceAtlasState) {
            throw new Error("Malformed record schema");
          }
          if (ids.has(r.id)) throw new Error("Duplicate IDs found");
          ids.add(r.id);
        });

        if (!data.derived || !data.derived.summary) throw new Error("Missing derived summary");

        // Valid, push to app
        onImport(data);
      } catch (err) {
        alert(`Import failed: ${err.message}. No state changes made.`);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] hover:bg-gray-50 rounded text-sm transition-colors shadow-sm"
      >
        <Download size={14} /> Export
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] hover:bg-gray-50 rounded text-sm transition-colors shadow-sm"
      >
        <Upload size={14} /> Import
      </button>
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
      />
    </div>
  );
}
