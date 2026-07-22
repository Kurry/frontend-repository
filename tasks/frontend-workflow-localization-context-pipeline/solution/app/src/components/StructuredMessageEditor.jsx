import { createSignal } from "solid-js";
import { store, updateDraftAst } from "../store";

export default function StructuredMessageEditor(props) {
  const [activeTab, setActiveTab] = createSignal("text");

  const unit = () => store.sourceUnits.find(u => u.id === store.activeUnitId);
  const target = () => store.targetRevisions[store.activeUnitId]?.[store.activeLocale];

  const handleTextChange = (e) => {
    // Basic mock text change handler
    const text = e.target.value;
    updateDraftAst(store.activeUnitId, store.activeLocale, [{ type: "text", value: text }]);
  };

  return (
    <div class="border border-border rounded-lg bg-surface flex flex-col h-full">
      <div class="border-b border-border p-4">
        <h2 class="text-lg font-semibold">Structured Message Editor</h2>
        <div class="text-sm text-gray-500">Editing: {store.activeLocale}</div>
      </div>

      <div class="flex border-b border-border">
        <button
          class={`px-4 py-2 ${activeTab() === 'text' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
          onClick={() => setActiveTab('text')}
        >
          Text View
        </button>
        <button
          class={`px-4 py-2 ${activeTab() === 'ast' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
          onClick={() => setActiveTab('ast')}
        >
          Structure View
        </button>
      </div>

      <div class="flex-1 p-4 overflow-y-auto">
        {activeTab() === 'text' ? (
          <div>
            <textarea
              class="w-full h-32 p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={target()?.draft?.text || ""}
              onInput={handleTextChange}
              placeholder="Enter translation here..."
            />
          </div>
        ) : (
          <div class="font-mono text-sm bg-gray-100 p-4 rounded h-full overflow-y-auto">
            <pre>{JSON.stringify(target()?.draft?.ast || [], null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
