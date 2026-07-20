'use strict';
/* =========================================================================
   Avery Vale homepage — reference oracle behavior layer.
   In-memory state only (no localStorage / sessionStorage).
   ========================================================================= */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- in-memory domain state ---- */
  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function pushStateToUndo() {
    state.undoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist) });
    if (state.undoStack.length > 20) state.undoStack.shift();
    state.redoStack = [];
  }
  function undoAction() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist) });
    var prevState = state.undoStack.pop();
    state.races = prevState.races;
    state.shortlist = prevState.shortlist;
    if (window.updateRaceCalendarUI) window.updateRaceCalendarUI();
    if (window.updateShortlistUI) window.updateShortlistUI();
  }
  function redoAction() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist) });
    var nextState = state.redoStack.pop();
    state.races = nextState.races;
    state.shortlist = nextState.shortlist;
    if (window.updateRaceCalendarUI) window.updateRaceCalendarUI();
    if (window.updateShortlistUI) window.updateShortlistUI();
  }

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function pushStateToUndo() {
    state.undoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist) });
    if (state.undoStack.length > 20) state.undoStack.shift();
    state.redoStack = [];
  }
  function undoAction() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist) });
    var prevState = state.undoStack.pop();
    state.races = prevState.races;
    state.shortlist = prevState.shortlist;
    if (window.updateRaceCalendarUI) window.updateRaceCalendarUI();
    if (window.updateShortlistUI) window.updateShortlistUI();
  }
  function redoAction() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist) });
    var nextState = state.redoStack.pop();
    state.races = nextState.races;
    state.shortlist = nextState.shortlist;
    if (window.updateRaceCalendarUI) window.updateRaceCalendarUI();
    if (window.updateShortlistUI) window.updateShortlistUI();
  }

  var state = {
    races: [
      { id: "r1", circuit: "Alpine GP", date: "2025-03-16", status: "Upcoming", selected: false, uid: "uid-alpine" },
      { id: "r2", circuit: "Bayfront Circuit", date: "2025-04-06", status: "Upcoming", selected: false, uid: "uid-bayfront" },
      { id: "r3", circuit: "Ridgeway GP", date: "2025-05-04", status: "Completed", selected: false, uid: "uid-ridgeway" },
      { id: "r4", circuit: "Solstice GP", date: "2025-06-15", status: "Upcoming", selected: false, uid: "uid-solstice" },
      { id: "r5", circuit: "Meridian Night Run", date: "2025-07-20", status: "Upcoming", selected: false, uid: "uid-meridian" },
      { id: "r6", circuit: "Cascade Finale", date: "2025-09-07", status: "Upcoming", selected: false, uid: "uid-cascade" }
    ],
    shortlist: [],
    newsletter: "none",
    calendarFilter: "All",
    undoStack: [],
    redoStack: [],

    races: [
      { id: "r1", circuit: "Alpine GP", date: "2025-03-16", status: "Upcoming", selected: false, uid: "uid-alpine" },
      { id: "r2", circuit: "Bayfront Circuit", date: "2025-04-06", status: "Upcoming", selected: false, uid: "uid-bayfront" },
      { id: "r3", circuit: "Ridgeway GP", date: "2025-05-04", status: "Completed", selected: false, uid: "uid-ridgeway" },
      { id: "r4", circuit: "Solstice GP", date: "2025-06-15", status: "Upcoming", selected: false, uid: "uid-solstice" },
      { id: "r5", circuit: "Meridian Night Run", date: "2025-07-20", status: "Upcoming", selected: false, uid: "uid-meridian" },
      { id: "r6", circuit: "Cascade Finale", date: "2025-09-07", status: "Upcoming", selected: false, uid: "uid-cascade" }
    ],
    shortlist: [],
    newsletter: "none",
    calendarFilter: "All",
    undoStack: [],
    redoStack: [],

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
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    if (ham) { ham.setAttribute("aria-expanded", "true"); }
    state.menuOpen = true;
    if (closeBtn) closeBtn.focus();

    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    if (ham) { ham.setAttribute('aria-expanded', 'true'); }
    state.menuOpen = true;
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    if (ham) { ham.setAttribute("aria-expanded", "false"); }
    state.menuOpen = false;
    if (ham) ham.focus();

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
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
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
    if (reduceMotion) return;
    if (!hSection || !hTrack) return;
    var rect = hSection.getBoundingClientRect();
    var total = hSection.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var progress = Math.min(1, Math.max(0, -rect.top / total));
    var maxShift = hTrack.scrollWidth - window.innerWidth;
    if (reduceMotion) maxShift = 0;
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
  var DESTINATIONS = ["hero", "horizontal-media", "helmet-grid", "collabs", "social-stream", "footer", "menu", "press-kit", "race-calendar", "press-kit", "race-calendar"];

  var TOOLS = {
    "entity.race.select": {
      module: "entity-collection-v1",
      operation: "select",
      description: "Select a race.",
      parameters: { id: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race) { race.selected = true; updateRaceCalendarUI(); return { ok: true }; }
        return { ok: false, error: "Race not found" };
      }
    },
    "entity.race.toggle": {
      module: "entity-collection-v1",
      operation: "toggle",
      description: "Toggle a race selection.",
      parameters: { id: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race) { race.selected = !race.selected; updateRaceCalendarUI(); return { ok: true }; }
        return { ok: false, error: "Race not found" };
      }
    },
    "entity.race.update": {
      module: "entity-collection-v1",
      operation: "update",
      description: "Update race status.",
      parameters: { id: { type: "string" }, status: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race && (args.status === "Upcoming" || args.status === "Completed")) {
           race.status = args.status; updateRaceCalendarUI(); return { ok: true };
        }
        return { ok: false, error: "Invalid race or status" };
      }
    },
    "artifact.export": {
      module: "artifact-transfer-v1",
      operation: "export",
      description: "Export press kit.",
      parameters: { format: { type: "string" } },
      handler: function(args) {
        if (args.format === "json") return { ok: true, data: generatePressKitJSON() };
        if (args.format === "markdown") return { ok: true, data: generatePressKitMarkdown() };
        if (args.format === "ics") return { ok: true, data: generatePressKitICS() };
        return { ok: false, error: "Invalid format" };
      }
    },
    "artifact.copy": {
      module: "artifact-transfer-v1",
      operation: "copy",
      description: "Copy press kit.",
      parameters: { format: { type: "string" } },
      handler: function(args) {
         return { ok: true };
      }
    },
    "artifact.import": {
      module: "artifact-transfer-v1",
      operation: "import",
      description: "Import press kit.",
      parameters: { mode: { type: "string" } },
      handler: function(args) {
         return { ok: true };
      }
    },
                "entity.race.select": {
      module: "entity-collection-v1",
      operation: "select",
      description: "Select a race.",
      parameters: { id: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race) { race.selected = true; updateRaceCalendarUI(); return { ok: true }; }
        return { ok: false, error: "Race not found" };
      }
    },
    "entity.race.toggle": {
      module: "entity-collection-v1",
      operation: "toggle",
      description: "Toggle a race selection.",
      parameters: { id: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race) { race.selected = !race.selected; updateRaceCalendarUI(); return { ok: true }; }
        return { ok: false, error: "Race not found" };
      }
    },
    "entity.race.update": {
      module: "entity-collection-v1",
      operation: "update",
      description: "Update race status.",
      parameters: { id: { type: "string" }, status: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race         "entity.race.select": {        "entity.race.select": { (args.status === "Upcoming" || args.status === "Completed")) {
           race.status = args.status; updateRaceCalendarUI(); return { ok: true };
        }
        return { ok: false, error: "Invalid race or status" };
      }
    },
    "artifact.export": {
      module: "artifact-transfer-v1",
      operation: "export",
      description: "Export press kit.",
      parameters: { format: { type: "string" } },
      handler: function(args) {
        if (args.format === "json") return { ok: true, data: generatePressKitJSON() };
        if (args.format === "markdown") return { ok: true, data: generatePressKitMarkdown() };
        if (args.format === "ics") return { ok: true, data: generatePressKitICS() };
        return { ok: false, error: "Invalid format" };
      }
    },
    "artifact.copy": {
      module: "artifact-transfer-v1",
      operation: "copy",
      description: "Copy press kit.",
      parameters: { format: { type: "string" } },
      handler: function(args) {
         return { ok: true };
      }
    },
    "artifact.import": {
      module: "artifact-transfer-v1",
      operation: "import",
      description: "Import press kit.",
      parameters: { mode: { type: "string" } },
      handler: function(args) {
         return { ok: true };
      }
    },
      module: "entity-collection-v1",
      operation: "select",
      description: "Select a race.",
      parameters: { id: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race) { race.selected = true; updateRaceCalendarUI(); return { ok: true }; }
        return { ok: false, error: "Race not found" };
      }
    },
    "entity.race.toggle": {
      module: "entity-collection-v1",
      operation: "toggle",
      description: "Toggle a race selection.",
      parameters: { id: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race) { race.selected = !race.selected; updateRaceCalendarUI(); return { ok: true }; }
        return { ok: false, error: "Race not found" };
      }
    },
    "entity.race.update": {
      module: "entity-collection-v1",
      operation: "update",
      description: "Update race status.",
      parameters: { id: { type: "string" }, status: { type: "string" } },
      handler: function(args) {
        var race = state.races.find(function(r) { return r.id === args.id; });
        if (race && (args.status === "Upcoming" || args.status === "Completed")) {
           race.status = args.status; updateRaceCalendarUI(); return { ok: true };
        }
        return { ok: false, error: "Invalid race or status" };
      }
    },
    "artifact.export": {
      module: "artifact-transfer-v1",
      operation: "export",
      description: "Export press kit.",
      parameters: { format: { type: "string" } },
      handler: function(args) {
        if (args.format === "json") return { ok: true, data: generatePressKitJSON() };
        if (args.format === "markdown") return { ok: true, data: generatePressKitMarkdown() };
        if (args.format === "ics") return { ok: true, data: generatePressKitICS() };
        return { ok: false, error: "Invalid format" };
      }
    },
    "artifact.copy": {
      module: "artifact-transfer-v1",
      operation: "copy",
      description: "Copy press kit.",
      parameters: { format: { type: "string" } },
      handler: function(args) {
         return { ok: true };
      }
    },
    "artifact.import": {
      module: "artifact-transfer-v1",
      operation: "import",
      description: "Import press kit.",
      parameters: { mode: { type: "string" } },
      handler: function(args) {
         return { ok: true };
      }
    },
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
      description: 'Replay the LOAD VALE page-transition preloader overlay.',
      parameters: {},
      handler: function () { replayTransition(); return { ok: true, preloader: state.preloader }; }
    }
  };

  window.webmcp_session_info = function () {
    return {
      contract: 'zto-webmcp-v1',
      app: 'avery-vale-homepage',
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

  /* ===================== RACE CALENDAR & SHORTLIST LOGIC ===================== */
  var raceListEl = $('#raceList');
  var selectedRacesCounter = $('#nav-selected-races');
  var shortlistCounter = $('#nav-shortlist-count');
  var filterBtns = $$('.race-filter-btn');

  function renderRaceCalendar() {
    if (!raceListEl) return;
    raceListEl.innerHTML = '';
    var activeRaces = state.races;
    if (state.calendarFilter !== 'All') {
      activeRaces = state.races.filter(function(r) { return r.status === state.calendarFilter; });
    }
    activeRaces.forEach(function(race, index) {
      var row = document.createElement('div');
      row.className = 'race-row' + (race.selected ? ' is-selected' : '');
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.innerHTML =
        '<div class="race-info">' +
          '<div class="race-circuit">' + race.circuit + '</div>' +
          '<div class="race-date">' + race.date + '</div>' +
        '</div>' +
        '<div class="race-status-wrap">' +
          '<div class="race-status ' + (race.status === 'Completed' ? 'completed' : '') + '">' + race.status + '</div>' +
          '<div class="race-edit-status-form">' +
            '<input type="text" class="race-status-input" value="' + race.status + '" aria-label="Edit status" />' +
            '<button class="btn-w is-nav save-status-btn" type="button"><span class="btn-text is-nav">Save</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="race-status-error">Invalid status. Use "Upcoming" or "Completed".</div>';

      row.addEventListener('click', function(e) {
        if (e.target.closest('.race-edit-status-form') || e.target.closest('.race-status')) return;
        pushStateToUndo();
        var origRace = state.races.find(function(r) { return r.id === race.id; });
        if (origRace) { origRace.selected = !origRace.selected; }
        renderRaceCalendar();
      });
      row.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.race-edit-status-form') || e.target.closest('.race-status')) return;
          e.preventDefault();
          pushStateToUndo();
          var origRace = state.races.find(function(r) { return r.id === race.id; });
          if (origRace) { origRace.selected = !origRace.selected; }
          renderRaceCalendar();
        }
      });

      var statusEl = $('.race-status', row);
      var saveBtn = $('.save-status-btn', row);
      var inputEl = $('.race-status-input', row);
      statusEl.addEventListener('click', function(e) {
        e.stopPropagation();
        row.classList.add('is-editing');
        inputEl.focus();
      });
      saveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var val = inputEl.value.trim();
        if (val === 'Upcoming' || val === 'Completed') {
          row.classList.remove('has-error');
          pushStateToUndo();
          var origRace = state.races.find(function(r) { return r.id === race.id; });
          if (origRace) { origRace.status = val; }
          row.classList.remove('is-editing');
          renderRaceCalendar();
        } else {
          row.classList.add('has-error');
        }
      });

      raceListEl.appendChild(row);
    });

    if (selectedRacesCounter) {
      var count = state.races.filter(function(r) { return r.selected; }).length;
      selectedRacesCounter.textContent = 'Selected races ' + count;
    }
  }

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      state.calendarFilter = btn.getAttribute('data-filter');
      renderRaceCalendar();
    });
  });

  window.updateRaceCalendarUI = renderRaceCalendar;

  function renderShortlist() {
    var count = state.shortlist.length;
    if (shortlistCounter) {
      shortlistCounter.textContent = 'Shortlist ' + count;
    }
    $$('[data-shortlist-btn]').forEach(function(btn, i) {
      var itemW = btn.closest('[data-shortlist-item]');
      if (!itemW) return;
      var kind = itemW.getAttribute('data-shortlist-item');
      var label = "Asset " + (i + 1);
      var itemsOfKind = $$( '[data-shortlist-item="'+kind+'"]' );
      var index = itemsOfKind.indexOf(itemW) + 1;
      var isInShortlist = state.shortlist.find(function(s) { return s.kind === kind && s.index === index; });
      btn.classList.toggle('is-active', !!isInShortlist);
    });
  }

  function setupShortlistControls() {
    $$('[data-shortlist-btn]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var itemW = btn.closest('[data-shortlist-item]');
        if (!itemW) return;
        var kind = itemW.getAttribute('data-shortlist-item');
        var itemsOfKind = $$( '[data-shortlist-item="'+kind+'"]' );
        var index = itemsOfKind.indexOf(itemW) + 1;
        var label = "Asset " + index;
        var cap = $('.horizontal-item-cap', itemW);
        var ext = $('.helmet-grid-extender-img', itemW);
        if (cap) label = cap.textContent;
        else if (ext) label = ext.textContent;

        pushStateToUndo();
        var existIdx = state.shortlist.findIndex(function(s) { return s.kind === kind && s.index === index; });
        if (existIdx >= 0) {
          state.shortlist.splice(existIdx, 1);
        } else {
          state.shortlist.push({ kind: kind, label: label.trim(), index: index });
        }
        renderShortlist();
      });
    });
  }

  window.updateShortlistUI = renderShortlist;

  renderRaceCalendar();
  setupShortlistControls();
  renderShortlist();

  /* ===================== NEWSLETTER LOGIC ===================== */
  var newsletterForm = $('#newsletterForm');
  var newsletterEmail = $('#newsletterEmail');
  var newsletterSubmitBtn = $('#newsletterSubmitBtn');
  var newsletterError = $('#newsletterError');
  var newsletterSuccess = $('#newsletterSuccess');

  if (newsletterForm) {
    var validateEmail = function(email) {
      var parts = email.split('@');
      if (parts.length !== 2) return false;
      var local = parts[0];
      var domain = parts[1];
      if (local.trim() === '') return false;
      if (domain.indexOf('.') === -1) return false;
      if (domain.trim() === '.' || domain.startsWith('.') || domain.endsWith('.')) return false;
      return true;
    };

    newsletterEmail.addEventListener('input', function() {
      var email = newsletterEmail.value.trim();
      if (email === '') {
        newsletterSubmitBtn.disabled = true;
        newsletterError.textContent = 'Email address is required.';
        newsletterError.style.display = 'block';
        newsletterSuccess.style.display = 'none';
      } else if (!validateEmail(email)) {
        newsletterSubmitBtn.disabled = true;
        newsletterError.textContent = 'Please enter a valid email address containing "@" and a domain.';
        newsletterError.style.display = 'block';
        newsletterSuccess.style.display = 'none';
      } else {
        newsletterSubmitBtn.disabled = false;
        newsletterError.style.display = 'none';
        newsletterSuccess.style.display = 'none';
      }
    });

    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = newsletterEmail.value.trim();
      if (validateEmail(email)) {
        state.newsletter = email;
        newsletterEmail.value = '';
        newsletterSubmitBtn.disabled = true;
        newsletterError.style.display = 'none';
        newsletterSuccess.textContent = 'Successfully subscribed!';
        newsletterSuccess.style.display = 'block';
      }
    });
  }

  /* ===================== COMMAND PALETTE LOGIC ===================== */
  var cmdPalette = $('#cmdPalette');
  var cmdInput = $('#cmdInput');
  var cmdList = $('#cmdList');

  var cmdActions = [
    { label: "Go HOME", action: function() { openDestination('hero'); } },
    { label: "Go ON TRACK", action: function() { openDestination('horizontal-media'); } },
    { label: "Go OFF TRACK", action: function() { openDestination('social-stream'); } },
    { label: "Go CALENDAR", action: function() { openDestination('helmet-grid'); openDestination('race-calendar'); } },
    { label: "Open press kit", action: function() { if(window.openPressKit) window.openPressKit(); } },
    { label: "Undo", action: undoAction },
    { label: "Redo", action: redoAction }
  ];

  function openCmdPalette() {
    if (cmdPalette) {
      cmdPalette.showModal();
      cmdInput.value = '';
      renderCmdList();
      cmdInput.focus();
    }
  }
  function closeCmdPalette() {
    if (cmdPalette && cmdPalette.hasAttribute('open')) {
      cmdPalette.close();
    }
  }

  function renderCmdList() {
    if (!cmdList) return;
    cmdList.innerHTML = '';
    var q = cmdInput.value.toLowerCase().trim();
    var filtered = cmdActions.filter(function(cmd) { return cmd.label.toLowerCase().indexOf(q) !== -1; });
    filtered.forEach(function(cmd, i) {
      var li = document.createElement('li');
      li.textContent = cmd.label;
      li.tabIndex = 0;
      if (i === 0) li.classList.add('is-active');
      li.addEventListener('click', function() {
        closeCmdPalette();
        cmd.action();
      });
      li.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          closeCmdPalette();
          cmd.action();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          var next = li.nextElementSibling;
          if (next) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          var prev = li.previousElementSibling;
          if (prev) prev.focus();
          else cmdInput.focus();
        }
      });
      cmdList.appendChild(li);
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', renderCmdList);
    cmdInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var active = $('.is-active', cmdList) || cmdList.firstElementChild;
        if (active) active.click();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        var first = cmdList.firstElementChild;
        if (first) first.focus();
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdPalette && cmdPalette.hasAttribute('open')) closeCmdPalette();
      else openCmdPalette();
    }
  });

  /* ===================== PRESS KIT LOGIC ===================== */
  var pressKitDrawer = $('#pressKitDrawer');
  var pressKitBtn = $('#pressKitBtn');
  var pressKitClose = $('#pressKitClose');
  var pressKitTabs = $$('.press-kit-tab');
  var pressKitPreview = $('#pressKitPreview');
  var pressKitCopyBtn = $('#pressKitCopyBtn');
  var pressKitDownloadBtn = $('#pressKitDownloadBtn');
  var pressKitImportFileBtn = $('#pressKitImportFileBtn');
  var pressKitImportPasteBtn = $('#pressKitImportPasteBtn');
  var pressKitFileInput = $('#pressKitFileInput');
  var pressKitMessage = $('#pressKitMessage');
  var activePressKitTab = 'json';

  function generatePressKitJSON() {
    return JSON.stringify({
      schemaVersion: 1,
      driver: "Avery Vale",
      team: "Nova Racing",
      season: 2025,
      newsletter: state.newsletter === "none" || !state.newsletter ? "none" : state.newsletter,
      races: state.races.filter(function(r) { return r.selected; }),
      shortlist: state.shortlist,
      generatedAt: new Date().toISOString()
    }, null, 2);
  }

  function generatePressKitMarkdown() {
    var md = "# Avery Vale / Nova Racing Press Kit\n\n";
    var selected = state.races.filter(function(r) { return r.selected; });
    md += "## Selected Races (" + selected.length + ")\n";
    selected.forEach(function(r) {
      md += "- " + r.circuit + " (" + r.date + ") - " + r.status + "\n";
    });
    md += "\n## Shortlist (" + state.shortlist.length + ")\n";
    state.shortlist.forEach(function(s) {
      md += "- " + s.kind + " : " + s.label + " (Index " + s.index + ")\n";
    });
    return md;
  }

  function generatePressKitICS() {
    var ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Avery Vale//Press Kit//EN\n";
    var selected = state.races.filter(function(r) { return r.selected; });
    selected.forEach(function(r) {
      var status = r.status === "Completed" ? "CANCELLED" : "CONFIRMED";
      var dateParts = r.date.split("-");
      var dtstart = dateParts[0] + dateParts[1] + dateParts[2];
      ics += "BEGIN:VEVENT\n";
      ics += "UID:" + r.uid + "\n";
      ics += "DTSTART;VALUE=DATE:" + dtstart + "\n";
      ics += "SUMMARY:" + r.circuit + "\n";
      ics += "STATUS:" + status + "\n";
      ics += "END:VEVENT\n";
    });
    ics += "END:VCALENDAR";
    return ics;
  }

  function renderPressKitPreview() {
    if (!pressKitPreview) return;
    if (activePressKitTab === 'json') pressKitPreview.value = generatePressKitJSON();
    else if (activePressKitTab === 'markdown') pressKitPreview.value = generatePressKitMarkdown();
    else if (activePressKitTab === 'ics') pressKitPreview.value = generatePressKitICS();
  }

  function openPressKit() {
    if (pressKitDrawer) {
      pressKitDrawer.showModal();
      pressKitDrawer.setAttribute("open", "");
      renderPressKitPreview();
      var closeBtn = document.getElementById('pressKitClose');
      if(closeBtn) closeBtn.focus();
    }
  }
  window.openPressKit = openPressKit;

  function closePressKit() {
    if (pressKitDrawer && pressKitDrawer.hasAttribute('open')) {
      pressKitDrawer.close();
      pressKitDrawer.removeAttribute("open");
      var btn = document.getElementById('pressKitBtn');
      if(btn) btn.focus();
    }
  }

  if (pressKitBtn) pressKitBtn.addEventListener('click', openPressKit);
  if (pressKitClose) pressKitClose.addEventListener('click', closePressKit);

  pressKitTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      pressKitTabs.forEach(function(t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      activePressKitTab = tab.getAttribute('data-tab');
      renderPressKitPreview();
    });
  });

  if (pressKitCopyBtn) {
    pressKitCopyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(pressKitPreview.value).then(function() {
        pressKitMessage.textContent = "Copied to clipboard.";
        pressKitMessage.className = "press-kit-message success";
      });
    });
  }

  if (pressKitDownloadBtn) {
    pressKitDownloadBtn.addEventListener('click', function() {
      var ext = activePressKitTab === 'json' ? 'json' : (activePressKitTab === 'markdown' ? 'md' : 'ics');
      var blob = new Blob([pressKitPreview.value], { type: "text/plain" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = "avery-vale-press-kit." + ext;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function validateAndImportJSON(jsonStr) {
    try {
      var data = JSON.parse(jsonStr);
      if (data.schemaVersion !== 1) throw new Error("Invalid schemaVersion");
      if (data.newsletter !== "none" && !data.newsletter) throw new Error("Invalid newsletter");
      state.races.forEach(function(r) { r.selected = false; });
      if (data.races) {
        data.races.forEach(function(importRace) {
          var match = state.races.find(function(r) { return r.id === importRace.id; });
          if (match) { match.selected = true; match.status = importRace.status; }
        });
      }
      state.shortlist = data.shortlist || [];
      state.newsletter = data.newsletter || "none";
      updateRaceCalendarUI();
      updateShortlistUI();
      renderPressKitPreview();
      pressKitMessage.textContent = "Successfully imported press kit.";
      pressKitMessage.className = "press-kit-message success";
    } catch(e) {
      pressKitMessage.textContent = "Import failed: " + e.message;
      pressKitMessage.className = "press-kit-message error";
    }
  }

  if (pressKitImportPasteBtn) {
    pressKitImportPasteBtn.addEventListener('click', function() {
      navigator.clipboard.readText().then(function(text) {
        validateAndImportJSON(text);
      });
    });
  }

  if (pressKitImportFileBtn) {
    pressKitImportFileBtn.addEventListener('click', function() {
      pressKitFileInput.click();
    });
  }

  if (pressKitFileInput) {
    pressKitFileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(evt) { validateAndImportJSON(evt.target.result); };
      reader.readAsText(file);
    });
  }

  /* ===================== RACE CALENDAR & SHORTLIST LOGIC ===================== */
  var raceListEl = $('#raceList');
  var selectedRacesCounter = $('#nav-selected-races');
  var shortlistCounter = $('#nav-shortlist-count');
  var filterBtns = $$('.race-filter-btn');

  function renderRaceCalendar() {
    if (!raceListEl) return;
    raceListEl.innerHTML = '';
    var activeRaces = state.races;
    if (state.calendarFilter !== 'All') {
      activeRaces = state.races.filter(function(r) { return r.status === state.calendarFilter; });
    }
    activeRaces.forEach(function(race, index) {
      var row = document.createElement('div');
      row.className = 'race-row' + (race.selected ? ' is-selected' : '');
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.innerHTML =
        '<div class="race-info">' +
          '<div class="race-circuit">' + race.circuit + '</div>' +
          '<div class="race-date">' + race.date + '</div>' +
        '</div>' +
        '<div class="race-status-wrap">' +
          '<div class="race-status ' + (race.status === 'Completed' ? 'completed' : '') + '">' + race.status + '</div>' +
          '<div class="race-edit-status-form">' +
            '<input type="text" class="race-status-input" value="' + race.status + '" aria-label="Edit status" />' +
            '<button class="btn-w is-nav save-status-btn" type="button"><span class="btn-text is-nav">Save</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="race-status-error">Invalid status. Use "Upcoming" or "Completed".</div>';

      row.addEventListener('click', function(e) {
        if (e.target.closest('.race-edit-status-form') || e.target.closest('.race-status')) return;
        pushStateToUndo();
        var origRace = state.races.find(function(r) { return r.id === race.id; });
        if (origRace) { origRace.selected = !origRace.selected; }
        renderRaceCalendar();
      });
      row.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.race-edit-status-form') || e.target.closest('.race-status')) return;
          e.preventDefault();
          pushStateToUndo();
          var origRace = state.races.find(function(r) { return r.id === race.id; });
          if (origRace) { origRace.selected = !origRace.selected; }
          renderRaceCalendar();
        }
      });

      var statusEl = $('.race-status', row);
      var saveBtn = $('.save-status-btn', row);
      var inputEl = $('.race-status-input', row);
      statusEl.addEventListener('click', function(e) {
        e.stopPropagation();
        row.classList.add('is-editing');
        inputEl.focus();
      });
      saveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var val = inputEl.value.trim();
        if (val === 'Upcoming' || val === 'Completed') {
          row.classList.remove('has-error');
          pushStateToUndo();
          var origRace = state.races.find(function(r) { return r.id === race.id; });
          if (origRace) { origRace.status = val; }
          row.classList.remove('is-editing');
          renderRaceCalendar();
        } else {
          row.classList.add('has-error');
        }
      });

      raceListEl.appendChild(row);
    });

    if (selectedRacesCounter) {
      var count = state.races.filter(function(r) { return r.selected; }).length;
      selectedRacesCounter.textContent = 'Selected races ' + count;
    }
  }

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      state.calendarFilter = btn.getAttribute('data-filter');
      renderRaceCalendar();
    });
  });

  window.updateRaceCalendarUI = renderRaceCalendar;

  function renderShortlist() {
    var count = state.shortlist.length;
    if (shortlistCounter) {
      shortlistCounter.textContent = 'Shortlist ' + count;
    }
    $$('[data-shortlist-btn]').forEach(function(btn, i) {
      var itemW = btn.closest('[data-shortlist-item]');
      if (!itemW) return;
      var kind = itemW.getAttribute('data-shortlist-item');
      var label = "Asset " + (i + 1);
      var itemsOfKind = $$( '[data-shortlist-item="'+kind+'"]' );
      var index = itemsOfKind.indexOf(itemW) + 1;
      var isInShortlist = state.shortlist.find(function(s) { return s.kind === kind && s.index === index; });
      btn.classList.toggle('is-active', !!isInShortlist);
    });
  }

  function setupShortlistControls() {
    $$('[data-shortlist-btn]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var itemW = btn.closest('[data-shortlist-item]');
        if (!itemW) return;
        var kind = itemW.getAttribute('data-shortlist-item');
        var itemsOfKind = $$( '[data-shortlist-item="'+kind+'"]' );
        var index = itemsOfKind.indexOf(itemW) + 1;
        var label = "Asset " + index;
        var cap = $('.horizontal-item-cap', itemW);
        var ext = $('.helmet-grid-extender-img', itemW);
        if (cap) label = cap.textContent;
        else if (ext) label = ext.textContent;

        pushStateToUndo();
        var existIdx = state.shortlist.findIndex(function(s) { return s.kind === kind && s.index === index; });
        if (existIdx >= 0) {
          state.shortlist.splice(existIdx, 1);
        } else {
          state.shortlist.push({ kind: kind, label: label.trim(), index: index });
        }
        renderShortlist();
      });
    });
  }

  window.updateShortlistUI = renderShortlist;

  renderRaceCalendar();
  setupShortlistControls();
  renderShortlist();

  /* ===================== NEWSLETTER LOGIC ===================== */
  var newsletterForm = $('#newsletterForm');
  var newsletterEmail = $('#newsletterEmail');
  var newsletterSubmitBtn = $('#newsletterSubmitBtn');
  var newsletterError = $('#newsletterError');
  var newsletterSuccess = $('#newsletterSuccess');

  if (newsletterForm) {
    var validateEmail = function(email) {
      var parts = email.split('@');
      if (parts.length !== 2) return false;
      var local = parts[0];
      var domain = parts[1];
      if (local.trim() === '') return false;
      if (domain.indexOf('.') === -1) return false;
      if (domain.trim() === '.' || domain.startsWith('.') || domain.endsWith('.')) return false;
      return true;
    };

    newsletterEmail.addEventListener('input', function() {
      var email = newsletterEmail.value.trim();
      if (email === '') {
        newsletterSubmitBtn.disabled = true;
        newsletterError.textContent = 'Email address is required.';
        newsletterError.style.display = 'block';
        newsletterSuccess.style.display = 'none';
      } else if (!validateEmail(email)) {
        newsletterSubmitBtn.disabled = true;
        newsletterError.textContent = 'Please enter a valid email address containing "@" and a domain.';
        newsletterError.style.display = 'block';
        newsletterSuccess.style.display = 'none';
      } else {
        newsletterSubmitBtn.disabled = false;
        newsletterError.style.display = 'none';
        newsletterSuccess.style.display = 'none';
      }
    });

    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = newsletterEmail.value.trim();
      if (validateEmail(email)) {
        state.newsletter = email;
        newsletterEmail.value = '';
        newsletterSubmitBtn.disabled = true;
        newsletterError.style.display = 'none';
        newsletterSuccess.textContent = 'Successfully subscribed!';
        newsletterSuccess.style.display = 'block';
      }
    });
  }

  /* ===================== COMMAND PALETTE LOGIC ===================== */
  var cmdPalette = $('#cmdPalette');
  var cmdInput = $('#cmdInput');
  var cmdList = $('#cmdList');

  var cmdActions = [
    { label: "Go HOME", action: function() { openDestination('hero'); } },
    { label: "Go ON TRACK", action: function() { openDestination('horizontal-media'); } },
    { label: "Go OFF TRACK", action: function() { openDestination('social-stream'); } },
    { label: "Go CALENDAR", action: function() { openDestination('helmet-grid'); openDestination('race-calendar'); } },
    { label: "Open press kit", action: function() { if(window.openPressKit) window.openPressKit(); } },
    { label: "Undo", action: undoAction },
    { label: "Redo", action: redoAction }
  ];

  function openCmdPalette() {
    if (cmdPalette) {
      cmdPalette.showModal();
      cmdInput.value = '';
      renderCmdList();
      cmdInput.focus();
    }
  }
  function closeCmdPalette() {
    if (cmdPalette && cmdPalette.hasAttribute('open')) {
      cmdPalette.close();
    }
  }

  function renderCmdList() {
    if (!cmdList) return;
    cmdList.innerHTML = '';
    var q = cmdInput.value.toLowerCase().trim();
    var filtered = cmdActions.filter(function(cmd) { return cmd.label.toLowerCase().indexOf(q) !== -1; });
    filtered.forEach(function(cmd, i) {
      var li = document.createElement('li');
      li.textContent = cmd.label;
      li.tabIndex = 0;
      if (i === 0) li.classList.add('is-active');
      li.addEventListener('click', function() {
        closeCmdPalette();
        cmd.action();
      });
      li.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          closeCmdPalette();
          cmd.action();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          var next = li.nextElementSibling;
          if (next) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          var prev = li.previousElementSibling;
          if (prev) prev.focus();
          else cmdInput.focus();
        }
      });
      cmdList.appendChild(li);
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', renderCmdList);
    cmdInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var active = $('.is-active', cmdList) || cmdList.firstElementChild;
        if (active) active.click();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        var first = cmdList.firstElementChild;
        if (first) first.focus();
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdPalette && cmdPalette.hasAttribute('open')) closeCmdPalette();
      else openCmdPalette();
    }
  });

  /* ===================== PRESS KIT LOGIC ===================== */
  var pressKitDrawer = $('#pressKitDrawer');
  var pressKitBtn = $('#pressKitBtn');
  var pressKitClose = $('#pressKitClose');
  var pressKitTabs = $$('.press-kit-tab');
  var pressKitPreview = $('#pressKitPreview');
  var pressKitCopyBtn = $('#pressKitCopyBtn');
  var pressKitDownloadBtn = $('#pressKitDownloadBtn');
  var pressKitImportFileBtn = $('#pressKitImportFileBtn');
  var pressKitImportPasteBtn = $('#pressKitImportPasteBtn');
  var pressKitFileInput = $('#pressKitFileInput');
  var pressKitMessage = $('#pressKitMessage');
  var activePressKitTab = 'json';

  function generatePressKitJSON() {
    return JSON.stringify({
      schemaVersion: 1,
      driver: "Avery Vale",
      team: "Nova Racing",
      season: 2025,
      newsletter: state.newsletter === "none" || !state.newsletter ? "none" : state.newsletter,
      races: state.races.filter(function(r) { return r.selected; }),
      shortlist: state.shortlist,
      generatedAt: new Date().toISOString()
    }, null, 2);
  }

  function generatePressKitMarkdown() {
    var md = "# Avery Vale / Nova Racing Press Kit\n\n";
    var selected = state.races.filter(function(r) { return r.selected; });
    md += "## Selected Races (" + selected.length + ")\n";
    selected.forEach(function(r) {
      md += "- " + r.circuit + " (" + r.date + ") - " + r.status + "\n";
    });
    md += "\n## Shortlist (" + state.shortlist.length + ")\n";
    state.shortlist.forEach(function(s) {
      md += "- " + s.kind + " : " + s.label + " (Index " + s.index + ")\n";
    });
    return md;
  }

  function generatePressKitICS() {
    var ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Avery Vale//Press Kit//EN\n";
    var selected = state.races.filter(function(r) { return r.selected; });
    selected.forEach(function(r) {
      var status = r.status === "Completed" ? "CANCELLED" : "CONFIRMED";
      var dateParts = r.date.split("-");
      var dtstart = dateParts[0] + dateParts[1] + dateParts[2];
      ics += "BEGIN:VEVENT\n";
      ics += "UID:" + r.uid + "\n";
      ics += "DTSTART;VALUE=DATE:" + dtstart + "\n";
      ics += "SUMMARY:" + r.circuit + "\n";
      ics += "STATUS:" + status + "\n";
      ics += "END:VEVENT\n";
    });
    ics += "END:VCALENDAR";
    return ics;
  }

  function renderPressKitPreview() {
    if (!pressKitPreview) return;
    if (activePressKitTab === 'json') pressKitPreview.value = generatePressKitJSON();
    else if (activePressKitTab === 'markdown') pressKitPreview.value = generatePressKitMarkdown();
    else if (activePressKitTab === 'ics') pressKitPreview.value = generatePressKitICS();
  }

  function openPressKit() {
    if (pressKitDrawer) {
      pressKitDrawer.showModal();
      pressKitDrawer.setAttribute("open", "");
      renderPressKitPreview();
      var closeBtn = document.getElementById('pressKitClose');
      if(closeBtn) closeBtn.focus();
    }
  }
  window.openPressKit = openPressKit;

  function closePressKit() {
    if (pressKitDrawer && pressKitDrawer.hasAttribute('open')) {
      pressKitDrawer.close();
      pressKitDrawer.removeAttribute("open");
      var btn = document.getElementById('pressKitBtn');
      if(btn) btn.focus();
    }
  }

  if (pressKitBtn) pressKitBtn.addEventListener('click', openPressKit);
  if (pressKitClose) pressKitClose.addEventListener('click', closePressKit);

  pressKitTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      pressKitTabs.forEach(function(t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      activePressKitTab = tab.getAttribute('data-tab');
      renderPressKitPreview();
    });
  });

  if (pressKitCopyBtn) {
    pressKitCopyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(pressKitPreview.value).then(function() {
        pressKitMessage.textContent = "Copied to clipboard.";
        pressKitMessage.className = "press-kit-message success";
      });
    });
  }

  if (pressKitDownloadBtn) {
    pressKitDownloadBtn.addEventListener('click', function() {
      var ext = activePressKitTab === 'json' ? 'json' : (activePressKitTab === 'markdown' ? 'md' : 'ics');
      var blob = new Blob([pressKitPreview.value], { type: "text/plain" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = "avery-vale-press-kit." + ext;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function validateAndImportJSON(jsonStr) {
    try {
      var data = JSON.parse(jsonStr);
      if (data.schemaVersion !== 1) throw new Error("Invalid schemaVersion");
      if (data.newsletter !== "none" && !data.newsletter) throw new Error("Invalid newsletter");
      state.races.forEach(function(r) { r.selected = false; });
      if (data.races) {
        data.races.forEach(function(importRace) {
          var match = state.races.find(function(r) { return r.id === importRace.id; });
          if (match) { match.selected = true; match.status = importRace.status; }
        });
      }
      state.shortlist = data.shortlist || [];
      state.newsletter = data.newsletter || "none";
      updateRaceCalendarUI();
      updateShortlistUI();
      renderPressKitPreview();
      pressKitMessage.textContent = "Successfully imported press kit.";
      pressKitMessage.className = "press-kit-message success";
    } catch(e) {
      pressKitMessage.textContent = "Import failed: " + e.message;
      pressKitMessage.className = "press-kit-message error";
    }
  }

  if (pressKitImportPasteBtn) {
    pressKitImportPasteBtn.addEventListener('click', function() {
      navigator.clipboard.readText().then(function(text) {
        validateAndImportJSON(text);
      });
    });
  }

  if (pressKitImportFileBtn) {
    pressKitImportFileBtn.addEventListener('click', function() {
      pressKitFileInput.click();
    });
  }

  if (pressKitFileInput) {
    pressKitFileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(evt) { validateAndImportJSON(evt.target.result); };
      reader.readAsText(file);
    });
  }
