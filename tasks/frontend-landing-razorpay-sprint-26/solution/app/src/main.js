import { z } from "zod";
/**
 * Razorpay Sprint 26 — page runtime.
 * Loader lifecycle, GSAP/ScrollTrigger motion, scroll-spy nav, mobile menu,
 * lazy Rive hydration, and the local video modal. Original implementation
 * following the PRD's Motion & Microinteractions timings.
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

// A reload always restarts the hero sequence from the top.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

/* ------------------------------------------------------------------ *
 * Site loader                                                         *
 * ------------------------------------------------------------------ */
function initLoader() {
  document.body.style.visibility = "visible";
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";

  const loader = document.getElementById("site-loader");
  const bar = document.getElementById("loader-bar");
  let exited = false;
  let glbReady = false;
  let minReady = false;
  let progress = 0;
  let raf = null;
  let revealed = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    window.dispatchEvent(new CustomEvent("loaderExited"));
  };

  function animateBar(target, speed) {
    cancelAnimationFrame(raf);
    (function step() {
      progress += (target - progress) * speed;
      if (Math.abs(target - progress) < 0.3) progress = target;
      if (bar) bar.style.width = progress.toFixed(1) + "%";
      if (progress < target) raf = requestAnimationFrame(step);
    })();
  }
  animateBar(70, 0.04);

  function exit() {
    if (exited) return;
    exited = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
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
          loader.remove();
          reveal();
        });
        setTimeout(() => {
          if (loader.parentNode) loader.remove();
          reveal();
        }, 1200);
      })
    );
  }
  function tryExit() {
    if (glbReady && minReady) {
      animateBar(100, 0.12);
      setTimeout(exit, 400);
    }
  }
  setTimeout(() => {
    minReady = true;
    tryExit();
  }, 3000);
  const safety = setTimeout(() => {
    glbReady = minReady = true;
    exit();
  }, 12000);
  window.addEventListener("glbLoaded", () => {
    clearTimeout(safety);
    setTimeout(() => {
      glbReady = true;
      tryExit();
    }, 400);
  });
}

/* ------------------------------------------------------------------ *
 * Pinned hero logo + scroll pill                                      *
 * ------------------------------------------------------------------ */
function initHeroChrome() {
  const logo = document.getElementById("threejs-logo");
  const nudge = document.getElementById("scroll-nudge");
  let loaderDone = false;
  let stageActive = false;
  const sync = () => {
    const on = loaderDone && stageActive;
    if (logo) logo.style.opacity = on ? "1" : "0";
    if (nudge) nudge.style.opacity = on ? "1" : "0";
  };
  window.addEventListener("loaderExited", () => {
    loaderDone = true;
    sync();
  });
  window.addEventListener("threeJsCanvas", (e) => {
    stageActive = !!(e.detail && e.detail.active);
    sync();
  });
}

/* ------------------------------------------------------------------ *
 * Hero fold fade-ins                                                  *
 * ------------------------------------------------------------------ */
function initHeroFade() {
  const els = document.querySelectorAll("[data-hero-fade]");
  gsap.set(els, { opacity: 0, y: 30 });
  window.addEventListener("threeJsCanvas", (e) => {
    if (e.detail && e.detail.active) return;
    setTimeout(() => {
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.05,
      });
    }, 300);
  });
}

/* ------------------------------------------------------------------ *
 * Word reveal headings                                                *
 * ------------------------------------------------------------------ */
function initWordReveal() {
  const els = document.querySelectorAll("[data-word-reveal]");
  els.forEach((el) => {
    const words = el.innerText.split(/\s+/).filter(Boolean);
    el.innerHTML = words
      .map(
        (w) =>
          '<span style="display:inline-block;vertical-align:bottom;">' +
          `<span class="wr-word" style="display:inline-block;">${w}</span>` +
          "</span>"
      )
      .join(" ");
    el.style.opacity = "";
    const inner = el.querySelectorAll(".wr-word");
    gsap.set(inner, { opacity: 0.15 });
    el._wrWords = inner;
    el._wrTween = null;
    el._wrShown = false;
  });
  const enter = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (!el._wrWords || !entry.isIntersecting) continue;
        el._wrShown = true;
        if (el._wrTween) el._wrTween.kill();
        el._wrTween = gsap.to(el._wrWords, {
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.07,
          overwrite: true,
        });
      }
    },
    { rootMargin: "-25% 0px 0px 0px", threshold: 0 }
  );
  const reset = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (!el._wrWords || entry.isIntersecting || !el._wrShown) continue;
        el._wrShown = false;
        if (el._wrTween) el._wrTween.kill();
        el._wrTween = gsap.to(el._wrWords, {
          opacity: 0.15,
          duration: 0.4,
          ease: "power2.in",
          overwrite: true,
        });
      }
    },
    { threshold: 0 }
  );
  els.forEach((el) => {
    enter.observe(el);
    reset.observe(el);
  });
}

