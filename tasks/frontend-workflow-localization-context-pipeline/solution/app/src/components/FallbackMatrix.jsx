import { store, setStore } from "../store";

export default function FallbackMatrix() {
  const locales = ["fr-FR", "de-DE", "ja-JP"];

  const getStatusColor = (status) => {
    switch (status) {
      case "source": return "bg-gray-200 text-gray-700";
      case "missing": return "bg-red-100 text-red-700";
      case "draft": return "bg-yellow-100 text-yellow-700";
      case "parser-invalid": return "bg-red-500 text-white";
      case "in-review": return "bg-blue-100 text-blue-700";
      case "approved": return "bg-green-100 text-green-700";
      default: return "bg-gray-100";
    }
  };

  return (
    <div class="border border-border rounded-lg bg-surface overflow-hidden mt-4">
      <div class="p-4 border-b border-border">
         <h3 class="font-semibold text-md">Completeness Matrix</h3>
      </div>
      <div class="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs uppercase bg-gray-50 sticky top-0">
            <tr>
              <th class="px-4 py-2 border-b">Unit ID</th>
              {locales.map(l => (
                <th class="px-4 py-2 border-b">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {store.sourceUnits.map(unit => (
              <tr
                class={`border-b hover:bg-gray-50 cursor-pointer ${store.activeUnitId === unit.id ? 'bg-blue-50' : ''}`}
                onClick={() => setStore('activeUnitId', unit.id)}
              >
                <td class="px-4 py-2 font-mono text-xs">{unit.id}</td>
                {locales.map(l => {
                  const status = store.targetRevisions[unit.id]?.[l]?.fallbackStatus || "missing";
                  return (
                    <td class="px-4 py-2">
                       <span class={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                         {status}
                       </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
