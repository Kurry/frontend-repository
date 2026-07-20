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
import { z } from "zod";
import { state, pushUndo, undo, redo, resetStore } from "./store.ts";

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
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const pin = document.querySelector("[data-services-pin]");
  if (!pin) return;
  const items = gsap.utils.toArray(".services-item");
  if (!items.length) return;

  // They are absolutely positioned. As we scroll, throw the top one away with rotation
  const order = items.slice().reverse(); // First item in HTML is on top visually? Actually HTML order makes last item visually on top unless z-index applied.

  // Set z-index to ensure correct visual stacking
  items.forEach((item, i) => {
      item.style.zIndex = items.length - i;
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: "+=200%",
      pin: true,
      scrub: true,
    },
  });

  items.forEach((item, i) => {
    if (i === items.length - 1) return; // Leave last card alone
    tl.to(item, {
      yPercent: -120,
      rotation: i % 2 === 0 ? -15 : 15,
      ease: "none"
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
const ContactSchema = z.object({
  email: z.string().trim().max(254).email(),
  phone: z.string().max(40).regex(/^[\d\s\+\-\(\)]*$/).optional().nullable().transform(v => v === "" ? null : v),
  terms: z.literal(true)
});

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

  form.querySelectorAll(".form-input").forEach((input) => {
    input.addEventListener("input", () => {
      input.closest(".form-input_wrap")?.classList.toggle("is-filled", input.value.length > 0);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (Date.now() - loadedAt < 5000) return;

    const emailInput = form.querySelector('input[name="E-mail"]');
    const phoneInput = form.querySelector('input[name="Telefoonnummer"]');
    const termsInput = form.querySelector('input[name="Terms-Conditions"]');

    const payload = {
      email: emailInput?.value || "",
      phone: phoneInput?.value || null,
      terms: termsInput?.checked || false
    };

    const result = ContactSchema.safeParse(payload);

    form.querySelectorAll("[data-validate]").forEach(el => el.classList.remove("is--error"));

    if (!result.success) {
      result.error.issues.forEach(issue => {
        if (issue.path[0] === 'email') {
          emailInput?.closest("[data-validate]")?.classList.add("is--error");
        } else if (issue.path[0] === 'terms') {
          termsInput?.closest("[data-validate]")?.classList.add("is--error");
        } else if (issue.path[0] === 'phone') {
          phoneInput?.closest("[data-validate]")?.classList.add("is--error");
        }
      });
      return;
    }

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (res.ok) {
        success?.classList.add("is-visible");
        const s = state.get();
        state.set({ ...s, contactSubmitted: true, contactEmail: result.data.email });
      }
    } catch (err) {
      // fail silent
    }
  });
}

/* ------------------------------------------------ cookie flow */
const CookieSchema = z.object({
  essential: z.literal(true),
  marketing: z.boolean(),
  analytics: z.boolean(),
  personalization: z.boolean()
});

function updateCookieState(payload) {
  pushUndo();
  const s = state.get();
  state.set({ ...s, cookieCategories: payload });
}

function initCookies() {
  const banner = document.querySelector('[data-cookie-banner="zone-1"]');
  const prefs = document.querySelector("[data-cookie-prefs]");

  if (banner) {
    requestAnimationFrame(() => banner.classList.add("is-visible"));
    banner.querySelector("[data-cookie-close]")?.addEventListener("click", () => banner.classList.remove("is-visible"));
    banner.querySelector("[data-cookie-accept]")?.addEventListener("click", (e) => {
      e.preventDefault();
      updateCookieState({ essential: true, marketing: true, analytics: true, personalization: true });
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

    prefs.querySelector("[data-cookie-accept-all]")?.addEventListener("click", (e) => {
      e.preventDefault();
      updateCookieState({ essential: true, marketing: true, analytics: true, personalization: true });
      close();
      banner?.classList.remove("is-visible");
    });

    prefs.querySelector("[data-cookie-reject]")?.addEventListener("click", (e) => {
      e.preventDefault();
      updateCookieState({ essential: true, marketing: false, analytics: false, personalization: false });
      close();
      banner?.classList.remove("is-visible");
    });

    prefs.querySelector("[data-cookie-accept-selected]")?.addEventListener("click", (e) => {
      e.preventDefault();

      const payload = {
        essential: prefs.querySelector('input[name="Essential"]')?.checked ?? false,
        marketing: prefs.querySelector('input[name="Marketing"]')?.checked ?? false,
        analytics: prefs.querySelector('input[name="Analytics"]')?.checked ?? false,
        personalization: prefs.querySelector('input[name="Personalization"]')?.checked ?? false
      };

      const result = CookieSchema.safeParse(payload);

      prefs.querySelectorAll("[data-validate-cookie]").forEach(el => el.classList.remove("is--error"));

      if (!result.success) {
        result.error.issues.forEach(issue => {
          const field = issue.path[0];
          prefs.querySelector(`input[name="${field.charAt(0).toUpperCase() + field.slice(1)}"]`)?.closest("[data-validate-cookie]")?.classList.add("is--error");
        });
        return;
      }

      updateCookieState(result.data);
      close();
      banner?.classList.remove("is-visible");
    });

    prefs.querySelectorAll("[data-toggle]").forEach((label) => {
      const input = label.querySelector("input");
      // Prevent unchecking essential
      input?.addEventListener("change", (e) => {
        if (input.name === "Essential") {
          input.checked = true;
        }
        label.classList.toggle("is-on", input.checked);
      });
    });
  }
}

/* ------------------------------------------------ misc */

const DiscoveryBriefSchema = z.object({
  schemaVersion: z.literal(1),
  brand: z.literal("Cinder & Bloom"),
  shortlistedClients: z.array(z.enum(["Loom House", "Second Circle", "New Current", "Roadkind", "Motive Lab"])),
  activeClient: z.enum(["Loom House", "Second Circle", "New Current", "Roadkind", "Motive Lab"]),
  flickIndexByClient: z.object({
    "Loom House": z.number().int().nonnegative(),
    "Second Circle": z.number().int().nonnegative(),
    "New Current": z.number().int().nonnegative(),
    "Roadkind": z.number().int().nonnegative(),
    "Motive Lab": z.number().int().nonnegative()
  }),
  locale: z.enum(["en", "fi"]),
  cookieCategories: z.object({
    essential: z.literal(true),
    marketing: z.boolean(),
    analytics: z.boolean(),
    personalization: z.boolean()
  }),
  contactSubmitted: z.boolean(),
  contactEmail: z.string().email().nullable(),
  activeOrganicViews: z.string(),
  activeLikes: z.string(),
  testimonialIndex: z.number().int().nonnegative()
}).refine(data => {
  if (data.contactSubmitted && !data.contactEmail) return false;
  if (!data.contactSubmitted && data.contactEmail !== null) return false;
  return true;
}, "contactEmail must be null if contactSubmitted is false, and equal to the lead email if contactSubmitted is true");

function initOverlays() {
  const cmdPalette = document.getElementById("command-palette");
  const briefPanel = document.getElementById("discovery-brief");
  const shortlistPanel = document.getElementById("shortlist-panel");

  // Command Palette
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      cmdPalette.showModal();
      document.getElementById("cmd-search").focus();
    }
  });

  document.getElementById("cmd-export")?.addEventListener("click", () => {
    cmdPalette.close();
    generateBrief();
    briefPanel.showModal();
  });

  document.getElementById("cmd-jump")?.addEventListener("click", () => {
    cmdPalette.close();
    document.querySelector(".section_services")?.scrollIntoView({ behavior: "smooth" });
  });

  cmdPalette?.addEventListener("click", (e) => {
    if (e.target === cmdPalette) cmdPalette.close();
  });

  // Discovery Brief
  document.getElementById("brief-close")?.addEventListener("click", () => briefPanel.close());
  briefPanel?.addEventListener("click", (e) => {
    if (e.target === briefPanel) briefPanel.close();
  });

  document.getElementById("tab-json")?.addEventListener("click", () => {
    document.getElementById("brief-json-view").classList.remove("hidden");
    document.getElementById("brief-md-view").classList.add("hidden");
    document.getElementById("tab-json").classList.add("font-bold", "underline");
    document.getElementById("tab-md").classList.remove("font-bold", "underline");
  });

  document.getElementById("tab-md")?.addEventListener("click", () => {
    document.getElementById("brief-json-view").classList.add("hidden");
    document.getElementById("brief-md-view").classList.remove("hidden");
    document.getElementById("tab-md").classList.add("font-bold", "underline");
    document.getElementById("tab-json").classList.remove("font-bold", "underline");
  });

  document.getElementById("brief-copy")?.addEventListener("click", () => {
    const text = document.getElementById("brief-json-view").classList.contains("hidden")
      ? document.getElementById("brief-md-content").value
      : document.getElementById("brief-json-content").value;
    navigator.clipboard.writeText(text);
    const confirm = document.getElementById("copy-confirm");
    confirm.classList.remove("opacity-0");
    setTimeout(() => confirm.classList.add("opacity-0"), 2000);
  });

  document.getElementById("brief-download")?.addEventListener("click", () => {
    const text = document.getElementById("brief-json-content").value;
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "discovery_brief.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("brief-import")?.addEventListener("click", () => {
    const text = document.getElementById("brief-json-content").value;
    const errEl = document.getElementById("import-error");
    errEl.classList.add("hidden");
    try {
      const data = JSON.parse(text);
      const result = DiscoveryBriefSchema.safeParse(data);
      if (!result.success) {
        errEl.textContent = result.error.errors[0].message;
        errEl.classList.remove("hidden");
        return;
      }

      const s = state.get();
      state.set({
        ...s,
        shortlistedClients: result.data.shortlistedClients,
        locale: result.data.locale,
        cookieCategories: result.data.cookieCategories,
        activeClient: result.data.activeClient,
        flickIndexByClient: result.data.flickIndexByClient
      });

      // Update DOM to match state
      updateDOMFromState();

      briefPanel.close();
    } catch (e) {
      errEl.textContent = "Malformed JSON";
      errEl.classList.remove("hidden");
    }
  });

  // Shortlist Panel
  document.getElementById("nav-shortlist-btn")?.addEventListener("click", () => {
    shortlistPanel.showModal();
  });

  document.getElementById("shortlist-close")?.addEventListener("click", () => shortlistPanel.close());
  shortlistPanel?.addEventListener("click", (e) => {
    if (e.target === shortlistPanel) shortlistPanel.close();
  });

  // Undo/Redo
  document.getElementById("nav-undo")?.addEventListener("click", undo);
  document.getElementById("nav-redo")?.addEventListener("click", redo);

  // Shortlist buttons in client deck
  document.querySelectorAll(".shortlist-toggle-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const client = e.target.getAttribute("data-client-title");
      pushUndo();
      const s = state.get();
      let list = [...s.shortlistedClients];
      if (list.includes(client)) {
        list = list.filter(c => c !== client);
      } else {
        list.push(client);
      }
      state.set({ ...s, shortlistedClients: list });
    });
  });

  state.subscribe(renderState);
}

