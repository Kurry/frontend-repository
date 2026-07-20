import { createSignal, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import {
  store, setStore, DEFAULT_STATE,
  APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS, LOOK_PACKS, SCENES,
  calcEV, getBaseEV, getNetEV, pushHistory, undo, redo, resetState,
  undoStack, redoStack, generatePresetId
} from './store';
import { downloadEditStack, copyEditStack, importEditStack, downloadImage } from './utils/export';
import PhCaretUp from '~icons/ph/caret-up';
import PhCaretDown from '~icons/ph/caret-down';
import PhTrash from '~icons/ph/trash';

function ControlDial(props) {
  const currentIndex = () => props.stops.indexOf(props.value());

  const step = (delta) => {
    const nextIndex = currentIndex() + delta;
    if (nextIndex >= 0 && nextIndex < props.stops.length) {
      pushHistory({ ...store });
      props.onChange(props.stops[nextIndex]);
    }
  };

  const handleUp = () => {
    step(props.inverted ? -1 : 1);
  };

  const handleDown = () => {
    step(props.inverted ? 1 : -1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); handleUp(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); handleDown(); }
  };

  return (
    <div class="flex flex-col items-center bg-gray-900 rounded-lg p-2 w-24">
      <button
        class="text-gray-400 hover:text-white p-2 rounded transition-colors disabled:opacity-0"
        onClick={handleUp}
        disabled={props.inverted ? currentIndex() === 0 : currentIndex() === props.stops.length - 1}
        aria-label={`${props.inverted ? 'Narrow' : 'Increase'} ${props.label}`}
      >
        <PhCaretUp class="w-6 h-6" />
      </button>
      <div
        class="py-2 text-center select-none outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        tabindex="0"
        onKeyDown={handleKeyDown}
        aria-label={`${props.label} dial. Current: ${props.format(props.value())}`}
      >
        <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">{props.label}</div>
        <div class="text-xl font-mono">{props.format(props.value())}</div>
      </div>
      <button
        class="text-gray-400 hover:text-white p-2 rounded transition-colors disabled:opacity-0"
        onClick={handleDown}
        disabled={props.inverted ? currentIndex() === props.stops.length - 1 : currentIndex() === 0}
        aria-label={`${props.inverted ? 'Open' : 'Decrease'} ${props.label}`}
      >
        <PhCaretDown class="w-6 h-6" />
      </button>
    </div>
  );
}

function LivePreview(props) {
  // Optional state override (e.g. DEFAULT_STATE while Before/After is held);
  // falls back to the live store so the preview stays reactive.
  const s = () => props.state ?? store;
  const blurAmount = () => Math.max(0, 20 / (s().aperture ** 1.1));
  const brightnessAmount = () => {
    const stops = getBaseEV(s().scene) - calcEV(s().aperture, s().shutter, s().iso);
    return Math.max(10, 100 * Math.pow(1.2, stops));
  };
  // Floor at 0 so ISO stops below the 100 baseline (e.g. 50) don't produce a
  // negative CSS opacity; cap below 1 so grain never fully hides the photo,
  // per spec, even if iso is ever set outside the discrete ISO_STOPS list.
  const noiseOpacity = () => Math.max(0, Math.min(0.6, Math.log2(s().iso / 100) * 0.1));
  const motionIndex = () => {
    const idx = SHUTTER_STOPS.indexOf(s().shutter);
    return Math.max(0, Math.min(9, idx));
  };

  const filterStyle = () => {
    const tonalBrightness = brightnessAmount() * (1 + s().highlights / 400 + s().shadows / 500);
    const tonalContrast = 100 + s().contrast + s().highlights * 0.2 - s().shadows * 0.25;
    const brightness = Math.max(10, Math.min(240, tonalBrightness));
    const contrast = Math.max(10, Math.min(240, tonalContrast));
    return `brightness(${brightness}%) contrast(${contrast}%)`;
  };

  const currentMotionSrc = () => `/assets/motion-${(motionIndex() + 1).toString().padStart(2, '0')}.jpg`;

  return (
    <div id="export-container" class="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center">
      <div class="relative w-full h-full transition-all duration-300 ease-out" style={{ filter: filterStyle() }}>
        {/* Background Depth layer */}
        <div
          class="absolute inset-0 bg-cover bg-center transition-all duration-300 ease-out"
          style={{
            'background-image': 'url(/assets/background.jpg)',
            'filter': `blur(${blurAmount()}px)`
          }}
        />

        {/* Motion frames */}
        <img
          src={currentMotionSrc()}
          class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out"
          style={{ 'filter': `blur(${blurAmount()}px)` }}
          alt="Subject in motion"
        />

        {/* B&W filter from lookPack */}
        <div class={`absolute inset-0 ${s().lookPack === 'B&W' ? 'backdrop-grayscale' : ''}`} style={{ 'pointer-events': 'none' }} />

        {/* Noise overlay */}
        <div
          class="absolute inset-0 bg-repeat opacity-0 transition-opacity duration-300 ease-out mix-blend-overlay"
          style={{
            'background-image': 'url(/assets/iso-noise.jpg)',
            'opacity': noiseOpacity(),
            'pointer-events': 'none'
          }}
        />
      </div>
    </div>
  );
}

