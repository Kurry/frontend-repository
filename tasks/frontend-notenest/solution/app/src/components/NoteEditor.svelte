<script lang="ts">
  import { store } from '../lib/store.svelte';
  import ColorPicker from './ColorPicker.svelte';

  let titleError: string = $state('');
  let showMoveDropdown: boolean = $state(false);
  let editorRef: HTMLElement | null = $state(null);

  let selectedNote = $derived(store.selectedNote);

  // Track formatting toolbar state
  let boldActive: boolean = $state(false);
  let italicActive: boolean = $state(false);
  let listActive: boolean = $state(false);

  function updateToolbarState() {
    try {
      if (typeof document !== 'undefined') {
        boldActive = document.queryCommandState('bold');
        italicActive = document.queryCommandState('italic');
        listActive = document.queryCommandState('insertUnorderedList');
      }
    } catch {}
  }

  function onTitleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!selectedNote) return;
    
    if (!target.value.trim()) {
      titleError = 'Title cannot be blank';
      return;
    }
    
    titleError = '';
    store.updateNote(selectedNote.id, { title: target.value });
  }

  function onTitleBlur(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!selectedNote) return;
    
    if (!target.value.trim()) {
      titleError = 'Title cannot be blank';
      target.value = selectedNote.title || 'Untitled';
      store.updateNote(selectedNote.id, { title: target.value });
      return;
    }
    
    titleError = '';
  }

  function onEditorInput() {
    if (!selectedNote || !editorRef) return;
    store.updateNote(selectedNote.id, { bodyHtml: editorRef.innerHTML });
    updateToolbarState();
  }

  function execCommand(command: string) {
    document.execCommand(command, false);
    if (selectedNote && editorRef) {
      store.updateNote(selectedNote.id, { bodyHtml: editorRef.innerHTML });
    }
    updateToolbarState();
    editorRef?.focus();
  }

  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !selectedNote) return;

    const file = input.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      store.addImage(selectedNote.id, dataUrl, file.name);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function insertChecklist() {
    if (!selectedNote) return;
    store.addChecklistBlock(selectedNote.id);
  }

  function getFolderPaths(): { id: string | null; path: string }[] {
    const paths = store.getAllFolderPaths();
    return [{ id: null, path: 'Unfiled' }, ...paths.map(p => ({ id: p.id, path: p.path }))];
  }

  function moveNote(folderId: string | null) {
    if (!selectedNote) return;
    store.moveNote(selectedNote.id, folderId);
    showMoveDropdown = false;
  }

  function deleteNote() {
    if (!selectedNote) return;
    if (selectedNote.deleted) {
      if (confirm('Delete this note forever?')) {
        store.deleteForever(selectedNote.id);
      }
    } else {
      store.deleteNote(selectedNote.id);
    }
  }

  // Sync editor content when note changes
  $effect(() => {
    if (selectedNote && editorRef) {
      if (editorRef.innerHTML !== selectedNote.bodyHtml) {
        editorRef.innerHTML = selectedNote.bodyHtml;
      }
    }
    titleError = '';
  });
</script>

