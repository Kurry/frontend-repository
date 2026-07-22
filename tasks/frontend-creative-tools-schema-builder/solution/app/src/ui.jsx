// Shared UI chrome: focus-trapping modals, tabs with crossfade, toasts,
// labeled form fields, JSON code surfaces, and small visualizations.
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Close, ChevronDown } from '@carbon/icons-react';

export function useDur(fast = 0.15, base = 0.2) {
  const isRM = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  };
  const [rm, setRm] = useState(isRM);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const q = window.matchMedia('(prefers-reduced-motion: reduce)');
      const cb = (e) => setRm(e.matches);
      q.addEventListener('change', cb);
      return () => q.removeEventListener('change', cb);
    }
  }, []);
  return { fast: rm ? 0 : fast, base: rm ? 0 : base };
}

/* ------------------------------- Modal ----------------------------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, wide = false, tone }) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const dur = useDur();

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    const first = focusables()[0];
    (first || panel).focus();
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const items = focusables();
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus();
      }
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur.fast }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`panel modal-panel relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: dur.base }}
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 var-border">
              <h2 className="heading-panel m-0">
                {tone === 'danger' && <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: 'var(--danger)' }} aria-hidden="true" />}
                {title}
              </h2>
              <button type="button" className="icon-btn" aria-label={`Close ${title}`} onClick={onClose}>
                <Close size={16} />
              </button>
            </div>
            <div className="px-4 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------- Tabs ----------------------------------- */

export function Tabs({ id, tabs, active, onChange, className = '' }) {
  const listRef = useRef(null);
  function onKey(e) {
    const idx = tabs.findIndex((t) => t.id === active);
    let next = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(tabs[next].id);
      const el = listRef.current?.querySelector(`[data-tab="${tabs[next].id}"]`);
      if (el) el.focus();
    }
  }
  return (
    <div role="tablist" aria-label={id} className={`tablist ${className}`} ref={listRef} onKeyDown={onKey}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          data-tab={t.id}
          id={`${id}-tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`${id}-panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          className={`tab tap ${active === t.id ? 'tab-active' : ''} ${t.disabled ? 'tab-disabled' : ''}`}
          disabled={t.disabled}
          onClick={() => onChange(t.id)}
          title={t.disabled ? t.disabledReason : undefined}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, tab, children, className = '' }) {
  const dur = useDur();
  return (
    <motion.div
      key={tab}
      role="tabpanel"
      id={`${id}-panel-${tab}`}
      aria-labelledby={`${id}-tab-${tab}`}
      className={`min-h-0 flex-1 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: dur.fast === 0 ? 0 : dur.fast + 0.02 }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ Form bits -------------------------------- */

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className="field-block">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="field-hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Switch({ checked, onChange, label, labelledBy, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={`switch tap ${checked ? 'switch-on' : ''}`}
      onClick={onChange}
    >
      <span className="switch-thumb" aria-hidden="true" />
    </button>
  );
}

/* ------------------------------ Code surface ----------------------------- */

const JSON_TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g;

export function highlightJson(text) {
  const out = [];
  let last = 0;
  let k = 0;
  let m;
  JSON_TOKEN.lastIndex = 0;
  while ((m = JSON_TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <span key={k++} className={m[2] ? 'tok-key' : 'tok-str'}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else if (m[3] !== undefined) {
      out.push(
        <span key={k++} className="tok-bool">
          {m[3]}
        </span>,
      );
    } else if (m[4] !== undefined) {
      out.push(
        <span key={k++} className="tok-num">
          {m[4]}
        </span>,
      );
    } else if (m[5] !== undefined) {
      out.push(
        <span key={k++} className="tok-punc">
          {m[5]}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function CodeSurface({ text, label, emptyHint }) {
  return (
    <pre className="code-surface" tabIndex={0} aria-label={label}>
      <code>{text ? highlightJson(text) : <span className="code-empty">{emptyHint || 'Nothing to show yet.'}</span>}</code>
    </pre>
  );
}

/* ------------------------------ Empty state ------------------------------ */

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  );
}

/* --------------------------------- Gauge --------------------------------- */

export function Gauge({ ratio, failures, size = 64 }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, ratio)) * c;
  return (
    <div className="gauge" style={{ width: size, height: size }} role="img" aria-label={`Pass coverage ${Math.round(ratio * 100)} percent${failures ? `, ${failures} failures` : ''}`}>
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx="32" cy="32" r={r} className="gauge-track" strokeWidth="7" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={r}
          strokeWidth="7"
          fill="none"
          className="gauge-fill"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          style={{ stroke: failures > 0 ? 'var(--warning)' : 'var(--success)' }}
        />
      </svg>
      <span className="gauge-label">{Math.round(ratio * 100)}%</span>
    </div>
  );
}

/* ------------------------------ Status chip ------------------------------ */

export function StatusChip({ status }) {
  const dur = useDur();
  const labels = {
    pending: 'Pending',
    running: 'Running',
    retrying: 'Retrying',
    failed: 'Failed',
    complete: 'Complete',
    paused: 'Paused',
    done: 'Done',
  };
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        className={`status-chip chip-${status}`}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: dur.fast }}
      >
        {labels[status] || status}
      </motion.span>
    </AnimatePresence>
  );
}

/* -------------------------------- Select --------------------------------- */

export function Select({ id, label, value, onChange, options, className = '' }) {
  return (
    <div className={`select-wrap ${className}`}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <select id={id} className="select tap" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="select-caret" aria-hidden="true" />
      </div>
    </div>
  );
}

/* -------------------------------- Toasts --------------------------------- */

export function Toasts({ toasts }) {
  const dur = useDur();
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast toast-${t.tone}`}
            initial={{ opacity: 0, x: 70 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: dur.base }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- Type badge -------------------------------- */

const TYPE_SHORT = { string: 'str', number: 'num', boolean: 'bool', object: 'obj', array: 'arr' };

export function TypeBadge({ type }) {
  const dur = useDur();
  return (
    <motion.span
      key={type}
      className="type-badge"
      style={{ color: `var(--type-${type})`, borderColor: `var(--type-${type})` }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 24, duration: dur.fast }}
      aria-label={`type ${type}`}
    >
      {TYPE_SHORT[type] || type}
    </motion.span>
  );
}