function ExposureMeter() {
  const ev = () => getNetEV();
  const clampedEv = () => Math.max(-5, Math.min(5, ev()));

  return (
    <div class="flex flex-col items-center bg-gray-900/80 backdrop-blur rounded p-2 text-xs font-mono ml-4">
      <div class="mb-1 text-gray-400">OVER</div>
      <div class="relative w-4 h-48 bg-gray-800 rounded-full border border-gray-700">
        <div class="absolute w-full h-px bg-gray-500 top-1/2 left-0 -translate-y-1/2" />
        <div
          class="absolute w-3 h-3 bg-white rounded-full left-1/2 -translate-x-1/2 transition-all duration-300 ease-out"
          style={{ top: `${50 - (clampedEv() * 10)}%`, 'margin-top': '-0.375rem' }}
        />
      </div>
      <div class="mt-1 text-gray-400">UNDER</div>
      <div class="mt-2 text-white font-bold">{ev() > 0 ? '+' : ''}{ev().toFixed(1)} EV</div>
    </div>
  );
}

function LightSlider(props) {
  let keyboardHistoryCaptured = false;

  const handleInput = (e) => {
    props.onChange(Number(e.target.value));
  };

  const handlePointerDown = () => pushHistory({ ...store });
  const handleKeyDown = (e) => {
    if (!keyboardHistoryCaptured && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      pushHistory();
      keyboardHistoryCaptured = true;
    }
  };

  return (
    <div class="flex flex-col mb-4 w-full">
      <div class="flex justify-between text-xs mb-1">
        <label for={`slider-${props.id}`} class="text-gray-400 uppercase">{props.label}</label>
        <span class="font-mono text-white w-8 text-right">{props.value()}</span>
      </div>
      <input
        id={`slider-${props.id}`}
        type="range"
        min="-100" max="100" step="1"
        value={props.value()}
        onInput={handleInput}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onBlur={() => { keyboardHistoryCaptured = false; }}
        class="w-full accent-primary"
      />
    </div>
  );
}

function Histogram() {
  const heights = createMemo(() => {
    const center = 14.5
      + getNetEV() * 2.4
      + store.highlights * 0.025
      + store.shadows * 0.015;
    const spread = Math.max(2.8, Math.min(8, 5.5 - store.contrast * 0.025));
    const scenePhase = SCENES.indexOf(store.scene) * 0.7;

    return Array.from({ length: 30 }, (_, index) => {
      const distance = (index - center) / spread;
      const bell = Math.exp(-0.5 * distance * distance) * 78;
      const detail = (Math.sin(index * 1.65 + scenePhase) + 1) * 5;
      return Math.max(6, Math.min(100, bell + detail + 6));
    });
  });

  return (
    <div class="w-full h-24 bg-gray-800 rounded mt-4 p-2 relative overflow-hidden flex items-end" role="img" aria-label="Live exposure histogram">
      <div class="flex items-end w-full h-full space-x-1 opacity-70">
        <For each={heights()}>
          {(height) => (
            <div class="w-full bg-white transition-all duration-300" style={{ height: `${height}%` }} />
          )}
        </For>
      </div>
    </div>
  );
}

