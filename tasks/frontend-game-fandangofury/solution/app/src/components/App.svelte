<script lang="ts">
  import { onMount } from 'svelte';
  import { createActor } from 'xstate';
  import { gameMachine } from '../lib/game-machine';
  import { game, gameState } from '../lib/game-store.svelte.ts';
  import HUD from './HUD.svelte';
  import CombatScene from './CombatScene.svelte';
  import StageMap from './StageMap.svelte';
  import Shop from './Shop.svelte';
  import MasksScreen from './MasksScreen.svelte';
  import VictoryScreen from './VictoryScreen.svelte';
  import DefeatScreen from './DefeatScreen.svelte';
  import HistoryPanel from './HistoryPanel.svelte';
  import PauseOverlay from './PauseOverlay.svelte';
  import ExportCampaign from './ExportCampaign.svelte';
  import ImportCampaign from './ImportCampaign.svelte';
  import FighterSettings from './FighterSettings.svelte';
  import OverlayShell from './OverlayShell.svelte';
  import { initWebMcp } from '../lib/webmcp.ts';

  let currentScreen = $state('MAP');
  let showHistory = $state(false);

  const actor = createActor(gameMachine);
  actor.subscribe((snapshot) => {
    currentScreen = snapshot.value as string;
  });
  actor.start();

  function send(type: string) {
    actor.send({ type });
  }

  const inCombat = $derived(
    currentScreen === 'COMBAT' || currentScreen === 'BOSS' || currentScreen === 'PAUSE',
  );
  const paused = $derived(currentScreen === 'PAUSE');
  // Screens that keep the Stage map mounted underneath their overlay, so the
  // control that opened the overlay stays in the DOM for focus return.
  const mapLevel = $derived(
    !inCombat && currentScreen !== 'VICTORY' && currentScreen !== 'DEFEAT',
  );

  function startCombat(stageId: number) {
    game.startStage(stageId);
    send('START_STAGE');
  }

  function resumeRun() {
    game.resumeFromCheckpoint();
    send(gameState.isBoss ? 'RESUME_RUN_BOSS' : 'RESUME_RUN_WAVE');
  }

  function tryAgain() {
    game.startStage(gameState.currentStage);
    send('TRY_AGAIN');
  }

  function confirmReset() {
    game.resetProgress();
    send('CONFIRM_RESET');
  }

  function pauseToggle() {
    if (currentScreen === 'COMBAT' || currentScreen === 'BOSS') pauseRun();
    else if (currentScreen === 'PAUSE') resumePausedRun();
  }

  function pauseRun() {
    game.pauseRun();
    send('PAUSE');
  }

  function resumePausedRun() {
    game.resumeRun();
    send(gameState.isBoss ? 'RESUME_BOSS' : 'RESUME');
  }

  // Auto-dismiss transient toasts (checkpoint-saved, copy/download confirm, etc.)
  $effect(() => {
    const t = gameState.toast;
    if (!t) return;
    const id = t.id;
    const timer = setTimeout(() => {
      if (gameState.toast?.id === id) gameState.toast = null;
    }, 2600);
    return () => clearTimeout(timer);
  });

  onMount(() => {
    initWebMcp({
      currentScreen: () => currentScreen,
      startStage: (stageId: number) => startCombat(stageId),
      restartStage: tryAgain,
      continueFromVictory: () => {
        if (currentScreen === 'VICTORY') send('CONTINUE');
      },
      retreatToMap: () => {
        if (currentScreen === 'COMBAT' || currentScreen === 'BOSS') pauseRun();
      },
      openMap: () => {
        if (currentScreen === 'SHOP') send('CLOSE_SHOP');
        else if (currentScreen === 'MASKS') send('CLOSE_MASKS');
        else if (currentScreen === 'SETTINGS') send('CLOSE_SETTINGS');
        else if (currentScreen === 'EXPORT') send('CLOSE_EXPORT');
        else if (currentScreen === 'IMPORT') send('CLOSE_IMPORT');
        else if (currentScreen === 'RESET_CONFIRM') send('CANCEL_RESET');
      },
      openMasks: () => {
        if (currentScreen === 'MAP') send('OPEN_MASKS');
      },
      openCantina: () => {
        if (currentScreen === 'MAP') send('OPEN_SHOP');
      },
      openExportCampaign: () => {
        if (currentScreen === 'MAP') send('OPEN_EXPORT');
      },
      openImportCampaign: () => {
        if (currentScreen === 'MAP') send('OPEN_IMPORT');
      },
      sessionPause: () => {
        if (currentScreen === 'COMBAT' || currentScreen === 'BOSS') pauseRun();
      },
      sessionResume: () => {
        if (currentScreen === 'PAUSE') resumePausedRun();
      },
    });

    function isEditable(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      );
    }

    function handleKeydown(e: KeyboardEvent) {
      if (isEditable(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'p') {
        // Only the combat/pause lifecycle owns the P key; menu overlays ignore it
        // so typing or focus elsewhere never pauses a run by accident.
        if (currentScreen === 'COMBAT' || currentScreen === 'BOSS' || currentScreen === 'PAUSE') {
          e.preventDefault();
          pauseToggle();
        }
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="min-h-screen bg-fury-darker text-white select-none overflow-x-hidden">
  {#if mapLevel}
    <!-- The Stage map stays mounted under every menu overlay so the control
         that opened an overlay remains in the DOM and can receive focus back. -->
    <StageMap
      onStart={startCombat}
      onResumeRun={resumeRun}
      onOpenShop={() => send('OPEN_SHOP')}
      onOpenMasks={() => send('OPEN_MASKS')}
      onOpenReset={() => send('OPEN_RESET')}
      onOpenExport={() => send('OPEN_EXPORT')}
      onOpenImport={() => send('OPEN_IMPORT')}
      onOpenSettings={() => send('OPEN_SETTINGS')}
    />
    {#if currentScreen === 'SHOP'}
      <Shop onClose={() => send('CLOSE_SHOP')} />
    {:else if currentScreen === 'MASKS'}
      <MasksScreen onClose={() => send('CLOSE_MASKS')} />
    {:else if currentScreen === 'SETTINGS'}
      <FighterSettings onClose={() => send('CLOSE_SETTINGS')} />
    {:else if currentScreen === 'EXPORT'}
      <ExportCampaign onClose={() => send('CLOSE_EXPORT')} />
    {:else if currentScreen === 'IMPORT'}
      <ImportCampaign onClose={() => send('CLOSE_IMPORT')} />
    {:else if currentScreen === 'RESET_CONFIRM'}
      <OverlayShell title="Reset Progress" emoji="🗑️" accent="var(--color-fury-red)" maxWidth="max-w-sm" onClose={() => send('CANCEL_RESET')}>
        <div class="text-center">
          <p class="text-slate-200 mb-6 text-sm">
            This erases all Pesos, Masks, upgrades, Stage progress, the saved fighter
            name, and any run checkpoint. This cannot be undone.
          </p>
          <div class="flex gap-3 justify-center">
            <button
              class="btn-interactive min-h-12 px-6 py-2 rounded-lg font-semibold text-white"
              style="background: rgba(120,120,140,0.25);"
              onclick={() => send('CANCEL_RESET')}
            >
              Cancel
            </button>
            <button
              class="btn-interactive min-h-12 px-6 py-2 bg-fury-red hover:bg-red-600 rounded-lg font-semibold text-white"
              onclick={confirmReset}
            >
              Reset All
            </button>
          </div>
        </div>
      </OverlayShell>
    {/if}
  {:else if inCombat}
    <CombatScene
      screen={gameState.isBoss ? 'BOSS' : 'COMBAT'}
      {paused}
      onBossStart={() => send('BOSS_START')}
      onVictory={() => send('BOSS_DEFEATED')}
      onDefeat={() => send('PLAYER_DEFEATED')}
    />
    <HUD />
    {#if !paused}
      <button
        class="fixed top-16 right-2 z-40 bg-gray-800/90 hover:bg-gray-700 text-xs min-h-12 px-3 py-2 rounded-lg border border-fury-orange/40 hover:border-fury-orange btn-interactive text-slate-100"
        onclick={pauseRun}
        aria-label="Pause run (P)"
      >
        ⏸️ Pause
      </button>
    {/if}
    {#if paused}
      <PauseOverlay
        onResume={resumePausedRun}
        onSaveCheckpoint={() => {
          game.saveCheckpoint();
          game.showToast('Checkpoint saved — Resume Run is ready on the Stage map', 'success');
          send('SAVE_CHECKPOINT');
        }}
        onAbandon={() => {
          game.abandonRun();
          send('ABANDON');
        }}
      />
    {/if}
  {:else if currentScreen === 'VICTORY'}
    <VictoryScreen onContinue={() => send('CONTINUE')} />
  {:else if currentScreen === 'DEFEAT'}
    <DefeatScreen onTryAgain={tryAgain} onToMap={() => send('TO_MAP')} />
  {/if}

  <!-- History floats above any menu/idle screen; opening it never changes the
       underlying screen, so the trigger control stays mounted for focus return. -->
  {#if showHistory}
    <HistoryPanel onClose={() => (showHistory = false)} />
  {/if}

  {#if !inCombat && currentScreen !== 'VICTORY' && currentScreen !== 'DEFEAT' && currentScreen !== 'RESET_CONFIRM'}
    <button
      class="fixed bottom-2 right-2 z-40 bg-fury-blue/85 hover:bg-fury-blue text-xs min-h-12 px-3 py-2 rounded-lg border border-fury-green/30 hover:border-fury-green btn-interactive text-white"
      onclick={() => (showHistory = true)}
      aria-label="Open History panel"
    >
      📜 History
    </button>
  {/if}

  <!-- Global assistive-tech live region: every status message (illegal-action
       feedback, wave starts, checkpoint saved, copy confirmation) is announced. -->
  <div aria-live="polite" aria-atomic="true" class="sr-only-ff">{gameState.statusMessage}</div>

  {#if gameState.toast}
    <div
      class="fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl text-sm font-bold shadow-lg toast-in"
      role="status"
      aria-live="polite"
      style="background: {gameState.toast.type === 'warn'
        ? 'rgba(230,57,70,0.95)'
        : gameState.toast.type === 'info'
          ? 'rgba(38,70,83,0.95)'
          : 'rgba(42,157,143,0.95)'}; color: #fff; border: 1px solid rgba(255,255,255,0.25);"
    >
      {gameState.toast.text}
    </div>
  {/if}
</div>

<style>
  .sr-only-ff {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .toast-in {
    animation: toast-in 0.25s ease-out;
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translate(-50%, 12px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .toast-in { animation: none; }
  }
</style>
