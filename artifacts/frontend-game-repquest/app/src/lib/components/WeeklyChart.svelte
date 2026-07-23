<script lang="ts">
  import { onMount } from 'svelte';
  import { ChartBar } from 'phosphor-svelte';
  import { getWeeklyData } from '../../store.svelte';
  import { quest } from '../../store.svelte';

  let canvasEl: HTMLCanvasElement;
  let wrapEl: HTMLDivElement;
  let resizeObserver: ResizeObserver | null = null;
  const repHistory = $derived(quest.state.repHistory);
  const dailyGoal = $derived(quest.state.dailyGoal);

  type BarRect = { x: number; w: number; date: string; reps: number };
  let barRects: BarRect[] = [];
  let hoverIndex = $state<number>(-1);
  let tooltip = $derived(hoverIndex >= 0 ? barRects[hoverIndex] : null);

  function drawChart() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvasEl.width = Math.max(1, Math.round(w * dpr));
    canvasEl.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const data = getWeeklyData(quest.state);
    const maxReps = Math.max(dailyGoal, ...data.map(d => d.reps), 1);

    const padding = { top: 20, right: 10, bottom: 30, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barWidth = chartW / data.length * 0.6;
    const barGap = chartW / data.length * 0.4;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    const goalY = padding.top + chartH * (1 - dailyGoal / maxReps);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, goalY);
    ctx.lineTo(w - padding.right, goalY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#22c55e';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Goal: ${dailyGoal}`, w - padding.right, goalY - 2);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round((maxReps / ySteps) * i);
      const y = padding.top + chartH * (1 - val / maxReps);
      ctx.fillText(String(val), padding.left - 5, y);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    barRects = [];
    for (let i = 0; i < data.length; i++) {
      const barH = Math.max((data[i].reps / maxReps) * chartH, 2);
      const x = padding.left + i * (barWidth + barGap) + barGap / 2;
      const y = padding.top + chartH - barH;
      barRects.push({ x, w: barWidth, date: data[i].date, reps: data[i].reps });

      const color = data[i].reps >= dailyGoal ? '#22c55e' : (data[i].reps > 0 ? '#f59e0b' : '#475569');
      const isHover = i === hoverIndex;

      const radius = Math.min(3, barWidth / 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = isHover ? 1 : 0.92;
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.arcTo(x, y, x + barWidth, y, radius);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + barH, radius);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      if (isHover) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (data[i].reps > 0) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(data[i].reps), x + barWidth / 2, y - 3);
      }

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const d = new Date(data[i].date);
      const today = (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      })();
      const isToday = data[i].date === today;

      ctx.fillStyle = isToday ? '#f59e0b' : '#94a3b8';
      ctx.font = isToday ? 'bold 9px sans-serif' : '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(isToday ? 'Today' : dayNames[d.getDay()], x + barWidth / 2, padding.top + chartH + 5);
    }
  }

  function handleMove(e: MouseEvent) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let found = -1;
    for (let i = 0; i < barRects.length; i++) {
      const b = barRects[i];
      if (px >= b.x - 3 && px <= b.x + b.w + 3) { found = i; break; }
    }
    if (found !== hoverIndex) { hoverIndex = found; drawChart(); }
  }

  function handleLeave() {
    if (hoverIndex !== -1) { hoverIndex = -1; drawChart(); }
  }

  onMount(() => {
    drawChart();
    resizeObserver = new ResizeObserver(() => drawChart());
    if (canvasEl) resizeObserver.observe(canvasEl);
    return () => { resizeObserver?.disconnect(); };
  });

  $effect(() => {
    repHistory;
    dailyGoal;
    drawChart();
  });
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--accent-strong)"><ChartBar size={18} weight="fill" /> Weekly summary</h2>
  <div class="relative" bind:this={wrapEl} role="img" aria-label="Weekly reps bar chart for the last 7 days with a goal reference line. Exact per-day totals are listed below and on hover.">
    <canvas
      bind:this={canvasEl}
      class="w-full rounded-lg"
      style="height: 160px; min-height: 120px;"
      aria-hidden="true"
      onmousemove={handleMove}
      onmouseleave={handleLeave}
    ></canvas>
    {#if tooltip}
      <div
        class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full bg-slate-950 border border-slate-600 text-slate-100 text-[11px] rounded-lg px-2 py-1 shadow-lg whitespace-nowrap"
        style="left: {tooltip.x + tooltip.w / 2}px; top: 8px;"
        role="status"
      >
        <span class="font-semibold" style="color: var(--accent-strong)">{tooltip.date}</span>: {tooltip.reps} reps
      </div>
    {/if}
  </div>
  <p class="text-xs text-slate-400 mt-2 break-words">
    {getWeeklyData(quest.state).map((day) => `${day.date}: ${day.reps} reps`).join(' · ')}
  </p>
</div>
