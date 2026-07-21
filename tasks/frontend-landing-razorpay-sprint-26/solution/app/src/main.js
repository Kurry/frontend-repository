import { z } from "zod";
/**
 * Novapay Sprint 26 — page runtime.
 * Loader lifecycle, GSAP/ScrollTrigger motion, scroll-spy nav, mobile menu,
 * lazy Rive hydration, local VP9 video modal, session chrome (shortlist /
 * compare / theme filter / search / watch log / command palette / sprint
 * launch brief) with focus management, and the live Sprint-brief preview.
 * In-memory state only — a reload returns to the seeded empty baseline.
 */
import "./style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as rive from "@rive-app/canvas";
import riveWasmUrl from "@rive-app/canvas/rive.wasm?url";
import { initHero } from "./hero.js";
import { initWebmcp } from "./webmcp.js";

gsap.registerPlugin(ScrollTrigger);
rive.RuntimeLoader.setWasmUrl(riveWasmUrl);

const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A reload always restarts the sequence from the top.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const announce = (msg) => {
  const live = $("#live-status");
  if (live) { live.textContent = ""; requestAnimationFrame(() => { live.textContent = msg; }); }
};

/* ---- focus trap helper -------------------------------------------------- */
function makeTrap(container) {
  const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),video[controls]';
  function onKey(e) {
    if (e.key !== "Tab") return;
    const list = $$(sel, container).filter((el) => el.offsetParent !== null || el.getClientRects().length);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}

/* ------------------------------------------------------------------ *
 * Site loader                                                          *
 * ------------------------------------------------------------------ */
function initLoader() {
  document.body.style.visibility = "visible";
  const loader = $("#site-loader");
  const bar = $("#loader-bar");
  let exited = false, revealed = false;
  const reveal = () => { if (revealed) return; revealed = true; window.dispatchEvent(new CustomEvent("loaderExited")); };

  if (RM) {
    if (bar) bar.style.width = "100%";
    requestAnimationFrame(() => {
      if (loader) { loader.classList.add("rm-exit"); loader.style.pointerEvents = "none"; loader.remove(); }
      reveal();
    });
    return;
  }

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";

  let glbReady = false, minReady = false, progress = 0, raf = null;
  const animateBar = (target, speed) => {
    cancelAnimationFrame(raf);
    (function step() {
      progress += (target - progress) * speed;
      if (Math.abs(target - progress) < 0.3) progress = target;
      if (bar) bar.style.width = progress.toFixed(1) + "%";
      if (progress < target) raf = requestAnimationFrame(step);
    })();
  };
  animateBar(70, 0.04);

  function exit() {
    if (exited) return; exited = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      window.scrollTo(0, 0);
      loader.classList.add("is-exiting");
      loader.style.pointerEvents = "none";
      loader.addEventListener("transitionend", function onEnd(e) {
        if (e.propertyName !== "transform") return;
        loader.removeEventListener("transitionend", onEnd);
        loader.remove(); reveal();
      });
      setTimeout(() => { if (loader.parentNode) loader.remove(); reveal(); }, 1200);
    }));
  }
  function tryExit() { if (glbReady && minReady) { animateBar(100, 0.12); setTimeout(exit, 400); } }
  setTimeout(() => { minReady = true; tryExit(); }, 3000);
  const safety = setTimeout(() => { glbReady = minReady = true; exit(); }, 12000);
  window.addEventListener("glbLoaded", () => { clearTimeout(safety); setTimeout(() => { glbReady = true; tryExit(); }, 400); });
}

/* ------------------------------------------------------------------ *
 * Pinned hero logo + scroll pill                                       *
 * ------------------------------------------------------------------ */
function initHeroChrome() {
  const logo = $("#threejs-logo"), nudge = $("#scroll-nudge");
  let loaderDone = false, stageActive = false;
  const segLogo = document.querySelector(".seg-logo");
  const sync = () => {
    const on = loaderDone && stageActive;
    if (logo) logo.style.opacity = on ? "1" : "0";
    if (nudge) nudge.style.opacity = on ? "1" : "0";
    if (segLogo) segLogo.style.opacity = on ? "0" : "1"; // floating lockup covers the corner over the hero
  };
  window.addEventListener("loaderExited", () => { loaderDone = true; sync(); });
  window.addEventListener("threeJsCanvas", (e) => { stageActive = !!(e.detail && e.detail.active); sync(); });
}

