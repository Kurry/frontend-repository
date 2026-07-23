<script lang="ts">
  import './app.css';
  import { Compass, ListChecks, ShieldCheck, GearSix, Sword, Keyboard, X } from 'phosphor-svelte';
  import type { Component } from 'svelte';
  import QuestMap from './lib/components/QuestMap.svelte';
  import LogRepsForm from './lib/components/LogRepsForm.svelte';
  import ProgressPanel from './lib/components/ProgressPanel.svelte';
  import GearShop from './lib/components/GearShop.svelte';
  import HistoryPanel from './lib/components/HistoryPanel.svelte';
  import WeeklyChart from './lib/components/WeeklyChart.svelte';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';
  import DailyReminder from './lib/components/DailyReminder.svelte';
  import UndoRedo from './lib/components/UndoRedo.svelte';
  import Toasts from './lib/components/Toasts.svelte';
  // (Notification.svelte is retired in favor of the queue-based Toasts.)
  import GameModeBar from './lib/components/GameModeBar.svelte';
  import ChallengePanel from './lib/components/ChallengePanel.svelte';
  import QuestArtifactPanel from './lib/components/QuestArtifactPanel.svelte';
  import HeatMap from './lib/components/HeatMap.svelte';
  import PersonalRecords from './lib/components/PersonalRecords.svelte';
  import FirstRunTip from './lib/components/FirstRunTip.svelte';
  import { quest } from './store.svelte';

  type TabId = 'quest' | 'history' | 'gear' | 'settings';

  let activeTab = $state<TabId>('quest');
  let showHelp = $state(false);

  const tabs: { id: TabId; label: string; icon: Component }[] = [
    { id: 'quest', label: 'Quest', icon: Compass },
    { id: 'history', label: 'History', icon: ListChecks },
    { id: 'gear', label: 'Gear', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: GearSix }
  ];

  function setTab(id: TabId) { activeTab = id; }

  function onGlobalKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
    if (showHelp && e.key === 'Escape') { showHelp = false; return; }
    if (typing) return;
    if (e.key === '?') { e.preventDefault(); showHelp = !showHelp; return; }
    if (e.key === '1') { setTab('quest'); return; }
    if (e.key === '2') { setTab('history'); return; }
    if (e.key === '3') { setTab('gear'); return; }
    if (e.key === '4') { setTab('settings'); return; }
    if (e.key.toLowerCase() === 'l') {
      if (activeTab !== 'quest') setTab('quest');
      requestAnimationFrame(() => document.getElementById('rep-input')?.focus());
      return;
    }
    if (e.key.toLowerCase() === 'm') {
      quest.setGameMode(quest.gameMode === 'quest' ? 'challenge' : 'quest');
      return;
    }
  }

</script>

<svelte:window onkeydown={onGlobalKey} />

