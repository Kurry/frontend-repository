<script lang="ts">
  import { onMount } from 'svelte';
  import { getWeeklyData } from '../../store.svelte';
  import { quest } from '../../store.svelte';

  let canvasEl: HTMLCanvasElement;
  let resizeObserver: ResizeObserver | null = null;
  const repHistory = $derived(quest.state.repHistory);
  const dailyGoal = $derived(quest.state.dailyGoal);

  function drawChart() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvasEl.width = w * dpr;
    canvasEl.height = h * dpr;
    ctx.scale(dpr, dpr);

    const data = getWeeklyData(quest.state);
    const maxReps = Math.max(dailyGoal, ...data.map(d => d.reps), 1);

    const padding = { top: 20, right: 10, bottom: 30, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barWidth = chartW / data.length * 0.6;
    const barGap = chartW / data.length * 0.4;

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Goal line
    const goalY = padding.top + chartH * (1 - dailyGoal / maxReps);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, goalY);
    ctx.lineTo(w - padding.right, goalY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Goal label
    ctx.fillStyle = '#22c55e';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Goal: ${dailyGoal}`, w - padding.right, goalY - 2);

    // Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round((maxReps / ySteps) * i);
      const y = padding.top + chartH * (1 - val / maxReps);
      ctx.fillText(String(val), padding.left - 5, y);
      // Grid line
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Bars
    for (let i = 0; i < data.length; i++) {
      // Zero-rep days still render a small visible tick instead of a zero-height (invisible) bar,
      // so the empty state reads as "all-zero bars" rather than a blank chart area.
      const barH = Math.max((data[i].reps / maxReps) * chartH, 2);
      const x = padding.left + i * (barWidth + barGap) + barGap / 2;
      const y = padding.top + chartH - barH;

      // Color based on goal achievement
      const color = data[i].reps >= dailyGoal ? '#22c55e' : (data[i].reps > 0 ? '#f59e0b' : '#475569');

      // Bar with rounded top
      const radius = Math.min(3, barWidth / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.arcTo(x, y, x + barWidth, y, radius);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + barH, radius);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.closePath();
      ctx.fill();

      // Bar value
      if (data[i].reps > 0) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(data[i].reps), x + barWidth / 2, y - 3);
      }

      // Day label
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

  onMount(() => {
    drawChart();
    resizeObserver = new ResizeObserver(() => drawChart());
    if (canvasEl) resizeObserver.observe(canvasEl);
    return () => {
      resizeObserver?.disconnect();
    };
  });

  // Redraw when data changes
  $effect(() => {
    repHistory;
    dailyGoal;
    drawChart();
  });
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold text-amber-400 mb-3">Weekly summary</h2>
  <canvas
    bind:this={canvasEl}
    class="w-full rounded-lg"
    style="height: 160px; min-height: 120px;"
    aria-label="Weekly reps bar chart showing last 7 days"
  ></canvas>
</div>
