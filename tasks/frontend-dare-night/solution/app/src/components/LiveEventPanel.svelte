<script lang="ts">
  import { STREAM_STATUS_LABEL, type LiveEvent, type StreamStatus } from '../lib/stream';

  interface Props {
    status: StreamStatus;
    appliedEvents: LiveEvent[];
    bonuses: { name: string; bonus: number }[];
    offeredEvent: LiveEvent | null;
    deliveredCount: number;
    totalEvents: number;
    duplicatesIgnored: number;
    onStart: () => void;
    onPause: () => void;
    onReconnect: () => void;
    onDeliverOutOfOrder: () => void;
  }

  let {
    status,
    appliedEvents,
    bonuses,
    offeredEvent,
    deliveredCount,
    totalEvents,
    duplicatesIgnored,
    onStart,
    onPause,
    onReconnect,
    onDeliverOutOfOrder,
  }: Props = $props();

  function statusDotColor(s: StreamStatus): string {
    switch (s) {
      case 'active': return '#22C55E';
      case 'paused': return '#F59E0B';
      case 'disconnected': return '#EF4444';
      case 'caught-up': return '#3B82F6';
      default: return '#9CA3AF';
    }
  }
</script>

<div class="bg-white rounded-xl p-6 shadow-lg w-full" style="border-radius: 10px;">
  <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
    <h2 class="text-lg font-semibold" style="color: var(--color-accent);">Live event feed</h2>
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
      <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: {statusDotColor(status)};" aria-hidden="true"></span>
      <span class="text-xs font-semibold text-black" data-testid="stream-status">{STREAM_STATUS_LABEL[status]}</span>
    </div>
  </div>

  <p class="text-xs text-gray-600 mb-3">
    Applied {deliveredCount} of {totalEvents} events. Duplicates ignored: {duplicatesIgnored}.
  </p>

  <div class="flex flex-wrap gap-2 mb-4">
    <button
      class="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      style="background-color: var(--color-accent);"
      onclick={onStart}
    >
      Start
    </button>
    <button
      class="px-4 py-2 rounded-full text-sm font-semibold bg-white text-black border-2 border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      onclick={onPause}
    >
      Pause
    </button>
    <button
      class="px-4 py-2 rounded-full text-sm font-semibold bg-white text-black border-2 border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      onclick={onReconnect}
    >
      Reconnect
    </button>
    <button
      class="px-4 py-2 rounded-full text-sm font-semibold bg-white text-black border-2 border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-40 disabled:cursor-not-allowed"
      onclick={onDeliverOutOfOrder}
      disabled={!offeredEvent}
    >
      Deliver out of order
    </button>
  </div>

  {#if offeredEvent}
    <p class="text-xs text-gray-600 mb-3" data-testid="offered-event">
      Offered next (out of order): {offeredEvent.id} · seq {offeredEvent.seq} · {offeredEvent.player} +{offeredEvent.points}
    </p>
  {/if}

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <h3 class="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Live bonus by player</h3>
      <div class="space-y-1">
        {#each bonuses as row (row.name)}
          <div class="flex items-center justify-between text-sm">
            <span class="truncate" style="color: var(--color-text-primary);">{row.name}</span>
            <span class="font-bold text-green-600" data-testid="bonus-{row.name}">{row.bonus}</span>
          </div>
        {/each}
      </div>
    </div>
    <div>
      <h3 class="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Applied log (seq order)</h3>
      {#if appliedEvents.length === 0}
        <p class="text-xs text-gray-500">No events applied yet. Select Start to begin the stream.</p>
      {:else}
        <ol class="space-y-1">
          {#each [...appliedEvents].sort((a, b) => a.seq - b.seq) as ev (ev.id)}
            <li class="text-xs text-gray-700">{ev.seq}. {ev.id} — {ev.player} +{ev.points}</li>
          {/each}
        </ol>
      {/if}
    </div>
  </div>
</div>
