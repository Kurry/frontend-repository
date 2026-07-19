'use strict';
/* =========================================================================
   Lando Norris homepage — reference oracle behavior layer.
   In-memory state only (no localStorage / sessionStorage).
   ========================================================================= */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- in-memory domain state ---- */
  var state = {
    preloader: 'visible',      // 'visible' | 'hidden'
    menuOpen: false,
    activeSection: 'hero',
    videoPlaying: false,
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ===================== PRELOADER ===================== */
  var preloader = $('#preloader');
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('is-hidden');
    state.preloader = 'hidden';
  }
  function replayTransition() {
    if (!preloader) return;
    preloader.classList.remove('is-hidden');
    state.preloader = 'visible';
    var delay = reduceMotion ? 60 : 1100;
    window.clearTimeout(replayTransition._t);
    replayTransition._t = window.setTimeout(hidePreloader, delay);
  }
  // Initial dismissal after load.
  window.setTimeout(hidePreloader, reduceMotion ? 40 : 1200);

  /* ===================== NAV MENU OVERLAY ===================== */
  var menu = $('#navMenu');
  var ham = $('#navHam');
  var closeBtn = $('#navClose');

  function openMenu() {
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    if (ham) { ham.setAttribute('aria-expanded', 'true'); }
    state.menuOpen = true;
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    if (ham) { ham.setAttribute('aria-expanded', 'false'); }
    state.menuOpen = false;
  }
  function toggleMenu() { state.menuOpen ? closeMenu() : openMenu(); }

  if (ham) ham.addEventListener('click', toggleMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.menuOpen) closeMenu();
  });

  /* ===================== SECTION NAVIGATION ===================== */
  function openDestination(dest) {
    if (dest === 'menu') { openMenu(); return true; }
    var el = document.querySelector('[data-section="' + dest + '"]');
    if (!el) return false;
    if (state.menuOpen) closeMenu();
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    state.activeSection = dest;
    return true;
  }
  // Menu link items scroll to their destination via the same handler.
  $$('[data-menu-link]').forEach(function (link) {
    link.addEventListener('click', function () {
      var dest = link.getAttribute('data-dest');
      if (dest) openDestination(dest);
    });
  });

  /* Inert nav / social / legal controls: interactive look, no navigation. */
  $$('[data-inert-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      state.activeSection = 'hero';
    });
  });
  $$('[data-social], [data-business], [data-legal], [data-store-cta]').forEach(function (btn) {
    if (btn.hasAttribute('data-store-cta')) return; // store handled below
    btn.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ===================== STORE BUTTON HOVER SPLIT ===================== */
  var storeBtn = $('#storeBtn');
  if (storeBtn) {
    storeBtn.addEventListener('mouseenter', function () { storeBtn.classList.add('is-hover-split'); });
    storeBtn.addEventListener('mouseleave', function () { storeBtn.classList.remove('is-hover-split'); });
    storeBtn.addEventListener('focus', function () { storeBtn.classList.add('is-hover-split'); });
    storeBtn.addEventListener('blur', function () { storeBtn.classList.remove('is-hover-split'); });
    storeBtn.addEventListener('click', function (e) { e.preventDefault(); });
  }

  /* ===================== TEXT-HOVER LINKS ===================== */
  $$('[data-anim="text-hover"]').forEach(function (el) {
    el.addEventListener('mouseenter', function () { el.classList.add('is-hover'); });
    el.addEventListener('mouseleave', function () { el.classList.remove('is-hover'); });
  });

  /* ===================== HORIZONTAL SCROLL ===================== */
  var hSection = $('#horizontal-media');
  var hTrack = $('#horizontalTrack');
  function updateHorizontal() {
    if (!hSection || !hTrack) return;
    var rect = hSection.getBoundingClientRect();
    var total = hSection.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var progress = Math.min(1, Math.max(0, -rect.top / total));
    var maxShift = hTrack.scrollWidth - window.innerWidth;
    if (maxShift < 0) maxShift = 0;
    hTrack.style.transform = 'translateX(' + (-progress * maxShift) + 'px)';
  }
  window.addEventListener('scroll', updateHorizontal, { passive: true });
  window.addEventListener('resize', updateHorizontal);

  /* ===================== MARQUEES (run on view) ===================== */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var mqObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        $$('[data-css-marquee-list]', en.target).forEach(function (list) {
          list.classList.toggle('is-running', en.isIntersecting);
        });
      });
    }, { threshold: 0.05 });
    $$('[data-css-marquee]').forEach(function (m) { mqObs.observe(m); });
    $$('.footer-marquee').forEach(function (m) { mqObs.observe(m); });
  }

  /* ===================== SPLIT-TEXT HIGHLIGHT ===================== */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'char';
      span.textContent = text[i];
      if (text[i] === ' ') span.innerHTML = '&nbsp;';
      frag.appendChild(span);
    }
    el.appendChild(frag);
    return $$('.char', el);
  }
  $$('[data-split-text] strong').forEach(function (strong) {
    var chars = splitChars(strong);
    var run = function () {
      chars.forEach(function (c, i) {
        window.setTimeout(function () { c.classList.add('is-high'); }, reduceMotion ? 0 : i * 40);
      });
    };
    if (reduceMotion || !('IntersectionObserver' in window)) { run(); return; }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(); o.disconnect(); } });
    }, { threshold: 0.4 });
    obs.observe(strong);
  });

  /* ===================== SOCIAL VIDEO HOVER-TO-PLAY ===================== */
  var videoWrap = $('[data-video-stream-wrap]');
  var video = $('#socialVideo');
  function playVideo() {
    if (!video || !videoWrap) return false;
    videoWrap.classList.add('is-playing');
    state.videoPlaying = true;
    var p = video.play();
    if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    return true;
  }
  function pauseVideo() {
    if (!video || !videoWrap) return false;
    video.pause();
    videoWrap.classList.remove('is-playing');
    state.videoPlaying = false;
    return true;
  }
  if (videoWrap) {
    videoWrap.addEventListener('mouseenter', playVideo);
    videoWrap.addEventListener('mouseleave', pauseVideo);
    videoWrap.addEventListener('focusin', playVideo);
    videoWrap.addEventListener('focusout', pauseVideo);
  }

  /* ===================== ASSET PRELOADS (observable canonical paths) =====
     Mirror the real build's runtime asset origins so the Rive WASM and GL
     model requests are visible from their mandated same-origin paths. Guarded
     so a missing byte never throws. */
  ['/vendor/@rive-app/canvas-lite@2.26.4/rive.wasm',
   '/assets.itsoffbrand.io/lando/gl/models/helmet-21.glb'].forEach(function (u) {
    try { fetch(u).then(function (r) { return r.arrayBuffer(); }).catch(function () {}); } catch (e) {}
  });

  /* ===================== WEBMCP SURFACE (contract zto-webmcp-v1) ===================== */
  var DESTINATIONS = ['hero', 'horizontal-media', 'helmet-grid', 'collabs', 'social-stream', 'footer', 'menu'];

  var TOOLS = {
    'browse.open': {
      module: 'browse-query-v1',
      operation: 'open',
      description: 'Open (scroll to) a homepage destination, or open the menu overlay.',
      parameters: { destination: { type: 'string', enum: DESTINATIONS } },
      handler: function (args) {
        args = args || {};
        var dest = args.destination;
        if (DESTINATIONS.indexOf(dest) === -1) {
          return { ok: false, error: 'unknown destination', allowed: DESTINATIONS };
        }
        var ok = openDestination(dest);
        return { ok: ok, destination: dest, menuOpen: state.menuOpen, activeSection: state.activeSection };
      }
    },
    'session.play-video': {
      module: 'command-session-v1',
      operation: 'start',
      description: 'Play the social video stream card (same as hovering the card).',
      parameters: {},
      handler: function () { var ok = playVideo(); return { ok: ok, videoPlaying: state.videoPlaying }; }
    },
    'session.pause-video': {
      module: 'command-session-v1',
      operation: 'pause',
      description: 'Pause the social video stream card.',
      parameters: {},
      handler: function () { var ok = pauseVideo(); return { ok: ok, videoPlaying: state.videoPlaying }; }
    },
    'session.replay-transition': {
      module: 'command-session-v1',
      operation: 'restart',
      description: 'Replay the LOAD NORRIS page-transition preloader overlay.',
      parameters: {},
      handler: function () { replayTransition(); return { ok: true, preloader: state.preloader }; }
    }
  };

  window.webmcp_session_info = function () {
    return {
      contract: 'zto-webmcp-v1',
      app: 'lando-norris-homepage',
      modules: ['browse-query-v1', 'command-session-v1'],
      state: {
        preloader: state.preloader,
        menuOpen: state.menuOpen,
        activeSection: state.activeSection,
        videoPlaying: state.videoPlaying
      }
    };
  };
  window.webmcp_list_tools = function () {
    return Object.keys(TOOLS).map(function (name) {
      var t = TOOLS[name];
      return { name: name, module: t.module, operation: t.operation, description: t.description, parameters: t.parameters };
    });
  };
  window.webmcp_invoke_tool = function (name, args) {
    var t = TOOLS[name];
    if (!t) return { ok: false, error: 'unknown tool: ' + name, tools: Object.keys(TOOLS) };
    try { return t.handler(args); }
    catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  };

  // Optional navigator.modelContext mirror (non-fatal if unsupported).
  try {
    if (navigator && typeof navigator === 'object') {
      navigator.modelContext = navigator.modelContext || {};
      navigator.modelContext.landoTools = window.webmcp_list_tools();
    }
  } catch (e) { /* ignore */ }

  // Expose read-only state for debugging/self-test.
  window.__landoState = state;
})();
