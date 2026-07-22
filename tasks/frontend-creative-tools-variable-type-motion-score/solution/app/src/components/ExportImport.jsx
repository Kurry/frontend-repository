import { store, setStore } from '../store';

export default function ExportImport() {
  return (
    <div class="h-12 border-b border-neutral-300 bg-white px-4 flex items-center justify-between">
      <div class="flex gap-2">
        <button class="text-sm px-2 py-1 border rounded hover:bg-neutral-50">Branch: {store.branches[0].name}</button>
      </div>
      <div class="flex gap-2">
        <button class="text-sm px-2 py-1 bg-black text-white rounded font-bold">Export</button>
        <button class="text-sm px-2 py-1 border rounded hover:bg-neutral-50">Import</button>
      </div>
    </div>
  );
}