/* ------------------------------------------------------------------ *
 * Segment nav: scroll-spy (#305EFF) + click flash (#0039ff)           *
 * ------------------------------------------------------------------ */
function initNav() {
  const cells = Array.from(document.querySelectorAll("[data-section]"));
  const spyCells = cells.slice(1); // first cell is the logo link
  const navbar = document.querySelector(".navigation-wrapper");
  const navH = navbar ? navbar.offsetHeight : 0;
  let clickLock = false;
  let clickTimer = null;

  function spy() {
    if (clickLock) return;
    let active = null;
    for (const cell of spyCells) {
      const section = document.getElementById(cell.getAttribute("data-section"));
      if (!section) continue;
      if (section.getBoundingClientRect().top <= navH + 10) active = cell;
    }
    cells.forEach((c) => c.classList.remove("is-active"));
    if (active) active.classList.add("is-active");
  }

  spyCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      cells.forEach((c) => c.classList.remove("is-active", "is-clicked"));
      cell.classList.add("is-active", "is-clicked");
      clickLock = true;
      if (clickTimer) clearTimeout(clickTimer);
      const settle = () => {
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          clickLock = false;
          cell.classList.remove("is-clicked");
          window.removeEventListener("scroll", settle);
          spy();
        }, 150);
      };
      window.addEventListener("scroll", settle, { passive: true });
      clickTimer = setTimeout(() => {
        clickLock = false;
        cell.classList.remove("is-clicked");
        window.removeEventListener("scroll", settle);
      }, 200);
    });
  });
  window.addEventListener("scroll", spy, { passive: true });
  spy();
}

/* ------------------------------------------------------------------ *
 * Mobile menu                                                         *
 * ------------------------------------------------------------------ */
function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
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
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => open && set(false))
  );
}

/* ------------------------------------------------------------------ *
 * Video modal (local MP4 + poster)                                    *
 * ------------------------------------------------------------------ */
function initVideoModal() {
  const modal = document.querySelector(".video-modal");
  const box = document.querySelector(".video-container");
  const video = document.getElementById("dynamic-video");
  const close = document.querySelector(".video-close-button");
  if (!modal || !box || !video) return;
  let opener = null;

  function open(id, trigger) {
    opener = trigger instanceof HTMLElement ? trigger : document.activeElement;
    video.poster = `/assets/video-thumbs/${id}.jpg`;
    // Prefer VP9 webm (broad codec support incl. headless chromium); fall back
    // to h264 mp4 when webm is unplayable.
    video.src = video.canPlayType('video/webm; codecs="vp9"')
      ? `/assets/videos/${id}.webm`
      : `/assets/videos/${id}.mp4`;
    video.onerror = () => {
      if (video.src.endsWith(".webm")) {
        video.src = `/assets/videos/${id}.mp4`;
        try {
          video.load();
          video.play();
        } catch {}
      }
    };
    try {
      video.load();
      video.play();
    } catch {}
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    modal.setAttribute("aria-hidden", "false");
    box.style.opacity = "1";
    box.style.transform = "scale(1)";
    document.body.style.overflow = "hidden";
    if (close) close.focus();
  }
  function shut() {
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
    modal.setAttribute("aria-hidden", "true");
    box.style.opacity = "0";
    box.style.transform = "scale(0.95)";
    try {
      video.pause();
    } catch {}
    video.removeAttribute("src");
    video.removeAttribute("poster");
    document.body.style.overflow = "";
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    opener = null;
  }
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-video]");
    if (trigger) {
      open(trigger.getAttribute("data-video"), trigger);
      return;
    }
  });
  // Whole leader-media block is clickable too.
  document.querySelectorAll(".leader__media").forEach((media) => {
    const play = media.querySelector("[data-video]");
    if (!play) return;
    media.style.cursor = "pointer";
    media.addEventListener("click", (e) => {
      if (e.target.closest("[data-video]")) return;
      open(play.getAttribute("data-video"), play);
    });
  });
  if (close) close.addEventListener("click", shut);
  modal.addEventListener("click", (e) => {
    if (!box.contains(e.target)) shut();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.opacity === "1") shut();
  });
}

