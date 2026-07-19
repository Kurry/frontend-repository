/**
 * Oracle runtime — AIR-GAPPED.
 * Rewrites any leftover absolute CloudFront URLs to local /cdn/… paths.
 * Never fetches live CDN/Vimeo/GTM. Freezes hero video to Freeze-t2 still.
 * Exposes seeded __wwRand for deterministic c-particles layout.
 */
(function () {
  const CDN_HOST = "https://d3ql15awrosklt.cloudfront.net/";
  const CDN_PROTOREL = "//d3ql15awrosklt.cloudfront.net/";
  const LEGACY_LOCAL_CDN = "/cdn/d3ql15awrosklt.cloudfront.net/";
  const LOCAL_CDN = "/d3ql15awrosklt.cloudfront.net/";
  const VIMEO_HOST = "https://download-video-ak.vimeocdn.com/";
  const VIMEO_PLAYER = "https://player.vimeo.com/";
  const LOCAL_VIMEO = "/download-video-ak.vimeocdn.com/";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Seeded LCG — must match Particles-*.js layout (seed 0x574f4c56 / "WOLV")
  if (typeof window.__wwRand !== "function") {
    let s = 0x574f4c56 >>> 0;
    window.__wwRand = function __wwRand() {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return (s >>> 0) / 4294967296;
    };
  }

  function toLocal(url) {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith(CDN_HOST)) return LOCAL_CDN + url.slice(CDN_HOST.length);
    if (url.startsWith(CDN_PROTOREL))
      return LOCAL_CDN + url.slice(CDN_PROTOREL.length);
    if (url.startsWith(LEGACY_LOCAL_CDN))
      return LOCAL_CDN + url.slice(LEGACY_LOCAL_CDN.length);
    if (url.startsWith(VIMEO_HOST))
      return LOCAL_VIMEO + url.slice(VIMEO_HOST.length);
    if (url.startsWith(VIMEO_PLAYER)) return null;
    return null;
  }

  function rewriteAttr(el, attr) {
    const v = el.getAttribute(attr);
    if (!v) return;
    const local = toLocal(v);
    if (local && local !== v) el.setAttribute(attr, local);
  }

  function rewriteTree(root) {
    (root || document)
      .querySelectorAll("[src], [href], [poster]")
      .forEach((el) => {
        rewriteAttr(el, "src");
        rewriteAttr(el, "href");
        rewriteAttr(el, "poster");
      });
    (root || document).querySelectorAll("[srcset]").forEach((el) => {
      const raw = el.getAttribute("srcset");
      if (!raw) return;
      const next = raw
        .split(",")
        .map((part) => {
          const bits = part.trim().split(/\s+/);
          const local = toLocal(bits[0]);
          if (local) bits[0] = local;
          return bits.join(" ");
        })
        .join(", ");
      if (next !== raw) el.setAttribute("srcset", next);
    });
  }

  /** Posterize / freeze videos only when oracleFreeze / reduced-motion (gold plays normally). */
  function freezeVideos(root) {
    (root || document).querySelectorAll("video").forEach((video) => {
      if (video.dataset.oracleFrozen) return;
      const isHero = video.getAttribute("data-hero-home") === "video";
      const still = document.querySelector('[data-hero-home="poster-still"]');
      const shouldFreeze =
        reduced.matches ||
        document.documentElement.hasAttribute("data-oracle-freeze");

      if (!shouldFreeze) {
        // Live-gold path: do not force-pause hero; allow autoplay reveal.
        if (isHero && still) {
          const reveal = () => {
            if (document.documentElement.hasAttribute("data-oracle-freeze"))
              return;
            still.style.opacity = "0";
            still.style.pointerEvents = "none";
            video.style.opacity = "1";
            video.style.visibility = "visible";
          };
          video.addEventListener("playing", reveal);
        }
        return;
      }

      video.dataset.oracleFrozen = "1";
      const apply = () => {
        try {
          video.pause();
          if (video.readyState >= 1) {
            try {
              video.currentTime = isHero ? 0.05 : 0.05;
            } catch (_) {}
          }
          if (isHero && still) {
            still.style.opacity = "1";
            still.style.zIndex = "2";
            video.style.opacity = "0";
            video.style.visibility = "hidden";
          }
        } catch (_) {}
      };

      apply();
      video.addEventListener("loadeddata", apply, { once: true });
      video.addEventListener("play", () => {
        video.pause();
        apply();
      });
    });
  }

  function stripGtm(root) {
    (root || document)
      .querySelectorAll(
        'iframe[src*="googletagmanager"], script[src*="googletagmanager"], script[src*="gtag"]',
      )
      .forEach((el) => el.remove());
  }

  function boot(root) {
    rewriteTree(root);
    stripGtm(root);
    freezeVideos(root);
  }

  try {
    if (/[?&]oracleFreeze=1\b/.test(location.search)) {
      document.documentElement.setAttribute("data-oracle-freeze", "1");
    }
  } catch (_) {}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => boot(document));
  } else {
    boot(document);
  }

  document.addEventListener("swup:page:view", () => boot(document));
  document.addEventListener("vite-script-loaded", () => boot(document));
})();
