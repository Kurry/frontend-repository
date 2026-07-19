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

  function open(id) {
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
  }
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-video]");
    if (trigger) {
      open(trigger.getAttribute("data-video"));
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
      open(play.getAttribute("data-video"));
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
