<script lang="ts">
  import { createForm } from '@tanstack/svelte-form';
  import { IconAlertCircle, IconFileImport, IconX } from '@tabler/icons-svelte';
  import { fade, scale } from 'svelte/transition';
  import { importTextSchema } from '../lib/schemas';
  import { triage } from '../lib/triage.svelte';
  import { focusTrap } from '../lib/focusTrap';
  import { motion } from '../lib/motion.svelte';

  let { returnFocus }: { returnFocus?: HTMLElement } = $props();
  let closeButton: HTMLButtonElement;
  let draft = $state(triage.importDraft);
  let fieldError = $state('');

  const form = createForm(() => ({
    defaultValues: { json: triage.importDraft },
    validators: {
      onSubmit: ({ value }) => {
        const parsed = importTextSchema.safeParse(value.json);
        return parsed.success ? undefined : { json: parsed.error.issues[0]?.message };
      },
    },
    onSubmit: ({ value }) => triage.importReport(value.json),
  }));

  function validationMessage(value: string): string | undefined {
    if (!value) return undefined;
    const parsed = importTextSchema.safeParse(value);
    return parsed.success ? undefined : parsed.error.issues[0]?.message;
  }

  async function submitImport() {
    const parsed = importTextSchema.safeParse(draft);
    if (!parsed.success) {
      fieldError = parsed.error.issues[0]?.message ?? 'Triage report JSON violates the field contract';
      triage.liveMessage = `Import failed: ${fieldError}`;
      triage.notify(triage.liveMessage, 'danger');
      await form.handleSubmit();
      return;
    }
    fieldError = '';
    form.setFieldValue('json', draft);
    await form.handleSubmit();
  }
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && triage.importOpen && triage.closeImport()} />

{#if triage.importOpen}
<div class="modal-layer open" role="presentation" transition:fade={{ duration: motion.reduced ? 0 : 220 }}>
  <button class="backdrop" aria-label="Close import triage report" onclick={() => triage.closeImport()}></button>
  <div class="dialog card-panel" role="dialog" aria-modal="true" aria-labelledby="import-title" transition:scale={{ start: .97, duration: motion.reduced ? 0 : 220 }} use:focusTrap={{ returnFocus }}>
    <header>
      <div>
        <span class="eyebrow">Replace-suite mode</span>
        <h2 id="import-title">Import triage report</h2>
        <p>Validate and replace the active suite from an exported report.</p>
      </div>
      <button bind:this={closeButton} tabindex={triage.importOpen ? 0 : -1} class="close-button" type="button" aria-label="Close import triage report" onclick={() => triage.closeImport()}><IconX size={19} /></button>
    </header>
    <form
      onsubmit={(event) => {
        event.preventDefault();
        submitImport();
      }}
    >
      <label for="import-json">Triage report JSON</label>
      <textarea
        id="import-json"
        class:error={!!fieldError || !!triage.importError}
        class="control mono"
        value={draft}
        aria-invalid={!!fieldError || !!triage.importError}
        aria-describedby="import-json-help import-json-error"
        spellcheck="false"
        oninput={(event) => {
          draft = (event.currentTarget as HTMLTextAreaElement).value;
          form.setFieldValue('json', draft);
          fieldError = validationMessage(draft) ?? '';
          triage.importDraft = draft;
          triage.importError = '';
        }}
      ></textarea>
      <p class="field-help" id="import-json-help">Required schemaVersion, tests, five-run schedules, reasons, verdicts, and quarantine arrays are checked before any suite state changes.</p>
      {#if fieldError || triage.importError}
        <p class="field-error" id="import-json-error"><IconAlertCircle size={14} /> {triage.importError || fieldError}</p>
      {/if}
      <div class="form-actions">
        <button class="action-btn" type="button" onclick={() => triage.closeImport()}>Cancel</button>
        <button class="action-btn primary" type="submit"><IconFileImport size={16} /> Import and replace suite</button>
      </div>
    </form>
  </div>
</div>
{/if}

<style>
  .modal-layer { position: fixed; z-index: 85; inset: 0; display: grid; visibility: hidden; place-items: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 220ms ease, visibility 0s linear 220ms; }
  .modal-layer.open { visibility: visible; opacity: 1; pointer-events: auto; transition-delay: 0s; }
  .backdrop { position: absolute; inset: 0; border: 0; background: rgba(16, 25, 22, .5); backdrop-filter: blur(3px); }
  .dialog { position: relative; width: min(720px, 100%); max-height: calc(100vh - 32px); overflow: auto; border-radius: 20px; transform: scale(.97); transition: transform 220ms ease; }
  .modal-layer.open .dialog { transform: scale(1); }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; border-bottom: 1px solid #e1e7e3; padding: 22px; }
  h2 { margin: 3px 0 0; color: #17201d; font-size: 21px; letter-spacing: -.025em; }
  header p { margin: 4px 0 0; color: #74817b; font-size: 11px; }
  .close-button { display: grid; width: 36px; height: 36px; flex: 0 0 auto; place-items: center; border: 1px solid #dbe3de; border-radius: 10px; background: #fff; color: #52615b; }
  .close-button:hover { background: #f2f6f3; }
  form { padding: 19px 22px 22px; }
  label { display: block; margin-bottom: 7px; color: #394741; font-size: 12px; font-weight: 800; }
  textarea { display: block; width: 100%; min-height: 290px; resize: vertical; line-height: 1.55; }
  .field-help { margin: 7px 0 0; color: #75817c; font-size: 10px; line-height: 1.45; }
  .field-error { display: flex; align-items: flex-start; gap: 6px; margin: 8px 0 0; border-radius: 8px; background: #fff0ef; padding: 8px; color: #aa292e; font-size: 11px; font-weight: 700; }
  .field-error :global(svg) { flex: 0 0 auto; }
  .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  :global(.dark) header { border-color: #30403a; }
  :global(.dark) h2 { color: #eff4f1; }
  :global(.dark) label { color: #d9e1dd; }
  :global(.dark) .close-button { border-color: #3a4944; background: #202c28; color: #e4ebe7; }
  :global(.dark) .field-error { background: #47282b; color: #f5aaab; }
  @media (max-width: 520px) {
    header, form { padding: 17px 15px; }
    textarea { min-height: 240px; }
    .form-actions { display: grid; grid-template-columns: 1fr; }
    .form-actions .primary { grid-row: 1; }
  }
</style>
