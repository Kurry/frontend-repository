// Hildén & Kaira — natively authored interaction layer.
// Stack: GSAP (ScrollTrigger, SplitText, InertiaPlugin) + Lenis + Swiper.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import Lenis from "lenis";
import Swiper from "swiper";
import { Navigation, Keyboard } from "swiper/modules";

import { initPlayers } from "./player.js";
import { initFlickGroups } from "./flick.js";

gsap.registerPlugin(ScrollTrigger, SplitText, InertiaPlugin);

const EASE_PRIMARY = "cubic-bezier(0.625, 0.05, 0, 1)";
const desktopFine = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

/* ------------------------------------------------ smooth scroll (>=768) */
let lenis = null;
let clientDeckSwiper = null;
function initLenis() {
  if (window.matchMedia("(min-width: 768px)").matches) {
    lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* ------------------------------------------------ split-text reveals */
function initSplitReveals() {
  const targets = document.querySelectorAll("main h2, main h3, main p, footer h2, footer p");
  targets.forEach((el) => {
    if (el.closest("[data-gsap-ignore]") || el.hasAttribute("data-gsap-ignore")) {
      el.setAttribute("data-split-visible", "");
      return;
    }
    if (el.hasAttribute("data-split-visible")) return;
    const isHeading = /^H\d$/.test(el.tagName);
    let split;
    try {
      split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: !isMobile(),
        linesClass: "gsap-line",
      });
    } catch (e) {
      el.setAttribute("data-split-visible", "");
      return;
    }
    el.setAttribute("data-split-visible", "");
    gsap.fromTo(
      split.lines,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: isHeading ? 0.8 : 0.6,
        stagger: isHeading ? 0.08 : 0.04,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "clamp(top 80%)", once: true },
      }
    );
  });
}

/* ------------------------------------------------ hero load + floating items */
function initHero() {
  const veil = document.querySelector("[data-pageload-bg]");
  const logoItems = gsap.utils.toArray(".hero-home_logo-item");
  const content = document.querySelector("[data-hero-content]");
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (logoItems.length) {
    tl.fromTo(
      logoItems,
      { yPercent: 105, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.045 },
      0.1
    );
  }
  if (content) {
    tl.fromTo(
      content.children,
      { y: "2em", autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08 },
      0.35
    );
  }
  const nav = document.querySelector("[data-nav-root]");
  if (nav) {
    tl.fromTo(
      nav.querySelectorAll(".nav-link, .nav-logo, .nav-button > *, .menu-button"),
      { yPercent: -40, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.04 },
      0.4
    );
  }
  if (veil) {
    tl.to(veil, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, 0);
    tl.set(veil, { display: "none" });
  }

  // Floating case thumbnails: continuous bottom-to-top drift loops.
  // Deterministic parameter table (duration s, x vw offset, rotation deg,
  // scale delta, initial progress) — matches the documented motion ranges.
  const params = [
    { d: 13.2, x: -32, r: -9, s: 0.05, p: 0.55 },
    { d: 14.1, x: 31, r: 11, s: -0.06, p: 0.8 },
    { d: 12.4, x: -25, r: -12, s: 0.08, p: 0.3 },
    { d: 14.8, x: 38, r: 8, s: -0.03, p: 0.12 },
    { d: 12.9, x: -40, r: 10, s: 0.02, p: 0.68 },
    { d: 13.6, x: 24, r: -7, s: -0.08, p: 0.42 },
    { d: 14.4, x: -36, r: 12, s: 0.06, p: 0.02 },
  ];
  gsap.utils.toArray("[data-hero-item]").forEach((item, i) => {
    const cfg = params[i % params.length];
    const travel = window.innerHeight + 300;
    const setup = () => {
      gsap.set(item, {
        xPercent: -50,
        yPercent: -50,
        x: `${cfg.x}vw`,
        rotation: cfg.r,
        scale: 1 + cfg.s,
      });
    };
    setup();
    const tween = gsap.fromTo(
      item,
      { y: travel },
      {
        y: -travel,
        duration: cfg.d,
        ease: "none",
        repeat: -1,
        delay: i * 2.5 * 0.001, // phase applied through progress below
        onUpdate() {
          const pr = this.ratio;
          let opacity = 1;
          if (pr < 0.1) opacity = pr / 0.1;
          else if (pr > 0.82) opacity = Math.max(0, 1 - (pr - 0.82) / 0.18);
          gsap.set(item, { opacity });
        },
      }
    );
    tween.progress(cfg.p);
  });
}

