import { component$, useContext } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import { buildExportText } from '../../utils/export';

export const ExportDrawer = component$(() => {
  const store = useContext(GlobalStoreContext);
  // Open/format state lives on the shared store (not local signals) so the
  // WebMCP browse_open/artifact_export/artifact_copy tools can drive the
  // exact same drawer the UI's Export button opens.

  return (
    <>
      <div class="fixed bottom-4 right-4 z-50 flex gap-2">
         <button class="btn btn-neutral rounded-none shadow-lg text-white font-bold tracking-widest uppercase text-xs" onClick$={() => store.exportDrawerOpen = true}>
           Export
         </button>
         <button class="btn btn-primary rounded-none shadow-lg text-white font-bold tracking-widest uppercase text-xs" onClick$={() => store.selectionId = 'new'}>
           + Create Palette
         </button>
      </div>

      {store.exportDrawerOpen && (
        <div class="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog" aria-label="Export Drawer">
           <div class="absolute inset-0 bg-black/50" onClick$={() => store.exportDrawerOpen = false}></div>
           <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
             <div class="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
               <h3 class="font-bold text-lg font-serif">Export Library</h3>
               <button class="btn btn-sm btn-ghost btn-circle" onClick$={() => store.exportDrawerOpen = false} aria-label="Close">✕</button>
             </div>

             <div class="flex border-b border-gray-200" role="tablist" aria-label="Export Formats">
               <button
                   role="tab"
                   aria-selected={store.exportFormat === 'css'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${store.exportFormat === 'css' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => store.exportFormat = 'css'}
                 >
                   CSS vars
               </button>
               <button
                   role="tab"
                   aria-selected={store.exportFormat === 'utility-theme'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${store.exportFormat === 'utility-theme' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => store.exportFormat = 'utility-theme'}
                 >
                   Utility-theme snippet
               </button>
               <button
                   role="tab"
                   aria-selected={store.exportFormat === 'scss'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${store.exportFormat === 'scss' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => store.exportFormat = 'scss'}
                 >
                   SCSS map
               </button>
               <button
                   role="tab"
                   aria-selected={store.exportFormat === 'json'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${store.exportFormat === 'json' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => store.exportFormat = 'json'}
                 >
                   JSON
               </button>
             </div>

             <div class="flex-1 overflow-y-auto p-4 bg-gray-900 text-gray-100 font-mono text-xs">
               <pre class="whitespace-pre-wrap break-all" id="ExportPreviewText">
                 {buildExportText(store.exportFormat, store.palettes)}
               </pre>
             </div>

             <div class="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2 relative">
               <button class="btn btn-neutral w-full rounded-none text-white font-bold uppercase tracking-widest text-xs" onClick$={() => {
                   const txt = buildExportText(store.exportFormat, store.palettes);
                   navigator.clipboard.writeText(txt);
                   store.copyFeedback = 'export';
                   setTimeout(() => store.copyFeedback = null, 1500);
               }}>
                 Copy to Clipboard
               </button>
               {store.copyFeedback === 'export' && (
                 <div class="text-center text-sm font-bold text-green-700" aria-live="polite">
                   Copied successfully!
                 </div>
               )}
             </div>
           </div>
        </div>
      )}
    </>
  );
});
