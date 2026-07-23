import { Component, createSignal, Show } from 'solid-js';
import { Dialog, type CreateToasterReturn } from '@ark-ui/solid';
import { createForm } from '@felte/solid';
import { validator } from '@felte/validator-zod';
import { z } from 'zod';
import { exportVaultJson, importVault, logAudit, store } from '../store';
import { vaultImportSchema } from '../validation';
import { DecorativeIcon } from './PermissionSwitch';
import { IconCopy, IconDownload } from '@tabler/icons-solidjs';

const importSchema = z.object({
  jsonString: z.string().superRefine((val, ctx) => {
    try {
      const parsed = JSON.parse(val);
      const result = vaultImportSchema.safeParse(parsed);
      if (!result.success) {
        const issue = result.error.issues[0];
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${issue?.path.join('.') || 'vault import'}: ${issue?.message ?? 'Invalid Vault JSON.'}`,
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'vault import: Paste valid Vault JSON.',
      });
    }
  }),
});

export const VaultDrawer: Component<{
  open: boolean;
  onClose: () => void;
  toast: CreateToasterReturn;
}> = (props) => {
  const [mode, setMode] = createSignal<'export' | 'import'>('export');
  const [closing, setClosing] = createSignal(false);
  const [pendingImport, setPendingImport] = createSignal<string | null>(null);
  const [importError, setImportError] = createSignal<string | null>(null);

  const vaultText = () => JSON.stringify(exportVaultJson(), null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(vaultText());
    props.toast.create({ title: 'Copied', description: 'Vault JSON copied to clipboard' });
    logAudit('Exported vault configuration to clipboard.', 'vault-exported', store.identities.find((i) => i.id === store.activeIdentityId)?.nickname);
  };

  const handleDownload = () => {
    const blob = new Blob([vaultText()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nostrpass-vault.json';
    a.click();
    URL.revokeObjectURL(url);
    props.toast.create({ title: 'Downloaded', description: 'Vault JSON downloaded.' });
    logAudit('Exported vault configuration.', 'vault-exported', store.identities.find((i) => i.id === store.activeIdentityId)?.nickname);
  };

  const { form, errors, reset, isSubmitting } = createForm({
    extend: validator({ schema: importSchema }),
    onSubmit: (values) => {
      setPendingImport(values.jsonString);
    },
  });

  const confirmImport = () => {
    const raw = pendingImport();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const result = importVault(parsed);
      if (!result.ok) {
        setImportError(result.error);
        setPendingImport(null);
        return;
      }
      props.toast.create({ title: 'Success', description: 'Vault imported successfully' });
      setPendingImport(null);
      setImportError(null);
      requestClose();
      reset();
    } catch {
      setImportError('vault import: Invalid Vault JSON.');
      setPendingImport(null);
    }
  };

  const requestClose = () => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      props.onClose();
    }, 180);
  };

  return (
    <>
      <Dialog.Root open={props.open} onOpenChange={(e) => !e.open && requestClose()}>
        <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-40 dialog-backdrop" classList={{ 'dialog-closing': closing() }} />
        <Dialog.Positioner class="fixed inset-0 flex justify-end z-50">
          <Dialog.Content class="bg-slate-900 border-l border-slate-700 w-full max-w-md h-full flex flex-col shadow-2xl drawer-panel" classList={{ 'dialog-closing': closing() }}>
            <div class="flex items-center justify-between p-4 border-b border-slate-800">
              <Dialog.Title class="text-lg font-semibold text-slate-100">Export vault</Dialog.Title>
              <Dialog.CloseTrigger class="text-slate-400 hover:text-slate-200 p-2">Close</Dialog.CloseTrigger>
            </div>

            <div class="flex gap-2 p-4 border-b border-slate-800">
              <button
                type="button"
                class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                classList={{
                  'bg-violet-600 text-white': mode() === 'export',
                  'bg-slate-800 text-slate-400 hover:bg-slate-700': mode() !== 'export',
                }}
                onClick={() => setMode('export')}
              >
                Export vault
              </button>
              <button
                type="button"
                class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                classList={{
                  'bg-violet-600 text-white': mode() === 'import',
                  'bg-slate-800 text-slate-400 hover:bg-slate-700': mode() !== 'import',
                }}
                onClick={() => setMode('import')}
              >
                Import vault
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 max-w-full">
              <Show when={mode() === 'export'}>
                <div class="space-y-4">
                  <p class="text-sm text-slate-400">Save this JSON securely to backup your keys and grants.</p>
                  <pre class="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-800 max-w-full">
                    {vaultText()}
                  </pre>
                  <div class="flex gap-2">
                    <button type="button" onClick={handleCopy} class="hover-wash flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200">
                      <DecorativeIcon><IconCopy size={16} /></DecorativeIcon>
                      Copy
                    </button>
                    <button type="button" onClick={handleDownload} class="hover-wash flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200">
                      <DecorativeIcon><IconDownload size={16} /></DecorativeIcon>
                      Download
                    </button>
                  </div>
                </div>
              </Show>

              <Show when={mode() === 'import'}>
                <form ref={form} class="space-y-4 flex flex-col h-full">
                  <label class="text-sm text-slate-400" for="vault-json-input">
                    Vault JSON
                  </label>
                  <textarea
                    id="vault-json-input"
                    name="jsonString"
                    class="flex-1 min-h-[240px] w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-violet-500 resize-none max-w-full break-all"
                    placeholder='{"version":"nostrpass-vault-v1", ...}'
                  />
                  <div aria-live="polite" role="status" class="text-xs text-rose-400">
                    <Show when={importError()}>{(msg) => <span>{msg()}</span>}</Show>
                    <Show when={!importError() && errors().jsonString}>{(msg) => <span>{msg()[0]}</span>}</Show>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting() || !!errors().jsonString}
                    class="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl disabled:opacity-50"
                  >
                    Restore vault
                  </button>
                </form>
              </Show>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Dialog.Root open={pendingImport() !== null} onOpenChange={(e) => !e.open && setPendingImport(null)}>
        <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-[60] dialog-backdrop" />
        <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4 z-[70]">
          <Dialog.Content class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl max-w-sm w-full dialog-panel">
            <Dialog.Title class="text-lg font-semibold text-slate-100 mb-2">Import vault?</Dialog.Title>
            <Dialog.Description class="text-sm text-slate-400 mb-6">
              This will replace the current vault with the pasted configuration.
            </Dialog.Description>
            <div class="flex justify-end gap-3">
              <Dialog.CloseTrigger class="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</Dialog.CloseTrigger>
              <button type="button" onClick={confirmImport} class="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500">
                Import vault
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};