/* ------------------------------------------------ nav: dock links under wordmark */
function initNavDock() {
  const nav = document.querySelector("[data-nav-root]");
  const logo = document.querySelector("[data-hero-logo]");
  const inner = nav?.querySelector(".nav-inner");
  if (!nav || !logo) return;
  const update = () => {
    const em = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    if (window.matchMedia("(max-width: 479px)").matches) {
      nav.style.removeProperty("--nav-links-top");
      nav.style.removeProperty("--nav-inner-shift");
      // The small nav logo hides above the bar while the hero wordmark is on screen.
      const navLogo = nav.querySelector(".nav-logo");
      if (navLogo) {
        const hide = window.scrollY < logo.offsetHeight;
        gsap.set(navLogo, { y: hide ? -5 * em : 0 });
      }
      return;
    }
    nav.style.removeProperty("--nav-logo-shift");
    const desktop = window.matchMedia("(min-width: 992px)").matches;
    const offset = desktop ? 2 * em : 0.75 * em;
    const linksTop = Math.max(0, logo.offsetHeight - offset - window.scrollY);
    nav.style.setProperty("--nav-links-top", `${linksTop}px`);
    // Nav chrome (logo / locale / CTA) rides just above the docked links and
    // settles into the top bar once the wordmark has scrolled away. While the
    // wordmark is on screen the chrome sits below the nav clip on desktop.
    if (inner) {
      const innerH = inner.offsetHeight;
      const container = inner.parentElement;
      const base = (container.offsetHeight - innerH) / 2;
      const shift = Math.max(0, linksTop + 0.9 * em - innerH - base);
      nav.style.setProperty("--nav-inner-shift", `${shift}px`);
    }
  };
  update();
  gsap.ticker.add(update);
  window.addEventListener("resize", update);
}

/* ------------------------------------------------ nav: theme sync (probe at 3em) */
function initNavThemeSync() {
  const nav = document.querySelector("[data-nav-root]");
  if (!nav) return;
  const themes = ["theme-dark", "theme-white", "theme-dark-grey", "theme-lime", "theme-media", "theme-chrome", "theme-turquoise"];
  const sections = Array.from(document.querySelectorAll("section, header.section_hero, footer"));
  let locked = false;
  nav._themeLock = (v) => (locked = v);
  const probe = () => {
    if (locked) return;
    const em = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    const y = 3 * em;
    let current = null; // default (light) theme
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) {
        const t = themes.find((c) => s.classList.contains(c));
        if (t) current = t;
        break;
      }
    }
    if (current ? !nav.classList.contains(current) : themes.some((t) => nav.classList.contains(t))) {
      themes.forEach((t) => nav.classList.remove(t));
      if (current) nav.classList.add(current);
    }
  };
  gsap.ticker.add(probe);
}

/* ------------------------------------------------ mobile menu */
function initMobileMenu() {
  const nav = document.querySelector("[data-nav-root]");
  const toggle = document.querySelector("[data-menu-toggle]");
  if (!nav || !toggle) return;
  let open = false;
  let prevTheme = null;
  toggle.addEventListener("click", () => {
    open = !open;
    nav.classList.toggle("is-menu-open", open);
    document.body.classList.toggle("is-scroll-locked", open);
    if (open) {
      prevTheme = Array.from(nav.classList).find((c) => c.startsWith("theme-"));
      nav._themeLock && nav._themeLock(true);
      nav.classList.remove(prevTheme || "theme-dark");
      nav.classList.add("theme-lime");
      lenis && lenis.stop();
    } else {
      lenis && lenis.start();
      setTimeout(() => {
        nav.classList.remove("theme-lime");
        if (prevTheme) nav.classList.add(prevTheme);
        nav._themeLock && nav._themeLock(false);
      }, 1000);
    }
  });
}

/* ------------------------------------------------ locale dropdown */
function initLocaleDropdown() {
  const root = document.querySelector("[data-locale-root]");
  if (!root) return;
  const toggle = root.querySelector(".locale-dropdown_toggle");
  const current = root.querySelector("[data-locale-current]");
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    const open = root.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  root.querySelectorAll("[data-locale-option]").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.preventDefault();
      const label = opt.getAttribute("data-locale-option");
      current.textContent = label;
      root.classList.remove("is-open");
      // Keep the session store in sync so exported briefs carry the choice.
      if (window.appState) {
        window.appState.locale = (label || "en").toLowerCase();
        updateUIFromState();
      }
    });
  });
  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) root.classList.remove("is-open");
  });
}

/* ------------------------------------------------ swiper (client decks) */
function initSwiper() {
  const group = document.querySelector("[data-swiper-group]");
  if (!group) return;
  const el = group.querySelector(".swiper");
  clientDeckSwiper = new Swiper(el, {
    modules: [Navigation, Keyboard],
    slidesPerView: "auto",
    speed: 600,
    grabCursor: true,
    centeredSlides: true,
    spaceBetween: 20,
    keyboard: { enabled: true },
    navigation: {
      nextEl: group.querySelector("[data-swiper-next]"),
      prevEl: group.querySelector("[data-swiper-prev]"),
    },
  });
}