/* ------------------------------------------------------------------ *
 * Hero fold fade-ins                                                   *
 * ------------------------------------------------------------------ */
function initHeroFade() {
  const els = $$("[data-hero-fade]");
  if (RM) { gsap.set(els, { opacity: 1, y: 0 }); return; }
  gsap.set(els, { opacity: 0, y: 30 });
  window.addEventListener("threeJsCanvas", (e) => {
    if (e.detail && e.detail.active) return;
    setTimeout(() => gsap.to(els, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 }), 250);
  });
}

/* ------------------------------------------------------------------ *
 * Word reveal headings (accessible: phrase on container, words hidden) *
 * ------------------------------------------------------------------ */
function initWordReveal() {
  const els = $$("[data-word-reveal]");
  els.forEach((el) => {
    const full = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", full);
    const words = full.split(" ").filter(Boolean);
    el.innerHTML = words
      .map((w) => '<span class="wr-outer" aria-hidden="true"><span class="wr-word">' + w + "</span></span>")
      .join(" ");
    const inner = $$(".wr-word", el);
    el._wrWords = inner; el._wrTween = null; el._wrShown = false;
    if (RM) { gsap.set(inner, { opacity: 1 }); return; }
    gsap.set(inner, { opacity: 0.12 });
  });
  if (RM) return;
  let heroRevealed = false;
  window.addEventListener("threeJsCanvas", (e) => { if (e.detail && !e.detail.active) heroRevealed = true; });
  const enter = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      if (!el._wrWords || !entry.isIntersecting) continue;
      if (el.closest(".hero-section") && !heroRevealed) continue;
      el._wrShown = true;
      if (el._wrTween) el._wrTween.kill();
      el._wrTween = gsap.to(el._wrWords, { opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.07, overwrite: true });
    }
  }, { rootMargin: "-20% 0px 0px 0px", threshold: 0 });
  const reset = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      if (!el._wrWords || entry.isIntersecting || !el._wrShown || el.closest(".hero-section")) continue;
      el._wrShown = false;
      if (el._wrTween) el._wrTween.kill();
      el._wrTween = gsap.to(el._wrWords, { opacity: 0.12, duration: 0.4, ease: "power2.in", overwrite: true });
    }
  }, { threshold: 0 });
  els.forEach((el) => { enter.observe(el); reset.observe(el); });
}

/* ------------------------------------------------------------------ *
 * Segment nav: scroll-spy (#305eff) + click flash (#0039ff)            *
 * ------------------------------------------------------------------ */
function initNav() {
  const cells = $$("[data-section]");
  const spyCells = cells.slice(1);
  const navbar = $(".navigation-wrapper");
  const navH = navbar ? navbar.offsetHeight : 0;
  let clickLock = false, clickTimer = null;

  function spy() {
    if (clickLock) return;
    let active = null;
    for (const cell of spyCells) {
      const section = document.getElementById(cell.getAttribute("data-section"));
      if (!section) continue;
      if (section.getBoundingClientRect().top <= navH + 12) active = cell;
    }
    cells.forEach((c) => { c.classList.remove("is-active", "is-clicked"); c.removeAttribute("aria-current"); });
    if (active) { active.classList.add("is-active"); active.setAttribute("aria-current", "true"); }
  }
  const logoCell = cells[0];
  if (logoCell) logoCell.addEventListener("click", (e) => {
    e.preventDefault();
    cells.forEach((c) => { c.classList.remove("is-active", "is-clicked"); c.removeAttribute("aria-current"); });
    window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
    try { history.replaceState(null, "", location.pathname + location.search); } catch {}
  });
  spyCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      cells.forEach((c) => { c.classList.remove("is-active", "is-clicked"); c.removeAttribute("aria-current"); });
      cell.classList.add("is-clicked");
      cell.setAttribute("aria-current", "true");
      clickLock = true;
      if (clickTimer) clearTimeout(clickTimer);
      const settle = () => {
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          clickLock = false; cell.classList.remove("is-clicked");
          window.removeEventListener("scroll", settle); spy();
        }, 150);
      };
      window.addEventListener("scroll", settle, { passive: true });
      clickTimer = setTimeout(() => {
        clickLock = false; cell.classList.remove("is-clicked");
        window.removeEventListener("scroll", settle); spy();
      }, 600);
    });
  });
  window.addEventListener("scroll", spy, { passive: true });
  spy();
}

