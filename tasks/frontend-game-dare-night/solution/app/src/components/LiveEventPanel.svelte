<script lang="ts">
  import {
    Play, Pause, PlugsConnected, Shuffle, Circle, Broadcast, PauseCircle, WifiSlash, CheckCircle,
  } from 'phosphor-svelte';
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
  let { status, appliedEvents, bonuses, offeredEvent, deliveredCount, totalEvents, duplicatesIgnored, onStart, onPause, onReconnect, onDeliverOutOfOrder }: Props = $props();

  function dot(s: StreamStatus): string {
    switch (s) {
      case 'active': return '#16A34A';
      case 'paused': return '#D97706';
      case 'disconnected': return '#DC2626';
      case 'caught-up': return '#2563EB';
      default: return '#6B7280';
    }
  }
  function pillBg(s: StreamStatus): string {
    switch (s) {
      case 'active': return 'bg-green-100';
      case 'paused': return 'bg-amber-100';
      case 'disconnected': return 'bg-red-100';
      case 'caught-up': return 'bg-blue-100';
      default: return 'bg-gray-100';
    }
  }
</script>

<div class="bg-white rounded-[10px] p-5 shadow-lg w-full">
  <div class="flex items-center justify-between gap-2.5 mb-2.5 flex-wrap">
    <h2 class="text-lg font-semibold" style="color: var(--color-accent);">Live event feed</h2>
    <span class="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-full {pillBg(status)} transition-colors duration-300" data-testid="stream-status-pill" data-stream-status={status}>
      {#if status === 'active'}<Broadcast size={16} weight="bold" style="color: {dot(status)};" aria-hidden="true" />
      {:else if status === 'paused'}<PauseCircle size={16} weight="bold" style="color: {dot(status)};" aria-hidden="true" />
      {:else if status === 'disconnected'}<WifiSlash size={16} weight="bold" style="color: {dot(status)};" aria-hidden="true" />
      {:else if status === 'caught-up'}<CheckCircle size={16} weight="bold" style="color: {dot(status)};" aria-hidden="true" />
      {:else}<Circle size={16} weight="fill" style="color: {dot(status)};" aria-hidden="true" />{/if}
      <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: {dot(status)};" aria-hidden="true"></span>
      <span class="text-xs font-bold text-black" data-testid="stream-status">{STREAM_STATUS_LABEL[status]}</span>
    </span>
  </div>

  <p class="text-xs text-gray-600 mb-2.5">Applied {deliveredCount} of {totalEvents} events. Duplicates ignored: {duplicatesIgnored}.</p>

  <div class="flex flex-wrap gap-2.5 mb-2.5">
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-md hover:opacity-90" style="background-color: var(--color-accent);" onclick={onStart}><Play size={18} weight="bold" aria-hidden="true" /> Start</button>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black hover:bg-gray-50" onclick={onPause}><Pause size={18} weight="bold" aria-hidden="true" /> Pause</button>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black hover:bg-gray-50" onclick={onReconnect}><PlugsConnected size={18} weight="bold" aria-hidden="true" /> Reconnect</button>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" onclick={onDeliverOutOfOrder} disabled={!offeredEvent}><Shuffle size={18} weight="bold" aria-hidden="true" /> Deliver out of order</button>
  </div>

  {#if offeredEvent}
    <p class="text-xs text-gray-600 mb-2.5" data-testid="offered-event">Offered next (out of order): {offeredEvent.id} · seq {offeredEvent.seq} · {offeredEvent.player} +{offeredEvent.points}</p>
  {/if}

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
    <div>
      <h3 class="text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">Live bonus by player</h3>
      <div class="space-y-1">
        {#each bonuses as row (row.name)}
          <div class="flex items-center justify-between text-sm">
            <span class="truncate" style="color: var(--color-text-primary);">{row.name}</span>
            <span class="font-bold text-green-600 tabular-nums" data-testid="bonus-{row.name}">{row.bonus}</span>
          </div>
        {/each}
      </div>
    </div>
    <div>
      <h3 class="text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">Applied log (seq order)</h3>
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