/* ------------------------------------------------ dynamic counters */
function initCounters() {
  const OFFSETS = { "organic-views": 50, likes: 20 };
  document.querySelectorAll("[data-count]").forEach((el) => {
    const kind = el.getAttribute("data-count");
    const finalValue = parseInt(el.textContent.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(finalValue)) return;
    const offset = OFFSETS[kind] ?? 20;
    let value = finalValue - offset;
    const fmt = (n) => n.toLocaleString("en-US").replace(/,/g, " ");
    el.textContent = fmt(value);
    const tick = () => {
      value += Math.max(1, Math.round(Math.random() * 3));
      el.textContent = fmt(value);
      const [lo, hi] = kind === "likes" ? [3000, 8000] : [2500, 6500];
      setTimeout(tick, lo + Math.random() * (hi - lo));
    };
    setTimeout(tick, 500 + Math.random() * 400);
  });
}

/* ------------------------------------------------ services pinned deck */
function initServices() {
  const pin = document.querySelector("[data-services-pin]");
  if (!pin) return;
  const items = gsap.utils.toArray(".services-item");
  if (!items.length) return;
  // DOM order: 03, 02, 01 — the last item (01) sits on top. Scrolling throws
  // the top card away to reveal the next.
  const order = items.slice().reverse();
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });
  order.forEach((item, i) => {
    if (i === order.length - 1) return;
    tl.to(item, {
      yPercent: -120,
      rotation: i % 2 ? 6 : -6,
      ease: "power1.in",
      duration: 1,
    });
  });
}

