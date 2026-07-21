import { createEffect, on, onCleanup, Show, children } from "solid-js";
import { Portal } from "solid-js/web";

// Custom dialog primitive: traps focus while open, closes on Escape, and ALWAYS
// returns focus to the element that opened it (the originating control).
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Modal(props) {
  let contentRef;
  let saved = null;
  let firstOpen = true;

  const focusables = () =>
    contentRef ? Array.from(contentRef.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement) : [];

  createEffect(
    on(
      () => props.open,
      (open) => {
        if (open) {
          saved = document.activeElement;
          if (firstOpen) {
            firstOpen = false;
            requestAnimationFrame(() => {
              if (props.initialFocus && props.initialFocus()) {
                const el = props.initialFocus();
                if (el && el.focus) el.focus();
              } else {
                const f = focusables();
                if (f.length) f[0].focus();
                else if (contentRef) contentRef.focus();
              }
            });
          }
        } else {
          firstOpen = true;
          if (saved && saved !== document.body && typeof saved.focus === "function") {
            try {
              saved.focus();
            } catch {
              /* ignore */
            }
          }
          saved = null;
        }
      },
    ),
  );

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      props.onClose && props.onClose();
      return;
    }
    if (e.key === "Tab") {
      const f = focusables();
      if (!f.length) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    props.onKeyDown && props.onKeyDown(e);
  }

  function onOverlayClick(e) {
    if (e.target === e.currentTarget && props.closeOnOverlay !== false) {
      props.onClose && props.onClose();
    }
  }

  return (
    <Show when={props.open || props.closing}>
      <Portal mount={props.mount}>
        <div
          class="fixed inset-0 z-[80] flex anim-overlay"
          classList={{
            "items-center justify-center p-4": props.placement !== "right",
            "items-stretch justify-end": props.placement === "right",
          }}
          style={{ background: props.placement === "right" ? "rgba(20,14,8,0.34)" : "rgba(20,14,8,0.42)" }}
          onMouseDown={onOverlayClick}
        >
          <div
            ref={contentRef}
            role={props.role || "dialog"}
            aria-modal="true"
            aria-label={props.label}
            aria-labelledby={props.labelledBy}
            tabindex="-1"
            onKeyDown={onKeyDown}
            class={props.contentClass || "bg-paper rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] overflow-auto thin-scroll"}
            classList={{
              "anim-detail-in": !props.closing && props.placement !== "right",
              "anim-detail-out": props.closing && props.placement !== "right",
              "anim-drawer-in": !props.closing && props.placement === "right",
              "anim-drawer-out": props.closing && props.placement === "right",
              "h-full": props.placement === "right",
            }}
          >
            {props.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
