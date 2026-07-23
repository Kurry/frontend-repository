import { h } from 'preact';
import {
  relay, RELAY_SCRIPT,
  relayStart, relayPause, relayDisconnect, relayReconnect, relayDeliverOutOfOrder
} from '../store';

const STATUS_INFO = {
  idle: { label: 'Not connected', cls: 'relay-idle' },
  live: { label: 'Live', cls: 'relay-live' },
  paused: { label: 'Paused', cls: 'relay-paused' },
  disconnected: { label: 'Disconnected', cls: 'relay-disconnected' },
  replaying: { label: 'Replaying missed events', cls: 'relay-replaying' },
  'caught-up': { label: 'Caught up', cls: 'relay-caught-up' },
  complete: { label: 'Broadcast complete', cls: 'relay-complete' }
};

function formatApplied(applied) {
  let out = '';
  applied.forEach((e, i) => {
    const num = Math.floor((e.ts - 1) / 2) + 1;
    const prefix = e.ts % 2 === 1 ? `${num}. ` : '';
    out += (i > 0 ? ' ' : '') + prefix + e.san;
  });
  return out;
}

export function LiveRelay() {
  const s = relay.value;
  const status = STATUS_INFO[s.status] || STATUS_INFO.idle;

  return (
    <section class="card mb-4">
      <h3 class="mb-1">Live Relay</h3>
      <p class="text-sm text-neutral-600 mb-3">
        A scripted broadcast of a demonstration game. Events carry stable ids and logical timestamps, so duplicates and out-of-order delivery resolve deterministically.
      </p>
      <div class="flex flex-wrap gap-2 mb-3">
        <button type="button" class="btn-secondary btn-compact" onClick={relayStart}>
          Start
        </button>
        <button type="button" class="btn-secondary btn-compact" onClick={relayPause}>
          Pause
        </button>
        <button type="button" class="btn-secondary btn-compact" onClick={relayDisconnect}>
          Disconnect
        </button>
        <button type="button" class="btn-secondary btn-compact" onClick={relayReconnect}>
          Reconnect
        </button>
        <button type="button" class="btn-secondary btn-compact" onClick={relayDeliverOutOfOrder}>
          Deliver out of order
        </button>
      </div>
      <div class="flex items-center gap-2 mb-2 flex-wrap" role="status" aria-live="polite">
        <span class={`relay-status ${status.cls}`}>{status.label}</span>
        <span class="text-base stat-figures">
          Delivered: {s.applied.length} of {RELAY_SCRIPT.length}
        </span>
        <span class="text-base stat-figures">
          Buffered: {s.buffer.length}
        </span>
      </div>
      <div class="text-base min-h-6 break-words">
        {s.applied.length === 0
          ? <span class="text-neutral-600">No events applied yet — select Start to open the stream</span>
          : (
            <div>
              <div class="mb-2">{formatApplied(s.applied)}</div>
              <ol class="list-decimal pl-6 space-y-1" aria-label="Applied events in logical order">
                {s.applied.map(event => (
                  <li key={event.id} class="stat-figures">
                    Time {event.ts}: {event.side} played {event.san} <span class="text-neutral-600">({event.id})</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
      </div>
    </section>
  );
}
