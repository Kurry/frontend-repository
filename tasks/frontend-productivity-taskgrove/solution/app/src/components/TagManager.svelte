<script>
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { store } from '../lib/store.svelte.js';
  import { TagUpsertSchema } from '../lib/schemas.js';

  const isOpen = $derived(store.showTagManager);
  const tags = $derived(store.tags);

  let shakeName = $state(false);
  let selectedColor = $state('#3B82F6');

  const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'
  ];

  const { form, errors, reset } = createForm({
    extend: validator({ schema: TagUpsertSchema }),
    initialValues: { name: '', color: '#3B82F6' },
    onSubmit: (values) => {
      const duplicate = store.tags.some(t => t.name.toLowerCase() === values.name.trim().toLowerCase());
      if (duplicate) {
        shakeName = true;
        store.announce('name must be unique among tags');
        setTimeout(() => { shakeName = false; }, 300);
        return;
      }
      if (store.addTag(values.name, values.color)) {
        reset();
        selectedColor = COLORS[tags.length % COLORS.length];
        shakeName = false;
        store.addToast('Tag created');
      }
    },
    onError: (errs) => {
      shakeName = true;
      setTimeout(() => { shakeName = false; }, 300);
      const first = errs.name?.[0] || errs.color?.[0];
      if (first) store.announce(first);
    },
  });

  $effect(() => {
    if (isOpen) selectedColor = COLORS[tags.length % COLORS.length];
  });
</script>

{#if isOpen}
  <div class="tag-manager-panel border-b border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-theme">
    <div class="flex items-center justify-between mb-2">
      <h2 class="heading font-bold" style="font-size: 48px; line-height: 1.1;">Tag manager</h2>
      <button class="btn-secondary !px-2 !py-1" onclick={() => store.showTagManager = false} aria-label="Close Tag manager">✕</button>
    </div>

    <form use:form class="form-grid mb-2">
      <div class="flex-1 min-w-[120px]">
        <label for="tag-name" class="block text-[10px] font-semibold mb-1">name</label>
        <input
          id="tag-name"
          name="name"
          placeholder="New tag name…"
          class="w-full bg-[var(--color-background)] border rounded px-2 py-2 {shakeName ? 'shake' : ''}"
          style="font-size: 10px; {$errors.name ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
          aria-invalid={!!$errors.name}
          aria-describedby={$errors.name ? 'tag-name-error' : undefined}
        />
        {#if $errors.name}
          <div id="tag-name-error" class="field-error shake" aria-live="polite">{$errors.name[0]}</div>
        {/if}
      </div>
      <div>
        <span class="block text-[10px] font-semibold mb-1">color</span>
        <div class="flex items-center gap-1 flex-wrap">
          {#each COLORS as color}
            <button
              type="button"
              class="w-8 h-8 rounded-full border-2 transition-all"
              style="background-color: {color}; border-color: {color === selectedColor ? 'var(--color-primary)' : 'transparent'};"
              onclick={() => { selectedColor = color; }}
              aria-label="Select color {color}"
            ></button>
          {/each}
        </div>
        <input type="hidden" name="color" value={selectedColor} />
        {#if $errors.color}<div class="field-error" aria-live="polite">{$errors.color[0]}</div>{/if}
      </div>
      <div class="self-end"><button type="submit" class="btn-primary">Create tag</button></div>
    </form>

    <div class="flex flex-wrap gap-2">
      {#if tags.length === 0}
        <span class="text-[10px] text-[var(--color-muted)]">No tags yet. Create your first tag above.</span>
      {/if}
      {#each tags as tag}
        <div class="flex items-center gap-1">
          <span class="tag-chip" style="background-color: {tag.color}; color: #fff;">{tag.name}</span>
          <button class="btn-secondary !min-h-0 !px-2 !py-1" style="color: var(--color-danger);" onclick={() => store.deleteTag(tag.id)} aria-label="Delete tag {tag.name}">✕</button>
        </div>
      {/each}
    </div>
  </div>
{/if}
