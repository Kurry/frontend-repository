import { store, setStore } from '../store';

export default function Timeline() {
  const togglePlay = () => setStore('playback', 'playing', p => !p);

  return (
    <div class="h-48 border-t border-neutral-300 bg-white p-4 flex flex-col">
      <div class="flex items-center gap-4 mb-4">
        <button onClick={togglePlay} class="px-3 py-1 bg-black text-white rounded text-sm font-bold">
          {store.playback.playing ? 'Pause' : 'Play'}
        </button>
        <div class="text-sm">Frame: {store.playback.frame} / {store.playback.duration}</div>
        <input type="range" min="0" max={store.playback.duration} value={store.playback.frame}
          onInput={(e) => setStore('playback', 'frame', Number(e.target.value))}
          class="flex-1"
        />
      </div>
      <div class="flex-1 bg-neutral-100 rounded border relative">
        <div class="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none"
          style={{ left: `${(store.playback.frame / store.playback.duration) * 100}%` }}
        />
      </div>
    </div>
  );
}
