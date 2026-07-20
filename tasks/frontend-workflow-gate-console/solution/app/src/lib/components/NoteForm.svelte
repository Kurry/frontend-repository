<script lang="ts">
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { onMount, onDestroy, tick } from 'svelte';
  import { X, NotePencil } from 'phosphor-svelte';
  import { gateNoteSchema, type GateNote } from '../contracts';
  import { consoleStore } from '../console-store.svelte';

  let { gateId }: { gateId: string } = $props();

  const { form, errors, data, reset } = createForm<GateNote>({
    initialValues: { text: '', category: '' as GateNote['category'] },
    extend: validator({ schema: gateNoteSchema }),
    validateOnMount: true,
    onSubmit(values) {
      if (consoleStore.addNote(gateId, values)) reset();
    }
  });

  const valid = $derived(gateNoteSchema.safeParse($data).success);
  const textLength = $derived(($data.text ?? '').length);
  const textError = $derived.by(() => {
    const length = ($data.text ?? '').trim().length;
    return length < 1 || length > 200 ? 'text must contain 1 to 200 trimmed characters' : '';
  });
  const categoryError = $derived(
    ['observation', 'waiver-request', 'follow-up'].includes($data.category ?? '')
      ? '' : 'category is required and must match the allowed enum'
  );

  let priorFocus: HTMLElement | null = null;
  onMount(async () => {
    priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await tick();
    document.getElementById(`note-text-${gateId}`)?.focus();
  });
  onDestroy(() => {
    const fallback = priorFocus;
    setTimeout(() => {
      const replacement = document.querySelector<HTMLElement>(`[data-add-note="${CSS.escape(gateId)}"]`);
      if (replacement) replacement.focus();
      else if (fallback?.isConnected) fallback.focus();
    }, 0);
  });

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') consoleStore.closeNoteForm();
  }
</script>

<svelte:window onkeydown={handleEscape} />

<form use:form class="note-form soft-surface" aria-label={`Add note to ${gateId}`}>
  <div class="form-heading">
    <div>
      <strong>Add gate note</strong>
      <span>API create body · text + category</span>
    </div>
    <button type="button" class="icon-button" aria-label="Cancel adding note" onclick={() => consoleStore.closeNoteForm()}>
      <X size={16} weight="bold" />
    </button>
  </div>

  <label for={`note-text-${gateId}`}>Text <span class="required">Required</span></label>
  <textarea id={`note-text-${gateId}`} name="text" rows="3" maxlength="201" aria-describedby={`note-text-error-${gateId}`}></textarea>
  <div class="field-meta">
    <span id={`note-text-error-${gateId}`} class:error={Boolean(textError)}>
      {textError || $errors.text?.[0] || '1–200 trimmed characters'}
    </span>
    <span class:over={textLength > 200}>{textLength}/200</span>
  </div>

  <label for={`note-category-${gateId}`}>Category <span class="required">Required</span></label>
  <select id={`note-category-${gateId}`} name="category" aria-describedby={`note-category-error-${gateId}`}>
    <option value="">Select category</option>
    <option value="observation">Observation</option>
    <option value="waiver-request">Waiver request</option>
    <option value="follow-up">Follow-up</option>
  </select>
  {#if categoryError || $errors.category}
    <span id={`note-category-error-${gateId}`} class="error">{categoryError || $errors.category?.[0]}</span>
  {/if}

  <div class="form-actions">
    <button type="button" class="action" onclick={() => consoleStore.closeNoteForm()}>Cancel</button>
    <button type="submit" class="action primary" disabled={!valid}>
      <NotePencil size={16} weight="bold" /> Attach note
    </button>
  </div>
</form>

<style>
  .note-form { margin: .75rem 0 .15rem; border-radius: .65rem; padding: .8rem; }
  .form-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:.7rem; }
  .form-heading strong { display:block; font-size:.78rem; }
  .form-heading span { display:block; margin-top:.12rem; font: .65rem var(--font-mono); color:#708096; }
  :global(.dark) .form-heading span { color:#8fa1b7; }
  label { display:flex; align-items:center; justify-content:space-between; margin:.55rem 0 .3rem; font-size:.7rem; font-weight:750; }
  .required { color:#b63c4b; text-transform:uppercase; font-size:.56rem; letter-spacing:.07em; }
  textarea, select { width:100%; color:inherit; background:white; border:1px solid #cbd5e2; border-radius:.5rem; padding:.55rem .6rem; font-size:.74rem; transition:border-color .18s, box-shadow .18s; }
  textarea { resize:vertical; min-height:4.4rem; }
  :global(.dark) textarea, :global(.dark) select { background:#071421; border-color:#32465c; }
  .field-meta { display:flex; justify-content:space-between; gap:1rem; color:#718096; font-size:.63rem; padding-top:.22rem; }
  .error, .field-meta .error, .over { color:#d13f53; font-size:.64rem; }
  .form-actions { display:flex; justify-content:flex-end; gap:.45rem; margin-top:.8rem; }
  .icon-button { display:grid; place-items:center; width:1.8rem; height:1.8rem; color:inherit; background:transparent; border:0; border-radius:.4rem; cursor:pointer; }
  .icon-button:hover { background:rgba(127,145,166,.14); }
</style>