/* ------------------------------------------------------------------ *
 * Mobile menu                                                          *
 * ------------------------------------------------------------------ */
function initMobileMenu() {
  const toggle = $("#menu-toggle"), menu = $("#mobile-menu");
  if (!toggle || !menu) return;
  let open = false;
  const set = (next) => {
    open = next;
    menu.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => set(!open));
  $$("#mobile-menu a").forEach((a) => a.addEventListener("click", () => open && set(false)));
}

/* ------------------------------------------------------------------ *
 * Video modal (local VP9 WebM + poster) with focus management          *
 * ------------------------------------------------------------------ */
function initVideoModal() {
  const modal = $(".video-modal"), box = $(".video-container"), video = $("#dynamic-video"), close = $(".video-close-button");
  if (!modal || !box || !video) return;
  let lastTrigger = null, releaseTrap = null;

  function open(trigger) {
    lastTrigger = trigger || document.activeElement;
    const id = trigger ? trigger.getAttribute("data-video") : null;
    const poster = trigger ? trigger.getAttribute("data-poster") : null;
    if (poster) video.poster = poster;
    if (id) {
      video.src = "/assets/videos/" + id + ".webm";
      try { video.load(); } catch {}
      const p = video.play(); if (p && p.catch) p.catch(() => {});
    }
    const exec = trigger && trigger.getAttribute("data-exec");
    if (exec && window.appMutations) window.appMutations.watchExecutive(exec);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => { if (close) close.focus(); });
    if (!releaseTrap) releaseTrap = makeTrap(box);
  }
  function shut() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    try { video.pause(); } catch {}
    video.removeAttribute("src"); video.removeAttribute("poster");
    try { video.load(); } catch {}
    document.body.style.overflow = "";
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    lastTrigger = null;
  }
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-video]");
    if (trigger) { e.preventDefault(); open(trigger); }
  });
  $$(".leader__media").forEach((media) => {
    const play = $("[data-video]", media);
    if (!play) return;
    media.style.cursor = "pointer";
    media.addEventListener("click", (e) => { if (e.target.closest("[data-video]")) return; open(play); });
  });
  if (close) close.addEventListener("click", shut);
  modal.addEventListener("mousedown", (e) => { if (e.target === modal) shut(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) shut(); });
}

/* ------------------------------------------------------------------ *
 * Stacked-section reveal + parallax backgrounds                        *
 * ------------------------------------------------------------------ */
function initStackMotion() {
  const stacks = $$(".stack-section");
  // Stacked overlap reveal is driven by the negative stack-overlap margin +
  // z-index ordering; background parallax layers scrub below. No per-section transform.
  $$(".parallax-bg").forEach((section) => {
    const src = section.getAttribute("data-bg");
    if (!src) return;
    const layer = document.createElement("div");
    layer.className = "parallax-layer";
    layer.style.backgroundImage = `url("${src}")`;
    section.insertBefore(layer, section.firstChild);
    if (!RM) {
      gsap.to(layer, { y: () => -section.offsetHeight * 0.3, ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true } });
    }
  });
}

/* ------------------------------------------------------------------ *
 * Footer gradient fade                                                 *
 * ------------------------------------------------------------------ */
function initFooterFade() {
  const footer = $("[data-gradient-fade]");
  if (!footer) return;
  const overlay = document.createElement("div");
  overlay.className = "footer__gradient";
  footer.insertBefore(overlay, footer.firstChild);
  if (RM) { overlay.style.opacity = "1"; return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      gsap.to(overlay, { opacity: entry.isIntersecting ? 1 : 0,
        duration: entry.isIntersecting ? 2 : 0.8, ease: entry.isIntersecting ? "power3.out" : "power3.in" });
    }
  }, { threshold: 0.25 });
  io.observe(footer);
}

/* ------------------------------------------------------------------ *
 * Lazy Rive hydration                                                  *
 * ------------------------------------------------------------------ */
