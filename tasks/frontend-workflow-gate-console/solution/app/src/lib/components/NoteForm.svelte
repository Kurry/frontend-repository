<script lang="ts">
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { onMount, tick } from 'svelte';
  import { X, NotePencil } from 'phosphor-svelte';
  import { gateNoteSchema, type GateNote } from '../contracts';
  import { consoleStore } from '../console-store.svelte';
  import { focusTrap } from '../actions';

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

  onMount(async () => {
    await tick();
    document.getElementById(`note-text-${gateId}`)?.focus();
  });

  function close() {
    consoleStore.closeNoteForm();
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={handleEscape} />

<div class="modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && close()}>
  <div
    use:focusTrap
    class="note-form surface"
    role="dialog"
    aria-modal="true"
    aria-labelledby={`note-form-title-${gateId}`}
  >
    <form use:form aria-label={`Add note to ${gateId}`}>
    <div class="form-heading">
      <div>
        <strong id={`note-form-title-${gateId}`}>Add gate note</strong>
        <span>API create body · text + category · {gateId}</span>
      </div>
      <button type="button" class="icon-button" aria-label="Cancel adding note" onclick={close}>
        <X size={16} weight="bold" aria-hidden="true" />
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
      <button type="button" class="action" onclick={close}>Cancel</button>
      <button type="submit" class="action primary" disabled={!valid}>
        <NotePencil size={16} weight="bold" aria-hidden="true" /> Attach note
      </button>
    </div>
    </form>
  </div>
</div>

<style>
  .modal-backdrop { position:fixed; inset:0; z-index:90; display:grid; place-items:center; padding:1rem; background:rgba(2,9,18,.68); backdrop-filter:blur(5px); }
  .note-form { width:min(520px, 100%); border-radius:.85rem; padding:1rem; }
  .form-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:.7rem; }
  .form-heading strong { display:block; font-size:.82rem; }
  .form-heading span { display:block; margin-top:.12rem; font: .65rem var(--font-mono); color:#546478; }
  :global(.dark) .form-heading span { color:#8fa1b7; }
  label { display:flex; align-items:center; justify-content:space-between; margin:.55rem 0 .3rem; font-size:.7rem; font-weight:750; }
  .required { color:#b63c4b; text-transform:uppercase; font-size:.56rem; letter-spacing:.07em; }
  textarea, select { width:100%; color:inherit; background:white; border:1px solid #cbd5e2; border-radius:.5rem; padding:.55rem .6rem; font-size:.74rem; transition:border-color .18s, box-shadow .18s; }
  textarea { resize:vertical; min-height:4.4rem; }
  :global(.dark) textarea, :global(.dark) select { background:#071421; border-color:#32465c; }
  .field-meta { display:flex; justify-content:space-between; gap:1rem; color:#546478; font-size:.63rem; padding-top:.22rem; }
  .error, .field-meta .error, .over { color:#d13f53; font-size:.64rem; }
  .form-actions { display:flex; justify-content:flex-end; gap:.45rem; margin-top:.8rem; }
  .icon-button { display:grid; place-items:center; width:2rem; height:2rem; color:inherit; background:transparent; border:0; border-radius:.4rem; cursor:pointer; }
  .icon-button:hover { background:rgba(127,145,166,.14); }
  @media (max-width:540px) {
    .modal-backdrop { padding:.45rem; align-items:end; }
    .note-form { border-radius:.85rem .85rem .4rem .4rem; }
  }
</style>
