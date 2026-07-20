<script>
  import {
    activeThemeId, cancelRemove, confirmRemove, createTheme, customThemes,
    editorNameDraft, removeConfirmId, requestRemove, selectTheme, uniqueName,
  } from './stores.js';
  import { builtins } from './themes.js';

  let holding = false;
  let progress = 0;
  let timer;
  let started = 0;
  let entered = '';
  let holdError = '';

  function beginHold(event) {
    if (event?.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    event?.preventDefault();
    if (holding) return;
    holding = true;
    progress = 0;
    holdError = '';
    started = performance.now();
    timer = setInterval(() => {
      progress = Math.min(100, ((performance.now() - started) / 3000) * 100);
      if (progress >= 100) completeHold();
    }, 40);
  }

  function cancelHold() {
    if (!holding) return;
    clearInterval(timer);
    holding = false;
    progress = 0;
  }

  function completeHold() {
    clearInterval(timer);
    holding = false;
    progress = 100;
    const desired = ($editorNameDraft || '').trim();
    if (!desired) {
      holdError = 'Name: enter a theme name before holding to add';
      setTimeout(() => { progress = 0; }, 400);
      return;
    }
    const name = builtins.some((theme) => theme.name.toLowerCase() === desired.toLowerCase())
      ? uniqueName('mytheme')
      : desired;
    const result = createTheme(name);
    if (!result.ok) {
      holdError = result.error;
      setTimeout(() => { progress = 0; }, 400);
      return;
    }
    entered = result.theme.id;
    setTimeout(() => { progress = 0; entered = ''; }, 550);
  }

  function swatches(theme) {
    return ['primary', 'secondary', 'accent', 'neutral'].map((key) => theme.colors[key]);
  }
</script>

<aside class="themes-panel panel" aria-label="Theme catalog">
  <div class="panel-title"><h1>Themes</h1><button type="button" aria-label="Theme panel options">•••</button></div>
  <button
    class="hold-button"
    class:holding
    type="button"
    aria-label="Hold to add theme"
    on:pointerdown={beginHold}
    on:pointerup={cancelHold}
    on:pointerleave={cancelHold}
    on:pointercancel={cancelHold}
    on:keydown={beginHold}
    on:keyup={cancelHold}
  >
    <span class="hold-fill" style:width={`${progress}%`}></span>
    <span aria-hidden="true">⌁</span>
    <b>{progress === 100 ? 'Theme added' : 'Hold to add theme'}</b>
  </button>
  {#if holdError}<p class="field-error" role="alert">{holdError}</p>{/if}

  <section class="theme-group custom-group">
    <h2>My themes <span>{$customThemes.length}</span></h2>
    {#if !$customThemes.length}
      <p class="empty-state">Created themes appear here. Use Hold to add theme above to create one.</p>
    {:else}
      <div class="theme-list">
        {#each $customThemes as theme (theme.id)}
          <div class="custom-row" class:entered={entered === theme.id}>
            <button class="theme-row" class:active={$activeThemeId === theme.id} type="button" on:click={() => selectTheme(theme.id)} title={theme.name}>
              <span class="theme-chip" role="img" aria-label={`Color preview for ${theme.name}: primary ${theme.colors.primary}, secondary ${theme.colors.secondary}, accent ${theme.colors.accent}, neutral ${theme.colors.neutral}`}>
                {#each swatches(theme) as color}<i style:background={color}></i>{/each}
              </span>
              <span class="theme-name">{theme.name}</span>
            </button>
            <button class="remove-control" type="button" aria-label={`Remove ${theme.name}`} on:click={() => requestRemove(theme.id)}>Remove</button>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="theme-group builtins-group">
    <h2>daisyUI themes <span>{builtins.length}</span></h2>
    <div class="theme-list">
      {#each builtins as theme}
        <button class="theme-row" class:active={$activeThemeId === theme.id} type="button" on:click={() => selectTheme(theme.id)}>
          <span class="theme-chip" role="img" aria-label={`Color preview for ${theme.name}`}>
            {#each swatches(theme) as color}<i style:background={color}></i>{/each}
          </span>
          <span class="theme-name">{theme.name}</span>
        </button>
      {/each}
    </div>
  </section>
</aside>

{#if $removeConfirmId}
  <div class="confirm-modal modal modal-open" role="presentation">
    <div class="modal-box confirm-box" role="dialog" aria-modal="true" aria-labelledby="remove-title">
      <h2 id="remove-title">Remove theme</h2>
      <p>Remove this custom theme from My themes? This cannot be undone.</p>
      <div class="confirm-actions">
        <button type="button" class="btn" on:click={cancelRemove}>Cancel</button>
        <button type="button" class="btn btn-error" on:click={confirmRemove}>Remove theme</button>
      </div>
    </div>
    <button class="modal-backdrop" aria-label="Cancel remove" on:click={cancelRemove}></button>
  </div>
{/if}