/* ------------------------------------------------ testimonial rotator */
function initTestimonials() {
  const wrap = document.querySelector("[data-testimonial-wrap]");
  if (!wrap) return;
  const items = Array.from(wrap.querySelectorAll("[data-testimonial-item]"));
  const count = wrap.querySelector("[data-current]");
  let index = 0;
  let timer = null;
  const duration = parseInt(wrap.getAttribute("data-autoplay-duration") || "5000", 10);

  const show = (next) => {
    if (next === index) return;
    const prev = items[index];
    index = (next + items.length) % items.length;
    const active = items[index];
    prev.classList.remove("is--active");
    active.classList.add("is--active");
    count && (count.textContent = String(index + 1));
    const text = active.querySelector("[data-testimonial-text]");
    if (text) {
      try {
        const split = SplitText.create(text, { type: "lines", mask: "lines", linesClass: "gsap-line" });
        gsap.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" });
      } catch (e) { /* no-op */ }
    }
    const details = active.querySelectorAll("[data-testimonial-split], [data-testimonial-img]");
    gsap.fromTo(details, { autoAlpha: 0, y: "0.5em" }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" });
  };
  const restart = () => {
    clearInterval(timer);
    if (wrap.hasAttribute("data-autoplay")) {
      timer = setInterval(() => show(index + 1), duration);
    }
  };
  wrap.querySelector("[data-next]")?.addEventListener("click", () => { show(index + 1); restart(); });
  wrap.querySelector("[data-prev]")?.addEventListener("click", () => { show(index - 1); restart(); });
  restart();
  // Exposed so state import can drive the real rotator to a specific index.
  wrap._testimonialSetIndex = (i) => { show(i); restart(); };
}

/* ------------------------------------------------ momentum hover (CTA cards) */
function initMomentumHover() {
  if (!desktopFine()) return;
  document.querySelectorAll("[data-momentum-hover-init] [data-momentum-hover-element]").forEach((el) => {
    const target = el.querySelector("[data-momentum-hover-target]") || el;
    let lastX = 0, lastY = 0, vx = 0, vy = 0;
    el.addEventListener("mousemove", (e) => {
      vx = e.clientX - lastX;
      vy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    el.addEventListener("mouseenter", () => {
      const clamp = gsap.utils.clamp(-1080, 1080);
      gsap.to(target, {
        inertia: {
          x: { velocity: clamp(vx * 30), end: 0 },
          y: { velocity: clamp(vy * 30), end: 0 },
          rotation: { velocity: gsap.utils.clamp(-60, 60)(vx * 20), end: 0 },
          resistance: 200,
        },
      });
    });
  });
}

/* ------------------------------------------------ parallax bg videos */
function initParallax() {
  document.querySelectorAll(".image-parallax").forEach((wrap) => {
    const img = wrap.querySelector("[data-parallax-image]");
    const section = wrap.closest("section");
    if (!img || !section) return;
    gsap.fromTo(
      img,
      { yPercent: -10 },
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
  // data-scroll-speed parallax elements (about section images)
  document.querySelectorAll("[data-scroll-speed]").forEach((el) => {
    const speed = parseFloat(el.getAttribute("data-scroll-speed") || "0");
    gsap.fromTo(
      el,
      { y: `${speed * 100}vh` },
      {
        y: `${-speed * 100}vh`,
        ease: "none",
        scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

/* ------------------------------------------------ CTA popup + contact form */
function initContact() {
  const popup = document.querySelector("[data-cta-popup]");
  if (popup) {
    document.querySelectorAll("[data-cta-popup-open]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        popup.showModal();
        // Move focus into the dialog (first form field, falling back to the
        // close button) instead of leaving it on the <dialog> element itself.
        const firstField = popup.querySelector(".form-input");
        (firstField || popup.querySelector("[data-cta-popup-close]"))?.focus();
      })
    );
    popup.querySelector("[data-cta-popup-close]")?.addEventListener("click", () => popup.close());
    popup.addEventListener("click", (e) => {
      if (e.target === popup) popup.close();
    });
  }

  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const loadedAt = Date.now();
  const success = document.querySelector("[data-form-success]");
  const fail = document.querySelector("[data-form-error]");

  form.querySelectorAll(".form-input").forEach((input) => {
    input.addEventListener("input", () => {
      input.closest(".form-input_wrap")?.classList.toggle("is-filled", input.value.length > 0);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Anti-spam: silently ignore submissions within 5s of load.
    if (Date.now() - loadedAt < 5000) return;
    const email = form.querySelector('input[name="E-mail"]');
    const terms = form.querySelector('input[name="Terms-Conditions"]');
    let valid = true;
    if (!email.value || !/.+@.+\..+/.test(email.value)) {
      email.closest("[data-validate]")?.classList.add("is--error");
      valid = false;
    } else {
      email.closest("[data-validate]")?.classList.remove("is--error");
    }
    if (!terms.checked) {
      terms.closest("[data-validate]")?.classList.add("is--error");
      valid = false;
    } else {
      terms.closest("[data-validate]")?.classList.remove("is--error");
    }
    if (!valid) return;
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (res.ok) {
        success?.classList.add("is-visible");
        fail?.classList.remove("is-visible");
        // Record the successful lead in the discovery-brief session state.
        window.appState.contactSubmitted = true;
        window.appState.contactEmail = email.value;
        pushHistory();
        updateUIFromState();
      } else {
        fail?.classList.add("is-visible");
      }
    } catch (err) {
      fail?.classList.add("is-visible");
    }
  });
}

/* ------------------------------------------------ cookie flow */
// Toggle checkboxes inside the preferences panel are matched to appState
// categories by their input name (falls back to the label's data-toggle
// value so markup variants without an explicit name still work).
function cookieCategoryFor(input, label) {
  const key = (input?.name || label.getAttribute("data-toggle") || "").toLowerCase();
  if (key.includes("market")) return "marketing";
  if (key.includes("analytic")) return "analytics";
  if (key.includes("personal")) return "personalization";
  return null;
}

function syncCookieTogglesFromState(prefs) {
  if (!prefs || !window.appState) return;
  prefs.querySelectorAll("[data-toggle]").forEach((label) => {
    const input = label.querySelector("input");
    const category = cookieCategoryFor(input, label);
    if (!input || !category) return;
    const checked = category === "essential" ? true : Boolean(window.appState.cookieCategories[category]);
    input.checked = checked;
    label.classList.toggle("is-on", checked);
  });
}

function applyCookieCategories(categories) {
  window.appState.cookieCategories = {
    essential: true,
    marketing: Boolean(categories.marketing),
    analytics: Boolean(categories.analytics),
    personalization: Boolean(categories.personalization),
  };
  pushHistory();
  updateUIFromState();
}

function initCookies() {
  const banner = document.querySelector('[data-cookie-banner="zone-1"]');
  const prefs = document.querySelector("[data-cookie-prefs]");
  if (banner) {
    requestAnimationFrame(() => banner.classList.add("is-visible"));
    banner.querySelector("[data-cookie-close]")?.addEventListener("click", () => banner.classList.remove("is-visible"));
    banner.querySelector("[data-cookie-accept]")?.addEventListener("click", (e) => {
      e.preventDefault();
      applyCookieCategories({ marketing: true, analytics: true, personalization: true });
      banner.classList.remove("is-visible");
    });
    banner.querySelector("[data-cookie-prefs-open]")?.addEventListener("click", (e) => {
      e.preventDefault();
      syncCookieTogglesFromState(prefs);
      prefs?.classList.add("is-visible");
    });
  }
  if (prefs) {
    const close = () => prefs.classList.remove("is-visible");
    prefs.querySelector("[data-cookie-prefs-close]")?.addEventListener("click", close);
    prefs.querySelector("[data-cookie-prefs-close-target]")?.addEventListener("click", close);
    prefs.querySelector("[data-cookie-reject]")?.addEventListener("click", (e) => {
      e.preventDefault();
      applyCookieCategories({ marketing: false, analytics: false, personalization: false });
      close();
      banner?.classList.remove("is-visible");
    });
    prefs.querySelector("[data-cookie-accept-all]")?.addEventListener("click", (e) => {
      e.preventDefault();
      applyCookieCategories({ marketing: true, analytics: true, personalization: true });
      close();
      banner?.classList.remove("is-visible");
    });
    prefs.querySelector("[data-cookie-accept-selected]")?.addEventListener("click", (e) => {
      e.preventDefault();
      const selected = { marketing: false, analytics: false, personalization: false };
      prefs.querySelectorAll("[data-toggle]").forEach((label) => {
        const input = label.querySelector("input");
        const category = cookieCategoryFor(input, label);
        if (input && category && category in selected) selected[category] = input.checked;
      });
      applyCookieCategories(selected);
      close();
      banner?.classList.remove("is-visible");
    });
    prefs.querySelectorAll("[data-toggle]").forEach((label) => {
      const input = label.querySelector("input");
      input?.addEventListener("change", () => label.classList.toggle("is-on", input.checked));
    });
    // Reflect current state whenever the banner (re)opens the panel.
    syncCookieTogglesFromState(prefs);
  }
}

/* ------------------------------------------------ misc */
function initMisc() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[current-year], .current-year").forEach((el) => (el.textContent = year));
  document.querySelectorAll("img").forEach((img) => img.setAttribute("draggable", "false"));
}

/* ------------------------------------------------ boot */
function boot() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) initLenis();
  initMisc();
  initHero();
  initNavDock();
  initNavThemeSync();
  initMobileMenu();
  initLocaleDropdown();
  if (!reducedMotion) initSplitReveals();
  initSwiper();
  initFlickGroups(gsap);
  initPlayers();
  if (!reducedMotion) initCounters();
  if (!reducedMotion) initServices();
  if (!reducedMotion) initTestimonials(); else initTestimonialsNoAnim();
  if (!reducedMotion) initMomentumHover();
  if (!reducedMotion) initParallax();
  initContact();
  initCookies();
  ScrollTrigger.refresh();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

function initTestimonialsNoAnim() {
  const wrap = document.querySelector("[data-testimonial-wrap]");
  if (!wrap) return;
  const items = Array.from(wrap.querySelectorAll("[data-testimonial-item]"));
  const count = wrap.querySelector("[data-current]");
  let index = 0;
  const show = (next) => {
    if (next === index) return;
    const prev = items[index];
    index = (next + items.length) % items.length;
    const active = items[index];
    prev.classList.remove("is--active");
    active.classList.add("is--active");
    count && (count.textContent = String(index + 1));
  };
  wrap.querySelector("[data-next]")?.addEventListener("click", () => show(index + 1));
  wrap.querySelector("[data-prev]")?.addEventListener("click", () => show(index - 1));
  // Exposed so state import can drive the real rotator to a specific index.
  wrap._testimonialSetIndex = (i) => show(i);
}

// Global State Management
window.appState = {
  shortlist: [],
  cookieCategories: {
    essential: true,
    marketing: false,
    analytics: false,
    personalization: false
  },
  contactSubmitted: false,
  contactEmail: null,
  locale: "en"
};
window.appHistory = [];
window.appHistoryPointer = -1;

function pushHistory() {
  // Discard future states if we are not at the end
  window.appHistory = window.appHistory.slice(0, window.appHistoryPointer + 1);
  window.appHistory.push(JSON.stringify(window.appState));
  window.appHistoryPointer++;
}

function restoreHistory(stateStr) {
  if (!stateStr) return;
  window.appState = JSON.parse(stateStr);
  updateUIFromState();
}

window.undoAction = function() {
  if (window.appHistoryPointer > 0) {
    window.appHistoryPointer--;
    restoreHistory(window.appHistory[window.appHistoryPointer]);
  }
};

window.redoAction = function() {
  if (window.appHistoryPointer < window.appHistory.length - 1) {
    window.appHistoryPointer++;
    restoreHistory(window.appHistory[window.appHistoryPointer]);
  }
};

// Deck Shortlist controls only add (deduplicated); removal happens via the
// Shortlist panel's Remove control.
window.addToShortlist = function(clientName) {
  if (window.appState.shortlist.includes(clientName)) return;
  window.appState.shortlist.push(clientName);
  pushHistory();
  updateUIFromState();
};

window.removeFromShortlist = function(clientName) {
  if (!window.appState.shortlist.includes(clientName)) return;
  window.appState.shortlist = window.appState.shortlist.filter(n => n !== clientName);
  pushHistory();
  updateUIFromState();
};

// Live session facts read from the DOM so the brief always reflects the page.
function readClientDeckFacts() {
  const facts = {
    activeClient: null,
    flickIndexByClient: {},
    activeOrganicViews: "",
    activeLikes: ""
  };
  document.querySelectorAll(".swiper-slide").forEach((slide) => {
    const name = slide.querySelector("[data-shortlist-btn]")?.getAttribute("data-shortlist-btn");
    if (!name) return;
    const items = Array.from(slide.querySelectorAll("[data-flick-cards-item]"));
    const idx = items.findIndex((it) => it.getAttribute("data-flick-cards-item-status") === "active");
    facts.flickIndexByClient[name] = idx >= 0 ? idx : 0;
    if (facts.activeClient === null) facts.activeClient = name; // fallback: first slide
    if (slide.classList.contains("swiper-slide-active")) {
      facts.activeClient = name;
      facts.activeOrganicViews = slide.querySelector('[data-count="organic-views"]')?.textContent.trim() ?? "";
      facts.activeLikes = slide.querySelector('[data-count="likes"]')?.textContent.trim() ?? "";
    }
  });
  if (!facts.activeOrganicViews) {
    facts.activeOrganicViews = document.querySelector('[data-count="organic-views"]')?.textContent.trim() ?? "";
  }
  if (!facts.activeLikes) {
    facts.activeLikes = document.querySelector('[data-count="likes"]')?.textContent.trim() ?? "";
  }
  return facts;
}

function readTestimonialIndex() {
  const wrap = document.querySelector("[data-testimonial-wrap]");
  if (!wrap) return 0;
  const items = Array.from(wrap.querySelectorAll("[data-testimonial-item]"));
  const idx = items.findIndex((it) => it.classList.contains("is--active"));
  return idx >= 0 ? idx : 0;
}

function buildBriefData() {
  const deckFacts = readClientDeckFacts();
  return {
    schemaVersion: 1,
    brand: "Cinder & Bloom",
    shortlistedClients: window.appState.shortlist,
    activeClient: deckFacts.activeClient,
    flickIndexByClient: deckFacts.flickIndexByClient,
    locale: window.appState.locale,
    cookieCategories: window.appState.cookieCategories,
    contactSubmitted: Boolean(window.appState.contactSubmitted),
    contactEmail: window.appState.contactSubmitted ? window.appState.contactEmail : null,
    activeOrganicViews: deckFacts.activeOrganicViews,
    activeLikes: deckFacts.activeLikes,
    testimonialIndex: readTestimonialIndex()
  };
}

window.exportBriefJSON = function() {
  return JSON.stringify(buildBriefData(), null, 2);
};

// Live Markdown summary rendered in the Discovery Brief's Markdown tab,
// generated from the exact same brief data as the JSON export.
window.exportBriefMarkdown = function() {
  const data = buildBriefData();
  const cookies = data.cookieCategories || {};
  return [
    `# Discovery Brief — ${data.brand}`,
    "",
    `**Active client:** ${data.activeClient || "—"}`,
    `**Shortlisted clients:** ${data.shortlistedClients.length ? data.shortlistedClients.join(", ") : "None"}`,
    `**Locale:** ${(data.locale || "en").toUpperCase()}`,
    "",
    "## Cookie preferences",
    `- Essential: ${cookies.essential ? "Yes" : "No"}`,
    `- Marketing: ${cookies.marketing ? "Yes" : "No"}`,
    `- Analytics: ${cookies.analytics ? "Yes" : "No"}`,
    `- Personalization: ${cookies.personalization ? "Yes" : "No"}`,
    "",
    "## Contact",
    `- Submitted: ${data.contactSubmitted ? "Yes" : "No"}`,
    `- Email: ${data.contactEmail || "—"}`,
    "",
    "## Session snapshot",
    `- Active organic views: ${data.activeOrganicViews || "—"}`,
    `- Active likes: ${data.activeLikes || "—"}`,
    `- Testimonial index: ${data.testimonialIndex}`
  ].join("\n");
};

// Validates an imported cookieCategories object against the discovery-brief
// contract: all four keys must be present booleans, and essential must be
// true. Anything else (missing key, non-boolean value, or essential:false)
// is an invalid brief and must be rejected rather than silently coerced.
function validateCookieCategories(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Missing cookieCategories");
  }
  for (const key of ["essential", "marketing", "analytics", "personalization"]) {
    if (typeof input[key] !== "boolean") {
      throw new Error(`Invalid cookieCategories.${key}`);
    }
  }
  if (input.essential !== true) {
    throw new Error("cookieCategories.essential must be true");
  }
  return {
    essential: true,
    marketing: input.marketing,
    analytics: input.analytics,
    personalization: input.personalization
  };
}

window.importBriefJSON = function(jsonString) {
  window.importBriefJSON.lastError = null;
  try {
    const data = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
    if (data.schemaVersion !== 1 || !data.shortlistedClients) {
      throw new Error("Invalid schema");
    }
    // Discovery-brief schema requires the brand to match exactly.
    if (data.brand !== "Cinder & Bloom") {
      throw new Error(`Invalid brand: expected "Cinder & Bloom"`);
    }
    const allowedLocales = ["en", "fi"];
    if (data.locale && !allowedLocales.includes(data.locale)) {
      throw new Error("Invalid locale");
    }
    // Broken pairing in either direction is invalid: a submitted lead must
    // carry its email, and a non-submitted brief must not carry a leaked one.
    if (data.contactSubmitted && !data.contactEmail) {
      throw new Error("Broken contact Submitted pairing");
    }
    if (!data.contactSubmitted && data.contactEmail) {
      throw new Error("Broken contact Submitted pairing");
    }
    // The five canonical client titles used across the export/data contract
    // (shortlist entries, activeClient, flickIndexByClient keys).
    const allowedTitles = ["Loom House", "Second Circle", "New Current", "Roadkind", "Motive Lab"];
    const referencedTitles = new Set(data.shortlistedClients || []);
    if (data.activeClient) referencedTitles.add(data.activeClient);
    if (data.flickIndexByClient) {
      Object.keys(data.flickIndexByClient).forEach((k) => referencedTitles.add(k));
    }
    for (const title of referencedTitles) {
      if (!allowedTitles.includes(title)) {
        throw new Error(`Unknown client title: ${title}`);
      }
    }
    // flickIndexByClient must carry all five canonical titles, each with a
    // non-negative integer index, per the discovery-brief schema contract.
    if (!data.flickIndexByClient || typeof data.flickIndexByClient !== "object") {
      throw new Error("Missing flickIndexByClient");
    }
    for (const title of allowedTitles) {
      const idx = data.flickIndexByClient[title];
      if (!Number.isInteger(idx) || idx < 0) {
        throw new Error(`Invalid flickIndexByClient.${title}`);
      }
    }
    // Validate cookie categories before mutating any state so a rejected
    // brief (including essential:false) leaves session state untouched.
    const validatedCookieCategories = validateCookieCategories(data.cookieCategories);

    window.appState.shortlist = data.shortlistedClients || [];
    if (data.locale) window.appState.locale = data.locale;
    // Assign contact state unconditionally so a brief without a submitted lead
    // clears any previously stored email instead of leaking it into re-exports.
    window.appState.contactSubmitted = Boolean(data.contactSubmitted);
    window.appState.contactEmail = window.appState.contactSubmitted ? data.contactEmail : null;
    window.appState.cookieCategories = validatedCookieCategories;

    pushHistory();
    updateUIFromState();
    restoreDeckPositions(data);
    return true;
  } catch (err) {
    window.importBriefJSON.lastError = (err && err.message) ? err.message : "Invalid discovery brief format.";
    return false;
  }
};

// Drives the real UI controls (swiper, flick deck, testimonial rotator) so
// an imported brief's carousel/flick/testimonial indices are visibly
// reflected on the page, not just stored in memory.
function restoreDeckPositions(data) {
  if (data.activeClient) {
    const slides = Array.from(document.querySelectorAll(".swiper-slide"));
    const idx = slides.findIndex(
      (slide) => slide.querySelector("[data-shortlist-btn]")?.getAttribute("data-shortlist-btn") === data.activeClient
    );
    if (idx >= 0 && clientDeckSwiper) clientDeckSwiper.slideTo(idx, 0);
  }
  if (data.flickIndexByClient) {
    document.querySelectorAll(".swiper-slide").forEach((slide) => {
      const name = slide.querySelector("[data-shortlist-btn]")?.getAttribute("data-shortlist-btn");
      if (!name || !(name in data.flickIndexByClient)) return;
      const group = slide.querySelector("[data-flick-cards-init]");
      if (group && typeof group._flickSetIndex === "function") {
        group._flickSetIndex(data.flickIndexByClient[name]);
      }
    });
  }
  if (typeof data.testimonialIndex === "number") {
    const wrap = document.querySelector("[data-testimonial-wrap]");
    if (wrap && typeof wrap._testimonialSetIndex === "function") {
      wrap._testimonialSetIndex(data.testimonialIndex);
    }
  }
}

function updateUIFromState() {
  const countEl = document.getElementById("nav-shortlist-count");
  if (countEl) countEl.textContent = window.appState.shortlist.length;
  
  const container = document.getElementById("shortlist-items-container");
  if (container) {
    container.innerHTML = "";
    window.appState.shortlist.forEach(item => {
      const div = document.createElement("div");
      div.className = "shortlist-item";
      div.innerHTML = `<span>${item}</span><button class="shortlist-item-remove" data-remove="${item}">Remove</button>`;
      container.appendChild(div);
    });
    container.querySelectorAll(".shortlist-item-remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        window.removeFromShortlist(e.target.getAttribute("data-remove"));
      });
    });
  }
  
  document.querySelectorAll("[data-shortlist-btn]").forEach(btn => {
    const name = btn.getAttribute("data-shortlist-btn");
    if (window.appState.shortlist.includes(name)) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  });

  const localeLabel = document.querySelector("[data-locale-current]");
  if (localeLabel) localeLabel.textContent = (window.appState.locale || "en").toUpperCase();

  const textarea = document.getElementById("brief-json-output");
  if (textarea) {
    textarea.value = window.exportBriefJSON();
  }

  const markdownOutput = document.getElementById("brief-markdown-output");
  if (markdownOutput) {
    markdownOutput.value = window.exportBriefMarkdown();
  }

  // Undo/redo can revert contactSubmitted in memory; keep the contact-form
  // success/error UI layers in sync so a reverted state doesn't keep
  // "Thanks for your submission!" visible.
  const contactSuccess = document.querySelector("[data-form-success]");
  if (contactSuccess) {
    contactSuccess.classList.toggle("is-visible", Boolean(window.appState.contactSubmitted));
  }
  const contactFail = document.querySelector("[data-form-error]");
  if (contactFail && window.appState.contactSubmitted) {
    contactFail.classList.remove("is-visible");
  }
  
  // Dispatch a custom event in case webmcp wants to know
  window.dispatchEvent(new Event("appStateUpdated"));
}

document.addEventListener("DOMContentLoaded", () => {
  pushHistory(); // Initial state
  
  document.querySelectorAll("[data-shortlist-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.addToShortlist(btn.getAttribute("data-shortlist-btn"));
    });
  });

  // Shortlist Panel
  const slPanel = document.getElementById("shortlist-panel");
  if (slPanel) {
    const trigger = document.getElementById("nav-shortlist-trigger"); // Needs to be added to Nav.astro
    if (trigger) trigger.addEventListener("click", () => {
      updateUIFromState();
      slPanel.showModal();
    });
    const close = document.getElementById("shortlist-panel-close");
    if (close) close.addEventListener("click", () => slPanel.close());
    const exportBtn = document.getElementById("btn-export-brief");
    if (exportBtn) exportBtn.addEventListener("click", () => {
      slPanel.close();
      const briefPanel = document.getElementById("discovery-brief-panel");
      if (briefPanel) {
        updateUIFromState();
        briefPanel.showModal();
      }
    });
  }

  // Command Palette
  const cp = document.getElementById("command-palette");
  if (cp) {
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        cp.showModal();
        const input = document.getElementById("command-input");
        if (input) input.focus();
      }
    });
    cp.addEventListener("click", (e) => {
      if (e.target === cp) cp.close();
    });
    cp.querySelectorAll("[data-cmd]").forEach(btn => {
      btn.addEventListener("click", () => {
        const cmd = btn.getAttribute("data-cmd");
        cp.close();
        if (cmd === "export") {
          const briefPanel = document.getElementById("discovery-brief-panel");
          if (briefPanel) {
            updateUIFromState();
            briefPanel.showModal();
          }
        } else if (cmd === "services") {
          const services = document.querySelector(".section_services");
          if (services) services.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  // Discovery Brief
  const db = document.getElementById("discovery-brief-panel");
  if (db) {
    const close = document.getElementById("discovery-brief-close");
    if (close) close.addEventListener("click", () => db.close());
    db.addEventListener("click", (e) => {
      if (e.target === db) db.close();
    });
    
    document.getElementById("btn-download-brief")?.addEventListener("click", () => {
      const blob = new Blob([window.exportBriefJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "discovery-brief.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    
    const copyBtn = document.getElementById("btn-copy-brief");
    if (copyBtn) {
      const copyLabel = copyBtn.textContent;
      let copyRevertTimer = null;
      copyBtn.addEventListener("click", () => {
        // Copy whatever format is currently visible (JSON or Markdown tab),
        // not always the JSON export.
        const activeTab = db.querySelector("[data-brief-tab].is-active")?.getAttribute("data-brief-tab");
        const text = activeTab === "markdown" ? window.exportBriefMarkdown() : window.exportBriefJSON();
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = "Copied!";
          if (copyRevertTimer) clearTimeout(copyRevertTimer);
          copyRevertTimer = setTimeout(() => {
            copyBtn.textContent = copyLabel;
            copyRevertTimer = null;
          }, 2000);
        });
      });
    }
    
    document.getElementById("btn-import-brief-trigger")?.addEventListener("click", () => {
      const sec = document.getElementById("import-section");
      if (sec) sec.style.display = "block";
    });
    
    document.getElementById("btn-import-brief-submit")?.addEventListener("click", () => {
      const input = document.getElementById("import-json-input");
      const err = document.getElementById("import-error");
      if (input && err) {
        err.textContent = "";
        const success = window.importBriefJSON(input.value);
        if (success) {
          db.close();
        } else {
          err.textContent = window.importBriefJSON.lastError || "Invalid discovery brief format.";
        }
      }
    });

    // JSON / Markdown tab control for the discovery brief panel.
    db.querySelectorAll("[data-brief-tab]").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        const target = tabBtn.getAttribute("data-brief-tab");
        db.querySelectorAll("[data-brief-tab]").forEach((btn) => {
          const isActive = btn === tabBtn;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-selected", String(isActive));
        });
        db.querySelectorAll(".discovery-brief_panel").forEach((panel) => {
          panel.hidden = panel.id !== `brief-panel-${target}`;
        });
      });
    });
  }

  // Undo / Redo Shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      const active = document.activeElement;
      const isTextEditable =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable);
      if (isTextEditable) return;
      if (e.shiftKey) window.redoAction();
      else window.undoAction();
    }
  });
  // Contact state is recorded by initContact's guarded submit handler only
  // after validation passes and the local endpoint responds OK.
});