function updateDOMFromState() {
    const s = state.get();

    // Update locale
    const root = document.querySelector("[data-locale-root]");
    if (root) {
        const current = root.querySelector("[data-locale-current]");
        if (current) current.textContent = s.locale.toUpperCase();
    }

    // Update cookie prefs
    const prefs = document.querySelector("[data-cookie-prefs]");
    if (prefs) {
        ['marketing', 'analytics', 'personalization'].forEach(cat => {
            const el = prefs.querySelector(`input[name="${cat.charAt(0).toUpperCase() + cat.slice(1)}"]`);
            if (el) {
                el.checked = s.cookieCategories[cat];
                el.dispatchEvent(new Event('change'));
            }
        });
    }

    // TODO: Need to sync active carousel and flick indices to DOM here!
    // For Swiper: window.swiperInstance?.slideTo(index)
    // For Flick: the flick.js logic might need updating to be state-driven
}

function generateBrief() {
  const s = state.get();

  // Try to find the active values from DOM if possible or fallback to state
  const activeSlide = document.querySelector('.swiper-slide-active .client-deck_title');
  if (activeSlide) {
     s.activeClient = activeSlide.textContent.trim();
  }

  const organicViewsEl = document.querySelector('.swiper-slide-active [data-count="organic-views"]');
  if (organicViewsEl) s.activeOrganicViews = organicViewsEl.textContent.trim();

  const likesEl = document.querySelector('.swiper-slide-active [data-count="likes"]');
  if (likesEl) s.activeLikes = likesEl.textContent.trim();

  const json = {
    schemaVersion: 1,
    brand: "Cinder & Bloom",
    shortlistedClients: s.shortlistedClients,
    activeClient: s.activeClient,
    flickIndexByClient: s.flickIndexByClient,
    locale: s.locale,
    cookieCategories: s.cookieCategories,
    contactSubmitted: s.contactSubmitted,
    contactEmail: s.contactEmail,
    activeOrganicViews: s.activeOrganicViews,
    activeLikes: s.activeLikes,
    testimonialIndex: s.testimonialIndex
  };

  document.getElementById("brief-json-content").value = JSON.stringify(json, null, 2);

  const md = `# Discovery brief — Cinder & Bloom

- **Shortlisted Clients**: ${s.shortlistedClients.join(", ") || "None"}
- **Active Client**: ${s.activeClient}
- **Locale**: ${s.locale}
- **Contact Submitted**: ${s.contactSubmitted} ${s.contactEmail ? `(${s.contactEmail})` : ''}
`;
  document.getElementById("brief-md-content").value = md;
}

