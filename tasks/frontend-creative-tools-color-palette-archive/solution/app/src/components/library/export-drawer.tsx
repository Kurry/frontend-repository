import { component$, useContext, useSignal, $ } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';

export const ExportDrawer = component$(() => {
  const store = useContext(GlobalStoreContext);
  // Using a local piece of state to manage if it is open (since it's an action, we could also use a store value like exportFormat)
  // The spec says "Export drawer format tabs with monospaced preview and the Detail/Editor contrast matrix are present as specified surfaces".
  const isOpen = useSignal(false);
  const currentFormat = useSignal<'css' | 'utility-theme' | 'scss' | 'json'>('json');

  return (
    <>
      <div class="fixed bottom-4 right-4 z-50 flex gap-2">
         <button class="btn btn-neutral rounded-none shadow-lg text-white font-bold tracking-widest uppercase text-xs" onClick$={() => isOpen.value = true}>
           Export
         </button>
         <button class="btn btn-primary rounded-none shadow-lg text-white font-bold tracking-widest uppercase text-xs" onClick$={() => store.selectionId = 'new'}>
           + Create Palette
         </button>
      </div>

      {isOpen.value && (
        <div class="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog" aria-label="Export Drawer">
           <div class="absolute inset-0 bg-black/50" onClick$={() => isOpen.value = false}></div>
           <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
             <div class="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
               <h3 class="font-bold text-lg font-serif">Export Library</h3>
               <button class="btn btn-sm btn-ghost btn-circle" onClick$={() => isOpen.value = false} aria-label="Close">✕</button>
             </div>

             <div class="flex border-b border-gray-200" role="tablist" aria-label="Export Formats">
               <button
                   role="tab"
                   aria-selected={currentFormat.value === 'css'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${currentFormat.value === 'css' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => currentFormat.value = 'css'}
                 >
                   CSS vars
               </button>
               <button
                   role="tab"
                   aria-selected={currentFormat.value === 'utility-theme'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${currentFormat.value === 'utility-theme' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => currentFormat.value = 'utility-theme'}
                 >
                   Utility-theme snippet
               </button>
               <button
                   role="tab"
                   aria-selected={currentFormat.value === 'scss'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${currentFormat.value === 'scss' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => currentFormat.value = 'scss'}
                 >
                   SCSS map
               </button>
               <button
                   role="tab"
                   aria-selected={currentFormat.value === 'json'}
                   class={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${currentFormat.value === 'json' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                   onClick$={() => currentFormat.value = 'json'}
                 >
                   JSON
               </button>
             </div>

             <div class="flex-1 overflow-y-auto p-4 bg-gray-900 text-gray-100 font-mono text-xs">
               <pre class="whitespace-pre-wrap break-all" id="ExportPreviewText">
                 {currentFormat.value === 'json' && JSON.stringify({ version: "palette-archive.v1", palettes: store.palettes }, null, 2)}
                 {currentFormat.value === 'css' && `:root {\n${store.palettes.map(p => `  /* ${p.name} */\n${p.swatches.map((s,i) => `  --color-${p.name.toLowerCase().replace(/\s+/g,'-')}-${(i+1)*100}: ${s.toLowerCase()};`).join('\n')}`).join('\n\n')}\n}`}
                 {currentFormat.value === 'scss' && `$palettes: (\n${store.palettes.map(p => `  "${p.name.toLowerCase().replace(/\s+/g,'-')}": (\n${p.swatches.map((s,i) => `    ${(i+1)*100}: ${s.toLowerCase()},`).join('\n')}\n  ),`).join('\n')}\n);`}
                 {currentFormat.value === 'utility-theme' && `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${store.palettes.map(p => `        "${p.name.toLowerCase().replace(/\s+/g,'-')}": {\n${p.swatches.map((s,i) => `          ${(i+1)*100}: "${s.toLowerCase()}",`).join('\n')}\n        },`).join('\n')}\n      }\n    }\n  }\n}`}
               </pre>
             </div>

             <div class="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2 relative">
               <button class="btn btn-neutral w-full rounded-none text-white font-bold uppercase tracking-widest text-xs" onClick$={() => {
                   let txt = '';
                   if (currentFormat.value === 'json') txt = JSON.stringify({ version: "palette-archive.v1", palettes: store.palettes }, null, 2);
                   else if (currentFormat.value === 'css') txt = `:root {\n${store.palettes.map(p => `  /* ${p.name} */\n${p.swatches.map((s,i) => `  --color-${p.name.toLowerCase().replace(/\s+/g,'-')}-${(i+1)*100}: ${s.toLowerCase()};`).join('\n')}`).join('\n\n')}\n}`;
                   else if (currentFormat.value === 'scss') txt = `$palettes: (\n${store.palettes.map(p => `  "${p.name.toLowerCase().replace(/\s+/g,'-')}": (\n${p.swatches.map((s,i) => `    ${(i+1)*100}: ${s.toLowerCase()},`).join('\n')}\n  ),`).join('\n')}\n);`;
                   else if (currentFormat.value === 'utility-theme') txt = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${store.palettes.map(p => `        "${p.name.toLowerCase().replace(/\s+/g,'-')}": {\n${p.swatches.map((s,i) => `          ${(i+1)*100}: "${s.toLowerCase()}",`).join('\n')}\n        },`).join('\n')}\n      }\n    }\n  }\n}`;
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
