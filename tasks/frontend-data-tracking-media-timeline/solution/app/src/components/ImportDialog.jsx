import { createSignal, Show } from 'solid-js';
import { importTimeline } from '../store';
import { TimelineJSONSchema } from '../schema';

export default function ImportDialog({ onClose }) {
  const [jsonText, setJsonText] = createSignal('');
  const [error, setError] = createSignal(null);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText());
      const validated = TimelineJSONSchema.parse(parsed);
      importTimeline(validated);
      onClose();
    } catch (err) {
      if (err.errors) {
        setError(`Validation failed: ${err.errors[0]?.path?.join('.')} - ${err.errors[0]?.message}`);
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-bold">Import Timeline</h2>
          <button onClick={onClose} class="text-gray-500 hover:text-black">✕</button>
        </div>
        <div class="p-4">
          <Show when={error()}>
            <div class="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm font-mono break-all">{error()}</div>
          </Show>
          <p class="text-sm text-gray-600 mb-2">Paste your Timeline JSON below:</p>
          <textarea 
            class="w-full h-64 border rounded p-2 font-mono text-sm" 
            value={jsonText()} 
            onInput={e => setJsonText(e.target.value)}
            placeholder='{"version": 1, "document": "media-timeline", ...}'
          />
        </div>
        <div class="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleImport} class="px-4 py-2 bg-blue-600 text-white rounded font-medium">Import</button>
        </div>
      </div>
    </div>
  );
}