function initRiveEmbeds() {
  const margin = window.innerWidth < 768 ? 1500 : 600;
  const instances = new Map();
  function hydrate(host) {
    if (instances.has(host) || getComputedStyle(host).display === "none") return;
    const src = host.getAttribute("data-rive");
    if (!src) return;
    let w = host.offsetWidth, h = host.offsetHeight;
    if (w <= 0 || h <= 0) { const r = host.getBoundingClientRect(); w = Math.round(r.width); h = Math.round(r.height); }
    if (w <= 0 || h <= 0) { setTimeout(() => hydrate(host), 400); return; }
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(Math.min(w, window.innerWidth * 1.5) * dpr);
    canvas.height = Math.round(Math.min(h, window.innerHeight * 1.5) * dpr);
    host.appendChild(canvas);
    const config = { src, canvas, autoplay: !RM,
      layout: new rive.Layout({ fit: rive.Fit.Contain, alignment: rive.Alignment.Center }),
      onLoad: () => { try { instance.resizeDrawingSurfaceToCanvas(); } catch {} } };
    const sm = host.getAttribute("data-rive-sm"), artboard = host.getAttribute("data-rive-artboard");
    if (sm) config.stateMachines = sm;
    if (artboard) config.artboard = artboard;
    let instance;
    try { instance = new rive.Rive(config); instances.set(host, instance); } catch {}
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) { if (entry.isIntersecting) { hydrate(entry.target); io.unobserve(entry.target); } }
  }, { rootMargin: `${margin}px 0px ${margin}px 0px` });
  $$("[data-rive]").forEach((h) => io.observe(h));
}

/* ================================================================== *
 * Session state + UI controllers                                       *
 * ================================================================== */
const EXECUTIVES = ["Arjun Mehta", "Rohan Iyer", "Nikhil Rao", "Kabir Menon", "Dev Sharma", "Meera Nair"];
const THEMES = ["All", "Agentic Stack", "International Payments", "Payment Gateway", "D2C", "Marketing", "Business Banking"];
let catalogFeatures = [];

window.appState = { shortlist: [], compare: [], themeFilter: "All", searchQuery: "", watchLog: [], undoStack: [], redoStack: [] };

function refreshDock() {
  const ds = $("#dock-shortlist-count"), dc = $("#dock-compare-count");
  if (ds) ds.textContent = String(window.appState.shortlist.length);
  if (dc) dc.textContent = String(window.appState.compare.length);
}
function updateShortlistUI() {
  const list = $("#shortlist-items"), count = $("#shortlist-count");
  if (count) count.textContent = String(window.appState.shortlist.length);
  if (list) {
    if (!window.appState.shortlist.length) list.innerHTML = '<li class="empty-msg">No launches pinned yet</li>';
    else { list.innerHTML = ""; window.appState.shortlist.forEach((n) => { const li = document.createElement("li"); li.textContent = n; list.appendChild(li); }); }
  }
  $$(".shortlist-item").forEach((card) => {
    const name = card.getAttribute("data-feature"), pinned = window.appState.shortlist.includes(name);
    const pin = $(".btn-pin", card), unpin = $(".btn-unpin", card);
    if (pin) pin.style.display = pinned ? "none" : "inline-flex";
    if (unpin) unpin.style.display = pinned ? "inline-flex" : "none";
    card.setAttribute("data-pinned", pinned ? "true" : "false");
  });
  refreshDock();
  if (window.updateBriefPreview) window.updateBriefPreview();
}
function updateCompareUI() {
  const list = $("#compare-items"), count = $("#compare-count");
  if (count) count.textContent = String(window.appState.compare.length);
  if (list) { list.innerHTML = ""; window.appState.compare.forEach((n) => { const li = document.createElement("li"); li.textContent = n; list.appendChild(li); }); }
  refreshDock();
  if (window.updateBriefPreview) window.updateBriefPreview();
}
function updateUndoRedoButtons() {
  const u = $("#btn-undo"), r = $("#btn-redo");
  if (u) u.disabled = window.appState.undoStack.length === 0;
  if (r) r.disabled = window.appState.redoStack.length === 0;
}
function applyFilters() {
  const theme = window.appState.themeFilter, q = window.appState.searchQuery.toLowerCase();
  $$(".shortlist-item").forEach((card) => {
    const themeMatch = theme === "All" || card.getAttribute("data-theme") === theme;
    const searchMatch = !q || (card.getAttribute("data-feature") || "").toLowerCase().includes(q);
    const host = card.classList.contains("feature-hero__caption") ? card.closest(".feature-hero") : card;
    if (host) host.style.display = themeMatch && searchMatch ? "" : "none";
  });
  if (window.updateBriefPreview) window.updateBriefPreview();
}

