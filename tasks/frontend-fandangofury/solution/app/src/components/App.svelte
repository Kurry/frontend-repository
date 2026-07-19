<script lang="ts">
  import { onMount } from 'svelte';
  import { createActor } from 'xstate';
  import { gameMachine } from '../lib/game-machine';
  import { game } from '../lib/game-store.svelte.ts';
  import HUD from './HUD.svelte';
  import CombatScene from './CombatScene.svelte';
  import StageMap from './StageMap.svelte';
  import Shop from './Shop.svelte';
  import MasksScreen from './MasksScreen.svelte';
  import VictoryScreen from './VictoryScreen.svelte';
  import DefeatScreen from './DefeatScreen.svelte';
  import HistoryPanel from './HistoryPanel.svelte';
  import { initWebMcp } from '../lib/webmcp.ts';

  let currentScreen = $state('MAP');
  let showHistory = $state(false);
  let prevScreen = $state('MAP');

  const actor = createActor(gameMachine);
  actor.subscribe((snapshot) => {
    currentScreen = snapshot.value as string;
  });
  actor.start();

  function send(type: string) {
    actor.send({ type });
  }

  function openHistory() {
    prevScreen = currentScreen;
    showHistory = true;
    send('OPEN_HISTORY');
  }

  function closeHistory() {
    showHistory = false;
    send('CLOSE_HISTORY');
  }

  function startCombat(stageId: number) {
    game.startStage(stageId);
    send('START_STAGE');
  }

  function tryAgain() {
    game.startStage(game.current.currentStage);
    send('TRY_AGAIN');
  }

  function confirmReset() {
    game.resetProgress();
    send('CONFIRM_RESET');
  }

  onMount(() => {
    initWebMcp({
      currentScreen: () => currentScreen,
      startStage: (stageId: number) => startCombat(stageId),
      restartStage: () => startCombat(game.current.currentStage),
      continueFromVictory: () => {
        if (currentScreen === 'VICTORY') send('CONTINUE');
      },
      retreatToMap: () => {
        if (currentScreen === 'COMBAT') send('PAUSE_TO_MAP');
      },
      openMap: () => {
        if (currentScreen === 'SHOP') send('CLOSE_SHOP');
        else if (currentScreen === 'MASKS') send('CLOSE_MASKS');
      },
      openMasks: () => {
        if (currentScreen === 'MAP') send('OPEN_MASKS');
      },
      openCantina: () => {
        if (currentScreen === 'MAP') send('OPEN_SHOP');
      },
    });

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (currentScreen === 'SHOP') send('CLOSE_SHOP');
        else if (currentScreen === 'MASKS') send('CLOSE_MASKS');
        else if (currentScreen === 'HISTORY') closeHistory();
        else if (currentScreen === 'RESET_CONFIRM') send('CANCEL_RESET');
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="min-h-screen bg-fury-darker text-white select-none overflow-x-hidden">
  {#if currentScreen === 'MAP'}
    <StageMap
      onStart={startCombat}
      onOpenShop={() => send('OPEN_SHOP')}
      onOpenMasks={() => send('OPEN_MASKS')}
      onOpenHistory={openHistory}
      onOpenReset={() => send('OPEN_RESET')}
    />
  {:else if currentScreen === 'COMBAT' || currentScreen === 'BOSS'}
    <CombatScene
      screen={currentScreen}
      onBossStart={() => send('BOSS_START')}
      onVictory={() => send('BOSS_DEFEATED')}
      onDefeat={() => send('PLAYER_DEFEATED')}
    />
  {:else if currentScreen === 'SHOP'}
    <Shop onClose={() => send('CLOSE_SHOP')} />
  {:else if currentScreen === 'MASKS'}
    <MasksScreen onClose={() => send('CLOSE_MASKS')} />
  {:else if currentScreen === 'VICTORY'}
    <VictoryScreen onContinue={() => send('CONTINUE')} />
  {:else if currentScreen === 'DEFEAT'}
    <DefeatScreen onTryAgain={tryAgain} onToMap={() => send('TO_MAP')} />
  {:else if currentScreen === 'RESET_CONFIRM'}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="bg-fury-dark border border-fury-orange rounded-xl p-6 max-w-sm w-full text-center" role="dialog" aria-label="Reset confirmation">
        <h2 class="text-2xl font-bold text-fury-orange mb-4">Reset progress?</h2>
        <p class="text-slate-200 mb-6">This will erase all pesos, masks, upgrades and stage progress. This cannot be undone.</p>
        <div class="flex gap-3 justify-center">
          <button
            class="btn-interactive min-h-12 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white"
            onclick={() => send('CANCEL_RESET')}
          >
            Cancel
          </button>
          <button
            class="btn-interactive min-h-12 px-6 py-2 bg-fury-red hover:bg-red-600 rounded-lg font-semibold text-white"
            onclick={confirmReset}
          >
            Reset all
          </button>
        </div>
      </div>
    </div>
  {:else if currentScreen === 'HISTORY'}
    {#if prevScreen === 'MAP'}
      <StageMap
        onStart={startCombat}
        onOpenShop={() => send('CLOSE_HISTORY')}
        onOpenMasks={() => send('CLOSE_HISTORY')}
        onOpenHistory={() => {}}
        onOpenReset={() => send('CLOSE_HISTORY')}
      />
    {:else if prevScreen === 'SHOP'}
      <Shop onClose={() => {}} />
    {:else if prevScreen === 'MASKS'}
      <MasksScreen onClose={() => {}} />
    {:else}
      <StageMap
        onStart={startCombat}
        onOpenShop={() => {}}
        onOpenMasks={() => {}}
        onOpenHistory={() => {}}
        onOpenReset={() => {}}
      />
    {/if}
    <HistoryPanel onClose={closeHistory} />
  {/if}

  {#if currentScreen === 'COMBAT' || currentScreen === 'BOSS'}
    <HUD />
  {/if}

  {#if currentScreen === 'COMBAT'}
    <button
      class="fixed top-16 right-2 z-40 bg-gray-800/90 hover:bg-gray-700 text-xs min-h-12 px-3 py-2 rounded-lg border border-fury-orange/40 hover:border-fury-orange btn-interactive text-slate-100"
      onclick={() => send('PAUSE_TO_MAP')}
      aria-label="Retreat to stage map"
    >
      🏳️ Retreat to map
    </button>
  {/if}

  {#if currentScreen !== 'RESET_CONFIRM' && currentScreen !== 'HISTORY' && currentScreen !== 'COMBAT' && currentScreen !== 'BOSS'}
    <button
      class="fixed bottom-2 right-2 z-40 bg-fury-blue/80 hover:bg-fury-blue text-xs min-h-12 px-3 py-2 rounded-lg border border-fury-green/30 hover:border-fury-green btn-interactive text-white"
      onclick={openHistory}
      aria-label="Open history panel"
    >
      📜 History
    </button>
  {/if}
</div>
