import { Component, createSignal, Show } from 'solid-js';
import { Dialog, Toast } from '@ark-ui/solid';
import { store, importVault, logAudit } from '../store';
import { createForm } from '@felte/solid';
import { validator } from '@felte/validator-zod';
import { z } from 'zod';
import { IconCopy } from '@tabler/icons-solidjs';

const vaultSchema = z.object({
  jsonString: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      const schema = z.object({
        version: z.number().int().min(1),
        activeLabel: z.string(),
        theme: z.enum(['light', 'dark']),
        identities: z.array(z.object({
          label: z.string(),
          npub: z.string(),
          nsec: z.string(),
          grants: z.record(z.boolean())
        })).min(1)
      });
      return schema.safeParse(parsed).success;
    } catch {
      return false;
    }
  }, 'Invalid Vault JSON format.')
});

export const VaultDrawer: Component<{
  open: boolean,
  onClose: () => void,
  toast: ReturnType<typeof Toast.createToaster>
}> = (props) => {
  const [mode, setMode] = createSignal<'export' | 'import'>('export');

  const generateExportJson = () => {
    const data = {
      version: 1,
      activeLabel: store.identities.find(i => i.id === store.activeIdentityId)?.nickname || '',
      theme: store.theme,
      identities: store.identities.map(i => ({
        label: i.nickname,
        npub: i.npub,
        nsec: i.nsec,
        grants: store.grants[i.id] || {}
      }))
    };
    return JSON.stringify(data, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateExportJson());
    props.toast.create({ title: 'Success', description: 'Vault JSON copied to clipboard' });
    logAudit('Exported vault configuration to clipboard.');
  };

  const {
    form: importFormHandler,
    errors: importErrors,
    reset: resetImport,
    isSubmitting: isImporting
  } = createForm({
    extend: validator({ schema: vaultSchema }),
    onSubmit: (values) => {
      try {
        const parsed = JSON.parse(values.jsonString);
        importVault(parsed);
        props.toast.create({ title: 'Success', description: 'Vault imported successfully' });
        props.onClose();
        resetImport();
      } catch (e) {
        // Validation handles format errors
      }
    },
  });

  return (
    <Dialog.Root open={props.open} onOpenChange={(e) => !e.open && props.onClose()}>
      <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-40 motion-safe:animate-in motion-safe:fade-in" />
      <Dialog.Positioner class="fixed inset-0 flex justify-end z-50">
        <Dialog.Content class="bg-slate-900 border-l border-slate-700 w-full max-w-md h-full flex flex-col shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right">
          <div class="flex items-center justify-between p-4 border-b border-slate-800">
            <Dialog.Title class="text-lg font-semibold text-slate-100">Vault Data</Dialog.Title>
            <Dialog.CloseTrigger class="text-slate-400 hover:text-slate-200 p-2">✕</Dialog.CloseTrigger>
          </div>

          <div class="flex gap-2 p-4 border-b border-slate-800">
             <button
               class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
               classList={{
                 'bg-violet-600 text-white': mode() === 'export',
                 'bg-slate-800 text-slate-400 hover:bg-slate-700': mode() !== 'export'
               }}
               onClick={() => setMode('export')}
             >
               Export
             </button>
             <button
               class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
               classList={{
                 'bg-violet-600 text-white': mode() === 'import',
                 'bg-slate-800 text-slate-400 hover:bg-slate-700': mode() !== 'import'
               }}
               onClick={() => setMode('import')}
             >
               Import
             </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <Show when={mode() === 'export'}>
              <div class="space-y-4">
                <p class="text-sm text-slate-400">Save this JSON securely to backup your keys and grants.</p>
                <div class="relative group">
                  <pre class="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-800">
                    {generateExportJson()}
                  </pre>
                  <button
                    onClick={handleCopy}
                    class="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy to clipboard"
                  >
                    <IconCopy size={16} />
                  </button>
                </div>
              </div>
            </Show>

            <Show when={mode() === 'import'}>
               <form ref={importFormHandler} class="space-y-4 flex flex-col h-full">
                  <p class="text-sm text-slate-400">Paste your previously exported Vault JSON below.</p>
                  <div class="flex-1 flex flex-col min-h-[300px]">
                     <textarea
                       name="jsonString"
                       class="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
                       placeholder='{\n  "version": 1,\n  ...'
                     />
                  </div>
                  <div aria-live="polite" class="text-xs text-rose-400">
                    <Show when={importErrors().jsonString}>
                      {(err) => <span>{err()[0]}</span>}
                    </Show>
                  </div>
                  <button
                    type="submit"
                    disabled={isImporting() || !!importErrors().jsonString}
                    class="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl disabled:opacity-50 transition-colors"
                  >
                    Restore Vault
                  </button>
               </form>
            </Show>
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
