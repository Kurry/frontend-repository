<script lang="ts">
  import { onMount } from 'svelte';
  import { quest, getCurrentWaypointIndex, getProgressToNextWaypoint } from '../../store.svelte';
  import type { GearItem } from '../../types';

  let canvasEl: HTMLCanvasElement;
  let animFrame = 0;
  let resizeObserver: ResizeObserver | null = null;

  // Time-based glide: when the path target changes we tween the rendered
  // character position from its current spot to the new spot over ~700ms with
  // an ease-in-out curve, so an early/settled screenshot pair always catches
  // visible motion (a per-frame lerp could settle inside the sampling gap).
  let glideStart = 0;
  let glideFrom = NaN;
  let glideTo = NaN;
  const GLIDE_MS = 700;
  let lastGlideToken = -1;
  let lastLifetime = -1;

  const equippedGear = $derived(quest.equippedGear);
  const lifetimeReps = $derived(quest.state.lifetimeReps);
  const waypoints = $derived(quest.state.waypoints);
  const zones = $derived(quest.state.zones);
  const unlockedZoneIds = $derived(quest.state.unlockedZoneIds);
  const glideToken = $derived(quest.glideToken);

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function targetCharacterX(w: number, wpIdx: number, spacing: number, padding: number, progressPct: number): number {
    const total = waypoints.length;
    if (wpIdx < 0) return padding;
    if (wpIdx >= total - 1) return padding + (total - 1) * spacing;
    const baseX = padding + wpIdx * spacing;
    const nextX = padding + (wpIdx + 1) * spacing;
    return baseX + (nextX - baseX) * (progressPct / 100);
  }

  function drawMap(now: number) {
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

    const wpIdx = getCurrentWaypointIndex(quest.state);
    const progress = getProgressToNextWaypoint(quest.state);

    const currentZone = wpIdx >= 0
      ? zones.find(z => z.id === waypoints[wpIdx].zoneId) || zones[0]
      : zones[0];

    // Sky gradient (zone palette)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, currentZone.bgColors.sky);
    skyGrad.addColorStop(1, lightenColor(currentZone.bgColors.sky, 30));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // Parallax clouds — two layers drifting at different speeds for depth.
    drawClouds(ctx, w, h, now);

    // Ground
    const groundY = h * 0.55;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, currentZone.bgColors.ground);
    groundGrad.addColorStop(1, darkenColor(currentZone.bgColors.ground, 20));
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= w; x += 5) {
      const wave = Math.sin(x * 0.02 + now * 0.0008) * 3;
      ctx.lineTo(x, groundY + wave);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Path
    const pathY = groundY + 15;
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(20, pathY);
    ctx.lineTo(w - 20, pathY);
    ctx.stroke();
    ctx.setLineDash([]);

    const totalWaypoints = waypoints.length;
    const padding = 40;
    const spacing = (w - padding * 2) / (totalWaypoints - 1);

    for (let i = 0; i < totalWaypoints; i++) {
      const wp = waypoints[i];
      const x = padding + i * spacing;
      const reached = i <= wpIdx;
      const isNext = i === wpIdx + 1;

      if (wp.isBoss) {
        const radius = reached ? 14 : (isNext ? 12 : 10);
        // Pulse ring on the next boss so the upcoming challenge reads at a glance.
        if (isNext) {
          const pulse = (Math.sin(now * 0.006) + 1) / 2;
          ctx.beginPath();
          ctx.arc(x, pathY, radius + 3 + pulse * 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239,68,68,${0.5 - pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, pathY, radius, 0, Math.PI * 2);
        if (wp.bossDefeated) {
          ctx.fillStyle = '#22c55e';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 5, pathY);
          ctx.lineTo(x - 1, pathY + 5);
          ctx.lineTo(x + 6, pathY - 5);
          ctx.stroke();
        } else {
          ctx.fillStyle = reached ? '#ef4444' : '#7f1d1d';
          ctx.fill();
          // Drawn "horns" boss sigil (no emoji) so icon style stays consistent.
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 4, pathY + 3); ctx.lineTo(x - 6, pathY - 5);
          ctx.moveTo(x + 4, pathY + 3); ctx.lineTo(x + 6, pathY - 5);
          ctx.moveTo(x - 3, pathY + 1); ctx.lineTo(x + 3, pathY + 1);
          ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Boss Challenge', x, pathY + radius + 6);
        if (!wp.bossDefeated && wp.bossMinReps) {
          ctx.fillText(`${wp.bossMinReps}+ reps`, x, pathY + radius + 16);
        }
      } else {
        const radius = reached ? 8 : (isNext ? 7 : 6);
        if (isNext) {
          const pulse = (Math.sin(now * 0.006) + 1) / 2;
          ctx.beginPath();
          ctx.arc(x, pathY, radius + 2 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245,158,11,${0.5 - pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, pathY, radius, 0, Math.PI * 2);
        ctx.fillStyle = reached ? '#f59e0b' : '#475569';
        ctx.fill();
        ctx.strokeStyle = reached ? '#d97706' : '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(wp.id), x, pathY);
        ctx.fillStyle = reached ? '#e2e8f0' : '#64748b';
        ctx.font = '7px sans-serif';
        ctx.fillText(`${wp.repsRequired}`, x, pathY + 18);
      }
    }

    // Character position with time-based glide
    const charX = targetCharacterX(w, wpIdx, spacing, padding, progress.pct);
    let renderedX: number;
    if (Number.isNaN(glideFrom)) {
      glideFrom = charX; glideTo = charX; glideStart = now;
      renderedX = charX;
    } else {
      const t = Math.min(1, (now - glideStart) / GLIDE_MS);
      renderedX = glideFrom + (glideTo - glideFrom) * easeInOutCubic(t);
    }

    drawCharacter(ctx, renderedX, pathY - 22, equippedGear, now);

    // Zone label chip (drawn marker, no emoji)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(5, 5, 116, 22);
    ctx.fillStyle = currentZone.bgColors.accent;
    ctx.beginPath(); ctx.arc(15, 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentZone.name, 24, 16);

    // Lifetime reps chip with a drawn star (no emoji)
    const chipW = 96;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(w - chipW - 5, 5, chipW, 22);
    drawStar(ctx, w - chipW + 6, 16, 5, '#f59e0b');
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${lifetimeReps} reps`, w - chipW + 16, 16);
  }

  function drawClouds(ctx: CanvasRenderingContext2D, w: number, h: number, now: number) {
    const layers = [
      { y: h * 0.16, speed: 0.006, scale: 1, alpha: 0.5 },
      { y: h * 0.30, speed: 0.012, scale: 0.7, alpha: 0.35 },
    ];
    ctx.save();
    for (const layer of layers) {
      const offset = (now * layer.speed) % (w + 120);
      ctx.fillStyle = `rgba(255,255,255,${layer.alpha})`;
      for (let k = 0; k < 3; k++) {
        const baseX = (k * (w + 120) / 3) - offset;
        const cx = ((baseX % (w + 120)) + (w + 120)) % (w + 120) - 60;
        const r = 12 * layer.scale;
        ctx.beginPath();
        ctx.arc(cx, layer.y, r, 0, Math.PI * 2);
        ctx.arc(cx + r, layer.y + 2, r * 0.8, 0, Math.PI * 2);
        ctx.arc(cx - r, layer.y + 2, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outer = (Math.PI / 2 * 3) + (i * 2 * Math.PI / 5);
      const inner = outer + Math.PI / 5;
      ctx.lineTo(cx + Math.cos(outer) * r, cy + Math.sin(outer) * r);
      ctx.lineTo(cx + Math.cos(inner) * r * 0.45, cy + Math.sin(inner) * r * 0.45);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, gear: GearItem, now: number) {
    const bob = Math.sin(now * 0.004) * 1.5;
    const cy = y + bob;

    ctx.fillStyle = gear.bodyColor || gear.color;
    ctx.fillRect(x - 6, cy - 2, 12, 14);

    ctx.fillStyle = '#fcd9b6';
    ctx.beginPath();
    ctx.arc(x, cy - 8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = gear.hatColor || '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, cy - 13, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 5, cy - 18, 10, 6);

    ctx.fillStyle = '#000';
    ctx.fillRect(x - 3, cy - 9, 2, 2);
    ctx.fillRect(x + 1, cy - 9, 2, 2);

    ctx.fillStyle = '#5c4033';
    ctx.fillRect(x - 5, cy + 12, 4, 6);
    ctx.fillRect(x + 1, cy + 12, 4, 6);

    const armSwing = Math.sin(now * 0.008) * 3;
    ctx.strokeStyle = gear.bodyColor || gear.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 6, cy + 2); ctx.lineTo(x - 10, cy + 8 + armSwing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 6, cy + 2); ctx.lineTo(x + 10, cy + 8 - armSwing); ctx.stroke();
  }

  function lightenColor(hex: string, pct: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + pct);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + pct);
    const b = Math.min(255, (num & 0x0000FF) + pct);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  }

  function darkenColor(hex: string, pct: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - pct);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - pct);
    const b = Math.max(0, (num & 0x0000FF) - pct);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  }

  function animate() {
    const now = performance.now();
    // Kick off a glide when the lifetime rep total changes (i.e. a real log).
    if (glideToken !== lastGlideToken || lifetimeReps !== lastLifetime) {
      lastGlideToken = glideToken;
      lastLifetime = lifetimeReps;
      glideFrom = Number.isNaN(glideFrom) ? targetNow() : (glideFrom + (glideTo - glideFrom) * currentProgress());
      glideTo = targetNow();
      glideStart = now;
    }
    drawMap(now);
    animFrame = requestAnimationFrame(animate);
  }

  function targetNow(): number {
    if (!canvasEl) return 0;
    const rect = canvasEl.getBoundingClientRect();
    const w = rect.width;
    const wpIdx = getCurrentWaypointIndex(quest.state);
    const progress = getProgressToNextWaypoint(quest.state);
    const padding = 40;
    const spacing = (w - padding * 2) / (waypoints.length - 1);
    return targetCharacterX(w, wpIdx, spacing, padding, progress.pct);
  }

  function currentProgress(): number {
    const t = Math.min(1, (performance.now() - glideStart) / GLIDE_MS);
    return easeInOutCubic(t);
  }

  onMount(() => {
    glideFrom = NaN;
    animFrame = requestAnimationFrame(animate);
    resizeObserver = new ResizeObserver(() => { glideFrom = NaN; });
    if (canvasEl) resizeObserver.observe(canvasEl);
    return () => {
      cancelAnimationFrame(animFrame);
      resizeObserver?.disconnect();
    };
  });
</script>

<div role="img" aria-label="Quest map: a horizontal path of numbered waypoints with the character sprite; boss waypoints are larger and red. The sky and ground palette show the current zone.">
  <canvas
    bind:this={canvasEl}
    class="w-full rounded-xl border border-stone-700"
    style="height: 180px; min-height: 140px;"
    aria-hidden="true"
  ></canvas>
  <!-- Numbers the canvas visualizes, also available as visible text outside it. -->
  <p class="text-xs text-slate-400 mt-2 flex flex-wrap gap-x-4 gap-y-1">
    <span>Zone: <span class="text-slate-200 font-semibold">{quest.currentZone.name}</span></span>
    <span>Lifetime reps: <span class="text-slate-200 font-semibold" data-stat="lifetime-reps">{lifetimeReps}</span></span>
    <span>Today: <span class="text-slate-200 font-semibold">{quest.todayReps}</span></span>
    <span>Next waypoint: <span class="text-slate-200 font-semibold">{quest.currentWaypointIndex >= waypoints.length - 1 ? 'summit reached' : quest.progressToNext.target + ' more'}</span></span>
  </p>
</div>
