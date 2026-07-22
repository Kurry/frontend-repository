import { createMemo, createSignal, For, Show } from "solid-js";
import type { Component } from "solid-js";
import { state, selectPiece, updatePiece, archivePiece, exportArtifact, importArtifact, createPiece, addQuery, mergePieces } from "./store";
import { Motion } from "solid-motionone";
import { Settings, Download, Upload, Archive, ChevronRight, AlertCircle, Plus, Merge } from "lucide-solid";
import { Dialog } from "@kobalte/core/dialog";
import { createForm } from "@tanstack/solid-form";

const App: Component = () => {
  const visiblePieces = createMemo(() => {
    let pieces = state.pieces.filter((p) => p.status !== "archived");
    if (state.activeQueryId) {
      const query = state.queries.find((q) => q.id === state.activeQueryId);
      if (query) {
        if (query.filter.status && query.filter.status.length > 0) {
          pieces = pieces.filter((p) => query.filter.status!.includes(p.status));
        }
        if (query.filter.clayBody && query.filter.clayBody.length > 0) {
          pieces = pieces.filter((p) => query.filter.clayBody!.includes(p.clayBody));
        }
      }
    }
    return pieces;
  });

  const selectedPiece = createMemo(() => state.pieces.find((p) => p.id === state.selectedPieceId));

  const loadSummary = createMemo(() => {
    const pieces = visiblePieces();
    const peakCone = Math.max(...pieces.map((p) => p.cone));
    const risks = pieces.filter(p => p.status === 'conflict').length;
    return { count: pieces.length, peakCone: peakCone === -Infinity ? 0 : peakCone, risks };
  });

  const handleExport = () => {
    const artifact = exportArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kiln-load-v1-forecast-ribbon.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          const result = importArtifact(parsed);
          if (!result.success) {
            alert("Invalid artifact: " + JSON.stringify(result.error));
          }
        } catch (err) {
          alert("Error parsing JSON");
        }
      };
      reader.readAsText(target.files[0]);
    }
  };

  const [createPieceOpen, setCreatePieceOpen] = createSignal(false);
  const createPieceForm = createForm(() => ({
    defaultValues: {
      title: "",
      maker: "",
      dimensions: "",
      clayBody: "stoneware",
      glaze: "",
      cone: 6,
      status: "draft"
    },
    onSubmit: async ({ value }) => {
      createPiece(value as any);
      setCreatePieceOpen(false);
    }
  }));

  const [saveQueryOpen, setSaveQueryOpen] = createSignal(false);
  const saveQueryForm = createForm(() => ({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      if (!value.name) return;
      addQuery(value.name, { status: ['ready'] }); // Simple filter demo
      setSaveQueryOpen(false);
    }
  }));

  const [mergeOpen, setMergeOpen] = createSignal(false);
  const [mergeTarget, setMergeTarget] = createSignal("");

  return (
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold tracking-tight text-slate-800">Ceramic Kiln Load Composer</h1>
          <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">Forecast Ribbon</span>
        </div>
        <div class="flex items-center gap-3">
          <button onClick={() => setCreatePieceOpen(true)} class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
            <Plus size={16} /> New Piece
          </button>
          <button onClick={handleExport} class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors border border-slate-300">
            <Download size={16} /> Export
          </button>
          <label class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors border border-slate-300 cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" accept=".json" class="hidden" onChange={handleImport} />
          </label>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Queries & Provenance */}
        <aside class="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div class="p-4 border-b border-slate-200">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Queries</h2>
              <button onClick={() => setSaveQueryOpen(true)} class="text-slate-400 hover:text-indigo-600">
                <Plus size={14} />
              </button>
            </div>
            <div class="space-y-1">
              <button
                class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${state.activeQueryId === null ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => state.activeQueryId = null}
              >
                All Pieces
              </button>
              <For each={state.queries}>
                {(query) => (
                  <button
                    class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${state.activeQueryId === query.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => state.activeQueryId = query.id}
                  >
                    {query.name}
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="p-4 flex-1 overflow-y-auto">
             <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Release Provenance</h2>
             <div class="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                <For each={state.history}>
                  {(entry) => (
                    <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div class="flex items-center justify-center w-2 h-2 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-indigo-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                        <div class="w-[calc(100%-2rem)] md:w-[calc(50%-2.5rem)] p-2 rounded border border-slate-200 bg-white shadow-sm">
                            <div class="flex items-center justify-between space-x-2 mb-1">
                                <div class="font-bold text-slate-900 text-xs">{entry.action}</div>
                                <time class="font-caveat font-medium text-indigo-500 text-[10px]">{new Date(entry.timestamp).toLocaleTimeString()}</time>
                            </div>
                            <div class="text-slate-500 text-[10px]">{entry.details}</div>
                        </div>
                    </div>
                  )}
                </For>
             </div>
          </div>
        </aside>

        {/* Main Content: Forecast Ribbon & Grid */}
        <main class="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">

           {/* Derived Summary Top Panel */}
           <div class="bg-white border-b border-slate-200 p-4 flex gap-8 items-center shadow-sm z-10">
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 font-medium uppercase tracking-wider">Load Count</span>
                <span class="text-2xl font-bold text-slate-800">{loadSummary().count}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 font-medium uppercase tracking-wider">Peak Temp</span>
                <span class="text-2xl font-bold text-slate-800">Cone {loadSummary().peakCone}</span>
              </div>
               <div class="flex flex-col">
                <span class="text-xs text-slate-500 font-medium uppercase tracking-wider">Risks</span>
                <span class={`text-2xl font-bold ${loadSummary().risks > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {loadSummary().risks}
                </span>
              </div>
           </div>

           <div class="flex-1 overflow-y-auto p-8 relative">
              <h2 class="text-lg font-bold text-slate-800 mb-6">Forecast Ribbon</h2>

              <div class="relative max-w-5xl mx-auto h-32 bg-slate-200 rounded-xl mb-12 flex items-center px-4 border border-slate-300 shadow-inner overflow-hidden">
                {/* Cone markers */}
                <div class="absolute inset-0 flex justify-between px-8 text-slate-400 text-xs font-medium pt-2 pointer-events-none">
                  <span>Cone 0</span>
                  <span>Cone 5</span>
                  <span>Cone 10</span>
                </div>

                <div class="relative w-full h-16 flex items-center">
                  <For each={visiblePieces()}>
                    {(piece) => {
                      const isSelected = piece.id === state.selectedPieceId;
                      // Simple mapping: cone 0-10 to 0-100% width.
                      const leftPos = Math.max(0, Math.min(100, (piece.cone / 10) * 100));

                      return (
                        <Motion.div
                          animate={{
                            left: `${leftPos}%`,
                            opacity: 1,
                            scale: isSelected ? 1.1 : 1,
                            backgroundColor: piece.status === 'conflict' ? '#fee2e2' : piece.status === 'ready' ? '#dcfce7' : '#f1f5f9',
                            color: piece.status === 'conflict' ? '#991b1b' : piece.status === 'ready' ? '#166534' : '#475569'
                          }}
                          transition={{ duration: 0.3 }}
                          class={`absolute w-12 h-12 -ml-6 rounded-lg cursor-pointer flex items-center justify-center shadow-md border-2 ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-lg z-20' : 'border-white hover:border-indigo-300 z-10'}`}
                          onClick={() => selectPiece(piece.id)}
                        >
                          <span class="font-bold text-sm">C{piece.cone}</span>
                        </Motion.div>
                      );
                    }}
                  </For>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl mx-auto">
                 <For each={visiblePieces()}>
                    {(piece) => (
                      <div
                        class={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${piece.id === state.selectedPieceId ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
                        onClick={() => selectPiece(piece.id)}
                      >
                         <div class="flex justify-between items-start mb-2">
                           <h3 class="font-bold text-slate-800">{piece.title}</h3>
                           <span class={`px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider
                              ${piece.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                piece.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                                piece.status === 'conflict' ? 'bg-rose-100 text-rose-700' :
                                'bg-blue-100 text-blue-700'
                              }
                           `}>
                             {piece.status}
                           </span>
                         </div>
                         <div class="text-sm text-slate-600 mb-1">Maker: {piece.maker}</div>
                         <div class="text-sm text-slate-600 mb-3">Clay: <span class="capitalize">{piece.clayBody}</span></div>
                         <div class="flex items-center text-xs font-medium text-slate-500 gap-4">
                           <span>Cone {piece.cone}</span>
                           <span>{piece.glaze}</span>
                         </div>
                      </div>
                    )}
                 </For>
              </div>
           </div>
        </main>

        {/* Right Sidebar: Piece Inspector */}
        <Show when={selectedPiece()} fallback={
          <aside class="w-80 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-8 text-center text-slate-400">
             <Settings size={48} class="mb-4 opacity-20" />
             <p>Select a piece on the forecast ribbon or grid to inspect and adjust its properties.</p>
          </aside>
        }>
          <aside class="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
             <div class="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 class="font-bold text-slate-800">Inspector</h2>
                <button class="text-slate-400 hover:text-slate-600" onClick={() => selectPiece(null)}>
                  <ChevronRight size={20} />
                </button>
             </div>
             <div class="p-6 space-y-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedPiece()!.title}
                    onInput={(e) => updatePiece(selectedPiece()!.id, { title: e.target.value })}
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Cone</label>
                  <div class="flex items-center gap-4">
                    <input
                      type="range"
                      min="0" max="10" step="1"
                      class="w-full accent-indigo-600"
                      value={selectedPiece()!.cone}
                      onInput={(e) => {
                         const val = parseInt(e.target.value);
                         let newStatus = selectedPiece()!.status;
                         if (selectedPiece()!.clayBody === 'porcelain' && val < 6) {
                            newStatus = 'conflict';
                         } else if (newStatus === 'conflict' && val >= 6) {
                            newStatus = 'ready';
                         } else if (newStatus === 'draft') {
                            newStatus = 'changed';
                         }
                         updatePiece(selectedPiece()!.id, { cone: val, status: newStatus });
                      }}
                    />
                    <span class="font-bold text-slate-700 w-8 text-right">C{selectedPiece()!.cone}</span>
                  </div>
                </div>

                <div>
                   <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                   <select
                     class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white capitalize"
                     value={selectedPiece()!.status}
                     onChange={(e) => updatePiece(selectedPiece()!.id, { status: e.target.value as any })}
                   >
                     <option value="draft">Draft</option>
                     <option value="ready">Ready</option>
                     <option value="changed">Changed</option>
                     <option value="conflict">Conflict</option>
                   </select>
                </div>

                <Show when={selectedPiece()!.status === 'conflict'}>
                  <div class="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-3">
                    <AlertCircle size={16} class="text-rose-600 mt-0.5 shrink-0" />
                    <p class="text-sm text-rose-800 font-medium">
                      Risk: Target cone is unsuitable for clay body or glaze. Adjust cone to resolve.
                    </p>
                  </div>
                </Show>

                <div class="pt-6 border-t border-slate-200 space-y-2">
                  <button
                    class="w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 transition-colors"
                    onClick={() => setMergeOpen(true)}
                  >
                    <Merge size={16} /> Merge Duplicate
                  </button>
                  <button
                    class="w-full flex justify-center items-center gap-2 px-4 py-2 border border-slate-300 text-rose-600 font-medium rounded-md hover:bg-rose-50 transition-colors"
                    onClick={() => { archivePiece(selectedPiece()!.id); selectPiece(null); }}
                  >
                    <Archive size={16} /> Archive Piece
                  </button>
                </div>
             </div>
          </aside>
        </Show>
      </div>

      <Dialog.Root open={createPieceOpen()} onOpenChange={setCreatePieceOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50 z-50 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0" />
          <Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-50">
             <Dialog.Title class="text-xl font-bold mb-4">Create Piece</Dialog.Title>
             <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); createPieceForm.handleSubmit(); }} class="space-y-4">

                <createPieceForm.Field
                  name="title"
                  validators={{ onChange: ({ value }) => !value ? "Title required" : undefined }}
                >
                  {(field) => (
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                      <input
                         class="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                         value={field().state.value}
                         onInput={(e) => field().handleChange(e.target.value)}
                      />
                      <Show when={field().state.meta.errors.length}>
                        <p class="text-xs text-rose-600 mt-1">{field().state.meta.errors.join(", ")}</p>
                      </Show>
                    </div>
                  )}
                </createPieceForm.Field>

                <createPieceForm.Field
                  name="maker"
                  validators={{ onChange: ({ value }) => !value ? "Maker required" : undefined }}
                >
                  {(field) => (
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Maker</label>
                      <input
                         class="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                         value={field().state.value}
                         onInput={(e) => field().handleChange(e.target.value)}
                      />
                      <Show when={field().state.meta.errors.length}>
                        <p class="text-xs text-rose-600 mt-1">{field().state.meta.errors.join(", ")}</p>
                      </Show>
                    </div>
                  )}
                </createPieceForm.Field>

                <div class="grid grid-cols-2 gap-4">
                  <createPieceForm.Field name="dimensions">
                    {(field) => (
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Dimensions</label>
                        <input class="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={field().state.value} onInput={(e) => field().handleChange(e.target.value)} />
                      </div>
                    )}
                  </createPieceForm.Field>
                  <createPieceForm.Field name="cone">
                    {(field) => (
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Cone</label>
                        <input type="number" class="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={field().state.value} onInput={(e) => field().handleChange(Number(e.target.value))} />
                      </div>
                    )}
                  </createPieceForm.Field>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <createPieceForm.Field name="clayBody">
                    {(field) => (
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Clay Body</label>
                        <select class="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={field().state.value} onChange={(e) => field().handleChange(e.target.value)}>
                           <option value="porcelain">Porcelain</option>
                           <option value="stoneware">Stoneware</option>
                           <option value="earthenware">Earthenware</option>
                           <option value="terracotta">Terracotta</option>
                        </select>
                      </div>
                    )}
                  </createPieceForm.Field>
                  <createPieceForm.Field name="glaze">
                    {(field) => (
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Glaze</label>
                        <input class="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={field().state.value} onInput={(e) => field().handleChange(e.target.value)} />
                      </div>
                    )}
                  </createPieceForm.Field>
                </div>

                <div class="flex justify-end gap-2 pt-4">
                  <Dialog.CloseButton class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium">Cancel</Dialog.CloseButton>
                  <createPieceForm.Subscribe
                     selector={(state) => ({
                       canSubmit: state.canSubmit,
                       isSubmitting: state.isSubmitting
                     })}
                  >
                    {(state) => (
                      <button
                        type="submit"
                        disabled={!state().canSubmit}
                        class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                         Create
                      </button>
                    )}
                  </createPieceForm.Subscribe>
                </div>
             </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={saveQueryOpen()} onOpenChange={setSaveQueryOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50 z-50 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0" />
          <Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-sm p-6 z-50">
             <Dialog.Title class="text-xl font-bold mb-4">Save Query</Dialog.Title>
             <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); saveQueryForm.handleSubmit(); }} class="space-y-4">
                <saveQueryForm.Field
                  name="name"
                  validators={{ onChange: ({ value }) => !value ? "Name required" : undefined }}
                >
                  {(field) => (
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Query Name</label>
                      <input
                         class="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                         value={field().state.value}
                         onInput={(e) => field().handleChange(e.target.value)}
                      />
                      <Show when={field().state.meta.errors.length}>
                        <p class="text-xs text-rose-600 mt-1">{field().state.meta.errors.join(", ")}</p>
                      </Show>
                    </div>
                  )}
                </saveQueryForm.Field>
                <div class="flex justify-end gap-2 pt-4">
                  <Dialog.CloseButton class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium">Cancel</Dialog.CloseButton>
                  <saveQueryForm.Subscribe selector={(state) => ({ canSubmit: state.canSubmit })}>
                    {(state) => (
                      <button
                        type="submit"
                        disabled={!state().canSubmit}
                        class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                         Save
                      </button>
                    )}
                  </saveQueryForm.Subscribe>
                </div>
             </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={mergeOpen()} onOpenChange={setMergeOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50 z-50 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0" />
          <Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-sm p-6 z-50">
             <Dialog.Title class="text-xl font-bold mb-4">Merge Duplicate</Dialog.Title>
             <p class="text-sm text-slate-600 mb-4">Select a piece to merge into the current one. The selected piece will be archived.</p>
             <select class="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-4" value={mergeTarget()} onChange={(e) => setMergeTarget(e.target.value)}>
                <option value="">-- Select piece --</option>
                <For each={visiblePieces().filter(p => p.id !== state.selectedPieceId)}>
                  {(p) => <option value={p.id}>{p.title} ({p.maker})</option>}
                </For>
             </select>
             <div class="flex justify-end gap-2">
                <Dialog.CloseButton class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium">Cancel</Dialog.CloseButton>
                <button
                  onClick={() => {
                     if (mergeTarget()) {
                        mergePieces(selectedPiece()!.id, mergeTarget());
                        setMergeOpen(false);
                     }
                  }}
                  disabled={!mergeTarget()}
                  class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Merge
                </button>
             </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
};

export default App;
