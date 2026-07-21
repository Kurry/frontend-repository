import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import { signal } from '@preact/signals';
import autoAnimate from '@formkit/auto-animate';

export const reducedMotion = signal(
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
);

if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = () => {
    reducedMotion.value = mq.matches;
  };
  mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active, { onEscape, initialFocus } = {}) {
  const nodeRef = useRef(null);
  const prevFocus = useRef(null);
  const opts = useRef({ onEscape, initialFocus });
  opts.current = { onEscape, initialFocus };

  const activate = (node) => {
    if (!node) return;
    prevFocus.current = document.activeElement;
    const focusInitial = () => {
      const init = opts.current.initialFocus;
      if (typeof init === 'function') {
        const el = init(node);
        if (el && el.focus) {
          el.focus({ preventScroll: true });
          if (document.activeElement === el) return;
        }
      }
      const first = node.querySelector(FOCUSABLE);
      if (first) first.focus({ preventScroll: true });
      else node.focus({ preventScroll: true });
    };
    focusInitial();
    const raf = requestAnimationFrame(focusInitial);
    const t = setTimeout(focusInitial, 40);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (opts.current.onEscape) opts.current.onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!node.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    node.__ldTrap = { raf, t, onKeyDown };
  };

  const deactivate = (node) => {
    const tr = node && node.__ldTrap;
    if (tr) {
      cancelAnimationFrame(tr.raf);
      clearTimeout(tr.t);
      window.removeEventListener('keydown', tr.onKeyDown, true);
      delete node.__ldTrap;
    }
    const pf = prevFocus.current;
    if (pf && pf.focus && document.body.contains(pf)) pf.focus();
  };

  // Keep nodeRef in sync with active; activate/deactivate as the overlay toggles.
  const setRef = (el) => {
    const prev = nodeRef.current;
    if (prev && prev !== el) deactivate(prev);
    nodeRef.current = el;
    if (el && active) activate(el);
  };

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;
    if (active && !node.__ldTrap) activate(node);
    if (!active && node.__ldTrap) deactivate(node);
    return undefined;
  }, [active]);

  useEffect(
    () => () => {
      if (nodeRef.current) deactivate(nodeRef.current);
    },
    [],
  );

  return setRef;
}

export function useGlobalShortcuts({ onUndo, onRedo, onExport, onHelp }) {
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo && onUndo();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onRedo && onRedo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo && onRedo();
      } else if (mod && e.key.toLowerCase() === 'e') {
        if (typing) return;
        e.preventDefault();
        onExport && onExport();
      } else if (!mod && e.key === '?' && !typing) {
        onHelp && onHelp();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function useAutoAnimate() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const cleanup = autoAnimate(ref.current, { duration: reducedMotion.value ? 0 : 260, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    return cleanup;
  }, []);
  return ref;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useRovingPhase() {
  const [, setTick] = useState(0);
  return useCallback(() => setTick((t) => t + 1), []);
}
