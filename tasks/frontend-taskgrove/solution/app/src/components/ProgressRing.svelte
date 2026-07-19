<script>
  let { progress = 0, size = 20 } = $props();

  const radius = $derived(size / 2 - 3);
  const circumference = $derived(2 * Math.PI * radius);
  const offset = $derived(circumference - (progress / 100) * circumference);
  const isComplete = $derived(progress >= 100);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 {size} {size}"
  class="progress-ring {isComplete ? 'progress-complete' : ''}"
  role="img"
  aria-label="{progress}% complete"
>
  <!-- Background track -->
  <circle
    cx={size/2}
    cy={size/2}
    r={radius}
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    opacity="0.15"
  />
  <!-- Progress arc -->
  <circle
    cx={size/2}
    cy={size/2}
    r={radius}
    fill="none"
    stroke={isComplete ? 'var(--color-primary)' : 'var(--color-primary)'}
    stroke-width="2.5"
    stroke-dasharray={circumference}
    stroke-dashoffset={offset}
    stroke-linecap={progress > 0 && progress < 100 ? 'round' : 'butt'}
    transform="rotate(-90 {size/2} {size/2})"
    style="transition: stroke-dashoffset 0.3s ease;"
  />
  {#if isComplete}
    <!-- Checkmark for complete -->
    <path
      d="M{size*0.33} {size*0.52} L{size*0.45} {size*0.63} L{size*0.67} {size*0.37}"
      fill="none"
      stroke="var(--color-primary)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else}
    <!-- Percentage text -->
    <text
      x={size/2}
      y={size/2}
      text-anchor="middle"
      dominant-baseline="central"
      fill="var(--color-text-primary)"
      font-size="{size * 0.3}"
      font-weight="600"
    >{Math.round(progress)}%</text>
  {/if}
</svg>