window.appMutations = {
  pinFeature(name, fromUndo = false) {
    if (window.appState.shortlist.includes(name)) return;
    if (!fromUndo) { window.appState.undoStack.push({ type: "pin", name }); window.appState.redoStack = []; updateUndoRedoButtons(); }
    window.appState.shortlist.push(name); updateShortlistUI();
  },
  unpinFeature(name, fromUndo = false) {
    const i = window.appState.shortlist.indexOf(name); if (i === -1) return;
    if (!fromUndo) { window.appState.undoStack.push({ type: "unpin", name, index: i }); window.appState.redoStack = []; updateUndoRedoButtons(); }
    window.appState.shortlist.splice(i, 1); updateShortlistUI();
  },
  addCompare(name) {
    if (window.appState.compare.includes(name)) return;
    if (window.appState.compare.length >= 3) {
      const msg = $("#compare-full-msg");
      if (msg) { msg.hidden = false; setTimeout(() => { msg.hidden = true; }, 3000); }
      announce("Compare is full, 3 of 3");
      openTray();
      return;
    }
    window.appState.compare.push(name); updateCompareUI();
  },
  setThemeFilter(theme) { window.appState.themeFilter = theme; applyFilters(); },
  setSearchQuery(q) { window.appState.searchQuery = q; applyFilters(); },
  watchExecutive(name) { if (name && !window.appState.watchLog.includes(name)) { window.appState.watchLog.push(name); if (window.updateBriefPreview) window.updateBriefPreview(); } },
};

/* ---- session tray (shortlist / compare / filters) --------------------- */
let trayOpen = false, trayOpener = null, trayTrap = null;
function openTray(opener) {
  const tray = $("#trays-ui"), toggle = $("#dock-toggle");
  if (!tray) return;
  trayOpener = opener || document.activeElement;
  tray.classList.add("is-open"); tray.setAttribute("aria-hidden", "false");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  trayOpen = true;
  const closeBtn = $("#tray-close");
  requestAnimationFrame(() => (closeBtn || tray).focus());
  if (!trayTrap) trayTrap = makeTrap(tray);
}
function closeTray() {
  const tray = $("#trays-ui"), toggle = $("#dock-toggle");
  if (!tray) return;
  tray.classList.remove("is-open"); tray.setAttribute("aria-hidden", "true");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
  trayOpen = false;
  if (trayTrap) { trayTrap(); trayTrap = null; }
  if (trayOpener && trayOpener.focus) trayOpener.focus();
  trayOpener = null;
}
window.openSessionTray = openTray;
window.closeSessionTray = closeTray;

/* ---- command palette -------------------------------------------------- */
let paletteOpen = false, paletteOpener = null, paletteTrap = null;
function openPalette() {
  const p = $("#command-palette"), search = $("#palette-search");
  if (!p) return;
  paletteOpener = document.activeElement;
  p.style.display = "flex"; void p.offsetWidth; p.style.opacity = "1";
  $("#command-palette-inner").style.transform = "translateY(0)";
  paletteOpen = true;
  if (search) { search.value = ""; search.focus(); }
  renderPaletteResults("");
  if (!paletteTrap) paletteTrap = makeTrap($("#command-palette-inner"));
}
function closePalette() {
  const p = $("#command-palette");
  if (!p) return;
  p.style.opacity = "0"; $("#command-palette-inner").style.transform = "translateY(-20px)";
  paletteOpen = false;
  if (paletteTrap) { paletteTrap(); paletteTrap = null; }
  setTimeout(() => { p.style.display = "none"; if (paletteOpener && paletteOpener.focus) paletteOpener.focus(); paletteOpener = null; }, 200);
}
const PALETTE_COMMANDS = [
  { kind: "Section", label: "Jump to Agentic Stack", action: "jump", target: "#agentic-stack" },
  { kind: "Section", label: "Jump to International Payments", action: "jump", target: "#international" },
  { kind: "Section", label: "Jump to Payment Gateway", action: "jump", target: "#payment-gateway" },
  { kind: "Section", label: "Jump to D2C", action: "jump", target: "#D2C" },
  { kind: "Section", label: "Jump to Marketing", action: "jump", target: "#Marketers" },
  { kind: "Section", label: "Jump to Business Banking", action: "jump", target: "#finance" },
  { kind: "Panel", label: "Open sprint brief", action: "open-brief", target: "" },
];
function renderPaletteResults(q) {
  const res = $("#palette-results"); if (!res) return;
  const matched = PALETTE_COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  res.innerHTML = matched.map((c) =>
    `<li data-action="${c.action}" data-target="${c.target}" tabindex="0"><span class="palette-kind">${c.kind}</span>${c.label}</li>`).join("");
}