function renderState(s) {
  const countEl = document.getElementById("shortlist-count");
  if (countEl) countEl.textContent = s.shortlistedClients.length;

  document.querySelectorAll(".shortlist-toggle-btn").forEach(btn => {
    const client = btn.getAttribute("data-client-title");
    if (s.shortlistedClients.includes(client)) {
      btn.textContent = "Shortlisted";
      btn.classList.replace("variant-secondary", "variant-primary");
    } else {
      btn.textContent = "Shortlist";
      btn.classList.replace("variant-primary", "variant-secondary");
    }
  });

  const listEl = document.getElementById("shortlist-list");
  if (listEl) {
    listEl.innerHTML = s.shortlistedClients.map(c => `
      <div class="flex justify-between items-center p-2 border border-gray-200 rounded">
        <span>${c}</span>
        <button class="remove-shortlist text-red-500 text-sm" data-client="${c}">Remove</button>
      </div>
    `).join("");

    listEl.querySelectorAll(".remove-shortlist").forEach(btn => {
      btn.addEventListener("click", (e) => {
        pushUndo();
        const client = e.target.getAttribute("data-client");
        state.set({ ...s, shortlistedClients: s.shortlistedClients.filter(c => c !== client) });
      });
    });
  }

  // Re-generate brief if open
  if (document.getElementById("discovery-brief")?.open) {
      generateBrief();
  }
}

function initMisc() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[current-year], .current-year").forEach((el) => (el.textContent = year));
  document.querySelectorAll("img").forEach((img) => img.setAttribute("draggable", "false"));
}

/* ------------------------------------------------ boot */
function boot() {
  initLenis();
  initOverlays();
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
