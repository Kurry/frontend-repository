import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { RecipeFlavorBalanceStudioSessionSchema } from '../schema';
import { Download, Upload, Undo2 } from 'lucide-react';

export function ArtifactActions() {
  const { records, undo, history, clearAndImport } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const avgProfile = records.reduce((acc, r) => {
      acc.sweetness += r.profile.sweetness;
      acc.acidity += r.profile.acidity;
      acc.saltiness += r.profile.saltiness;
      acc.bitterness += r.profile.bitterness;
      acc.umami += r.profile.umami;
      return acc;
    }, { sweetness: 0, acidity: 0, saltiness: 0, bitterness: 0, umami: 0 });

    if (records.length > 0) {
      avgProfile.sweetness /= records.length;
      avgProfile.acidity /= records.length;
      avgProfile.saltiness /= records.length;
      avgProfile.bitterness /= records.length;
      avgProfile.umami /= records.length;
    }

    const payload = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records,
      history,
      derived: {
        total_components: records.length,
        average_profile: avgProfile
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "flavor-balance-v1.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Check exact schema via zod
        const result = RecipeFlavorBalanceStudioSessionSchema.safeParse(json);

        if (!result.success) {
          console.error(result.error);
          setError("Malformed import: " + result.error.message);
          return;
        }

        // Must validate unique IDs
        const ids = result.data.records.map(r => r.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          setError("Malformed import: Duplicate IDs found");
          return;
        }

        // Success - clear and import, regenerate exportedAt (business requirement)
        setError(null);
        clearAndImport({
          ...result.data,
          exportedAt: new Date().toISOString(), // regenerate
        });

      } catch (err) {
        setError("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-red-400 text-sm font-medium mr-2">{error}</span>}
      <button
        onClick={undo}
        disabled={history.length === 0}
        className="flex items-center gap-2 text-zinc-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 p-2 rounded-full transition-colors"
        title="Undo last mutation"
        aria-label="Undo"
      >
        <Undo2 size={20} />
      </button>

      <div className="h-6 w-px bg-zinc-700 mx-1" />

      <button
        onClick={handleExport}
        className="flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 p-2 rounded transition-colors text-sm font-semibold"
        aria-label="Export Session"
      >
        <Download size={18} />
        Export
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 p-2 rounded transition-colors text-sm font-semibold"
        aria-label="Import Session"
      >
        <Upload size={18} />
        Import
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