function SnapshotsPanel() {
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");

  const handleSave = () => {
    if (!name().trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setStore('snapshots', s => [...s, {
      name: name().trim(),
      aperture: store.aperture,
      shutter: store.shutter,
      iso: store.iso,
      contrast: store.contrast,
      highlights: store.highlights,
      shadows: store.shadows,
      lookPack: store.lookPack,
    }]);
    setName("");
  };

  const applySnapshot = (snap) => {
    pushHistory({ ...store });
    setStore('aperture', snap.aperture);
    setStore('shutter', snap.shutter);
    setStore('iso', snap.iso);
    setStore('contrast', snap.contrast);
    setStore('highlights', snap.highlights);
    setStore('shadows', snap.shadows);
    setStore('lookPack', snap.lookPack);
  };

  return (
    <div class="mt-6 border-t border-gray-800 pt-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Snapshots</h3>
      <div class="flex space-x-2 mb-2">
        <div class="flex-1">
          <label for="snapshot-name" class="sr-only">Snapshot name</label>
          <input
            id="snapshot-name"
            type="text"
            placeholder="Name..."
            value={name()}
            onInput={e => setName(e.target.value)}
            aria-invalid={!!error()}
            aria-describedby={error() ? 'snapshot-name-error' : undefined}
            class={`w-full bg-gray-800 border ${error() ? 'border-red-500' : 'border-gray-700'} rounded p-1 text-sm text-white`}
          />
          <Show when={error()}>
            <div id="snapshot-name-error" class="text-red-500 text-[10px] mt-0.5" aria-live="polite">name: {error()}</div>
          </Show>
        </div>
        <button
          onClick={handleSave}
          class="bg-primary hover:bg-blue-600 text-white px-3 rounded text-sm transition-colors"
        >
          Save
        </button>
      </div>
      <div class="space-y-1">
        <For each={store.snapshots}>
          {(snap, i) => (
            <div class="flex justify-between items-center bg-gray-800 rounded p-1.5 text-sm">
              <span class="truncate flex-1 font-mono text-xs">{snap.name}</span>
              <div class="flex space-x-1">
                <button class="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs" onClick={() => applySnapshot(snap)}>Apply</button>
                <button class="p-1 text-gray-400 hover:text-red-500" onClick={() => setStore('snapshots', s => s.filter((_, idx) => idx !== i()))}>
                  <PhTrash />
                </button>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function GenerateBracket() {
  const [baseNameError, setBaseNameError] = createSignal('');
  const [generatedSeries, setGeneratedSeries] = createSignal([]);

  const generate = () => {
    const baseName = store.bracketConfig.baseName.trim();
    if (!baseName) {
      setBaseNameError('Base name is required');
      return;
    }
    if (baseName.length > 40) {
      setBaseNameError('Base name must be at most 40 characters');
      return;
    }
    setBaseNameError('');
    const count = store.bracketConfig.count;
    const step = store.bracketConfig.step;
    const half = Math.floor(count / 2);
    const generated = [];
    for(let i = -half; i <= half; i++) {
      const delta = i * step;
      const name = `${baseName} ${delta > 0 ? '+' : ''}${delta} EV`;
      const requestedShutterIdx = SHUTTER_STOPS.indexOf(store.shutter) - delta;
      const shutterIdx = Math.max(0, Math.min(SHUTTER_STOPS.length - 1, requestedShutterIdx));
      const preset = {
        name,
        aperture: store.aperture,
        shutter: SHUTTER_STOPS[shutterIdx],
        iso: store.iso,
        lookTag: "Bracket",
        favorite: false,
      };

      generated.push({ ...preset, delta, clamped: shutterIdx !== requestedShutterIdx });

      if (window.webmcp_tools && window.webmcp_tools['entity_create']) {
        window.webmcp_tools['entity_create']({
          entity: 'preset',
          fields: preset
        });
      } else {
        setStore('presets', p => [...p, {
          id: generatePresetId(),
          ...preset,
        }]);
      }
    }
    setGeneratedSeries(generated);
  };

  return (
    <div class="mt-6 border-t border-gray-800 pt-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Bracket</h3>
      <div class="space-y-2 text-sm">
        <div class="flex space-x-2 items-center">
          <label for="bracket-frames" class="w-16 text-gray-400">Frames</label>
          <select id="bracket-frames" value={store.bracketConfig.count}
            onInput={e => setStore('bracketConfig', 'count', Number(e.target.value))}
            class="flex-1 bg-gray-800 border border-gray-700 rounded p-1 text-white">
            <option value="3">3</option>
            <option value="5">5</option>
          </select>
        </div>
        <div class="flex space-x-2 items-center">
          <label for="bracket-step" class="w-16 text-gray-400">Step (EV)</label>
          <select id="bracket-step" value={store.bracketConfig.step}
            onInput={e => setStore('bracketConfig', 'step', Number(e.target.value))}
            class="flex-1 bg-gray-800 border border-gray-700 rounded p-1 text-white">
            <option value="1">1 stop</option>
            <option value="2">2 stops</option>
          </select>
        </div>
        <div class="flex space-x-2 items-center">
          <label for="bracket-base-name" class="w-16 text-gray-400">Base Name</label>
          <input id="bracket-base-name" type="text" value={store.bracketConfig.baseName}
            onInput={e => {
              setStore('bracketConfig', 'baseName', e.target.value);
              if (e.target.value.trim() && e.target.value.trim().length <= 40) setBaseNameError('');
            }}
            aria-invalid={!!baseNameError()}
            aria-describedby={baseNameError() ? 'bracket-base-name-error' : undefined}
            class={`flex-1 bg-gray-800 border ${baseNameError() ? 'border-red-500' : 'border-gray-700'} rounded p-1 text-white`} />
        </div>
        <Show when={baseNameError()}>
          <div id="bracket-base-name-error" class="text-red-500 text-xs transition-opacity" aria-live="polite">base name: {baseNameError()}</div>
        </Show>
        <button class="w-full py-1.5 mt-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          onClick={generate}
        >
          Generate Bracket
        </button>
        <Show when={generatedSeries().length > 0}>
          <div class="pt-2" aria-label="Generated bracket preview">
            <div class="mb-1 text-xs text-gray-400">Darkest to brightest</div>
            <div class="flex gap-2 overflow-x-auto pb-1" role="list">
              <For each={generatedSeries()}>
                {(frame) => (
                  <div class="min-w-20 flex-1" role="listitem">
                    <div
                      class="h-14 rounded border border-gray-700 bg-cover bg-center transition-all duration-300"
                      style={{
                        'background-image': 'url(/assets/background.jpg)',
                        filter: `brightness(${Math.max(35, Math.min(220, 100 * Math.pow(1.35, frame.delta)))}%)`,
                      }}
                      aria-label={`${frame.name} preview${frame.clamped ? ', clamped' : ''}`}
                    />
                    <div class="mt-1 text-[10px] text-center text-gray-300 whitespace-nowrap">{frame.delta > 0 ? '+' : ''}{frame.delta} EV</div>
                    <Show when={frame.clamped}>
                      <div class="text-[9px] text-center text-amber-400">Clamped</div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

export default function MeterLab() {
  const [copyMsg, setCopyMsg] = createSignal("");
  const [importMsg, setImportMsg] = createSignal("");

  const applyLookPack = (pack) => {
    pushHistory({ ...store });
    if (pack === store.lookPack) {
      setStore({ lookPack: null, contrast: 0, highlights: 0, shadows: 0 });
      return;
    }

    setStore({ lookPack: pack, contrast: 0, highlights: 0, shadows: 0 });
    if (pack === 'Warm') {
      setStore('contrast', 10);
      setStore('highlights', -5);
    } else if (pack === 'Subtle') {
      setStore('contrast', -10);
      setStore('shadows', 15);
    } else if (pack === 'Strong') {
      setStore('contrast', 30);
      setStore('highlights', 20);
      setStore('shadows', -20);
    }
  };

  const handleBeforeDown = () => setStore('beforeHold', true);
  const handleBeforeUp = () => setStore('beforeHold', false);

  return (
    <div class="relative w-full h-full flex overflow-hidden">
      {/* Stays mounted during Before/After hold (so #export-container survives);
          the hold swaps in the unedited default-state composition. */}
      <LivePreview state={store.beforeHold ? DEFAULT_STATE : undefined} />

      {/* Dials Layer */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-6 z-10 bg-black/40 p-4 rounded-xl backdrop-blur-md">
        <ControlDial
          label="Aperture"
          stops={APERTURE_STOPS}
          inverted
          value={() => store.aperture}
          onChange={(v) => setStore('aperture', v)}
          format={(v) => `f/${v}`}
        />
        <ControlDial
          label="Shutter"
          stops={SHUTTER_STOPS}
          value={() => store.shutter}
          onChange={(v) => setStore('shutter', v)}
          format={(v) => `1/${v}`}
        />
        <ControlDial
          label="ISO"
          stops={ISO_STOPS}
          value={() => store.iso}
          onChange={(v) => setStore('iso', v)}
          format={(v) => v}
        />
        <ExposureMeter />
      </div>

      {/* Top Left Export/Import Tools */}
      <div class="absolute top-4 left-4 z-20 flex space-x-2">
        <div class="bg-gray-900/90 backdrop-blur rounded p-2 flex flex-col space-y-2 border border-gray-800">
          <div class="text-xs font-bold text-gray-500 uppercase px-1">Export</div>
          <button class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm rounded transition" onClick={() => downloadImage('png')}>Download PNG</button>
          <button class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm rounded transition" onClick={() => downloadImage('jpeg')}>Download JPEG</button>
          <button class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm rounded transition" onClick={downloadEditStack}>Download edit stack</button>
          <button class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm rounded transition" onClick={async () => {
            await copyEditStack();
            setCopyMsg("Copied!");
            setTimeout(() => setCopyMsg(""), 2000);
          }}>{copyMsg() || "Copy edit stack"}</button>

          <div class="h-px bg-gray-800 my-1" />
          <div class="text-xs font-bold text-gray-500 uppercase px-1 mt-1">Import</div>
          <label class="cursor-pointer px-3 py-1 bg-primary/20 text-primary hover:bg-primary/30 text-sm rounded transition text-center">
            Import edit stack
            <input type="file" accept=".json" class="hidden" onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const result = importEditStack(ev.target.result);
                setImportMsg(result.success ? "Edit stack imported." : `Import failed: ${result.error}`);
              };
              reader.readAsText(file);
              e.currentTarget.value = '';
            }} />
          </label>
          <Show when={importMsg()}>
            <div class={`px-1 text-xs ${importMsg().startsWith('Import failed:') ? 'text-red-400' : 'text-green-400'}`} role="status">
              {importMsg()}
            </div>
          </Show>
        </div>
      </div>

      {/* Right Sidebar */}
      <div class="absolute right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur p-4 z-10 flex flex-col overflow-y-auto border-l border-gray-800 shadow-2xl">
        <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Development</h2>

        <LightSlider id="contrast" label="Contrast" value={() => store.contrast} onChange={(v) => setStore('contrast', v)} />
        <LightSlider id="highlights" label="Highlights" value={() => store.highlights} onChange={(v) => setStore('highlights', v)} />
        <LightSlider id="shadows" label="Shadows" value={() => store.shadows} onChange={(v) => setStore('shadows', v)} />

        <Histogram />

        <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mt-6 mb-2">Look Packs</h3>
        <div class="grid grid-cols-2 gap-2 mb-4">
          <For each={LOOK_PACKS}>
            {(pack) => (
              <button
                class={`py-2 px-3 text-sm rounded border transition-colors ${store.lookPack === pack ? 'bg-primary border-primary text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                onClick={() => applyLookPack(pack)}
              >
                {pack}
              </button>
            )}
          </For>
        </div>

        <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Scene</h3>
        <select
          class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white mb-2 focus:ring-2 focus:ring-primary outline-none"
          value={store.scene}
          onChange={(e) => {
            pushHistory({ ...store });
            setStore('scene', e.target.value);
          }}
        >
          <For each={SCENES}>
            {(scene) => <option value={scene}>{scene}</option>}
          </For>
        </select>

        <SnapshotsPanel />
        <GenerateBracket />

        <div class="mt-8 space-y-2">
          <div class="flex space-x-2">
            <button
              class="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded disabled:opacity-50 transition"
              onClick={undo} disabled={undoStack().length === 0}
            >
              Undo
            </button>
            <button
              class="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded disabled:opacity-50 transition"
              onClick={redo} disabled={redoStack().length === 0}
            >
              Redo
            </button>
          </div>
          <button
            class="w-full py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded active:bg-gray-600 select-none transition"
            onPointerDown={handleBeforeDown}
            onPointerUp={handleBeforeUp}
            onPointerLeave={handleBeforeUp}
          >
            Before / After (Hold)
          </button>
          <button
            class="w-full py-2 bg-red-900/50 hover:bg-red-900 text-sm rounded text-red-200 transition"
            onClick={resetState}
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