/* ---- sprint launch brief --------------------------------------------- */
let briefOpen = false, briefOpener = null, briefTrap = null;
function openBrief(opener) {
  const panel = $("#brief-panel"); if (!panel) return;
  briefOpener = opener || document.activeElement;
  if (window.updateBriefPreview) window.updateBriefPreview();
  panel.style.display = "flex"; void panel.offsetWidth;
  panel.style.opacity = "1"; $("#brief-panel-inner").style.transform = "translateY(0)";
  const err = $("#import-error"); if (err) { err.textContent = ""; err.style.color = "#ff8a8a"; }
  briefOpen = true;
  const inner = $("#brief-panel-inner"); inner.setAttribute("tabindex", "-1");
  requestAnimationFrame(() => inner.focus());
  if (!briefTrap) briefTrap = makeTrap(inner);
}
function closeBrief() {
  const panel = $("#brief-panel"); if (!panel) return;
  panel.style.opacity = "0"; $("#brief-panel-inner").style.transform = "translateY(20px)";
  briefOpen = false;
  if (briefTrap) { briefTrap(); briefTrap = null; }
  setTimeout(() => { panel.style.display = "none"; if (briefOpener && briefOpener.focus) briefOpener.focus(); briefOpener = null; }, 200);
}

window.generateBriefData = function () {
  return {
    brand: "Novapay", event: "Sprint 26",
    shortlistedFeatures: window.appState.shortlist.slice(),
    compareFeatures: window.appState.compare.slice(),
    watchedExecutives: window.appState.watchLog.slice(),
    themeFilter: window.appState.themeFilter,
    searchQuery: window.appState.searchQuery,
    generatedAt: new Date().toISOString(),
  };
};
window.updateBriefPreview = function () {
  const data = window.generateBriefData();
  const jc = $("#json-content"); if (jc) jc.textContent = JSON.stringify(data, null, 2);
  const mc = $("#markdown-content");
  if (mc) {
    const li = (arr) => arr.length ? arr.map((x) => "- " + x).join("\n") : "- _(none)_";
    mc.innerHTML =
      `<h3>Shortlisted launches</h3><pre>${li(data.shortlistedFeatures)}</pre>` +
      `<h3>Compare set</h3><pre>${li(data.compareFeatures)}</pre>` +
      `<h3>Theme filter</h3><pre>${data.themeFilter}</pre>` +
      `<h3>Search</h3><pre>${data.searchQuery || "_(empty)_"}</pre>` +
      `<h3>Watched executives</h3><pre>${li(data.watchedExecutives)}</pre>`;
  }
  return data;
};

