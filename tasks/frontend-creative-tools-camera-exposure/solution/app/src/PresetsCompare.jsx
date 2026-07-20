import { createSignal, createMemo, For, Show } from 'solid-js';
import { store, setStore } from './store';
import PhHeart from '~icons/ph/heart';
import PhTrash from '~icons/ph/trash';
import PhPencil from '~icons/ph/pencil';
import PresetForm from './PresetForm';

export default function PresetsCompare() {
  const [filterFav, setFilterFav] = createSignal(false);
  const [filterTag, setFilterTag] = createSignal("");
  const [editingPreset, setEditingPreset] = createSignal(null);
  const [isFormOpen, setIsFormOpen] = createSignal(false);
  const [compareId, setCompareId] = createSignal(null);

  const availableTags = createMemo(() => {
    const tags = new Set();
    store.presets.forEach(p => p.lookTag && tags.add(p.lookTag));
    return Array.from(tags);
  });

  const filteredPresets = createMemo(() => {
    return store.presets.filter(p => {
      if (filterFav() && !p.favorite) return false;
      if (filterTag() && p.lookTag !== filterTag()) return false;
      return true;
    });
  });

  const applyPreset = (preset) => {
    if (!preset) return;
    setStore('aperture', preset.aperture);
    setStore('shutter', preset.shutter);
    setStore('iso', preset.iso);
    setStore('mode', 'Meter/Lab');
  };

  const deletePreset = (id) => {
    if (window.webmcp_tools && window.webmcp_tools['entity_delete']) {
      window.webmcp_tools['entity_delete']({ entity: 'preset', id, confirm: true });
    } else {
      setStore('presets', (p) => p.filter(pr => pr.id !== id));
    }
  };

  const toggleFav = (id) => {
    if (window.webmcp_tools && window.webmcp_tools['entity_toggle']) {
      window.webmcp_tools['entity_toggle']({ entity: 'preset', id, field: 'favorite' });
    } else {
      setStore('presets', p => p.id === id, 'favorite', f => !f);
    }
  };

  return (
    <div class="h-full w-full flex bg-gray-900 text-white overflow-hidden">
      {/* Sidebar List */}
      <div class="w-[400px] flex flex-col border-r border-gray-800 bg-black/50">
        <div class="p-4 border-b border-gray-800 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Presets</h2>
            <button
              class="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-blue-600 transition-colors"
              onClick={() => { setEditingPreset(null); setIsFormOpen(true); }}
            >
              + New
            </button>
          </div>

          <div class="flex space-x-2 text-sm">
            <button
              class={`px-3 py-1 rounded-full border transition-colors ${filterFav() ? 'bg-primary border-primary text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              onClick={() => setFilterFav(!filterFav())}
            >
              Favorites Only
            </button>
            <select
              class="flex-1 bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-white outline-none focus:border-primary"
              value={filterTag()}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="">All Tags</option>
              <For each={availableTags()}>{(tag) => <option value={tag}>{tag}</option>}</For>
            </select>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-2 relative">
          <Show when={store.presets.length > 0 && filteredPresets().length === 0}>
            <div class="p-8 text-center text-gray-500 bg-gray-800/50 rounded border border-gray-800">
              No presets match your current filters.
            </div>
          </Show>
          <Show when={store.presets.length === 0}>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <div class="text-4xl mb-4">📷</div>
              <p class="text-lg font-bold text-gray-300 mb-2">No presets found</p>
              <p class="text-sm">Create a preset to save your exposure settings.</p>
            </div>
          </Show>
          <For each={filteredPresets()}>
            {(preset) => (
              <div class="group flex items-center justify-between p-3 bg-gray-800 rounded border border-transparent hover:border-gray-600 transition-colors">
                <div class="flex-1 cursor-pointer" onClick={() => applyPreset(preset)}>
                  <div class="font-bold flex items-center space-x-2 text-gray-200 group-hover:text-white">
                    <span>{preset.name}</span>
                    <Show when={preset.favorite}>
                      <PhHeart class="text-red-500 w-4 h-4" />
                    </Show>
                  </div>
                  <div class="text-xs text-gray-400 mt-1 font-mono">
                    f/{preset.aperture} • 1/{preset.shutter} • ISO {preset.iso}
                  </div>
                  <div class="text-[10px] uppercase tracking-wider text-primary mt-1">
                    {preset.lookTag}
                  </div>
                </div>
                <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="p-2 text-gray-400 hover:text-white bg-gray-700 rounded hover:bg-gray-600 transition" onClick={() => setCompareId(preset.id)} title="Compare">
                    C
                  </button>
                  <button class="p-2 text-gray-400 hover:text-red-400 bg-gray-700 rounded hover:bg-gray-600 transition" onClick={() => toggleFav(preset.id)} title="Toggle Favorite">
                    <PhHeart />
                  </button>
                  <button class="p-2 text-gray-400 hover:text-blue-400 bg-gray-700 rounded hover:bg-gray-600 transition" onClick={() => { setEditingPreset(preset); setIsFormOpen(true); }} title="Edit">
                    <PhPencil />
                  </button>
                  <button class="p-2 text-gray-400 hover:text-red-500 bg-gray-700 rounded hover:bg-red-900/50 transition" onClick={() => deletePreset(preset.id)} title="Delete">
                    <PhTrash />
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Main Compare Area */}
      <div class="flex-1 relative bg-black flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black">
        <Show when={compareId()} fallback={
          <div class="text-gray-600 text-center">
            <div class="text-6xl mb-4 opacity-50">⚖️</div>
            <p class="text-2xl font-bold mb-2 text-gray-400">Select a preset to compare</p>
            <p class="text-sm">Hover a preset row and click 'C' to load it here</p>
          </div>
        }>
          <div class="flex space-x-8 w-full max-w-5xl">
            {/* Current State Card */}
            <div class="flex-1 bg-gray-900 rounded-xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span class="text-8xl font-black">L</span>
              </div>
              <h3 class="text-xl font-bold mb-6 border-b border-gray-800 pb-4 text-gray-300">Live Editor State</h3>
              <div class="space-y-4 text-lg font-mono">
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 uppercase text-sm tracking-wider">Aperture</span>
                  <span class="text-white">f/{store.aperture}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 uppercase text-sm tracking-wider">Shutter</span>
                  <span class="text-white">1/{store.shutter}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 uppercase text-sm tracking-wider">ISO</span>
                  <span class="text-white">{store.iso}</span>
                </div>
              </div>
            </div>

            {/* Compare Preset Card */}
            <div class="flex-1 bg-gray-900 rounded-xl p-8 border-2 border-primary/40 shadow-2xl shadow-primary/10 relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-primary">
                <span class="text-8xl font-black">R</span>
              </div>
              <h3 class="text-xl font-bold mb-6 border-b border-gray-800 pb-4 text-primary flex items-center justify-between">
                <span>{store.presets.find(p => p.id === compareId())?.name}</span>
                <span class="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-wider">{store.presets.find(p => p.id === compareId())?.lookTag}</span>
              </h3>
              <div class="space-y-4 text-lg font-mono">
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 uppercase text-sm tracking-wider">Aperture</span>
                  <span class={`text-white ${store.presets.find(p => p.id === compareId())?.aperture !== store.aperture ? 'text-blue-400 font-bold' : ''}`}>
                    f/{store.presets.find(p => p.id === compareId())?.aperture}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 uppercase text-sm tracking-wider">Shutter</span>
                  <span class={`text-white ${store.presets.find(p => p.id === compareId())?.shutter !== store.shutter ? 'text-blue-400 font-bold' : ''}`}>
                    1/{store.presets.find(p => p.id === compareId())?.shutter}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 uppercase text-sm tracking-wider">ISO</span>
                  <span class={`text-white ${store.presets.find(p => p.id === compareId())?.iso !== store.iso ? 'text-blue-400 font-bold' : ''}`}>
                    {store.presets.find(p => p.id === compareId())?.iso}
                  </span>
                </div>
              </div>
              <button
                class="mt-8 w-full py-3 bg-primary hover:bg-blue-600 text-white rounded font-bold transition shadow-lg shadow-primary/20"
                onClick={() => {
                  const comparePreset = store.presets.find(p => p.id === compareId());
                  if (!comparePreset) {
                    setCompareId(null);
                    return;
                  }
                  applyPreset(comparePreset);
                }}
              >
                Apply to Live Editor
              </button>
            </div>
          </div>
        </Show>
      </div>

      <Show when={isFormOpen()}>
        <PresetForm
          preset={editingPreset()}
          onClose={() => setIsFormOpen(false)}
        />
      </Show>
    </div>
  );
}
