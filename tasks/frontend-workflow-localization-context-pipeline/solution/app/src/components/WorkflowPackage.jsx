import { store, packageLocale, exportRelease } from "../store";
import { createSignal } from "solid-js";

export default function WorkflowPackage() {
  const locales = ["fr-FR", "de-DE", "ja-JP"];
  const steps = ["Translate", "Check", "Linguistic", "Context", "Visual", "Approved"];

  const handleExport = () => {
    const data = exportRelease();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localization_release_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="border border-border rounded-lg bg-surface p-4 mt-4">
      <h2 class="text-lg font-semibold mb-4">Workflow & Packaging</h2>

      <div class="mb-6">
        <h3 class="font-medium text-sm mb-2 text-gray-700">Review Pipeline Status (Active Unit)</h3>
        <div class="flex items-center space-x-2 text-xs">
          {steps.map((step, idx) => (
            <div class="flex items-center">
              <div class={`px-2 py-1 rounded ${idx === 0 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                {step}
              </div>
              {idx < steps.length - 1 && <div class="text-gray-400 mx-1">-&gt;</div>}
            </div>
          ))}
        </div>
      </div>

      <div class="mb-6">
        <h3 class="font-medium text-sm mb-2 text-gray-700">Batch Packaging</h3>
        <div class="space-y-2">
          {locales.map(locale => (
            <div class="flex items-center justify-between p-2 border border-border rounded">
              <div class="font-medium text-sm">{locale}</div>
              <div class="flex items-center space-x-4">
                <span class={`text-xs px-2 py-1 rounded ${
                  store.packageStatus[locale] === 'idle' ? 'bg-gray-100' :
                  store.packageStatus[locale] === 'failed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {store.packageStatus[locale]}
                </span>
                <button
                  class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  onClick={() => packageLocale(locale)}
                >
                  {store.packageStatus[locale] === 'failed' ? 'Retry Package' : 'Package'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div class="border-t border-border pt-4">
        <button
          class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
          onClick={handleExport}
        >
          Export Exact Release Artifacts
        </button>
      </div>
    </div>
  );
}
