import React, { useRef, useState } from 'react';
import { useJournalStore, SessionSchema } from './store';

export function ArtifactTransfer() {
  const records = useJournalStore(state => state.records);
  const derived = useJournalStore(state => state.derived);
  const importSession = useJournalStore(state => state.importSession);
  const clearSession = useJournalStore(state => state.clearSession);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const session = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history: []
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plant-growth-v1-batch-reconciler.json';
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
        const result = SessionSchema.safeParse(json);
        if (result.success) {
          // Regenerate timestamp as per requirements
          const validatedSession = {
             ...result.data,
             exportedAt: new Date().toISOString()
          };
          clearSession();
          importSession(validatedSession);
          setError(null);
        } else {
          setError("Malformed Import: Invalid schema, missing required fields, or out of bounds values.");
        }
      } catch (err) {
        setError("Failed to parse JSON file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg border border-border mt-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold">Session Artifact</h2>
        {error && <p className="text-destructive text-sm mt-1">{error}</p>}
      </div>
      <div className="flex gap-2">
         <button
           onClick={handleExport}
           className="border px-4 py-2 rounded"
         >
           Export Session
         </button>
         <input
           type="file"
           accept=".json"
           className="hidden"
           ref={fileInputRef}
           onChange={handleImport}
           id="import-file"
         />
         <label
           htmlFor="import-file"
           className="bg-secondary text-secondary-foreground px-4 py-2 rounded cursor-pointer inline-block"
         >
           Import Session
         </label>
      </div>
    </div>
  );
}