/* ------------------------------------------------------------------ *
 * Stacked-section reveal + parallax backgrounds (GSAP/ScrollTrigger)  *
 * ------------------------------------------------------------------ */
function initStackMotion() {
  const stacks = Array.from(document.querySelectorAll(".stack-section"));
  function updateStacks() {
    if (window.innerWidth < 768) {
      stacks.forEach((s) => (s.style.transform = ""));
      return;
    }
    const vh = window.innerHeight;
    stacks.forEach((s) => {
      const rect = s.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh - rect.top) / vh));
      const eased = 1 - Math.pow(p, 0.6);
      s.style.transform = `translateY(${eased * 80}px)`;
    });
  }
  window.addEventListener("scroll", updateStacks, { passive: true });
  updateStacks();

  document.querySelectorAll(".parallax-bg").forEach((section) => {
    const src = section.getAttribute("data-bg");
    if (!src) return;
    const layer = document.createElement("div");
    layer.style.cssText =
      "position:absolute;top:-20%;left:0;width:100%;height:140%;" +
      `background-image:url("${src}");background-size:contain;` +
      "background-position:center center;background-repeat:repeat;" +
      "opacity:0.5;z-index:0;pointer-events:none;";
    section.insertBefore(layer, section.firstChild);
    gsap.to(layer, {
      y: () => -section.offsetHeight * 0.3,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

/* ------------------------------------------------------------------ *
 * Footer gradient fade                                                *
 * ------------------------------------------------------------------ */
function initFooterFade() {
  const footer = document.querySelector("[data-gradient-fade]");
  if (!footer) return;
  const overlay = document.createElement("div");
  overlay.className = "footer__gradient";
  footer.insertBefore(overlay, footer.firstChild);
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        gsap.to(overlay, {
          opacity: entry.isIntersecting ? 1 : 0,
          duration: entry.isIntersecting ? 2 : 0.8,
          ease: entry.isIntersecting ? "power3.out" : "power3.in",
        });
      }
    },
    { threshold: 0.25 }
  );
  io.observe(footer);
}

/* ------------------------------------------------------------------ *
 * Lazy Rive hydration                                                 *
 * ------------------------------------------------------------------ */
function initRiveEmbeds() {
  const MOBILE_BP = 768;
  const margin = window.innerWidth < MOBILE_BP ? 1500 : 600;
  const instances = new Map();

  function hydrate(host) {
    if (instances.has(host)) return;
    if (getComputedStyle(host).display === "none") return;
    const src = host.getAttribute("data-rive");
    if (!src) return;
    let w = host.offsetWidth;
    let h = host.offsetHeight;
    if (w <= 0 || h <= 0) {
      const r = host.getBoundingClientRect();
      w = Math.round(r.width);
      h = Math.round(r.height);
    }
    if (w <= 0 || h <= 0) {
      setTimeout(() => hydrate(host), 400);
      return;
    }
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(Math.min(w, window.innerWidth * 1.5) * dpr);
    canvas.height = Math.round(Math.min(h, window.innerHeight * 1.5) * dpr);
    host.appendChild(canvas);
    const config = {
      src,
      canvas,
      autoplay: true,
      layout: new rive.Layout({
        fit: rive.Fit.Contain,
        alignment: rive.Alignment.Center,
      }),
      onLoad: () => {
        try {
          instance.resizeDrawingSurfaceToCanvas();
        } catch {}
      },
    };
    const sm = host.getAttribute("data-rive-sm");
    const artboard = host.getAttribute("data-rive-artboard");
    if (sm) config.stateMachines = sm;
    if (artboard) config.artboard = artboard;
    let instance;
    try {
      instance = new rive.Rive(config);
      instances.set(host, instance);
    } catch {
      /* rive is progressive enhancement — never fatal */
    }
  }

  const hosts = document.querySelectorAll("[data-rive]");
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          hydrate(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: `${margin}px 0px ${margin}px 0px` }
  );
  hosts.forEach((h) => io.observe(h));
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Global State and UI Controllers                                     *
 * ------------------------------------------------------------------ */

window.appState = {
  shortlist: [],
  compare: [],
  themeFilter: 'All',
  searchQuery: '',
  watchLog: [],
  undoStack: [],
  redoStack: []
};

window.appMutations = {
  pinFeature(name, fromUndo = false) {
    if (window.appState.shortlist.includes(name)) return;

    if (!fromUndo) {
      window.appState.undoStack.push({ type: 'pin', name });
      window.appState.redoStack = [];
      updateUndoRedoButtons();
    }

    window.appState.shortlist.push(name);
    updateShortlistUI();
  },
  unpinFeature(name, fromUndo = false) {
    const index = window.appState.shortlist.indexOf(name);
    if (index === -1) return;

    if (!fromUndo) {
      window.appState.undoStack.push({ type: 'unpin', name, index });
      window.appState.redoStack = [];
      updateUndoRedoButtons();
    }

    window.appState.shortlist.splice(index, 1);
    updateShortlistUI();
  },
  addCompare(name) {
    if (window.appState.compare.includes(name)) return;
    if (window.appState.compare.length >= 3) {
      const msg = document.getElementById('compare-full-msg');
      if (msg) {
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
      }
      return;
    }
    window.appState.compare.push(name);
    updateCompareUI();
  },
  setThemeFilter(theme) {
    window.appState.themeFilter = theme;
    applyFilters();
  },
  setSearchQuery(query) {
    window.appState.searchQuery = query;
    applyFilters();
  },
  watchExecutive(name) {
    if (!window.appState.watchLog.includes(name)) {
      window.appState.watchLog.push(name);
    }
  }
};

function updateShortlistUI() {
  const list = document.getElementById('shortlist-items');
  const count = document.getElementById('shortlist-count');
  if (!list || !count) return;

  count.textContent = window.appState.shortlist.length;

  if (window.appState.shortlist.length === 0) {
    list.innerHTML = '<li class="empty-msg" style="color: #888;">No launches pinned yet</li>';
  } else {
    list.innerHTML = '';
    window.appState.shortlist.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      list.appendChild(li);
    });
  }

  document.querySelectorAll('article.shortlist-item').forEach(card => {
    const featureName = card.getAttribute('data-feature');
    const isPinned = window.appState.shortlist.includes(featureName);
    const pinBtn = card.querySelector('.btn-pin');
    const unpinBtn = card.querySelector('.btn-unpin');
    if (pinBtn && unpinBtn) {
      pinBtn.style.display = isPinned ? 'none' : 'inline-flex';
      unpinBtn.style.display = isPinned ? 'inline-flex' : 'none';
    }
  });

  if (typeof window.updateBriefPreview === 'function') window.updateBriefPreview();
}