<Toasts />
{#if quest.celebration}
  <div class="confetti" data-celebration="confetti" aria-hidden="true">
    {#each Array.from({length: 28}) as _, i}<i style={`--i:${i}`}></i>{/each}
  </div>
{/if}

<div class="min-h-screen">
  <!-- Header -->
  <header class="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-sm">
    <div class="max-w-2xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-xl font-extrabold tracking-tight flex items-center gap-2" style="color: var(--accent)">
          <Sword size={22} weight="bold" /> RepQuest
        </h1>
        <div class="flex items-center gap-3 text-xs">
          <span class="text-slate-400 hidden sm:inline">Streak: <span class="font-bold" style="color: var(--accent-strong)">{quest.state.currentStreak}</span></span>
          <span class="text-slate-400 hidden sm:inline">QP: <span class="font-bold" style="color: var(--accent-strong)">{quest.state.questPoints}</span></span>
          <button
            onclick={() => showHelp = true}
            aria-label="Keyboard shortcuts"
            class="inline-flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-2 py-1.5 border border-slate-700 transition-colors"
          >
            <Keyboard size={16} /> <span class="hidden xs:inline">Shortcuts</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Tab Navigation -->
  <div class="bg-slate-900 border-b border-slate-800 sticky top-[53px] z-30" role="tablist" aria-label="Main navigation">
    <div class="max-w-2xl mx-auto px-2 sm:px-4">
      <div class="flex">
        {#each tabs as tab}
          {@const Icon = tab.icon}
          <button
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="panel-{tab.id}"
            onclick={() => activeTab = tab.id}
            class="flex-1 min-w-0 py-3.5 text-sm font-medium text-center transition-colors border-b-2 flex items-center justify-center gap-1.5
                   {activeTab === tab.id
                     ? 'text-white'
                     : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'}"
            style={activeTab === tab.id ? 'border-color: var(--accent); color: var(--accent-strong)' : ''}
          >
            <Icon size={17} weight={activeTab === tab.id ? 'fill' : 'regular'} />
            <span class="truncate">{tab.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="max-w-2xl mx-auto px-4 py-4 space-y-4">
    <DailyReminder />

    {#if activeTab === 'quest'}
      <div id="panel-quest" role="tabpanel">
        <div class="space-y-4">
          {#if !quest.firstRunTipDismissed}
            <FirstRunTip />
          {/if}
          <GameModeBar />

          {#if quest.gameMode === 'quest'}
            <QuestMap />
            <LogRepsForm />
            <ProgressPanel />
            <PersonalRecords />
            <HeatMap />
            <WeeklyChart />
          {:else}
            <ChallengePanel />
          {/if}

          <UndoRedo />
        </div>
      </div>
    {:else if activeTab === 'history'}
      <div id="panel-history" role="tabpanel">
        <div class="space-y-4"><HistoryPanel /><HeatMap /></div>
      </div>
    {:else if activeTab === 'gear'}
      <div id="panel-gear" role="tabpanel">
        <GearShop />
      </div>
    {:else if activeTab === 'settings'}
      <div id="panel-settings" role="tabpanel">
        <SettingsPanel />
        <QuestArtifactPanel />
      </div>
    {/if}
  </main>

  <footer class="text-center py-6 text-slate-400 text-sm">
    <p>RepQuest — Log your push-ups, advance your quest!</p>
  </footer>
</div>

<!-- Keyboard shortcuts help dialog -->
{#if showHelp}
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onclick={(event) => event.target === event.currentTarget && (showHelp = false)}
    role="presentation"
  >
    <div class="bg-slate-800 rounded-xl p-5 max-w-sm w-full border border-slate-700 shadow-2xl" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold text-white flex items-center gap-2"><Keyboard size={20} /> Keyboard shortcuts</h2>
        <button onclick={() => showHelp = false} aria-label="Close shortcuts" class="text-slate-400 hover:text-white"><X size={18} /></button>
      </div>
      <ul class="text-sm text-slate-300 space-y-2">
        <li class="flex justify-between"><span>Focus Log reps</span><kbd class="kbd">L</kbd></li>
        <li class="flex justify-between"><span>Quest / History / Gear / Settings</span><span class="flex gap-1"><kbd class="kbd">1</kbd><kbd class="kbd">2</kbd><kbd class="kbd">3</kbd><kbd class="kbd">4</kbd></span></li>
        <li class="flex justify-between"><span>Toggle game mode</span><kbd class="kbd">M</kbd></li>
        <li class="flex justify-between"><span>This help</span><kbd class="kbd">?</kbd></li>
      </ul>
      <p class="text-xs text-slate-500 mt-3">Shortcuts pause while typing in a field. Mouse play is unaffected.</p>
    </div>
  </div>
{/if}

<style>
  .confetti{position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden}
  .confetti i{position:absolute;left:calc((var(--i) + 1) * 3.5%);top:-12px;width:8px;height:14px;background:hsl(calc(var(--i) * 43),90%,58%);animation:confetti-fall 1.2s ease-in forwards;animation-delay:calc(var(--i) * 11ms)}
  @keyframes confetti-fall{to{transform:translate(calc((var(--i) - 14) * 2px),105vh) rotate(720deg);opacity:.15}}
  .kbd{display:inline-block;min-width:1.4em;text-align:center;padding:1px 6px;border-radius:6px;background:#0f172a;border:1px solid #475569;color:#e2e8f0;font-family:var(--font-display);font-size:11px}
  @media (min-width: 420px){ .xs\:inline{display:inline} }
</style>