function briefSchema() {
  const unique = (values) => new Set(values).size === values.length;
  return z.object({
    brand: z.literal("Novapay"),
    event: z.literal("Sprint 26"),
    shortlistedFeatures: z.array(z.string().refine((v) => catalogFeatures.includes(v), "feature not in catalog")).refine(unique, "shortlistedFeatures must not contain duplicates"),
    compareFeatures: z.array(z.string().refine((v) => catalogFeatures.includes(v), "feature not in catalog")).max(3, "compareFeatures must have at most 3 entries").refine(unique, "compareFeatures must not contain duplicates"),
    watchedExecutives: z.array(z.string().refine((v) => EXECUTIVES.includes(v), "executive not in closed set")).refine(unique, "watchedExecutives must not contain duplicates"),
    themeFilter: z.enum(THEMES, { errorMap: () => ({ message: "themeFilter must be one of the closed enum values" }) }),
    searchQuery: z.string().max(120),
    generatedAt: z.string().refine((s) => s.endsWith("Z") && !Number.isNaN(Date.parse(s)), "generatedAt must be ISO-8601 UTC ending in Z"),
  }).strict();
}
function doImport(data) {
  const err = $("#import-error");
  try {
    const parsed = briefSchema().parse(data);
    window.appState.shortlist = parsed.shortlistedFeatures.slice();
    window.appState.compare = parsed.compareFeatures.slice();
    window.appState.themeFilter = parsed.themeFilter;
    window.appState.searchQuery = parsed.searchQuery;
    window.appState.watchLog = parsed.watchedExecutives.slice();
    window.appState.undoStack = [];
    window.appState.redoStack = [];
    const ts = $("#theme-filter"); if (ts) ts.value = window.appState.themeFilter;
    const si = $("#search-query"); if (si) si.value = window.appState.searchQuery;
    updateShortlistUI(); updateCompareUI(); updateUndoRedoButtons(); applyFilters();
    if (err) { err.style.color = "#a5d6a7"; err.textContent = "Import successful."; }
    announce("Sprint brief imported");
  } catch (e) {
    if (err) {
      err.style.color = "#ff8a8a";
      if (e instanceof z.ZodError) {
        const named = e.issues.map((i) => (i.path.length ? i.path.join(".") : "value") + ": " + i.message).join("; ");
        err.textContent = "Import error — " + named;
      } else err.textContent = "Import error: invalid JSON.";
    }
    announce("Import failed: contract violation");
  }
}
window.importBriefData = doImport;

