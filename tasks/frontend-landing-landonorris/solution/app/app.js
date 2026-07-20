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
    state.undoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist), newsletter: state.newsletter });
    if (state.undoStack.length > 20) state.undoStack.shift();
    state.redoStack = [];
  }
  function undoAction() {
    if (state.undoStack.length === 0) return;
    var currentNewsletter = state.newsletter;
    state.redoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist), newsletter: state.newsletter });
    var prevState = state.undoStack.pop();
    state.races = prevState.races;
    state.shortlist = prevState.shortlist;
    state.newsletter = prevState.newsletter;
    if (window.updateRaceCalendarUI) window.updateRaceCalendarUI();
    if (window.updateShortlistUI) window.updateShortlistUI();
    if (state.newsletter !== currentNewsletter) renderNewsletterState();
    renderPressKitPreview();
  }
  function redoAction() {
    if (state.redoStack.length === 0) return;
    var currentNewsletter = state.newsletter;
    state.undoStack.push({ races: deepClone(state.races), shortlist: deepClone(state.shortlist), newsletter: state.newsletter });
    var nextState = state.redoStack.pop();
    state.races = nextState.races;
    state.shortlist = nextState.shortlist;
    state.newsletter = nextState.newsletter;
    if (window.updateRaceCalendarUI) window.updateRaceCalendarUI();
    if (window.updateShortlistUI) window.updateShortlistUI();
    if (state.newsletter !== currentNewsletter) renderNewsletterState();
    renderPressKitPreview();
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
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    if (ham) { ham.setAttribute("aria-expanded", "false"); }
    state.menuOpen = false;
    if (ham) ham.focus();
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
    if (dest === 'press-kit') {
      if (!document.getElementById('pressKitDrawer')) return false;
      if (state.menuOpen) closeMenu();
      if (!openPressKit()) return false;
      state.activeSection = dest;
      return true;
    }
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
  var DESTINATIONS = ["hero", "horizontal-media", "helmet-grid", "collabs", "social-stream", "footer", "menu", "press-kit", "race-calendar"];

  var TOOLS = {
    "entity.race.select": {
      module: "entity-collection-v1",
      operation: "select",
      description: "Select a race.",
      parameters: { id: { type: "string" } },
      handler: function (args) {
        var race = state.races.find(function (item) { return item.id === args.id; });
        if (!race) return { ok: false, error: "Race not found" };
        if (race.selected) return { ok: true };
        pushStateToUndo();
        race.selected = true;
        renderRaceCalendar();
        return { ok: true };
      }
    },
    "entity.race.toggle": {
      module: "entity-collection-v1",
      operation: "toggle",
      description: "Toggle a race selection.",
      parameters: { id: { type: "string" } },
      handler: function (args) {
        var race = state.races.find(function (item) { return item.id === args.id; });
        if (!race) return { ok: false, error: "Race not found" };
        pushStateToUndo();
        race.selected = !race.selected;
        renderRaceCalendar();
        return { ok: true };
      }
    },
    "entity.race.update": {
      module: "entity-collection-v1",
      operation: "update",
      description: "Update race status.",
      parameters: { id: { type: "string" }, status: { type: "string" } },
      handler: function (args) {
        var race = state.races.find(function (item) { return item.id === args.id; });
        if (!race || (args.status !== "Upcoming" && args.status !== "Completed")) {
          return { ok: false, error: "Invalid race or status" };
        }
        if (race.status === args.status) return { ok: true };
        pushStateToUndo();
        race.status = args.status;
        renderRaceCalendar();
        return { ok: true };
      }
    },
    "artifact.export": {
      module: "artifact-transfer-v1",
      operation: "export",
      description: "Export press kit.",
      parameters: { format: { type: "string" } },
      handler: function (args) {
        args = args || {};
        if (!selectPressKitFormat(args.format)) return { ok: false, error: "Invalid format" };
        if (!openPressKit()) return { ok: false, error: "Press kit is unavailable" };
        return { ok: true, format: args.format, destination: "press-kit" };
      }
    },
    "artifact.copy": {
      module: "artifact-transfer-v1",
      operation: "copy",
      description: "Copy press kit.",
      parameters: { format: { type: "string" } },
      handler: function (args) {
        args = args || {};
        if (!selectPressKitFormat(args.format)) return { ok: false, error: "Invalid format" };
        if (!openPressKit()) return { ok: false, error: "Press kit is unavailable" };
        return copyPressKitPreview().then(function (ok) {
          return ok ? { ok: true, format: args.format } : { ok: false, error: "Clipboard write failed" };
        });
      }
    },
    "artifact.import": {
      module: "artifact-transfer-v1",
      operation: "import",
      description: "Import press kit.",
      parameters: { mode: { type: "string" } },
      handler: function (args) {
        args = args || {};
        if (args.mode !== "paste") return { ok: false, error: "Only paste mode is available through WebMCP" };
        if (!openPressKit()) return { ok: false, error: "Press kit is unavailable" };
        selectPressKitFormat("json");
        return importPressKitFromClipboard().then(function (ok) {
          return ok ? { ok: true, mode: "paste" } : { ok: false, error: "Clipboard import failed" };
        });
      }
    },
    "browse.open": {
      module: "browse-query-v1",
      operation: "open",
      description: "Open (scroll to) a homepage destination, or open the menu overlay.",
      parameters: { destination: { type: "string", enum: DESTINATIONS } },
      handler: function (args) {
        args = args || {};
        var dest = args.destination;
        if (DESTINATIONS.indexOf(dest) === -1) {
          return { ok: false, error: "unknown destination", allowed: DESTINATIONS };
        }
        var ok = openDestination(dest);
        return { ok: ok, destination: dest, menuOpen: state.menuOpen, activeSection: state.activeSection };
      }
    },
    "session.play-video": {
      module: "command-session-v1",
      operation: "start",
      description: "Play the social video stream card (same as hovering the card).",
      parameters: {},
      handler: function () { var ok = playVideo(); return { ok: ok, videoPlaying: state.videoPlaying }; }
    },
    "session.pause-video": {
      module: "command-session-v1",
      operation: "pause",
      description: "Pause the social video stream card.",
      parameters: {},
      handler: function () { var ok = pauseVideo(); return { ok: ok, videoPlaying: state.videoPlaying }; }
    },
    "session.replay-transition": {
      module: "command-session-v1",
      operation: "restart",
      description: "Replay the LOAD VALE page-transition preloader overlay.",
      parameters: {},
      handler: function () { replayTransition(); return { ok: true, preloader: state.preloader }; }
    }
  };

  window.webmcp_session_info = function () {
    return {
      contract: 'zto-webmcp-v1',
      app: 'avery-vale-homepage',
      modules: ['browse-query-v1', 'command-session-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
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
  /* ===================== RACE CALENDAR & SHORTLIST LOGIC ===================== */
  var raceListEl = $('#raceList');
  var selectedRacesCounters = $$('[data-selected-races-count]');
  var shortlistCounter = $('#nav-shortlist-count');
  var filterBtns = $$('.race-filter-btn');

  function renderRaceCalendar() {
    var count = state.races.filter(function(r) { return r.selected; }).length;
    selectedRacesCounters.forEach(function(counter) { counter.textContent = 'Selected races ' + count; });
    if (!raceListEl) {
      renderPressKitPreview();
      return;
    }
    raceListEl.innerHTML = '';
    var activeRaces = state.races;
    if (state.calendarFilter !== 'All') {
      activeRaces = state.races.filter(function(r) { return r.status === state.calendarFilter; });
    }
    activeRaces.forEach(function(race, index) {
      var row = document.createElement('div');
      row.className = 'race-row' + (race.selected ? ' is-selected' : '');
      row.innerHTML =
        '<button type="button" class="race-info race-select-btn" aria-pressed="' + (race.selected ? 'true' : 'false') + '">' +
          '<div class="race-circuit">' + race.circuit + '</div>' +
          '<div class="race-date">' + race.date + '</div>' +
        '</button>' +
        '<div class="race-status-wrap">' +
          '<button type="button" class="race-status ' + (race.status === 'Completed' ? 'completed' : '') + '" aria-label="Edit status for ' + race.circuit + '">' + race.status + '</button>' +
          '<div class="race-edit-status-form">' +
            '<input type="text" class="race-status-input" value="' + race.status + '" aria-label="Edit status" />' +
            '<button class="btn-w is-nav save-status-btn" type="button"><span class="btn-text is-nav">Save</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="race-status-error">Invalid status. Use "Upcoming" or "Completed".</div>';

      var selectBtn = $('.race-select-btn', row);
      selectBtn.addEventListener('click', function() {
        pushStateToUndo();
        var origRace = state.races.find(function(r) { return r.id === race.id; });
        if (origRace) { origRace.selected = !origRace.selected; }
        renderRaceCalendar();
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

    renderPressKitPreview();
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
    renderPressKitPreview();
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

  function renderNewsletterState() {
    if (!newsletterForm) return;
    newsletterEmail.value = '';
    newsletterSubmitBtn.disabled = true;
    newsletterError.style.display = 'none';
    if (state.newsletter && state.newsletter !== 'none') {
      newsletterSuccess.textContent = 'Successfully subscribed!';
      newsletterSuccess.style.display = 'block';
    } else {
      newsletterSuccess.style.display = 'none';
    }
    renderPressKitPreview();
  }

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
      if (!validateEmail(email)) {
        newsletterSubmitBtn.disabled = true;
        newsletterError.textContent = email === ''
          ? 'Email address is required.'
          : 'Please enter a valid email address containing "@" and a domain.';
        newsletterError.style.display = 'block';
        newsletterSuccess.style.display = 'none';
        return;
      }
      newsletterError.style.display = 'none';
      pushStateToUndo();
      state.newsletter = email;
      renderNewsletterState();
    });
  }

  /* ===================== COMMAND PALETTE LOGIC ===================== */
  var cmdPalette = $('#cmdPalette');
  var cmdInput = $('#cmdInput');
  var cmdList = $('#cmdList');
  var cmdPaletteOpener = null;

  var cmdActions = [
    { label: "Go HOME", action: function() { openDestination('hero'); } },
    { label: "Go ON TRACK", action: function() { openDestination('horizontal-media'); } },
    { label: "Go OFF TRACK", action: function() { openDestination('social-stream'); } },
    { label: "Go CALENDAR", action: function() { openDestination('race-calendar'); } },
    { label: "Open press kit", action: function() { if(window.openPressKit) window.openPressKit(); } },
    { label: "Undo", action: undoAction },
    { label: "Redo", action: redoAction }
  ];

  function openCmdPalette() {
    if (cmdPalette) {
      cmdPaletteOpener = document.activeElement;
      cmdPalette.showModal();
      cmdInput.value = '';
      renderCmdList();
      cmdInput.focus();
    }
  }
  function closeCmdPalette() {
    if (cmdPalette && cmdPalette.hasAttribute('open')) {
      cmdPalette.close();
      if (cmdPaletteOpener && typeof cmdPaletteOpener.focus === 'function') cmdPaletteOpener.focus();
      cmdPaletteOpener = null;
    }
  }

  if (cmdPalette) {
    cmdPalette.addEventListener('cancel', function(e) {
      e.preventDefault();
      closeCmdPalette();
    });
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
      li.addEventListener('focus', function() {
        var active = $('.is-active', cmdList);
        if (active) active.classList.remove('is-active');
        li.classList.add('is-active');
      });
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
  var pressKitOpener = null;

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

  function selectPressKitFormat(format) {
    if (['json', 'markdown', 'ics'].indexOf(format) === -1) return false;
    activePressKitTab = format;
    pressKitTabs.forEach(function(tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-tab') === format);
    });
    renderPressKitPreview();
    return true;
  }

  function openPressKit() {
    if (!pressKitDrawer) return false;
    if (!pressKitDrawer.hasAttribute('open')) {
      pressKitOpener = document.activeElement;
      pressKitDrawer.showModal();
    }
    renderPressKitPreview();
    var closeBtn = document.getElementById('pressKitClose');
    if(closeBtn) closeBtn.focus();
    return true;
  }
  window.openPressKit = openPressKit;

  function closePressKit() {
    if (pressKitDrawer && pressKitDrawer.hasAttribute('open')) {
      pressKitDrawer.close();
      pressKitDrawer.removeAttribute("open");
      if (pressKitOpener && typeof pressKitOpener.focus === 'function') pressKitOpener.focus();
      pressKitOpener = null;
    }
  }

  if (pressKitBtn) pressKitBtn.addEventListener('click', openPressKit);
  if (pressKitClose) pressKitClose.addEventListener('click', closePressKit);
  if (pressKitDrawer) {
    pressKitDrawer.addEventListener('cancel', function(e) {
      e.preventDefault();
      closePressKit();
    });
  }

  pressKitTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      selectPressKitFormat(tab.getAttribute('data-tab'));
    });
  });

  function copyPressKitPreview() {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      pressKitMessage.textContent = "Clipboard access is unavailable.";
      pressKitMessage.className = "press-kit-message error";
      return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(pressKitPreview.value).then(function() {
      pressKitMessage.textContent = "Copied to clipboard.";
      pressKitMessage.className = "press-kit-message success";
      return true;
    }).catch(function() {
      pressKitMessage.textContent = "Copy failed.";
      pressKitMessage.className = "press-kit-message error";
      return false;
    });
  }

  if (pressKitCopyBtn) {
    pressKitCopyBtn.addEventListener('click', function() {
      copyPressKitPreview();
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
      if (data.driver !== "Avery Vale" || data.team !== "Nova Racing" || data.season !== 2025) throw new Error("Invalid driver, team, or season");
      if (!Array.isArray(data.races)) throw new Error("Invalid races array");
      if (!Array.isArray(data.shortlist)) throw new Error("Invalid shortlist array");
      if (typeof data.generatedAt !== "string" || !/Z$/.test(data.generatedAt) || Number.isNaN(Date.parse(data.generatedAt))) throw new Error("Invalid generatedAt datetime");
      var emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (data.newsletter !== "none" && (typeof data.newsletter !== "string" || !emailPattern.test(data.newsletter.trim()))) throw new Error("Invalid newsletter email");

      var seenRaceIds = {};
      data.races.forEach(function(importRace) {
        if (!importRace || typeof importRace.id !== "string" || !importRace.id.trim()) throw new Error("Invalid race id");
        if (seenRaceIds[importRace.id]) throw new Error("Duplicate race id");
        seenRaceIds[importRace.id] = true;
        if (typeof importRace.circuit !== "string" || !importRace.circuit.trim() || importRace.circuit.trim().length > 80) throw new Error("Invalid race circuit");
        if (typeof importRace.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(importRace.date)) throw new Error("Invalid race date");
        if (importRace.status !== "Upcoming" && importRace.status !== "Completed") throw new Error("Invalid race status");
        if (importRace.selected !== true) throw new Error("Invalid race selected value");
        if (typeof importRace.uid !== "string" || !importRace.uid.trim()) throw new Error("Invalid race uid");
        if (!state.races.some(function(r) { return r.id === importRace.id; })) throw new Error("Unknown race id");
      });
      data.shortlist.forEach(function(item) {
        if (!item || (item.kind !== "helmet" && item.kind !== "editorial")) throw new Error("Invalid shortlist kind");
        if (typeof item.label !== "string" || !item.label.trim() || item.label.trim().length > 60) throw new Error("Invalid shortlist label");
        if (!Number.isInteger(item.index) || item.index < 1) throw new Error("Invalid shortlist index");
      });

      var importedRaces = deepClone(state.races);
      importedRaces.forEach(function(r) { r.selected = false; });
      data.races.forEach(function(importRace) {
        var match = importedRaces.find(function(r) { return r.id === importRace.id; });
        match.selected = true;
        match.status = importRace.status;
      });
      pushStateToUndo();
      state.races = importedRaces;
      state.shortlist = deepClone(data.shortlist);
      state.newsletter = data.newsletter;
      renderRaceCalendar();
      renderShortlist();
      renderNewsletterState();
      renderPressKitPreview();
      if (pressKitMessage) {
        pressKitMessage.textContent = "Successfully imported press kit.";
        pressKitMessage.className = "press-kit-message success";
      }
      return true;
    } catch(e) {
      if (pressKitMessage) {
        pressKitMessage.textContent = "Import failed: " + e.message;
        pressKitMessage.className = "press-kit-message error";
      }
      return false;
    }
  }

  function importPressKitFromClipboard() {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      pressKitMessage.textContent = "Import failed: Clipboard access is unavailable.";
      pressKitMessage.className = "press-kit-message error";
      return Promise.resolve(false);
    }
    return navigator.clipboard.readText().then(validateAndImportJSON).catch(function(error) {
      pressKitMessage.textContent = "Import failed: " + (error && error.message ? error.message : "Clipboard read failed");
      pressKitMessage.className = "press-kit-message error";
      return false;
    });
  }

  if (pressKitImportPasteBtn) {
    pressKitImportPasteBtn.addEventListener('click', function() {
      importPressKitFromClipboard();
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

})();
