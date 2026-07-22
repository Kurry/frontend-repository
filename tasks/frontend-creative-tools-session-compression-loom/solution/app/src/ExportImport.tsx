import { type Component, createSignal } from 'solid-js';
import { state, setState } from './store';

export const ExportImport: Component = () => {
  const [jsonText, setJsonText] = createSignal('');

  const handleExport = () => {
    const pack = {
      schemaVersion: "compressed-session-pack/v1",
      exportedAt: new Date().toISOString(),
      cap: state.cap,
      capsules: state.capsules,
    };
    setJsonText(JSON.stringify(pack, null, 2));
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText());
      if (data.schemaVersion === "compressed-session-pack/v1") {
        setState('capsules', data.capsules || []);
        if (data.cap) setState('cap', data.cap);
        alert('Import successful');
      } else {
        alert('Invalid schema version');
      }
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  return (
    <div class="border border-slate-700 p-4 mt-4">
      <h2 class="text-xl font-bold mb-4">Export / Import</h2>
      <div class="flex gap-2 mb-2">
        <button class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded" onClick={handleExport}>Export</button>
        <button class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded" onClick={handleImport}>Import</button>
      </div>
      <textarea
        class="w-full h-32 bg-slate-800 border border-slate-600 rounded p-2 text-xs font-mono"
        value={jsonText()}
        onInput={(e) => setJsonText(e.currentTarget.value)}
        placeholder="JSON data will appear here..."
      />
    </div>
  );
};
