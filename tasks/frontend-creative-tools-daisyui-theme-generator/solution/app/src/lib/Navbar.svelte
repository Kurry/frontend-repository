<script>
  import { siteTheme } from './stores.js';
  let open = '';
  let trigger;
  const themes = ['light', 'dark', 'cupcake', 'synthwave'];
  function toggle(name, event) {
    open = open === name ? '' : name;
    trigger = event.currentTarget;
  }
  function close() { open = ''; trigger?.focus(); }
  function keydown(event) { if (event.key === 'Escape' && open) { event.preventDefault(); close(); } }
</script>

<svelte:window on:keydown={keydown} />
<div class="announce" role="status">daisyUI 5.6 is now available!</div>
<header class="navbar-shell">
  <div class="brand-group">
    <button class="brand" type="button" aria-label="daisyUI home">
      <span class="brand-flower" aria-hidden="true"><i></i><i></i><i></i><i></i><b>•ᴗ•</b></span>
      <strong>daisyUI</strong>
    </button>
    <div class="chrome-dropdown">
      <button class="version-control" type="button" aria-haspopup="menu" aria-expanded={open === 'version'} on:click={(e) => toggle('version', e)}>5.6.18 <span>⌄</span></button>
      {#if open === 'version'}
        <div class="chrome-menu version-menu" role="menu"><b>Current version</b><span>daisyUI 5.6.18</span><span>Tailwind CSS 4.3.2</span></div>
      {/if}
    </div>
  </div>

  <nav class="product-nav" aria-label="Product sections">
    <button type="button">▣ Docs</button><button type="button">♧ Components</button><button type="button">▤ Templates</button><button type="button">⌁ MCP</button><button class="muted" type="button">More⌄</button>
  </nav>

  <div class="chrome-actions">
    <button class="search-control" type="button"><span>Search...</span><kbd>⌘ K</kbd></button>
    <div class="chrome-dropdown">
      <button class="icon-control theme-orb" type="button" aria-label="Choose site theme" aria-haspopup="menu" aria-expanded={open === 'theme'} on:click={(e) => toggle('theme', e)}>⠿ <span>⌄</span></button>
      {#if open === 'theme'}
        <div class="chrome-menu picker-menu" role="menu">
          <b>Site theme</b>
          {#each themes as item}<button class:chosen={$siteTheme === item} type="button" role="menuitem" on:click={() => { siteTheme.set(item); close(); }}>{item}</button>{/each}
        </div>
      {/if}
    </div>
    <div class="chrome-dropdown language-dropdown">
      <button class="icon-control" type="button" aria-label="Choose language" aria-haspopup="menu" aria-expanded={open === 'language'} on:click={(e) => toggle('language', e)}>◉ <span>⌄</span></button>
      {#if open === 'language'}
        <div class="chrome-menu language-menu" role="menu"><b>Language</b><button type="button" class="chosen" on:click={close}>English</button><button type="button" on:click={close}>Deutsch</button><button type="button" on:click={close}>日本語</button></div>
      {/if}
    </div>
    <button class="stars-control" type="button" aria-label="GitHub stars">♧ ~41k</button>
  </div>
</header>