function updateCompareUI() {
  const list = document.getElementById('compare-items');
  const count = document.getElementById('compare-count');
  if (!list || !count) return;

  count.textContent = window.appState.compare.length;
  list.innerHTML = '';
  window.appState.compare.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    list.appendChild(li);
  });

  if (typeof window.updateBriefPreview === 'function') window.updateBriefPreview();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  if (undoBtn) undoBtn.disabled = window.appState.undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = window.appState.redoStack.length === 0;
}

function applyFilters() {
  const theme = window.appState.themeFilter;
  const q = window.appState.searchQuery.toLowerCase();

  document.querySelectorAll('article.shortlist-item').forEach(card => {
    const cardTheme = card.getAttribute('data-theme');
    const cardFeature = card.getAttribute('data-feature').toLowerCase();

    const themeMatch = theme === 'All' || cardTheme === theme;
    const searchMatch = !q || cardFeature.includes(q);

    card.style.display = (themeMatch && searchMatch) ? '' : 'none';
  });

  if (typeof window.updateBriefPreview === 'function') window.updateBriefPreview();
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', e => {
    if (e.target.classList.contains('btn-pin')) {
      const feature = e.target.getAttribute('data-feature');
      window.appMutations.pinFeature(feature);
    } else if (e.target.classList.contains('btn-unpin')) {
      const feature = e.target.getAttribute('data-feature');
      window.appMutations.unpinFeature(feature);
    } else if (e.target.classList.contains('btn-compare')) {
      const feature = e.target.getAttribute('data-feature');
      window.appMutations.addCompare(feature);
    }
  });

  const themeSelect = document.getElementById('theme-filter');
  if (themeSelect) {
    themeSelect.addEventListener('change', e => {
      window.appMutations.setThemeFilter(e.target.value);
    });
  }
  const searchInput = document.getElementById('search-query');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      window.appMutations.setSearchQuery(e.target.value);
    });
  }

  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      const action = window.appState.undoStack.pop();
      if (!action) return;
      if (action.type === 'pin') {
        window.appMutations.unpinFeature(action.name, true);
      } else if (action.type === 'unpin') {
        window.appState.shortlist.splice(action.index, 0, action.name);
        updateShortlistUI();
      }
      window.appState.redoStack.push(action);
      updateUndoRedoButtons();
    });
  }
  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      const action = window.appState.redoStack.pop();
      if (!action) return;
      if (action.type === 'pin') {
        window.appState.shortlist.push(action.name);
        updateShortlistUI();
      } else if (action.type === 'unpin') {
        window.appMutations.unpinFeature(action.name, true);
      }
      window.appState.undoStack.push(action);
      updateUndoRedoButtons();
    });
  }

  document.body.addEventListener('click', e => {
    const playControl = e.target.closest('.leader__play');
    if (playControl) {
      const leaderSection = playControl.closest('.leader');
      if (leaderSection) {
        const nameEl = leaderSection.querySelector('.leader__name');
        if (nameEl) {
           const execName = nameEl.textContent.trim();
           const formattedName = execName.split(" ").map(n => n[0].toUpperCase() + n.substring(1).toLowerCase()).join(" ");
           window.appMutations.watchExecutive(formattedName);
        }
      }
    }
  });

  const cmdPalette = document.getElementById('command-palette');
  const paletteSearch = document.getElementById('palette-search');
  const paletteResults = document.getElementById('palette-results');
  let paletteOpener = null;

  if (cmdPalette) {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (cmdPalette.style.display !== 'flex') {
          paletteOpener = document.activeElement;
        }
        cmdPalette.style.display = 'flex';
        void cmdPalette.offsetWidth;
        cmdPalette.style.opacity = '1';
        cmdPalette.querySelector('#command-palette-inner').style.transform = 'translateY(0)';
        paletteSearch.focus();
        paletteSearch.value = '';
        renderPaletteResults('');
      } else if (e.key === 'Escape') {
          if (cmdPalette.style.display === 'flex') {
              closePalette();
          } else {
              const briefPanel = document.getElementById('brief-panel');
              if (briefPanel && briefPanel.style.display === 'flex') {
                  const closeBtn = document.getElementById('close-brief-panel');
                  if (closeBtn) closeBtn.click();
              }
          }
      }
    });

    paletteSearch.addEventListener('input', e => {
      renderPaletteResults(e.target.value.toLowerCase());
    });

    paletteResults.addEventListener('click', e => {
       const li = e.target.closest('li');
       if (!li) return;
       const action = li.getAttribute('data-action');
       const target = li.getAttribute('data-target');

       if (action === 'jump') {
          const navCell = document.querySelector(`a.seg-cell[href="${target}"]`);
          if (navCell) navCell.click();
       } else if (action === 'open-brief') {
          const exportBtn = document.getElementById('btn-export-brief');
          if (exportBtn) exportBtn.click();
       }
       closePalette();
    });

    function closePalette() {
       cmdPalette.style.opacity = '0';
       cmdPalette.querySelector('#command-palette-inner').style.transform = 'translateY(-20px)';
       setTimeout(() => {
          cmdPalette.style.display = 'none';
          if (paletteOpener instanceof HTMLElement && paletteOpener.isConnected) {
            paletteOpener.focus();
          }
          paletteOpener = null;
       }, 200);
    }

    function renderPaletteResults(q) {
       const commands = [
         { label: 'Jump to Agentic Stack', action: 'jump', target: '#agentic-stack' },
         { label: 'Jump to International Payments', action: 'jump', target: '#international' },
         { label: 'Jump to Payment Gateway', action: 'jump', target: '#payment-gateway' },
         { label: 'Jump to D2C', action: 'jump', target: '#D2C' },
         { label: 'Jump to Marketing', action: 'jump', target: '#Marketers' },
         { label: 'Jump to Business Banking', action: 'jump', target: '#finance' },
         { label: 'Open sprint brief', action: 'open-brief', target: '' },
       ];

       const matched = commands.filter(c => c.label.toLowerCase().includes(q));
       paletteResults.innerHTML = matched.map(c => `
          <li data-action="${c.action}" data-target="${c.target}" style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #333;" tabindex="0" onmouseover="this.style.background='#305eff'" onmouseout="this.style.background=''">
             ${c.label}
          </li>
       `).join('');
    }

    cmdPalette.addEventListener('click', e => {
       if (e.target === cmdPalette) closePalette();
    });
  }
});



