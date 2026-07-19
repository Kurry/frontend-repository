<script lang="ts">
  import './app.css';
  import QuestMap from './lib/components/QuestMap.svelte';
  import LogRepsForm from './lib/components/LogRepsForm.svelte';
  import ProgressPanel from './lib/components/ProgressPanel.svelte';
  import GearShop from './lib/components/GearShop.svelte';
  import HistoryPanel from './lib/components/HistoryPanel.svelte';
  import WeeklyChart from './lib/components/WeeklyChart.svelte';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';
  import DailyReminder from './lib/components/DailyReminder.svelte';
  import UndoRedo from './lib/components/UndoRedo.svelte';
  import Notification from './lib/components/Notification.svelte';
  import GameModeBar from './lib/components/GameModeBar.svelte';
  import ChallengePanel from './lib/components/ChallengePanel.svelte';
  import { quest } from './store.svelte';

  type TabId = 'quest' | 'history' | 'gear' | 'settings';

  let activeTab = $state<TabId>('quest');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'quest', label: 'Quest', icon: '⚔️' },
    { id: 'history', label: 'History', icon: '📋' },
    { id: 'gear', label: 'Gear', icon: '🛡️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
</script>

<Notification />

<div class="min-h-screen bg-slate-950">
  <!-- Header -->
  <header class="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-sm">
    <div class="max-w-2xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-extrabold text-amber-400 tracking-tight">
          ⚔️ RepQuest
        </h1>
        <div class="flex items-center gap-3 text-xs">
          <span class="text-slate-400 hidden sm:inline">Streak: <span class="text-amber-400 font-bold">{quest.state.currentStreak}</span></span>
          <span class="text-slate-400 hidden sm:inline">QP: <span class="text-amber-400 font-bold">{quest.state.questPoints}</span></span>
        </div>
      </div>
    </div>
  </header>

  <!-- Tab Navigation -->
  <div class="bg-slate-900 border-b border-slate-800 sticky top-[53px] z-30" role="tablist" aria-label="Main navigation">
    <div class="max-w-2xl mx-auto px-4">
      <div class="flex">
        {#each tabs as tab}
          <button
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="panel-{tab.id}"
            onclick={() => activeTab = tab.id}
            class="flex-1 py-3.5 text-sm font-medium text-center transition-colors border-b-2
                   {activeTab === tab.id
                     ? 'border-amber-400 text-amber-400'
                     : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'}
                   focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset"
          >
            <span class="mr-1">{tab.icon}</span>
            <span class="inline">{tab.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="max-w-2xl mx-auto px-4 py-4 space-y-4">
    <!-- Daily Reminder Banner -->
    <DailyReminder />

    {#if activeTab === 'quest'}
      <!-- Quest Tab -->
      <div id="panel-quest" role="tabpanel">
        <div class="space-y-4">
          <GameModeBar />

          {#if quest.gameMode === 'quest'}
            <QuestMap />
            <LogRepsForm />
            <ProgressPanel />
            <WeeklyChart />
          {:else}
            <ChallengePanel />
          {/if}

          <UndoRedo />
        </div>
      </div>
    {:else if activeTab === 'history'}
      <!-- History Tab -->
      <div id="panel-history" role="tabpanel">
        <HistoryPanel />
      </div>
    {:else if activeTab === 'gear'}
      <!-- Gear Tab -->
      <div id="panel-gear" role="tabpanel">
        <GearShop />
      </div>
    {:else if activeTab === 'settings'}
      <!-- Settings Tab -->
      <div id="panel-settings" role="tabpanel">
        <SettingsPanel />
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="text-center py-6 text-slate-400 text-sm">
    <p>RepQuest — Log your push-ups, advance your quest!</p>
  </footer>
</div>
