<script>
  import { onMount } from 'svelte';
  import Navbar from './lib/Navbar.svelte';
  import ThemePanel from './lib/ThemePanel.svelte';
  import EditorPanel from './lib/EditorPanel.svelte';
  import PreviewPanel from './lib/PreviewPanel.svelte';
  import { loadHash, siteTheme } from './lib/stores.js';
  import { registerWebMCP } from './lib/webmcp.js';

  onMount(() => { loadHash(); registerWebMCP(); });
</script>

<svelte:head><title>daisyUI — Tailwind CSS theme generator</title></svelte:head>
<div class="app-shell" data-site-theme={$siteTheme}>
  <Navbar />
  <div class="workspace"><ThemePanel /><EditorPanel /><PreviewPanel /></div>
</div>
