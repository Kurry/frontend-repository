<script lang="ts">
  import { onMount } from 'svelte';
  import { quest, getCurrentWaypointIndex, getProgressToNextWaypoint } from '../../store.svelte';
  import type { GearItem } from '../../types';

  let canvasEl: HTMLCanvasElement;
  let animFrame = $state(0);
  let resizeObserver: ResizeObserver | null = null;
  // Eased on-screen character position so advancing reps glides the character
  // along the path instead of teleporting it straight to the new spot.
  let displayedCharacterX = NaN;
  const equippedGear = $derived(quest.equippedGear);
  const lifetimeReps = $derived(quest.state.lifetimeReps);
  const waypoints = $derived(quest.state.waypoints);
  const zones = $derived(quest.state.zones);
  const unlockedZoneIds = $derived(quest.state.unlockedZoneIds);

  function drawMap() {
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

    const wpIdx = getCurrentWaypointIndex(quest.state);
    const progress = getProgressToNextWaypoint(quest.state);

    // Determine current zone
    const currentZone = wpIdx >= 0
      ? zones.find(z => z.id === waypoints[wpIdx].zoneId) || zones[0]
      : zones[0];

    // Draw sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, currentZone.bgColors.sky);
    skyGrad.addColorStop(1, lightenColor(currentZone.bgColors.sky, 30));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // Draw ground
    const groundY = h * 0.55;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, currentZone.bgColors.ground);
    groundGrad.addColorStop(1, darkenColor(currentZone.bgColors.ground, 20));
    ctx.fillStyle = groundGrad;

    // Wavy ground
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= w; x += 5) {
      const wave = Math.sin(x * 0.02 + Date.now() * 0.001) * 3;
      ctx.lineTo(x, groundY + wave);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Draw path
    const pathY = groundY + 15;
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(20, pathY);
    ctx.lineTo(w - 20, pathY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waypoints
    const totalWaypoints = waypoints.length;
    const padding = 40;
    const spacing = (w - padding * 2) / (totalWaypoints - 1);

    for (let i = 0; i < totalWaypoints; i++) {
      const wp = waypoints[i];
      const x = padding + i * spacing;
      const reached = i <= wpIdx;
      const isNext = i === wpIdx + 1;

      if (wp.isBoss) {
        // Boss marker - larger, different color
        const radius = reached ? 14 : (isNext ? 12 : 10);
        ctx.beginPath();
        ctx.arc(x, pathY, radius, 0, Math.PI * 2);
        if (wp.bossDefeated) {
          ctx.fillStyle = '#22c55e';
          ctx.fill();
          // Draw checkmark
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
          // Draw skull-like marker
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${radius}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💀', x, pathY);
        }
        // Boss label — drawn BELOW the path (like the reps label) rather than
        // above it, so it never collides with the character/marker artwork
        // that renders above the path line, even when waypoint spacing is
        // tight at narrow viewport widths.
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Boss Challenge', x, pathY + radius + 6);
        if (!wp.bossDefeated && wp.bossMinReps) {
          ctx.fillText(`${wp.bossMinReps}+ reps`, x, pathY + radius + 16);
        }
      } else {
        // Normal waypoint
        const radius = reached ? 8 : (isNext ? 7 : 6);
        ctx.beginPath();
        ctx.arc(x, pathY, radius, 0, Math.PI * 2);
        ctx.fillStyle = reached ? '#f59e0b' : '#475569';
        ctx.fill();
        ctx.strokeStyle = reached ? '#d97706' : '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Waypoint number
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (!wp.isBoss) {
        ctx.fillText(String(wp.id), x, pathY);
      }

      // Reps label — only for normal waypoints; boss waypoints already show
      // their own two-line label below the path (see above), and stacking
      // this one too would overlap it.
      if (!wp.isBoss) {
        ctx.fillStyle = reached ? '#e2e8f0' : '#64748b';
        ctx.font = '7px sans-serif';
        ctx.fillText(`${wp.repsRequired}`, x, pathY + 18);
      }
    }

    // Draw character
    const characterX = (() => {
      if (wpIdx < 0) return padding;
      if (wpIdx >= totalWaypoints - 1) return padding + (totalWaypoints - 1) * spacing;
      const baseX = padding + wpIdx * spacing;
      const nextX = padding + (wpIdx + 1) * spacing;
      return baseX + (nextX - baseX) * (progress.pct / 100);
    })();

    // Ease the rendered position toward the target so logging a set glides
    // the character forward across frames instead of jumping there instantly.
    if (Number.isNaN(displayedCharacterX)) {
      displayedCharacterX = characterX;
    } else {
      displayedCharacterX += (characterX - displayedCharacterX) * 0.12;
      if (Math.abs(characterX - displayedCharacterX) < 0.25) {
        displayedCharacterX = characterX;
      }
    }

    drawCharacter(ctx, displayedCharacterX, pathY - 22, equippedGear);

    // Draw zone label
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(5, 5, 120, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📍 ${currentZone.name}`, 10, 16);

    // Draw lifetime reps
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(w - 105, 5, 100, 22);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⭐ ${lifetimeReps} reps`, w - 10, 16);
  }

  function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, gear: GearItem) {
    const bob = Math.sin(Date.now() * 0.005) * 2;
    const cy = y + bob;

    // Body
    ctx.fillStyle = gear.bodyColor || gear.color;
    ctx.fillRect(x - 6, cy - 2, 12, 14);

    // Head
    ctx.fillStyle = '#fcd9b6';
    ctx.beginPath();
    ctx.arc(x, cy - 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = gear.hatColor || '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, cy - 13, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 5, cy - 18, 10, 6);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 3, cy - 9, 2, 2);
    ctx.fillRect(x + 1, cy - 9, 2, 2);

    // Legs
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(x - 5, cy + 12, 4, 6);
    ctx.fillRect(x + 1, cy + 12, 4, 6);

    // Arms
    const armSwing = Math.sin(Date.now() * 0.008) * 3;
    ctx.strokeStyle = gear.bodyColor || gear.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // Left arm
    ctx.beginPath();
    ctx.moveTo(x - 6, cy + 2);
    ctx.lineTo(x - 10, cy + 8 + armSwing);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(x + 6, cy + 2);
    ctx.lineTo(x + 10, cy + 8 - armSwing);
    ctx.stroke();
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
    drawMap();
    animFrame = requestAnimationFrame(animate);
  }

  onMount(() => {
    animate();
    resizeObserver = new ResizeObserver(() => drawMap());
    if (canvasEl) resizeObserver.observe(canvasEl);
    return () => {
      cancelAnimationFrame(animFrame);
      resizeObserver?.disconnect();
    };
  });
</script>

<canvas
  bind:this={canvasEl}
  class="w-full rounded-xl border border-stone-700"
  style="height: 180px; min-height: 140px;"
  aria-label="Quest map showing character progress along the path"
></canvas>
