<script>
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import {
    activeTheme, artifactFormat, artifactOpen, artifactText, importDraft,
    importThemeObject,
  } from './stores.js';
  import { importSchema, themeSchema } from './schema.js';

  let copied = '';
  let importError = '';
  let closeButton;

  $: css = artifactText('css', $activeTheme);
  $: json = artifactText('json', $activeTheme);
  $: config = artifactText('config', $activeTheme);
  $: text = $artifactFormat === 'json' ? json : $artifactFormat === 'config' ? config : css;

  const { form: importForm } = createForm({
    extend: validator({ schema: importSchema }),
    onSubmit: ({ payload }) => doImport(payload),
  });

  function close() {
    artifactOpen.set(false);
  }

  async function copy() {
    if ($artifactFormat === 'json' && !themeSchema.safeParse(JSON.parse(json)).success) {
      copied = 'Validation failed';
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be restricted */
    }
    copied = 'Copied';
    setTimeout(() => { copied = ''; }, 1700);
  }

  function download() {
    const ext = $artifactFormat === 'css' ? 'css' : $artifactFormat === 'config' ? 'js' : 'theme.json';
    const type = $artifactFormat === 'css' ? 'text/css' : $artifactFormat === 'config' ? 'text/javascript' : 'application/json';
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${$activeTheme.name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport(raw) {
    importError = '';
    try {
      const result = importThemeObject(JSON.parse(raw));
      if (!result.ok) importError = result.error;
      else {
        copied = 'Theme imported';
        importDraft.set('');
        setTimeout(() => { copied = ''; }, 1700);
      }
    } catch {
      importError = 'Import theme error: payload must be valid JSON';
    }
  }

  function keydown(event) {
    if (event.key === 'Escape') close();
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const root = event.currentTarget;
    const focusable = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

<svelte:window on:keydown={keydown} />
<div class="modal modal-open export-modal" role="presentation" on:keydown={trapFocus}>
  <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="export-title">
    <div class="modal-heading">
      <div>
        <p>Artifact center</p>
        <h2 id="export-title">{$activeTheme.name}</h2>
      </div>
      <button bind:this={closeButton} type="button" aria-label="Close artifact center" on:click={close}>×</button>
    </div>
    <div class="export-tabs" role="tablist" aria-label="Artifact format">
      <button type="button" role="tab" aria-selected={$artifactFormat === 'css'} class:active={$artifactFormat === 'css'} on:click={() => artifactFormat.set('css')}>CSS</button>
      <button type="button" role="tab" aria-selected={$artifactFormat === 'json'} class:active={$artifactFormat === 'json'} on:click={() => artifactFormat.set('json')}>JSON</button>
      <button type="button" role="tab" aria-selected={$artifactFormat === 'config'} class:active={$artifactFormat === 'config'} on:click={() => artifactFormat.set('config')}>Config</button>
    </div>
    <pre>{text}</pre>
    <div class="export-actions">
      <button type="button" class="btn btn-neutral" on:click={copy}>{copied || `Copy ${$artifactFormat.toUpperCase()}`}</button>
      <button type="button" class="btn" on:click={download}>Download</button>
    </div>
    <form use:importForm class="import-form" on:submit|preventDefault={() => doImport($importDraft)}>
      <label for="import-payload">Import theme</label>
      <textarea id="import-payload" name="payload" bind:value={$importDraft} placeholder="Paste a previously exported theme JSON object"></textarea>
      {#if importError}<p class="field-error" role="alert">{importError}</p>{/if}
      <button type="submit" class="btn btn-primary">Import declared theme</button>
    </form>
    <p class="sr-live" aria-live="polite">{copied}</p>
  </div>
  <button class="modal-backdrop" aria-label="Close artifact center" on:click={close}></button>
</div>
