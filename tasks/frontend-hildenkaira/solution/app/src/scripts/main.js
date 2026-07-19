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
      current.textContent = opt.getAttribute("data-locale-option");
      root.classList.remove("is-open");
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
  new Swiper(el, {
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
        popup.classList.add("is-open");
      })
    );
    popup.querySelector("[data-cta-popup-close]")?.addEventListener("click", () => popup.classList.remove("is-open"));
    popup.addEventListener("click", (e) => {
      if (e.target === popup) popup.classList.remove("is-open");
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
      } else {
        fail?.classList.add("is-visible");
      }
    } catch (err) {
      fail?.classList.add("is-visible");
    }
  });
}

/* ------------------------------------------------ cookie flow */
function initCookies() {
  const banner = document.querySelector('[data-cookie-banner="zone-1"]');
  const prefs = document.querySelector("[data-cookie-prefs]");
  if (banner) {
    requestAnimationFrame(() => banner.classList.add("is-visible"));
    banner.querySelector("[data-cookie-close]")?.addEventListener("click", () => banner.classList.remove("is-visible"));
    banner.querySelector("[data-cookie-accept]")?.addEventListener("click", (e) => {
      e.preventDefault();
      banner.classList.remove("is-visible");
    });
    banner.querySelector("[data-cookie-prefs-open]")?.addEventListener("click", (e) => {
      e.preventDefault();
      prefs?.classList.add("is-visible");
    });
  }
  if (prefs) {
    const close = () => prefs.classList.remove("is-visible");
    prefs.querySelector("[data-cookie-prefs-close]")?.addEventListener("click", close);
    prefs.querySelector("[data-cookie-prefs-close-target]")?.addEventListener("click", close);
    ["[data-cookie-reject]", "[data-cookie-accept-all]", "[data-cookie-accept-selected]"].forEach((sel) => {
      prefs.querySelector(sel)?.addEventListener("click", (e) => {
        e.preventDefault();
        close();
        banner?.classList.remove("is-visible");
      });
    });
    prefs.querySelectorAll("[data-toggle]").forEach((label) => {
      const input = label.querySelector("input");
      input?.addEventListener("change", () => label.classList.toggle("is-on", input.checked));
    });
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
  initLenis();
  initMisc();
  initHero();
  initNavDock();
  initNavThemeSync();
  initMobileMenu();
  initLocaleDropdown();
  initSplitReveals();
  initSwiper();
  initFlickGroups(gsap);
  initPlayers();
  initCounters();
  initServices();
  initTestimonials();
  initMomentumHover();
  initParallax();
  initContact();
  initCookies();
  ScrollTrigger.refresh();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
