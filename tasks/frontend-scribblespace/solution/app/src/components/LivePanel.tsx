import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  setShowLivePanel,
  streamStart,
  streamPause,
  streamDisconnect,
  streamDeliverOutOfOrder,
  streamReconnect,
  streamReconnectFinish,
} from '../slices/appSlice';
import { STREAM_EVENTS } from '../streamEvents';

const STATUS_META: Record<
  string,
  { label: string; glyph: string; bg: string; fg: string; border: string }
> = {
  idle: {
    label: 'Idle',
    glyph: '○',
    bg: '#EDEBF5',
    fg: '#211D3A',
    border: '#6B6489',
  },
  active: {
    label: 'Active',
    glyph: '▶',
    bg: '#6D5BD0',
    fg: '#FFFFFF',
    border: '#6D5BD0',
  },
  paused: {
    label: 'Paused',
    glyph: '| |',
    bg: '#FFFFFF',
    fg: '#211D3A',
    border: '#6B6489',
  },
  disconnected: {
    label: 'Disconnected',
    glyph: '!',
    bg: '#E0A030',
    fg: '#211D3A',
    border: '#E0A030',
  },
  replaying: {
    label: 'Replaying',
    glyph: '↺',
    bg: '#F3F0FF',
    fg: '#211D3A',
    border: '#6D5BD0',
  },
  'caught-up': {
    label: 'Caught up',
    glyph: '✓',
    bg: '#211D3A',
    fg: '#FFFFFF',
    border: '#211D3A',
  },
};

const LivePanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const stream = useAppSelector(s => s.app.stream);
  const replayTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (replayTimer.current !== null) window.clearTimeout(replayTimer.current);
    };
  }, []);

  const meta = STATUS_META[stream.status] || STATUS_META.idle;
  const appliedEvents = STREAM_EVENTS.filter(e => stream.appliedIds.includes(e.id)).sort(
    (a, b) => a.ts - b.ts
  );
  const pending = STREAM_EVENTS.filter(
    e =>
      !stream.appliedIds.includes(e.id) &&
      !stream.receivedIds.includes(e.id) &&
      !stream.missedIds.includes(e.id)
  );
  const offered = pending[1] || pending[0];
  const waitingCount =
    stream.missedIds.length +
    stream.receivedIds.filter(id => !stream.appliedIds.includes(id)).length;
  const allApplied = appliedEvents.length === STREAM_EVENTS.length;

  const handleReconnect = () => {
    dispatch(streamReconnect());
    if (replayTimer.current !== null) window.clearTimeout(replayTimer.current);
    replayTimer.current = window.setTimeout(() => {
      dispatch(streamReconnectFinish());
    }, 700);
  };

  return (
    <section
      aria-labelledby="live-panel-title"
      className="absolute top-2 right-2 bg-white shadow-xl flex flex-col"
      style={{
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        width: 'min(320px, calc(100vw - 16px))',
        maxHeight: 'calc(100% - 16px)',
        zIndex: 60,
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 id="live-panel-title" className="font-semibold m-0" style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>
          Live events
        </h2>
        <button
          type="button"
          aria-label="Close live events"
          title="Close live events"
          className="flex items-center justify-center hover:bg-[#EAE6F7]"
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
          onClick={() => dispatch(setShowLivePanel(false))}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1"
            style={{
              fontSize: '13px',
              borderRadius: '8px',
              backgroundColor: meta.bg,
              color: meta.fg,
              border: `1.5px solid ${meta.border}`,
            }}
          >
            <span aria-hidden="true">{meta.glyph}</span>
            {meta.label}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {appliedEvents.length} of {STREAM_EVENTS.length} events applied
          </span>
        </div>
        {waitingCount > 0 && (
          <p className="m-0 font-medium" style={{ fontSize: '13px', color: '#A4541B' }}>
            {waitingCount === 1 ? '1 event waiting' : `${waitingCount} events waiting`} — select
            Reconnect to apply
          </p>
        )}
        <p className="m-0" style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
          Each event carries a stable ID and a logical timestamp, so duplicates are ignored and
          out-of-order delivery resolves in timestamp order.
        </p>

        <div className="flex flex-wrap gap-2 mt-1">
          <button
            type="button"
            className="btn-primary"
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={
              stream.status === 'active' ||
              stream.status === 'replaying' ||
              stream.status === 'disconnected' ||
              allApplied
            }
            onClick={() => dispatch(streamStart())}
          >
            Start
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={stream.status !== 'active'}
            onClick={() => dispatch(streamPause())}
          >
            Pause
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={stream.status !== 'active' && stream.status !== 'paused'}
            onClick={() => dispatch(streamDisconnect())}
          >
            Disconnect
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={stream.status === 'idle' || stream.status === 'replaying'}
            onClick={handleReconnect}
          >
            Reconnect
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={stream.status === 'idle' || stream.status === 'replaying' || !offered}
            onClick={() => dispatch(streamDeliverOutOfOrder())}
          >
            Deliver Out of Order
          </button>
        </div>
        {offered && stream.status !== 'idle' && (
          <p className="m-0" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Next out-of-order delivery: event {offered.ts}
          </p>
        )}
      </div>

      <div className="px-4 pb-3 overflow-y-auto" style={{ borderTop: '1px solid var(--color-border)' }}>
        <h3 className="font-semibold mt-2 mb-1" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
          Applied events
        </h3>
        {appliedEvents.length === 0 ? (
          <p className="m-0" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            No events applied yet — select Start to begin the stream
          </p>
        ) : (
          <ol className="m-0 p-0 list-none flex flex-col gap-1">
            {appliedEvents.map(e => (
              <li
                key={e.id}
                className="flex items-center gap-2"
                style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
              >
                <span
                  className="font-semibold text-right"
                  style={{ color: 'var(--color-text-secondary)', width: 22, flexShrink: 0 }}
                >
                  {e.ts}
                </span>
                <span>{e.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
};

export default LivePanel;
