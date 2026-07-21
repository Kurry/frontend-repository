<script lang="ts">
  let { name, label, size = 18 }: { name: string; label: string; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  role="img"
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <title>{label}</title>
  {#if name === 'timer' || name === 'stopwatch'}
    <circle cx="12" cy="13" r="8" />
    <path d="M12 13V9" />
    <path d="M9 2h6" />
    <path d="M19 6l1.5-1.5" />
  {:else if name === 'tags'}
    <path d="M3 7l7-4 8 4.5v9L10 21 3 16.5z" />
    <path d="M3 7l7 4 7-4" />
    <path d="M10 11v10" />
  {:else if name === 'history'}
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
    <path d="M12 8v4l3 2" />
  {:else if name === 'export'}
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  {:else if name === 'import'}
    <path d="M12 15V3" />
    <path d="M8 11l4 4 4-4" />
    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  {:else if name === 'search'}
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  {:else if name === 'filter'}
    <path d="M3 5h18l-7 8v6l-4 2v-8z" />
  {:else if name === 'delete'}
    <path d="M4 7h16" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  {:else if name === 'edit'}
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="M14 6l4 4" />
  {:else if name === 'close'}
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  {:else if name === 'palette'}
    <path d="M4 6h16" />
    <path d="M4 12h10" />
    <path d="M4 18h7" />
    <circle cx="18" cy="15" r="2.4" />
  {:else if name === 'check'}
    <path d="M5 12l4 4 10-10" />
  {:else if name === 'plus'}
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  {:else if name === 'minus'}
    <path d="M5 12h14" />
  {:else if name === 'sun'}
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
  {:else if name === 'moon'}
    <path d="M20 14a8 8 0 1 1-9.5-9.8A7 7 0 0 0 20 14z" />
  {:else if name === 'sound'}
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5a8 8 0 0 1 0 11" />
  {:else if name === 'sound-off'}
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16 9l5 6M21 9l-5 6" />
  {:else if name === 'print'}
    <path d="M6 9V3h12v6" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <path d="M6 14h12v7H6z" />
  {:else if name === 'undo'}
    <path d="M9 7L4 12l5 5" />
    <path d="M4 12h11a5 5 0 0 1 0 10h-2" />
  {:else if name === 'redo'}
    <path d="M15 7l5 5-5 5" />
    <path d="M20 12H9a5 5 0 0 0 0 10h2" />
  {:else if name === 'branch'}
    <circle cx="6" cy="6" r="2.4" />
    <circle cx="6" cy="18" r="2.4" />
    <circle cx="18" cy="8" r="2.4" />
    <path d="M6 8.4v7.2" />
    <path d="M18 10.4c0 4-6 2-6 5.2" />
  {:else if name === 'download'}
    <path d="M12 3v12" />
    <path d="M8 11l4 4 4-4" />
    <path d="M5 21h14" />
  {:else if name === 'copy'}
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  {:else if name === 'target'}
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  {:else if name === 'play'}
    <path d="M8 5l11 7-11 7z" />
  {:else if name === 'stop'}
    <rect x="6" y="6" width="12" height="12" rx="2" />
  {:else if name === 'list'}
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  {:else}
    <circle cx="12" cy="12" r="8" />
  {/if}
</svg>
