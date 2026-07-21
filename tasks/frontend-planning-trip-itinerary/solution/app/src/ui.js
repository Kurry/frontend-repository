// ui.js — toasts, accessible modal/drawer overlays (focus trap + Escape),
// and the polite live-region announcer. All frontend-only.
import { h, icon } from "./core.js";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function announce(msg) {
  const el = document.getElementById("sr-live");
  if (el) { el.textContent = ""; requestAnimationFrame(() => { el.textContent = msg; }); }
}

let toastSeq = 0;
export function toast(title, desc = "", kind = "info", opts = {}) {
  if (typeof opts === "number") opts = { ms: opts };
  const ms = opts.ms == null ? 2600 : opts.ms;
  const root = document.getElementById("toast-root");
  if (!root) return;
  const id = ++toastSeq;
  const ico = kind === "ok" ? icon.check : kind === "warn" ? icon.alert : kind === "err" ? icon.alert : icon.info;
  const actionBtn = opts.action
    ? h("button", { class: "btn sm", type: "button", style: { marginTop: "7px", background: "var(--accent-soft)", color: "var(--accent)", borderColor: "transparent" }, onclick: () => { try { opts.action.onClick(); } catch (e) {} dismiss(); } }, opts.action.label)
    : null;
  const body = h("div", { class: "body" }, h("b", {}, title), desc ? h("p", {}, desc) : null, actionBtn);
  const closeBtn = h("button", { class: "x", "aria-label": "Dismiss notification", type: "button", html: icon.x });
  const node = h("div", { class: `toast ${kind}`, role: "status" }, h("span", { html: ico, "aria-hidden": "true" }), body, closeBtn);
  let gone = false;
  const dismiss = () => {
    if (gone) return; gone = true;
    node.classList.add("leaving");
    setTimeout(() => node.remove(), 220);
  };
  closeBtn.addEventListener("click", dismiss);
  root.appendChild(node);
  if (ms > 0) setTimeout(dismiss, ms);
  // also push to the screen-reader live region so non-toast announcements work too
  announce(`${title}${desc ? ". " + desc : ""}`);
  return { dismiss, id };
}

function trap(container, onClose) {
  const prev = document.activeElement;
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    if (e.key !== "Tab") return;
    const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener("keydown", onKey, true);
  requestAnimationFrame(() => {
    const f = container.querySelector(FOCUSABLE);
    if (f) f.focus(); else container.setAttribute("tabindex", "-1"), container.focus();
  });
  return () => {
    document.removeEventListener("keydown", onKey, true);
    if (prev && prev.focus) try { prev.focus(); } catch (e) {}
  };
}

// Generic overlay: pass the inner element; we wrap it in a scrim + manage focus.
export function openOverlay(inner, { onClose, labelledBy, role = "dialog" } = {}) {
  const root = document.getElementById("modal-root");
  const scrim = h("div", { class: "scrim" });
  scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) close(); });
  inner.setAttribute("role", role);
  if (labelledBy) inner.setAttribute("aria-labelledby", labelledBy);
  inner.setAttribute("aria-modal", "true");
  scrim.appendChild(inner);
  root.appendChild(scrim);
  const restore = trap(inner, close);
  let closed = false;
  function close() {
    if (closed) return; closed = true;
    restore();
    scrim.remove();
    onClose && onClose();
  }
  return { close, el: inner, scrim };
}

export function modal({ title, body, foot, wide = false, id = "dlg-title" }) {
  const titleEl = h("h3", { id, class: "display" }, title);
  const head = h("div", { class: "mhead" }, titleEl);
  const mbody = h("div", { class: "mbody" }, body);
  const node = h("div", { class: "modal" + (wide ? " wide" : "") }, head, mbody);
  if (foot) node.appendChild(h("div", { class: "mfoot" }, foot));
  let handle;
  const closeBtn = h("button", { class: "btn ghost icon x", type: "button", "aria-label": "Close dialog", html: icon.x, onclick: () => handle.close() });
  head.appendChild(closeBtn);
  handle = openOverlay(node, { labelledBy: id });
  return handle;
}

export function confirm({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    const msg = typeof message === "string" ? h("p", { style: { margin: 0, fontSize: "13.5px", color: "var(--ink-2)" } }, message) : message;
    let resolved = false;
    const finish = (v) => { if (resolved) return; resolved = true; handle.close(); resolve(v); };
    const ok = h("button", { class: "btn " + (danger ? "danger" : "primary"), type: "button", onclick: () => finish(true) }, confirmLabel);
    const no = h("button", { class: "btn", type: "button", onclick: () => finish(false) }, cancelLabel);
    const handle = modal({ title, body: msg, foot: [no, ok] });
  });
}

export function drawer({ title, body, id = "drw-title" }) {
  const root = document.getElementById("modal-root");
  const scrim = h("div", { class: "drawer-scrim" });
  const titleEl = h("h3", { id, class: "display" }, title);
  const head = h("div", { class: "mhead" }, titleEl,
    h("button", { class: "btn ghost icon", type: "button", "aria-label": "Close panel", html: icon.x, onclick: close }));
  const node = h("div", { class: "drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": id }, head, h("div", { class: "mbody" }, body));
  scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) close(); });
  root.appendChild(scrim);
  root.appendChild(node);
  requestAnimationFrame(() => node.classList.add("open"));
  const restore = trap(node, close);
  let closed = false;
  function close() {
    if (closed) return; closed = true;
    node.classList.remove("open");
    restore();
    setTimeout(() => { scrim.remove(); node.remove(); }, 220);
  }
  return { close, el: node };
}
