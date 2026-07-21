<script lang="ts">
  let { value, target }: { value: number; target: number } = $props();
  const R = 26;
  const C = 2 * Math.PI * R;
  const pct = $derived(target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0);
  const offset = $derived(C * (1 - pct / 100));
  const reached = $derived(target > 0 && value >= target);
</script>

<div class="gauge" class:reached role="img" aria-label="Today's velocity: {value} of {target} minute goal, {pct} percent">
  <svg width="64" height="64" viewBox="0 0 64 64">
    <circle class="track" cx="32" cy="32" r={R} />
    <circle class="val" cx="32" cy="32" r={R} stroke-dasharray={C} stroke-dashoffset={offset} />
  </svg>
  <span class="pct">{pct}%</span>
</div>
