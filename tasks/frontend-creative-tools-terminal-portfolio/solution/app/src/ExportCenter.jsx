import { useState } from 'preact/hooks';
import { projects, mode, theme, identity } from './store.js';

export default function ExportCenter() {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const jsonPreview = JSON.stringify({
    schemaVersion: 1,
    identity: identity.value,
    projects: projects.value
  }, null, 2);

  const cssPreview = `/* Generated Theme */\n:root {\n  --theme: ${theme.value};\n}`;
  const configPreview = `export const config = ${JSON.stringify(identity.value, null, 2)};`;

  const handleImport = () => {
    try {
       const parsed = JSON.parse(importText);
       if (parsed.schemaVersion && parsed.projects) {
          projects.value = parsed.projects;
          if (parsed.identity) identity.value = parsed.identity;
          setImportError("");
          alert("Import successful!");
       } else {
          setImportError("Invalid JSON schema. Missing projects or schemaVersion.");
       }
    } catch(err) {
       setImportError("Invalid JSON: " + err.message);
    }
  };

  return (
    <div className="h-full overflow-y-auto relative p-4 text-text-main flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">Export Center</h2>
        <button className="btn btn-sm btn-ghost" onClick={() => mode.value = 'board'}>&larr; Back to Board</button>
      </div>

      <div className="bg-base-200 p-4 rounded border border-border">
         <h3 className="font-bold mb-2">Import Portfolio JSON</h3>
         <textarea className="textarea textarea-bordered w-full h-24 font-mono text-xs" value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste JSON here..."></textarea>
         {importError && <p className="text-error text-xs mt-1">{importError}</p>}
         <button className="btn btn-primary btn-sm mt-2" onClick={handleImport}>Import JSON</button>
      </div>

      <div>
        <h3 className="font-bold mb-2">Portfolio JSON</h3>
        <pre className="bg-base-300 p-4 rounded text-xs overflow-x-auto">{jsonPreview}</pre>
      </div>

      <div>
        <h3 className="font-bold mb-2">Terminal Config</h3>
        <pre className="bg-base-300 p-4 rounded text-xs overflow-x-auto">{configPreview}</pre>
      </div>

      <div>
        <h3 className="font-bold mb-2">Theme CSS</h3>
        <pre className="bg-base-300 p-4 rounded text-xs overflow-x-auto">{cssPreview}</pre>
      </div>
    </div>
  );
}