const executiveNames = [
  "Arjun Mehta", "Rohan Iyer", "Nikhil Rao",
  "Kabir Menon", "Dev Sharma", "Meera Nair"
];

const themeNames = [
  "All", "Agentic Stack", "International Payments",
  "Payment Gateway", "D2C", "Marketing", "Business Banking"
];

// Gather catalog names on boot
let catalogFeatures = [];

document.addEventListener("DOMContentLoaded", () => {
  catalogFeatures = Array.from(document.querySelectorAll('article.shortlist-item')).map(c => c.getAttribute('data-feature'));

  const briefSchema = z.object({
    brand: z.literal("Novapay"),
    event: z.literal("Sprint 26"),
    shortlistedFeatures: z.array(z.string().refine(v => catalogFeatures.includes(v))),
    compareFeatures: z.array(z.string().refine(v => catalogFeatures.includes(v))).max(3),
    watchedExecutives: z.array(z.string().refine(v => executiveNames.includes(v))),
    themeFilter: z.enum(["All", "Agentic Stack", "International Payments", "Payment Gateway", "D2C", "Marketing", "Business Banking"]),
    searchQuery: z.string().max(120),
    generatedAt: z.string().endsWith("Z").datetime()
  });

  const btnExport = document.getElementById("btn-export-brief");
  const briefPanel = document.getElementById("brief-panel");
  const briefPanelInner = document.getElementById("brief-panel-inner");
  const btnClose = document.getElementById("close-brief-panel");

  const tabJson = document.getElementById("tab-json");
  const tabMarkdown = document.getElementById("tab-markdown");
  const viewJson = document.getElementById("view-json");
  const viewMarkdown = document.getElementById("view-markdown");

  const jsonContent = document.getElementById("json-content");
  const markdownContent = document.getElementById("markdown-content");

  const btnDownload = document.getElementById("btn-download");
  const btnCopy = document.getElementById("btn-copy");
  const copyConfirm = document.getElementById("copy-confirm");

  const btnImport = document.getElementById("btn-import");
  const fileImport = document.getElementById("file-import");
  const btnLoadSample = document.getElementById("btn-load-sample");
  const importError = document.getElementById("import-error");

  window.generateBriefData = function() {
    return {
      brand: "Novapay",
      event: "Sprint 26",
      shortlistedFeatures: window.appState.shortlist,
      compareFeatures: window.appState.compare,
      watchedExecutives: window.appState.watchLog,
      themeFilter: window.appState.themeFilter,
      searchQuery: window.appState.searchQuery,
      generatedAt: new Date().toISOString()
    };
  };

  window.generateBriefMarkdown = function(data = window.generateBriefData()) {
    const list = values => values.length ? values.map(value => `- ${value}`).join("\n") : "- None";
    return [
      "# Novapay Sprint 26 launch brief",
      "",
      "## Shortlisted launches",
      list(data.shortlistedFeatures),
      "",
      "## Compare set",
      list(data.compareFeatures),
      "",
      "## Theme filter",
      data.themeFilter,
      "",
      "## Search",
      data.searchQuery || "None",
      "",
      "## Watched executives",
      list(data.watchedExecutives),
      "",
      `Generated at: ${data.generatedAt}`,
    ].join("\n");
  };

  window.updateBriefPreview = function() {
    const data = window.generateBriefData();
    jsonContent.textContent = JSON.stringify(data, null, 2);
    markdownContent.textContent = window.generateBriefMarkdown(data);
    markdownContent.style.whiteSpace = "pre-wrap";
  };



  if (btnExport && briefPanel) {
    btnExport.addEventListener("click", () => {
      window.updateBriefPreview();
      briefPanel.style.display = "flex";
      void briefPanel.offsetWidth;
      briefPanel.style.opacity = "1";
      briefPanelInner.style.transform = "translateY(0)";
      importError.textContent = "";

      const opener = document.activeElement;
      briefPanel.setAttribute('data-opener-id', opener.id || '');
      briefPanelInner.setAttribute('tabindex', '-1');
      briefPanelInner.focus();
    });

    btnClose.addEventListener("click", () => {
      briefPanel.style.opacity = "0";
      briefPanelInner.style.transform = "translateY(20px)";
      setTimeout(() => {
        briefPanel.style.display = "none";
      }, 200);
    });

    briefPanel.addEventListener("click", e => {
      if (e.target === briefPanel) btnClose.click();
    });
  }

  if (tabJson && tabMarkdown) {
    tabJson.addEventListener("click", () => {
      tabJson.style.background = "#305eff";
      tabMarkdown.style.background = "#2c2c2c";
      viewJson.style.display = "block";
      viewMarkdown.style.display = "none";
    });
    tabMarkdown.addEventListener("click", () => {
      tabMarkdown.style.background = "#305eff";
      tabJson.style.background = "#2c2c2c";
      viewMarkdown.style.display = "block";
      viewJson.style.display = "none";
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      const data = window.generateBriefData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "novapay-sprint-26-brief.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(window.generateBriefData(), null, 2));
        copyConfirm.style.opacity = "1";
        setTimeout(() => copyConfirm.style.opacity = "0", 2000);
      } catch (err) {}
    });
  }

  function doImport(data) {
    try {
      const parsed = briefSchema.parse(data);
      window.appState.shortlist = parsed.shortlistedFeatures;
      window.appState.compare = parsed.compareFeatures;
      window.appState.themeFilter = parsed.themeFilter;
      window.appState.searchQuery = parsed.searchQuery;
      window.appState.watchLog = parsed.watchedExecutives;
      window.appState.undoStack = [];
      window.appState.redoStack = [];
      updateUndoRedoButtons();

      const themeSelect = document.getElementById("theme-filter");
      if (themeSelect) themeSelect.value = window.appState.themeFilter;
      const searchInput = document.getElementById("search-query");
      if (searchInput) searchInput.value = window.appState.searchQuery;

      if (typeof updateShortlistUI === 'function') updateShortlistUI();
      if (typeof updateCompareUI === 'function') updateCompareUI();
      if (typeof applyFilters === 'function') applyFilters();
      if (typeof window.updateBriefPreview === 'function') window.updateBriefPreview();

      importError.textContent = "Import successful!";
      importError.style.color = "#a5d6a7";
    } catch (e) {
      importError.style.color = "#ff4d4d";
      if (e instanceof z.ZodError) {
        importError.textContent = "Import Error: " + e.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
      } else {
        importError.textContent = "Import Error: Invalid format.";
      }
    }
  }

  if (btnImport && fileImport) {
    btnImport.addEventListener("click", () => fileImport.click());
    fileImport.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          doImport(data);
        } catch (err) {
          importError.style.color = "#ff4d4d";
          importError.textContent = "Import Error: Invalid JSON.";
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
  }

  if (btnLoadSample) {
    btnLoadSample.addEventListener("click", () => {
      const sample = {
        brand: "Novapay",
        event: "Sprint 26",
        shortlistedFeatures: catalogFeatures.slice(0, 2),
        compareFeatures: catalogFeatures.slice(2, 4),
        watchedExecutives: ["Arjun Mehta"],
        themeFilter: "Agentic Stack",
        searchQuery: "",
        generatedAt: new Date().toISOString()
      };
      doImport(sample);
    });
  }

  window.importBriefData = doImport;
});

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
  initHero();
  initWebmcp();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}


document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const playBtn = e.target.closest('.leader__play');
    if (playBtn) {
      e.preventDefault();
      playBtn.click();
      return;
    }
    const closeBtn = e.target.closest('.video-close-button');
    if (closeBtn) {
      e.preventDefault();
      closeBtn.click();
      return;
    }
  }
});
