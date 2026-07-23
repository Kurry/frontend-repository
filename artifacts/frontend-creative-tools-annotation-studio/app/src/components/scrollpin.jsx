import { useEffect } from 'react';

// While a pointer gesture is in flight, focusing the pressed control must not
// scroll its containers: a focus-triggered scroll between mousedown and
// mouseup moves the target out from under the cursor and the click never
// activates it. Pin every scrollable ancestor's scrollTop for the duration of
// the gesture. Keyboard focus (Tab) is untouched — the pin only arms after a
// pointerdown.
export function useScrollPinDuringPointer() {
  useEffect(() => {
    const onPointerDown = (event) => {
      const locks = [];
      let node = event.target?.parentElement;
      while (node && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
          locks.push({ node, top: node.scrollTop });
        }
        node = node.parentElement;
      }
      const doc = document.scrollingElement;
      if (doc) locks.push({ node: doc, top: doc.scrollTop });
      if (!locks.length) return;

      const restore = () => {
        for (const lock of locks) {
          if (lock.node.scrollTop !== lock.top) lock.node.scrollTop = lock.top;
        }
      };
      const onFocusIn = () => {
        restore();
        window.setTimeout(restore, 0);
      };
      const release = () => {
        window.removeEventListener('focusin', onFocusIn);
        window.removeEventListener('pointerup', release);
        window.removeEventListener('pointercancel', release);
        window.clearTimeout(timer);
      };
      window.addEventListener('focusin', onFocusIn);
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
      const timer = window.setTimeout(release, 900);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);
}
