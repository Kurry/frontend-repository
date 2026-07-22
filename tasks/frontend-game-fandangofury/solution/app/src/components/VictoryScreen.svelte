<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, STAGES, MASK_DEFS } from '../lib/game-store.svelte.ts';

  interface Props {
    onContinue: () => void;
  }

  let { onContinue }: Props = $props();
  const stage = $derived(STAGES[gameState.currentStage - 1]);

  let canvas: HTMLCanvasElement;

  onMount(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const colors = ['#e9c46a', '#e63946', '#f4a261', '#2a9d8f', '#a855f7', '#ffffff'];
    const W = (canvas.width = canvas.clientWidth || 600);
    const H = (canvas.height = canvas.clientHeight || 600);
    const parts = Array.from({ length: 140 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 120,
      y: H / 2,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -11 - 3,
      g: 0.28 + Math.random() * 0.12,
      size: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
      life: 1,
    }));
    let raf = 0;
    function frame() {
      ctx!.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.006;
        if (p.life > 0 && p.y < H + 30) {
          alive = true;
          ctx!.save();
          ctx!.globalAlpha = Math.max(0, p.life);
          ctx!.translate(p.x, p.y);
          ctx!.rotate(p.rot);
          ctx!.fillStyle = p.color;
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx!.restore();
        }
      }
      if (alive) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
  <canvas class="absolute inset-0 w-full h-full pointer-events-none z-0" aria-hidden="true" bind:this={canvas}></canvas>
  <div
    class="bg-fury-dark border-2 border-yellow-500/40 rounded-2xl w-full max-w-md text-center p-6 sm:p-8 relative overflow-hidden victory-screen z-10 victory-pop"
  >
    <div class="relative z-10">
      <div class="text-5xl sm:text-6xl mb-4 animate-bounce">🏆</div>
      <h2 class="text-3xl sm:text-4xl font-black text-fury-gold mb-2">Victory!</h2>
      <p class="text-slate-200 mb-6 text-sm sm:text-base">
        You conquered {stage?.name ?? 'the stage'} and defeated {stage?.bossName ?? 'the boss'}!
      </p>

      <div class="bg-fury-dark border border-yellow-500/20 rounded-xl p-4 mb-6 space-y-3 text-left">
        <div class="flex items-center justify-between">
          <span class="text-slate-200 text-sm">Pesos earned</span>
          <span class="text-fury-gold font-bold text-lg">+{gameState.runPesos}₱</span>
        </div>
        {#if gameState.runMasks.length > 0}
          <div class="border-t border-gray-700 pt-3">
            <div class="text-slate-200 text-sm mb-2">Masks found</div>
            {#each gameState.runMasks as maskId}
              {@const mask = MASK_DEFS.find((m) => m.id === maskId)}
              <div class="text-purple-300 font-semibold text-sm">{mask?.emoji ?? '🎭'} {mask?.name ?? maskId}</div>
            {/each}
          </div>
        {/if}
        <div class="border-t border-gray-700 pt-3 flex items-center justify-between">
          <span class="text-slate-200 text-sm">Total Pesos</span>
          <span class="text-fury-gold font-bold">{gameState.pesos}₱</span>
        </div>
      </div>

      <button
        class="btn-interactive min-h-12 px-8 py-3 bg-fury-gold hover:bg-yellow-500 text-fury-darker font-black text-lg rounded-xl border border-yellow-400/50"
        onclick={onContinue}
        aria-label="Continue to stage map"
      >
        Continue
      </button>
    </div>
  </div>
</div>

<style>
  .victory-pop {
    animation: victory-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes victory-pop {
    0% { transform: scale(0.7); opacity: 0; }
    60% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .victory-pop { animation: none; }
  }
</style>
