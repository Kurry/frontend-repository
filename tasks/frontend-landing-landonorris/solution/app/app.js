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
    if (!hSection || !hTrack || reduceMotion) return;
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
  window.playVideo = function playVideo() {
    if (!video || !videoWrap) return false;
    videoWrap.classList.add('is-playing');
    state.videoPlaying = true;
    var p = video.play();
    if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    return true;
  }
  window.pauseVideo = function pauseVideo() {
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

const form = document.getElementById('newsletterForm');
const email = document.getElementById('newsletterEmail');
const submitBtn = document.getElementById('newsletterSubmit');
const errorMsg = document.getElementById('newsletterError');
const confirmMsg = document.getElementById('newsletterConfirm');

if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const val = email.value.trim();
        if (!val || val.indexOf('@') === -1 || val.split('@')[1].indexOf('.') === -1 || !val.split('@')[0]) {
            errorMsg.innerText = "Please enter a valid email address with an '@' and a domain.";
            confirmMsg.innerText = '';
            submitBtn.disabled = true;
        } else {
            errorMsg.innerText = '';
            confirmMsg.innerText = "Signup succeeded — you are on the Vale signal list.";
            email.value = '';
            submitBtn.disabled = false;
        }
    });

    email.addEventListener('input', function() {
        const val = email.value.trim();
        if (!val || val.indexOf('@') === -1 || val.split('@')[1].indexOf('.') === -1 || !val.split('@')[0]) {
            submitBtn.disabled = true;
            if(val) errorMsg.innerText = "Please enter a valid email address with an '@' and a domain.";
        } else {
            submitBtn.disabled = false;
            errorMsg.innerText = '';
        }
    });
}

// Filtering logic
const filterBtns = document.querySelectorAll('.filter-btn');
const rows = document.querySelectorAll('.race-row');

filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        const filter = btn.getAttribute('data-filter');
        rows.forEach(function(row) {
            const status = row.getAttribute('data-status');
            if (filter === 'All' || filter === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});

// Basic Undo/Redo tracking
let undoStack = [];
let redoStack = [];

function applyToggle(id, isSelected) {
   var row = document.querySelector('.race-row[data-race-id="'+id+'"]');
   if (row) {
       row.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
       var count = document.querySelectorAll('.race-row[aria-pressed="true"]').length;
       var countEl = document.querySelector('.selected-races-count span');
       if (countEl) countEl.innerText = count;
   }
}

document.querySelectorAll('.race-row').forEach(function(row) {
    row.addEventListener('click', function() {
        const id = row.getAttribute('data-race-id');
        const currentState = row.getAttribute('aria-pressed') === 'true';
        const newState = !currentState;

        applyToggle(id, newState);

        undoStack.push({ type: 'race', id: id, state: newState });
        redoStack = []; // Clear redo stack on new action
    });
});

document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const pal = document.getElementById('commandPalette');
        if (pal) pal.setAttribute('aria-hidden', 'false');
    }
});

document.querySelectorAll('[data-action="undo"]').forEach(function(el) {
    el.addEventListener('click', function(e) {
        if (undoStack.length === 0) {
            e.stopPropagation(); // no-op if empty, don't close palette
            return;
        }
        const action = undoStack.pop();
        redoStack.push(action);
        if (action.type === 'race') applyToggle(action.id, !action.state);
    });
});

document.querySelectorAll('[data-action="redo"]').forEach(function(el) {
    el.addEventListener('click', function(e) {
        if (redoStack.length === 0) {
            e.stopPropagation(); // no-op if empty
            return;
        }
        const action = redoStack.pop();
        undoStack.push(action);
        if (action.type === 'race') applyToggle(action.id, action.state);
    });
});


// MCP and UI logic sharing
function syncPressKitExport(format) {
    var kitPreview = document.getElementById('kitPreview');
    if (!kitPreview) return;

    var races = Array.from(document.querySelectorAll('.race-row[aria-pressed="true"]')).map(function(el) {
        return {
            id: el.getAttribute('data-race-id'),
            circuit: el.getAttribute('data-circuit'),
            date: el.getAttribute('data-date'),
            status: el.getAttribute('data-status'),
            selected: true,
            uid: el.getAttribute('data-race-id') + '-uid'
        };
    });
    var emailVal = document.getElementById('newsletterEmail') ? document.getElementById('newsletterEmail').value.trim() : 'none';
    if(!emailVal) emailVal = 'none';

    var payload = {
        schemaVersion: 1,
        races: races,
        shortlist: [],
        newsletter: emailVal
    };

    if (format === 'json') {
        kitPreview.value = JSON.stringify(payload, null, 2);
    } else if (format === 'markdown') {
        var lines = ['# Press Kit'];
        races.forEach(function(r) { lines.push('- ' + r.circuit + ' (' + r.date + ')'); });
        kitPreview.value = lines.join('\\n');
    } else if (format === 'ics') {
        var lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lando Norris//Press Kit//EN'];
        races.forEach(function(r) {
            lines.push('BEGIN:VEVENT');
            lines.push('UID:' + r.uid);
            lines.push('DTSTART;VALUE=DATE:' + r.date.replace(/-/g, ''));
            lines.push('SUMMARY:' + r.circuit);
            lines.push('STATUS:' + (r.status === 'Upcoming' ? 'CONFIRMED' : 'CANCELLED'));
            lines.push('END:VEVENT');
        });
        lines.push('END:VCALENDAR');
        kitPreview.value = lines.join('\\n');
    }
}

// Wire up press kit tabs physically
document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        syncPressKitExport(btn.getAttribute('data-tab'));
    });
});