{#if selectedNote}
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-white flex-shrink-0 flex-wrap">
      {#if !selectedNote.deleted}
        <!-- Formatting toolbar -->
        <div class="flex items-center gap-1 border-r border-slate-200 pr-2">
          <button
            class="p-1.5 rounded transition hover:bg-slate-100 {boldActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}"
            onclick={() => execCommand('bold')}
            aria-label="Bold"
            aria-pressed={boldActive}
          >
            <span class="font-bold text-sm">B</span>
          </button>
          <button
            class="p-1.5 rounded transition hover:bg-slate-100 {italicActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}"
            onclick={() => execCommand('italic')}
            aria-label="Italic"
            aria-pressed={italicActive}
          >
            <span class="italic text-sm">I</span>
          </button>
          <button
            class="p-1.5 rounded transition hover:bg-slate-100 {listActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}"
            onclick={() => execCommand('insertUnorderedList')}
            aria-label="Bulleted List"
            aria-pressed={listActive}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
          </button>
        </div>

        <!-- Extra controls -->
        <div class="flex items-center gap-1">
          <button
            class="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition"
            onclick={() => insertChecklist()}
            aria-label="Insert Checklist"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <span class="hidden sm:inline">Checklist</span>
          </button>

          <label class="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="hidden sm:inline">Image</span>
            <input type="file" accept="image/*" class="hidden" onchange={handleImageUpload} />
          </label>

          <ColorPicker currentColor={selectedNote.color} onSelect={(c) => store.setColor(selectedNote.id, c)} />

          <button
            class="flex items-center gap-1 px-2 py-1.5 text-xs rounded transition
              {selectedNote.pinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-600 hover:bg-slate-100'}"
            onclick={() => store.togglePin(selectedNote.id)}
          >
            <svg class="w-3.5 h-3.5" fill={selectedNote.pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            {#if selectedNote.pinned}Pinned{:else}<span class="hidden sm:inline">Pin</span>{/if}
          </button>

          <!-- Move to Folder -->
          <div class="relative">
            <button
              class="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition"
              onclick={() => showMoveDropdown = !showMoveDropdown}
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              <span class="hidden sm:inline">Move</span>
            </button>
            {#if showMoveDropdown}
              <div class="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-48 max-h-64 overflow-y-auto">
                {#each getFolderPaths() as opt}
                  <button
                    class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition
                      {selectedNote.folderId === opt.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}"
                    onclick={() => moveNote(opt.id)}
                  >
                    {opt.path}
                  </button>
                {/each}
              </div>
              <button
                class="fixed inset-0 z-10 cursor-default"
                onclick={() => showMoveDropdown = false}
                aria-label="Close"
                tabindex="-1"
              ></button>
            {/if}
          </div>
        </div>
      {/if}

      <div class="flex-1"></div>

      <button
        class="flex items-center gap-1 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded transition"
        onclick={deleteNote}
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        {#if selectedNote.deleted}Delete Forever{:else}<span class="hidden sm:inline">Trash</span>{/if}
      </button>

      {#if selectedNote.deleted}
        <button
          class="flex items-center gap-1 px-2 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded transition"
          onclick={() => store.restoreNote(selectedNote.id)}
        >
          Restore
        </button>
      {/if}
    </div>

    <!-- Title -->
    <div class="px-4 py-3 border-b border-slate-100">
      <div class="relative">
        <input
          type="text"
          value={selectedNote.title}
          class="w-full text-lg font-semibold text-slate-800 bg-transparent border-none outline-none placeholder-slate-300"
          placeholder="Note title..."
          oninput={onTitleInput}
          onblur={onTitleBlur}
          disabled={selectedNote.deleted}
          aria-label="Note title"
        />
        {#if titleError}
          <p class="text-xs text-red-500 mt-1">{titleError}</p>
        {/if}
      </div>
      <div class="flex items-center gap-3 mt-1 text-xs text-slate-400">
        <span>Created {new Date(selectedNote.createdAt).toLocaleDateString()}</span>
        <span>•</span>
        <span>Updated {new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
        {#if selectedNote.deleted}
          <span class="text-red-400">• In Trash</span>
        {/if}
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <!-- Rich text editor -->
      {#if !selectedNote.deleted}
        <div
          class="min-h-32 text-sm text-slate-700 leading-relaxed"
          contenteditable="true"
          bind:this={editorRef}
          oninput={onEditorInput}
          onselect={updateToolbarState}
          onkeyup={updateToolbarState}
          role="textbox"
          aria-multiline="true"
          aria-label="Note body"
        ></div>
      {:else}
        <div class="text-sm text-slate-500">
          {@html selectedNote.bodyHtml}
        </div>
      {/if}

      <!-- Checklists -->
      {#each selectedNote.checklists as block (block.id)}
        <div class="border border-slate-200 rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Checklist</span>
            <div class="flex items-center gap-2">
              {#if !selectedNote.deleted}
                <button
                  class="text-xs text-indigo-500 hover:text-indigo-700 transition"
                  onclick={() => store.addChecklistItem(selectedNote.id, block.id)}
                >
                  + Add item
                </button>
                <button
                  class="text-xs text-red-400 hover:text-red-600 transition"
                  onclick={() => store.removeChecklistBlock(selectedNote.id, block.id)}
                >
                  Remove
                </button>
              {/if}
            </div>
          </div>
          {#if block.items.length > 0}
            <ul class="space-y-1">
              {#each block.items as item (item.id)}
                <li class="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.done}
                    class="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                    onchange={() => store.toggleChecklistItem(selectedNote.id, block.id, item.id)}
                    disabled={selectedNote.deleted}
                    aria-label="Toggle item"
                  />
                  {#if !selectedNote.deleted}
                    <input
                      type="text"
                      value={item.text}
                      class="flex-1 text-sm bg-transparent border-none outline-none
                        {item.done ? 'line-through text-slate-400' : 'text-slate-700'}
                        placeholder-slate-400"
                      oninput={(e) => store.updateChecklistItem(selectedNote.id, block.id, item.id, e.target.value)}
                      placeholder="Checklist item..."
                    />
                    <button
                      class="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 flex-shrink-0 text-sm"
                      onclick={() => store.removeChecklistItem(selectedNote.id, block.id, item.id)}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  {:else}
                    <span class="flex-1 text-sm {item.done ? 'line-through text-slate-400' : 'text-slate-700'}">
                      {item.text}
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}

      <!-- Images -->
      {#each selectedNote.images as img (img.id)}
        <div class="relative group border border-slate-200 rounded-lg overflow-hidden">
          <img src={img.dataUrl} alt={img.name} class="w-full max-h-64 object-contain" />
          <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-3 py-1.5 flex items-center justify-between">
            <span class="truncate">{img.name}</span>
            {#if !selectedNote.deleted}
              <button
                class="text-red-300 hover:text-red-100 transition text-xs font-medium cursor-pointer"
                onclick={() => store.removeImage(selectedNote.id, img.id)}
              >
                Remove Image
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="flex-1 flex flex-col items-center justify-center text-slate-300 px-4">
    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>
    <p class="text-sm">Select a note to view or edit</p>
  </div>
{/if}