/* ------------------------------------------------------------------ */
function wireChrome() {
  catalogFeatures = $$(".shortlist-item").map((c) => c.getAttribute("data-feature"));

  document.body.addEventListener("click", (e) => {
    const t = e.target;
    if (t.classList.contains("btn-pin")) window.appMutations.pinFeature(t.getAttribute("data-feature"));
    else if (t.classList.contains("btn-unpin")) window.appMutations.unpinFeature(t.getAttribute("data-feature"));
    else if (t.classList.contains("btn-compare")) window.appMutations.addCompare(t.getAttribute("data-feature"));
  });

  const themeSelect = $("#theme-filter");
  if (themeSelect) themeSelect.addEventListener("change", (e) => window.appMutations.setThemeFilter(e.target.value));
  const searchInput = $("#search-query");
  if (searchInput) searchInput.addEventListener("input", (e) => window.appMutations.setSearchQuery(e.target.value));

  const undoBtn = $("#btn-undo"), redoBtn = $("#btn-redo");
  if (undoBtn) undoBtn.addEventListener("click", () => {
    const a = window.appState.undoStack.pop(); if (!a) return;
    if (a.type === "pin") window.appMutations.unpinFeature(a.name, true);
    else { window.appState.shortlist.splice(a.index, 0, a.name); updateShortlistUI(); }
    window.appState.redoStack.push(a); updateUndoRedoButtons();
  });
  if (redoBtn) redoBtn.addEventListener("click", () => {
    const a = window.appState.redoStack.pop(); if (!a) return;
    if (a.type === "pin") { window.appState.shortlist.push(a.name); updateShortlistUI(); }
    else window.appMutations.unpinFeature(a.name, true);
    window.appState.undoStack.push(a); updateUndoRedoButtons();
  });

  const dockToggle = $("#dock-toggle"), trayClose = $("#tray-close");
  if (dockToggle) dockToggle.addEventListener("click", () => trayOpen ? closeTray() : openTray(dockToggle));
  if (trayClose) trayClose.addEventListener("click", closeTray);

  const btnExport = $("#btn-export-brief");
  if (btnExport) btnExport.addEventListener("click", () => openBrief(btnExport));
  const btnCloseBrief = $("#close-brief-panel");
  if (btnCloseBrief) btnCloseBrief.addEventListener("click", closeBrief);
  const briefPanel = $("#brief-panel");
  if (briefPanel) briefPanel.addEventListener("mousedown", (e) => { if (e.target === briefPanel) closeBrief(); });

  const tabJson = $("#tab-json"), tabMarkdown = $("#tab-markdown"), viewJson = $("#view-json"), viewMarkdown = $("#view-markdown");
  if (tabJson && tabMarkdown) {
    tabJson.addEventListener("click", () => { tabJson.classList.add("is-active"); tabMarkdown.classList.remove("is-active"); viewJson.style.display = "block"; viewMarkdown.style.display = "none"; });
    tabMarkdown.addEventListener("click", () => { tabMarkdown.classList.add("is-active"); tabJson.classList.remove("is-active"); viewMarkdown.style.display = "block"; viewJson.style.display = "none"; });
    tabJson.classList.add("is-active");
  }
  const btnDownload = $("#btn-download");
  if (btnDownload) btnDownload.addEventListener("click", () => {
    const data = window.updateBriefPreview();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "novapay-sprint-26-brief.json";
    a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const btnCopy = $("#btn-copy"), copyConfirm = $("#copy-confirm");
  if (btnCopy) btnCopy.addEventListener("click", async () => {
    const text = JSON.stringify(window.updateBriefPreview(), null, 2);
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); copied = document.execCommand("copy") === true; ta.remove();
      }
    } catch {}
    if (!copied) {
      const err = $("#import-error");
      if (err) { err.style.color = "#ff8a8a"; err.textContent = "Copy failed. Select the JSON preview and copy it manually."; }
      announce("Sprint brief copy failed");
      return;
    }
    const label = btnCopy.textContent;
    btnCopy.textContent = "Copied";
    if (copyConfirm) { copyConfirm.style.opacity = "1"; setTimeout(() => { copyConfirm.style.opacity = "0"; }, 1800); }
    announce("Sprint brief copied to clipboard");
    setTimeout(() => { btnCopy.textContent = label; }, 2000);
  });
  const btnImport = $("#btn-import"), fileImport = $("#file-import");
  if (btnImport && fileImport) {
    btnImport.addEventListener("click", () => fileImport.click());
    fileImport.addEventListener("change", (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { try { doImport(JSON.parse(ev.target.result)); } catch { const err = $("#import-error"); if (err) { err.style.color = "#ff8a8a"; err.textContent = "Import error: invalid JSON."; } announce("Import failed: invalid JSON"); } };
      reader.readAsText(file);
      e.target.value = "";
    });
  }
  const btnLoadSample = $("#btn-load-sample");
  if (btnLoadSample) btnLoadSample.addEventListener("click", () => doImport({
    brand: "Novapay", event: "Sprint 26",
    shortlistedFeatures: catalogFeatures.slice(0, 2),
    compareFeatures: catalogFeatures.slice(2, 4),
    watchedExecutives: ["Arjun Mehta"],
    themeFilter: "Agentic Stack", searchQuery: "", generatedAt: new Date().toISOString(),
  }));

  const cmdPalette = $("#command-palette"), paletteSearch = $("#palette-search"), paletteResults = $("#palette-results");
  if (cmdPalette) {
    if (paletteSearch) paletteSearch.addEventListener("input", (e) => renderPaletteResults(e.target.value.toLowerCase()));
    if (paletteResults) {
      paletteResults.addEventListener("click", (e) => {
        const li = e.target.closest("li"); if (!li) return;
        const action = li.getAttribute("data-action"), target = li.getAttribute("data-target");
        if (action === "jump") { const cell = $(`a.seg-cell[href="${target}"]`); if (cell) cell.click(); }
        else if (action === "open-brief") openBrief();
        closePalette();
      });
      paletteResults.addEventListener("keydown", (e) => { if (e.key === "Enter") { const li = e.target.closest("li"); if (li) li.click(); } });
    }
    cmdPalette.addEventListener("mousedown", (e) => { if (e.target === cmdPalette) closePalette(); });
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); paletteOpen ? closePalette() : openPalette(); return; }
    if (e.key === "Escape") {
      if (paletteOpen) closePalette();
      else if (briefOpen) closeBrief();
      else if (trayOpen) closeTray();
    }
  });

  refreshDock();
  updateUndoRedoButtons();
  if (window.updateBriefPreview) window.updateBriefPreview();

  const honorHash = () => {
    const h = location.hash;
    if (h && h !== "#Hero") { const cell = $(`a.seg-cell[href="${h}"]`); if (cell) cell.click(); }
  };
  if (location.hash && location.hash !== "#Hero") window.addEventListener("loaderExited", () => setTimeout(honorHash, 60), { once: true });
}

/* ------------------------------------------------------------------ */
function boot() {
  initLoader();
  initHeroChrome();
  initHeroFade();
  initWordReveal();
  initNav();
  initMobileMenu();
  initVideoModal();
  initStackMotion();
  initFooterFade();
  initRiveEmbeds();
  wireChrome();
  initHero();
  initWebmcp();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