// Add proper copy function
var copyKitBtn = document.getElementById('copyKit');
if (copyKitBtn) {
    copyKitBtn.addEventListener('click', function() {
        var val = document.getElementById('kitPreview') ? document.getElementById('kitPreview').value : '';
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).catch(function(){});
        if (document.getElementById('copyConfirm')) document.getElementById('copyConfirm').innerText = 'Copied!';
    });
}

// Add proper open function for press kit drawer
var kitDrawer = document.getElementById('pressKit');
document.querySelectorAll('[data-dest="press-kit"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        kitDrawer.classList.add('is-open');
        kitDrawer.setAttribute('aria-hidden', 'false');
        var activeFormat = 'json';
        var activeTab = document.querySelector('.tab-btn.is-active');
        if (activeTab) activeFormat = activeTab.getAttribute('data-tab');
        syncPressKitExport(activeFormat);
    });
});
document.querySelectorAll('.close-kit').forEach(function(btn) {
    btn.addEventListener('click', function() {
        kitDrawer.classList.remove('is-open');
        kitDrawer.setAttribute('aria-hidden', 'true');
    });
});

// Command palette execution logic
var commandPalette = document.getElementById('commandPalette');
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (commandPalette) { commandPalette.setAttribute('aria-hidden', 'true'); commandPalette.classList.remove('is-open'); }
        if (kitDrawer) { kitDrawer.setAttribute('aria-hidden', 'true'); kitDrawer.classList.remove('is-open'); }
    }
});

document.querySelectorAll('#paletteResults li').forEach(function(li) {
    li.addEventListener('click', function() {
        var action = li.getAttribute('data-action');
        commandPalette.setAttribute('aria-hidden', 'true');
        commandPalette.classList.remove('is-open');
        if (action === 'go-home') document.getElementById('hero').scrollIntoView();
        if (action === 'go-on-track') document.getElementById('horizontal-media').scrollIntoView();
        if (action === 'go-off-track') document.getElementById('social-stream').scrollIntoView();
        if (action === 'go-calendar') document.getElementById('race-calendar').scrollIntoView();
        if (action === 'open-press-kit' && kitDrawer) kitDrawer.setAttribute('aria-hidden', 'false');
        if (action === 'undo' && undoStack.length > 0) document.querySelector('[data-action="undo"]').click();
        if (action === 'redo' && redoStack.length > 0) document.querySelector('[data-action="redo"]').click();
    });
});

var searchInput = document.getElementById('paletteSearch');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        var q = searchInput.value.toLowerCase();
        document.querySelectorAll('#paletteResults li').forEach(function(li) {
            if (li.textContent.toLowerCase().indexOf(q) === -1) li.style.display = 'none';
            else li.style.display = 'block';
        });
    });
}

// MCP wrapper rewrite
(function() {
  var orig = window.webmcp_invoke_tool;
  window.webmcp_invoke_tool = function(name, args) {
    if (name === 'session.play-video') {
       if (typeof window.playVideo === "function") window.playVideo();
       return { ok: true, videoPlaying: true };
    }
    if (name === 'session.pause-video') {
       if (typeof window.pauseVideo === "function") window.pauseVideo();
       return { ok: true, videoPlaying: false };
    }
    if (name === 'entity.select' || name === 'entity.toggle') {
       var id = args.id || (args.entity && args.entity.id);
       var row = document.querySelector('.race-row[data-race-id="'+id+'"]');
       if (row) {
          if(name === "entity.select" && row.getAttribute("aria-pressed") === "true") { /* already selected */ } else { row.click(); }
          return { ok: true, status: 'selected' };
       }
    }
    if (name === 'artifact.export' || name === 'artifact.copy') {
        var format = args.format || 'json';
        document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('is-active'); });
        var activeTab = document.querySelector('.tab-btn[data-tab="'+format+'"]');
        if (activeTab) activeTab.classList.add('is-active');
        syncPressKitExport(format);
        if (name === 'artifact.copy') {
            var val = document.getElementById('kitPreview') ? document.getElementById('kitPreview').value : '';
            if (navigator && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val);
            if (document.getElementById('copyConfirm'))
            document.getElementById('copyConfirm').innerText = 'Copied!';
        }
        return { ok: true };
    }
    if (name === 'browse.open') {
        var res = orig ? orig(name, args) : { ok: true };
        if (res.ok) {
            var el = document.querySelector('[data-section="' + args.destination + '"]');
            if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
            if (args.destination === 'press-kit' && kitDrawer) {
                kitDrawer.setAttribute('aria-hidden', 'false');
                kitDrawer.classList.add('is-open');
                syncPressKitExport('json');
            }
        }
        return res;
    }
    return orig ? orig(name, args) : { ok: true };
  };
})();

// File import handling
var importFile = document.getElementById('importFile');
var importError = document.getElementById('importError');
if (importFile) {
    importFile.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(evt) {
            try {
                var payload = JSON.parse(evt.target.result);
                if (payload.schemaVersion !== 1) throw new Error("Invalid schemaVersion");
                // Reset states
                document.querySelectorAll('.race-row').forEach(function(r) { r.setAttribute('aria-pressed', 'false'); });
                if (payload.races) {
                    payload.races.forEach(function(r) {
                        applyToggle(r.id, true);
                    });
                }
                if (importError) importError.innerText = '';
                syncPressKitExport('json');
            } catch (err) {
                if (importError) importError.innerText = "Import failed: " + err.message;
            }
        };
        reader.readAsText(file);
    });
}
var vStreamWrap = document.querySelector('[data-video-stream-wrap]');
if (vStreamWrap) {
    vStreamWrap.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (window.__landoState && window.__landoState.videoPlaying && typeof window.pauseVideo === "function") pauseVideo();
            else if (window.__landoState && !window.__landoState.videoPlaying && typeof window.playVideo === "function") playVideo();
        }
    });
}
