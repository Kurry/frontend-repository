import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

// A single document-level keydown handler manages a stack of focus-trap scopes.
// The topmost *active* scope with a container owns Tab cycling; the topmost
// active scope with an onEscape owns Escape. This lets inline (modeless) forms
// and modal dialogs coexist — the most recently opened surface wins — while a
// Tab-only trap leaves the mouse free to drive interleaved flows.

const stack = [];
let installed = false;

function focusables(el) {
  if (!el) return [];
  const sel = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
  return Array.from(el.querySelectorAll(sel)).filter(n => !n.disabled && n.offsetParent !== null);
}

function topActive() {
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i].active) return stack[i];
  return null;
}

function onKey(e) {
  const top = topActive();
  if (!top) return;
  if (e.key === 'Escape') {
    if (typeof top.onEscape === 'function') {
      e.preventDefault();
      e.stopPropagation();
      top.onEscape();
    }
    return;
  }
  if (e.key !== 'Tab') return;
  const el = top.containerRef && top.containerRef.current;
  if (!el) return;
  const list = focusables(el);
  if (list.length === 0) { e.preventDefault(); return; }
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  if (!el.contains(active)) { e.preventDefault(); first.focus(); return; }
  if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
}

function install() {
  if (installed || typeof document === 'undefined') return;
  document.addEventListener('keydown', onKey, true);
  installed = true;
}

// Props: active (bool), containerRef, onEscape. Pushes itself while active.
export function TrapScope({ active, containerRef, onEscape }) {
  useEffect(() => {
    const entry = { active: !!active, containerRef, onEscape };
    if (active) {
      install();
      stack.push(entry);
      return () => {
        const i = stack.indexOf(entry);
        if (i >= 0) stack.splice(i, 1);
      };
    }
    return undefined;
  }, [active, containerRef, onEscape]);

  useEffect(() => {
    const entry = stack.find(e => e.containerRef === containerRef);
    if (entry) { entry.active = !!active; entry.onEscape = onEscape; }
  }, [active, containerRef, onEscape]);

  return null;
}

// Capture the element that had focus so it can be restored when a surface closes.
export function useRestoreFocus(open) {
  const openerRef = useRef(null);
  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement;
    } else if (openerRef.current && typeof openerRef.current.focus === 'function') {
      try { openerRef.current.focus(); } catch { /* ignore */ }
      openerRef.current = null;
    }
  }, [open]);
}

export function firstFocusable(el) {
  const list = focusables(el);
  return list[0] || null;
}
