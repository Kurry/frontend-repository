import { Component, createSignal, Show } from 'solid-js';
import { Dialog, type CreateToasterReturn } from '@ark-ui/solid';
import { createForm } from '@felte/solid';
import { validator } from '@felte/validator-zod';
import { z } from 'zod';
import {
  exportBackupJson,
  importBackup,
  logAudit,
  store,
} from '../store';
import { backupSchema } from '../validation';
import { DecorativeIcon } from './PermissionSwitch';
import { IconCopy, IconDownload } from '@tabler/icons-solidjs';

const importSchema = z.object({
  jsonString: z.string().superRefine((val, ctx) => {
    try {
      const parsed = JSON.parse(val);
      const result = backupSchema.safeParse(parsed);
      if (!result.success) {
        const issue = result.error.issues[0];
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${issue?.path.join('.') || 'backup import'}: ${issue?.message ?? 'Invalid Key Backup JSON.'}`,
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'backup import: Paste valid Key Backup JSON.',
      });
    }
  }),
});

export const BackupDrawer: Component<{
  identityId: string | null;
  onClose: () => void;
  toast: CreateToasterReturn;
}> = (props) => {
  const [mode, setMode] = createSignal<'export' | 'import'>('export');
  const [closing, setClosing] = createSignal(false);

  const identity = () => store.identities.find((i) => i.id === props.identityId);

  const backupJson = () => {
    const id = props.identityId;
    if (!id) return '';
    const data = exportBackupJson(id);
    return data ? JSON.stringify(data, null, 2) : '';
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(backupJson());
    const label = identity()?.nickname ?? 'identity';
    props.toast.create({ title: 'Copied', description: `Key Backup JSON copied for ${label}.` });
    logAudit(`Exported backup for "${label}".`, 'backup-exported', label);
  };

  const handleDownload = () => {
    const blob = new Blob([backupJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${identity()?.nickname ?? 'identity'}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    const label = identity()?.nickname ?? 'identity';
    props.toast.create({ title: 'Downloaded', description: `Key Backup JSON downloaded for ${label}.` });
    logAudit(`Exported backup for "${label}".`, 'backup-exported', label);
  };

  const [importError, setImportError] = createSignal<string | null>(null);

  const { form, errors, reset, isSubmitting } = createForm({
    extend: validator({ schema: importSchema }),
    onSubmit: (values) => {
      try {
        const parsed = JSON.parse(values.jsonString);
        const result = importBackup(parsed);
        if (!result.ok) {
          setImportError(result.error);
          return;
        }
        props.toast.create({ title: 'Success', description: 'Key Backup imported successfully.' });
        setImportError(null);
        requestClose();
        reset();
      } catch {
        setImportError('backup import: Invalid Key Backup JSON.');
      }
    },
  });

  const requestClose = () => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      props.onClose();
    }, 180);
  };

  return (
    <Dialog.Root
      open={props.identityId !== null}
      onOpenChange={(e) => {
        if (!e.open) requestClose();
      }}
    >
      <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-40 dialog-backdrop" classList={{ 'dialog-closing': closing() }} />
      <Dialog.Positioner class="fixed inset-0 flex justify-end z-50">
        <Dialog.Content
          class="bg-slate-900 border-l border-slate-700 w-full max-w-md h-full flex flex-col shadow-2xl dialog-panel"
          classList={{ 'dialog-closing': closing() }}
        >
          <div class="flex items-center justify-between p-4 border-b border-slate-800">
            <Dialog.Title class="text-lg font-semibold text-slate-100">
              Export backup — {identity()?.nickname ?? ''}
            </Dialog.Title>
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
              Export backup
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
              Import backup
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <Show when={mode() === 'export'}>
              <div class="space-y-4">
                <p class="text-sm text-slate-400">Single-identity Key Backup JSON compiled live from the vault.</p>
                <div
                  class="w-24 h-24 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-[10px] text-slate-500 text-center p-2"
                  aria-label="Placeholder QR rendering of the backup"
                >
                  Placeholder QR tile
                </div>
                <div class="relative group">
                  <pre class="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-800 max-w-full">
                    {backupJson()}
                  </pre>
                  <div class="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleCopy}
                      class="hover-wash flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
                    >
                      <DecorativeIcon><IconCopy size={16} /></DecorativeIcon>
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      class="hover-wash flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
                    >
                      <DecorativeIcon><IconDownload size={16} /></DecorativeIcon>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            <Show when={mode() === 'import'}>
              <form ref={form} class="space-y-4 flex flex-col h-full">
                <label class="text-sm text-slate-400" for="backup-json-input">
                  Key Backup JSON
                </label>
                <textarea
                  id="backup-json-input"
                  name="jsonString"
                  class="flex-1 min-h-[240px] w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none max-w-full break-all"
                  placeholder='{"version":"nostrpass-backup-v1", ...}'
                />
                <div aria-live="polite" role="status" class="text-xs text-rose-400">
                  <Show when={importError()}>{(msg) => <span>{msg()}</span>}</Show>
                  <Show when={!importError() && errors().jsonString}>{(err) => <span>{err()[0]}</span>}</Show>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting() || !!errors().jsonString}
                  class="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl disabled:opacity-50"
                >
                  Import backup
                </button>
              </form>
            </Show>
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
