/* Field Notes Archive — oracle reconstruction logic.
   Offline SPA: client-side routing across 10 routes (home, about, 8 cases),
   pin/note/dossier pipeline, scrapbook undo/redo, command palette, and WebMCP. */
(function () {
  "use strict";

  var MANIFEST = {};
  function img(name) { return MANIFEST[name] || ("/media/storyblok/f/290489675855311/" + name); }

  var FILTER_TO_CAT = {
    "organic-early-modernism": "organic",
    "expressive": "expressive",
    "monumental-modernism": "monumental",
    "place-culture-continuity": "place"
  };
  var FILTERS = Object.keys(FILTER_TO_CAT);
  var ARCHITECT_SLUGS = [
    "ada-mercer", "elias-north", "mara-voss", "julian-kade",
    "imani-vale", "pavel-rowan", "lucian-shore", "mae-calder"
  ];
  var SCHEMA_VERSION = "field-notes-archive.dossier.v1";
  var HOME_TITLE = "Field Notes Archive—American Modernist Architecture";
  var ABOUT_TITLE = "About Field Notes Archive—The Archive & The Idea";

  var CATEGORIES = [
    { id: "organic", title: "Organic & Early Modernism", color: "#1E4BD7",
      thesis: "Buildings that grow from the ground — American form before Europe named it modern.",
      architects: ["ada-mercer", "elias-north"] },
    { id: "expressive", title: "Expressive", color: "#0C7866",
      thesis: "Structure as sculpture; the building itself as a gesture.",
      architects: ["mara-voss"] },
    { id: "monumental", title: "Monumental Modernism", color: "#581E70",
      thesis: "Weight, light, and raw material raised to a civic scale.",
      architects: ["julian-kade", "imani-vale", "pavel-rowan"] },
    { id: "place", title: "Place / culture continuity", color: "#D71E1E",
      thesis: "Architecture rooted in region, craft, and the American ground.",
      architects: ["lucian-shore", "mae-calder"] }
  ];

  var ARCHITECTS = {
    "ada-mercer": { name: "Ada Mercer", born: "1867", died: "1959",
      title: "Ada Mercer—Field Notes Archive",
      bio: "The architect who made buildings breathe with the land, dissolving the line between structure and site through an organic philosophy.",
      video: "ada-mercer-archive.mp4", plan: "ada_mercer_plan.avif" },
    "elias-north": { name: "Elias North", born: "1870", died: "1936",
      title: "Elias North—Field Notes Archive",
      bio: "The architect who stripped ornament from California decades before Europe made minimalism a movement.",
      video: "elias-north-archive.mp4", pdf: "elias_north_pdf.avif" },
    "mara-voss": { name: "Mara Voss", born: "1929", died: "",
      title: "Mara Voss—Field Notes Archive",
      bio: "Deconstructivist provocateur or modernism's natural heir — radical forms bent the language of the building into sculpture.",
      video: "mara-voss-archive.mp4" },
    "julian-kade": { name: "Julian Kade", born: "1901", died: "1974",
      title: "Julian Kade—Field Notes Archive",
      bio: "From Tide Court to River Assembly Hall, Kade made raw concrete and natural light into a singular obsession.",
      audio: true },
    "imani-vale": { name: "Imani Vale", born: "1917", died: "2019",
      title: "Imani Vale—Field Notes Archive",
      bio: "Seventy years of landmarks across four continents, every one anchored in geometric precision.",
      video: "imani-vale-archive.mp4" },
    "pavel-rowan": { name: "Pavel Rowan", born: "1918", died: "1997",
      title: "Pavel Rowan—Field Notes Archive",
      bio: "Can concrete be expressive and confrontational? Rowan's boundary-pushing civic work still divides opinion today.",
      video: "pavel-rowan-archive.mp4" },
    "lucian-shore": { name: "Lucian Shore", born: "1856", died: "1924",
      title: "Lucian Shore—Field Notes Archive",
      bio: "The father of the tall office frame and the man behind form following function — ideas that still underpin how the world builds tall.",
      pdf: "pdf2.avif" },
    "mae-calder": { name: "Mae Calder", born: "1869", died: "1958",
      title: "Mae Calder—Field Notes Archive",
      bio: "The architect who gave the American Southwest its voice, building a visual language from indigenous craft, landscape, and stone.",
      plan: "plan.avif" }
  };

  var ROUTES = ["home", "about"].concat(ARCHITECT_SLUGS);

  var ABOUT_GALLERY = [
    { file: "julian-kade-tide-court.avif", caption: "Julian Kade's Tide Court" },
    { file: "julian-kade-river-assembly-hall.avif", caption: "Julian Kade's River Assembly Hall" },
    { file: "pavel-rowan-northline-arts-building.avif", caption: "Pavel Rowan's Northline Arts Building" },
    { file: "imani-vale-east-archive-pavilion.avif", caption: "Imani Vale's East Archive Pavilion" }
  ];

  var ABOUT_ESSAY = [
    "Field Notes Archive rejects the tidy story that modern architecture began in Europe and arrived in America as an import. The Bauhaus-only narrative flattens a richer, older, and more radical history.",
    "This archive is compiled from a Ukrainian architectural education — a tradition that read buildings as structure, material, and place long before minimalism became a movement with a manifesto.",
    "The selection principles are simple and stubborn: industrial materials used honestly, architecture integrated with nature, and bold functional form that argues for itself. By those principles, the American modernists arrived first.",
    "Late figures like Imani Vale and Mara Voss are included on purpose — not as a coda to a European story, but as the continuation of an American one.",
    "The folder's open. Read it on its own terms."
  ];

  var DESTINATIONS = [
    { id: "home", label: "Home — Field Notes Archive" },
    { id: "about", label: "About — The Archive & The Idea" }
  ].concat(ARCHITECT_SLUGS.map(function (s) {
    return { id: s, label: ARCHITECTS[s].name };
  }));

  // ---------------- State (in-memory only) ----------------
  var state = {
    route: "home",
    activeSlug: null,
    unfolded: null,
    folderOpen: false,
    popup: { open: false, kind: null, ref: null },
    videoPlaying: false,
    audioPlaying: false,
    audioPart: 1,
    gallerySlide: 0,
    overscroll: 0,
    headerVisible: true,
    categoryFilter: "all",
    searchQuery: "",
    pins: [],
    notes: {},
    scrapbookOffsets: {},
    undoStack: [],
    redoStack: [],
    dossierFormat: "json",
    dossierOpen: false,
    readingListOpen: false,
    paletteOpen: false,
    paletteIndex: 0
  };

  ARCHITECT_SLUGS.forEach(function (s) { state.notes[s] = ""; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var app = $("#app"), header = $("#header"), subHeader = $("#subHeader");
  var viewHome = $("#view-home"), viewCase = $("#view-case"), viewAbout = $("#view-about");
  var popup = $("#popup"), popupMedia = $("#popupMedia"), popupInfo = $("#popupInfo");
  var readingList = $("#readingList"), dossierPanel = $("#dossierPanel"), commandPalette = $("#commandPalette");
  var galleryTimer = null, audioEl = null, waveInterval = null, paletteFocusEl = null;

  function categoryOf(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].architects.indexOf(slug) !== -1) return CATEGORIES[i];
    }
    return null;
  }
  function photosFor(slug) {
    var out = [];
    for (var k in MANIFEST) {
      if (k.indexOf(slug + "-") === 0 && /\.avif$/.test(k)) out.push(k);
    }
    out.sort();
    return out;
  }
  function pathFor(route) {
    if (route === "home") return "/";
    return "/" + route;
  }
  function routeFromPath(pathname) {
    var p = (pathname || "/").replace(/\/+$/, "") || "/";
    if (p === "/" || p === "") return "home";
    var slug = p.replace(/^\//, "");
    if (slug.indexOf("cases/") === 0) slug = slug.slice(6);
    if (ROUTES.indexOf(slug) !== -1) return slug;
    return null;
  }
  function setDocumentTitle(route) {
    if (route === "home") document.title = HOME_TITLE;
    else if (route === "about") document.title = ABOUT_TITLE;
    else if (ARCHITECTS[route]) document.title = ARCHITECTS[route].title;
  }
  function syncHistory(route, replace) {
    var url = pathFor(route);
    var method = replace ? "replaceState" : "pushState";
    if (location.pathname !== url || replace) {
      try { history[method]({ route: route }, "", url); } catch (e) { /* ignore */ }
    }
  }

  // ================= Research store =================
  function isPinned(slug) { return state.pins.indexOf(slug) !== -1; }
  function ensureNote(slug) {
    if (typeof state.notes[slug] !== "string") state.notes[slug] = "";
  }
  function togglePin(slug) {
    if (!ARCHITECTS[slug]) return { ok: false, error: "unknown architect" };
    ensureNote(slug);
    var idx = state.pins.indexOf(slug);
    if (idx === -1) state.pins.push(slug);
    else state.pins.splice(idx, 1);
    refreshCaseChrome();
    renderReadingList();
    refreshDossierPreview();
    return { ok: true, architect: slug, pinned: isPinned(slug), note: state.notes[slug] };
  }
  function saveNote(slug, note) {
    if (!ARCHITECTS[slug]) return { ok: false, error: "unknown architect" };
    var trimmed = String(note == null ? "" : note);
    if (trimmed.length > 500) {
      return { ok: false, error: "note", message: "note must be 0 through 500 characters" };
    }
    state.notes[slug] = trimmed;
    refreshCaseChrome();
    renderReadingList();
    refreshDossierPreview();
    return { ok: true, architect: slug, note: state.notes[slug], pinned: isPinned(slug) };
  }
  function setBookmark(fields) {
    fields = fields || {};
    var slug = fields.architect || fields.id;
    if (!ARCHITECTS[slug]) return { ok: false, error: "architect" };
    var note = fields.note != null ? String(fields.note) : state.notes[slug] || "";
    if (note.length > 500) return { ok: false, error: "note", message: "note must be 0 through 500 characters" };
    var pinned = fields.pinned;
    if (typeof pinned === "string") pinned = pinned === "true";
    if (typeof pinned !== "boolean") pinned = true;
    state.notes[slug] = note;
    var idx = state.pins.indexOf(slug);
    if (pinned && idx === -1) state.pins.push(slug);
    if (!pinned && idx !== -1) state.pins.splice(idx, 1);
    refreshCaseChrome();
    renderReadingList();
    refreshDossierPreview();
    return { ok: true, architect: slug, note: state.notes[slug], pinned: isPinned(slug) };
  }
  function deleteBookmark(slug, confirm) {
    if (confirm !== true) return { ok: false, error: "confirm=true required" };
    if (!ARCHITECTS[slug]) return { ok: false, error: "unknown architect" };
    var idx = state.pins.indexOf(slug);
    if (idx !== -1) state.pins.splice(idx, 1);
    state.notes[slug] = "";
    refreshCaseChrome();
    renderReadingList();
    refreshDossierPreview();
    return { ok: true, architect: slug, pinned: false };
  }

  function compileDossier() {
    var notes = {};
    var offsets = {};
    ARCHITECT_SLUGS.forEach(function (s) {
      notes[s] = typeof state.notes[s] === "string" ? state.notes[s] : "";
      if (state.scrapbookOffsets[s]) offsets[s] = state.scrapbookOffsets[s];
    });
    state.pins.forEach(function (s) { ensureNote(s); notes[s] = state.notes[s] || ""; });
    return {
      schemaVersion: SCHEMA_VERSION,
      pins: state.pins.slice(),
      notes: notes,
      scrapbookOffsets: offsets
    };
  }
  function dossierMarkdown() {
    var lines = ["# Field Notes Archive — Reading report", ""];
    var nonempty = 0;
    state.pins.forEach(function (s) {
      var note = state.notes[s] || "";
      if (note.trim()) nonempty++;
      lines.push("## " + ARCHITECTS[s].name);
      lines.push(note || "_(empty note)_");
      lines.push("");
    });
    lines.push("Summary: " + state.pins.length + " pins, " + nonempty + " non-empty notes.");
    return lines.join("\n");
  }
  function dossierPreviewText() {
    if (state.dossierFormat === "markdown") return dossierMarkdown();
    return JSON.stringify(compileDossier(), null, 2);
  }
  function refreshDossierPreview() {
    var el = $("#dossierPreview");
    if (el) el.textContent = dossierPreviewText();
  }
  function validateDossier(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return "payload";
    if (data.schemaVersion !== SCHEMA_VERSION) return "schemaVersion";
    if (!Array.isArray(data.pins)) return "pins";
    if (!data.notes || typeof data.notes !== "object" || Array.isArray(data.notes)) return "notes";
    if (!data.scrapbookOffsets || typeof data.scrapbookOffsets !== "object" || Array.isArray(data.scrapbookOffsets)) {
      return "scrapbookOffsets";
    }
    var seen = {};
    for (var i = 0; i < data.pins.length; i++) {
      var p = data.pins[i];
      if (ARCHITECT_SLUGS.indexOf(p) === -1) return "pins";
      if (seen[p]) return "pins";
      seen[p] = true;
      if (typeof data.notes[p] !== "string") return "notes";
    }
    for (var nk in data.notes) {
      if (ARCHITECT_SLUGS.indexOf(nk) === -1) return "notes";
      if (typeof data.notes[nk] !== "string") return "notes";
      if (data.notes[nk].length > 500) return "note";
    }
    for (var ck in data.scrapbookOffsets) {
      if (ARCHITECT_SLUGS.indexOf(ck) === -1) return "scrapbookOffsets";
      var items = data.scrapbookOffsets[ck];
      if (!items || typeof items !== "object") return "scrapbookOffsets";
      for (var iid in items) {
        var xy = items[iid];
        if (!xy || typeof xy.x !== "number" || typeof xy.y !== "number") return "scrapbookOffsets";
        if (xy.x < 0 || xy.x > 100 || xy.y < 0 || xy.y > 100) return "x";
      }
    }
    for (var j = 0; j < data.pins.length; j++) {
      if (typeof data.notes[data.pins[j]] !== "string") return "notes";
    }
    return null;
  }
  function importDossierJson(text) {
    var errEl = $("#dossierImportError");
    function fail(field) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = "Import validation failed: " + field;
      }
      return { ok: false, error: field };
    }
    var raw = String(text || "").trim();
    if (!raw) return fail("payload");
    var data;
    try { data = JSON.parse(raw); }
    catch (e) { return fail("payload"); }
    var bad = validateDossier(data);
    if (bad) return fail(bad);
    state.pins = data.pins.slice();
    ARCHITECT_SLUGS.forEach(function (s) { state.notes[s] = ""; });
    for (var k in data.notes) state.notes[k] = data.notes[k];
    state.scrapbookOffsets = {};
    for (var ck in data.scrapbookOffsets) {
      state.scrapbookOffsets[ck] = JSON.parse(JSON.stringify(data.scrapbookOffsets[ck]));
    }
    state.undoStack = [];
    state.redoStack = [];
    if (errEl) { errEl.hidden = true; errEl.textContent = ""; }
    refreshCaseChrome();
    renderReadingList();
    refreshDossierPreview();
    if (state.activeSlug) applyScrapbookOffsets(state.activeSlug);
    return { ok: true };
  }

  // ================= Home stack =================
  function tagMatches(slug) {
    var cat = categoryOf(slug);
    if (state.categoryFilter !== "all") {
      var want = FILTER_TO_CAT[state.categoryFilter];
      if (!cat || cat.id !== want) return false;
    }
    var q = (state.searchQuery || "").trim().toLowerCase();
    if (!q) return true;
    return ARCHITECTS[slug].name.toLowerCase().indexOf(q) !== -1;
  }
  function applyHomeFilters() {
    $$(".stack-group").forEach(function (group) {
      var catId = group.dataset.cat;
      var filterId = null;
      for (var f in FILTER_TO_CAT) if (FILTER_TO_CAT[f] === catId) filterId = f;
      var catActive = state.categoryFilter === "all" || state.categoryFilter === filterId;
      group.classList.toggle("is-dimmed", !catActive);
      group.classList.toggle("is-hidden-filter", !catActive && state.categoryFilter !== "all");
      $$(".tag", group).forEach(function (t) {
        var ok = tagMatches(t.dataset.tag);
        t.classList.toggle("is-disabled", !ok);
        t.disabled = !ok;
        t.setAttribute("aria-disabled", ok ? "false" : "true");
      });
    });
    $$(".home-filter").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.filter === state.categoryFilter);
    });
    var search = $("#homeSearch");
    if (search && search.value !== state.searchQuery) search.value = state.searchQuery;
  }
  function setCategoryFilter(filter) {
    if (filter !== "all" && FILTERS.indexOf(filter) === -1) return { ok: false, error: "unknown filter" };
    state.categoryFilter = filter || "all";
    applyHomeFilters();
    return { ok: true, filter: state.categoryFilter };
  }
  function setSearchQuery(query) {
    state.searchQuery = String(query || "");
    applyHomeFilters();
    return { ok: true, query: state.searchQuery };
  }

  function footerHTML() {
    var rose = '<svg class="wind-rose" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="1.5"><circle cx="50" cy="50" r="45"/><circle cx="50" cy="50" r="30"/><path d="M50 2 L58 50 L50 98 L42 50 Z" fill="#fff" stroke="none"/><path d="M2 50 L50 42 L98 50 L50 58 Z" fill="#fff" opacity=".5" stroke="none"/><path d="M18 18 L50 50 L82 82 M82 18 L50 50 L18 82" opacity=".6"/></g></svg>';
    return '<div class="the-footer">' +
      rose + rose +
      '<img class="the-footer__scale" src="/images/scale.svg" alt="Architectural scale" />' +
      '<span class="signature" aria-label="Archivist signature"></span>' +
      '<a class="the-footer__credit" href="#atlas-press" rel="noopener">' +
        '<span class="the-footer__credit-mark">Atlas Press</span></a>' +
      '<span class="the-footer__year">© 2026 Field Notes Archive</span>' +
    "</div>";
  }

  function renderStack() {
    var stack = $("#stack");
    stack.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      var group = document.createElement("div");
      group.className = "stack-group";
      group.dataset.cat = cat.id;
      var tags = cat.architects.map(function (slug) {
        return '<button type="button" class="tag" data-tag="' + slug + '">' + ARCHITECTS[slug].name + "</button>";
      }).join("");
      group.innerHTML =
        '<div class="stack-cover" style="background-color:' + cat.color + '">' +
          '<div class="stack-cover__head">' +
            '<h2 class="stack-cover__title">' + cat.title + "</h2>" +
            '<span class="stack-cover__chevron" aria-hidden="true">&rsaquo;</span>' +
          "</div>" +
          '<p class="stack-cover__desc">' + cat.thesis + "</p>" +
          '<div class="stack-cover__tags">' + tags + "</div>" +
          (cat.id === "place" ? '<div class="stack-cover__footer">' + footerHTML() + "</div>" : "") +
        "</div>";
      group.addEventListener("mouseenter", function () { group.classList.add("is-hovered"); });
      group.addEventListener("mouseleave", function () { group.classList.remove("is-hovered"); });
      $(".stack-cover__head", group).addEventListener("click", function () {
        group.classList.toggle("is-unfolded");
        state.unfolded = group.classList.contains("is-unfolded") ? cat.id : null;
      });
      stack.appendChild(group);
    });
    stack.querySelectorAll(".tag").forEach(function (t) {
      t.addEventListener("click", function () {
        if (t.disabled) return;
        openCase(t.dataset.tag, "folder-open");
      });
    });
    applyHomeFilters();
  }

  // ================= Case =================
  function renderCase(slug) {
    var a = ARCHITECTS[slug], cat = categoryOf(slug);
    document.documentElement.style.setProperty("--case-text", "#fff");
    var siblings = cat.architects;
    var tagsHTML = siblings.map(function (s) {
      return '<button type="button" class="tag" data-sibling="' + s + '">' + ARCHITECTS[s].name + "</button>";
    }).join("");
    var pinned = isPinned(slug);
    var note = state.notes[slug] || "";

    viewCase.innerHTML =
      '<div class="page-case"><div class="page-case__content">' +
        '<h1 class="case-hero-title" id="caseTitle" aria-label="' + a.name + '"></h1>' +
        '<div class="case-research">' +
          '<button type="button" id="pinBtn" class="pin-btn' + (pinned ? " is-pinned" : "") + '" aria-pressed="' + (pinned ? "true" : "false") + '" aria-label="Pin">' +
            (pinned ? "Pinned" : "Pin") + "</button>" +
          '<label class="field-note"><span>Field note</span>' +
            '<textarea id="fieldNote" maxlength="600" aria-label="Field note">' + note.replace(/</g, "&lt;") + "</textarea>" +
            '<span class="field-note__error" id="fieldNoteError" hidden></span>' +
          "</label>" +
          '<button type="button" id="saveNoteBtn" aria-label="Save note">Save note</button>' +
          '<button type="button" id="undoBtn" aria-label="Undo">Undo</button>' +
          '<button type="button" id="redoBtn" aria-label="Redo">Redo</button>' +
        "</div>" +
        '<div class="case-layout">' +
          '<div class="case-folder" id="caseFolder">' +
            '<div class="case-folder__stage">' +
              '<div class="case-folder-sheet">' +
                '<img class="case-folder-sheet__photo" src="' + img(slug + ".avif") + '" alt="' + a.name + '" />' +
                '<p class="case-folder-sheet__meta">Born ' + a.born + (a.died ? " — Died " + a.died : " — present") + "</p>" +
                '<h3 class="case-folder-sheet__name">' + a.name + "</h3>" +
                '<p class="case-folder-sheet__bio">' + a.bio + "</p>" +
                '<span class="case-folder-sheet__overlay" aria-hidden="true"></span>' +
              "</div>" +
              '<div class="case-folder-cover" style="background-color:' + cat.color + '">' +
                '<span class="case-folder-cover__label">' + a.name + "</span>" +
                '<span class="case-folder-cover__shadow"></span>' +
              "</div>" +
            "</div>" +
          "</div>" +
          '<div class="case-folder-tags">' + tagsHTML + "</div>" +
          '<div class="case-scrapbook" id="scrapbook"></div>' +
        "</div>" +
        '<div class="case-controls">' +
          '<button type="button" id="pageTurnBtn">Turn folder cover</button>' +
        "</div>" +
        '<div class="case-next" id="caseNext">' +
          '<div class="case-next__label">Overscroll to open the next case</div>' +
          '<button type="button" class="case-next__btn" id="caseNextBtn">Next case &darr;</button>' +
        "</div>" +
      "</div></div>";

    var titleEl = $("#caseTitle");
    splitChars(titleEl, a.name);
    renderScrapbook(slug);

    $("#pageTurnBtn").addEventListener("click", pageTurn);
    $("#caseNextBtn").addEventListener("click", advanceCase);
    $("#pinBtn").addEventListener("click", function () {
      var btn = $("#pinBtn");
      btn.classList.add("is-press");
      setTimeout(function () { btn.classList.remove("is-press"); }, 180);
      togglePin(slug);
    });
    $("#saveNoteBtn").addEventListener("click", function () {
      var val = $("#fieldNote").value;
      var res = saveNote(slug, val);
      var err = $("#fieldNoteError");
      if (!res.ok) {
        err.hidden = false;
        err.textContent = "note: must be 0 through 500 characters";
      } else {
        err.hidden = true;
        err.textContent = "";
      }
    });
    $("#undoBtn").addEventListener("click", function () {
      var btn = $("#undoBtn");
      btn.classList.add("is-press");
      setTimeout(function () { btn.classList.remove("is-press"); }, 180);
      undoScrapbook();
    });
    $("#redoBtn").addEventListener("click", function () {
      var btn = $("#redoBtn");
      btn.classList.add("is-press");
      setTimeout(function () { btn.classList.remove("is-press"); }, 180);
      redoScrapbook();
    });
    viewCase.querySelectorAll(".tag[data-sibling]").forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.stopPropagation();
        if (t.dataset.sibling !== slug) openCase(t.dataset.sibling, "folder-next");
      });
    });
    subHeader.querySelector("#subHeaderCat").textContent = cat.title;
  }

  function refreshCaseChrome() {
    if (!state.activeSlug || !viewCase.classList.contains("is-active")) return;
    var slug = state.activeSlug;
    var pinBtn = $("#pinBtn");
    if (pinBtn) {
      var pinned = isPinned(slug);
      pinBtn.classList.toggle("is-pinned", pinned);
      pinBtn.setAttribute("aria-pressed", pinned ? "true" : "false");
      pinBtn.textContent = pinned ? "Pinned" : "Pin";
    }
  }

  function seedItems(slug) {
    var a = ARCHITECTS[slug];
    var items = [];
    var photos = photosFor(slug).slice(0, 3);
    photos.forEach(function (p, i) {
      items.push({ id: "photo-" + i, cls: "content-photo", top: 4 + i * 22, left: 6 + i * 30, rot: (i % 2 ? 4 : -5),
        html: '<img src="' + img(p) + '" alt="' + a.name + ' work" /><span class="scrapbook-item__badge">photo</span>' });
    });
    items.push({ id: "note-0", cls: "content-note", top: 8, left: 60, rot: 3,
      html: "Research note — " + a.name + ", " + a.born + (a.died ? "–" + a.died : "–present") + "." });
    items.push({ id: "clip-0", cls: "content-paperclip", top: 2, left: 40, rot: 0,
      html: '<img class="content-paperclip" src="' + img("zirkel.avif") + '" alt="paperclip" />' });
    if (a.plan) items.push({ id: "plan-0", cls: "content-plan", top: 55, left: 55, rot: -3,
      html: '<img src="' + img(a.plan) + '" alt="plan" /><span class="scrapbook-item__badge">plan</span>' });
    if (a.video) items.push({ id: "video-0", cls: "content-video", kind: "video", top: 40, left: 8, rot: 2,
      html: '<img src="' + img("video.avif") + '" alt="video poster" /><span class="scrapbook-item__badge">video</span><button type="button" class="content-play" aria-label="Play video">&#9658;</button>' });
    if (a.pdf) items.push({ id: "pdf-0", cls: "content-pdf", kind: "pdf", top: 60, left: 20, rot: -4,
      html: '<img src="' + img(a.pdf) + '" alt="pdf preview" /><span class="scrapbook-item__badge">pdf</span>' });
    if (a.audio) items.push({ id: "audio-0", cls: "content-audio", kind: "audio", top: 45, left: 30, rot: 1,
      html: '<img src="' + img("scissors.avif") + '" alt="audio" /><span class="scrapbook-item__badge">audio — Julian Kade</span><button type="button" class="content-play" aria-label="Play audio">&#9658;</button>' });
    return items;
  }

  function renderScrapbook(slug) {
    var sb = $("#scrapbook");
    sb.innerHTML = "";
    var items = seedItems(slug);
    var saved = state.scrapbookOffsets[slug] || {};
    items.forEach(function (it) {
      var el = document.createElement("div");
      el.className = "scrapbook-item " + it.cls;
      el.dataset.itemId = it.id;
      var top = saved[it.id] ? saved[it.id].y : it.top;
      var left = saved[it.id] ? saved[it.id].x : it.left;
      el.style.top = top + "%";
      el.style.left = left + "%";
      el.style.transform = "rotate(" + it.rot + "deg)";
      el.dataset.rot = it.rot;
      el.innerHTML = it.html;
      if (it.kind) {
        el.dataset.kind = it.kind;
        el.addEventListener("click", function () {
          if (el.classList.contains("dragging")) return;
          openPopup(it.kind, slug);
        });
      }
      makeDraggable(el, slug);
      sb.appendChild(el);
    });
  }

  function applyScrapbookOffsets(slug) {
    var sb = $("#scrapbook");
    if (!sb) return;
    var saved = state.scrapbookOffsets[slug] || {};
    $$(".scrapbook-item", sb).forEach(function (el) {
      var id = el.dataset.itemId;
      if (saved[id]) {
        el.style.left = saved[id].x + "%";
        el.style.top = saved[id].y + "%";
      }
    });
  }

  function recordOffset(slug, itemId, x, y) {
    if (!state.scrapbookOffsets[slug]) state.scrapbookOffsets[slug] = {};
    state.scrapbookOffsets[slug][itemId] = { x: x, y: y };
    refreshDossierPreview();
  }

  // ================= About =================
  function renderAbout() {
    var imgs = ABOUT_GALLERY.map(function (g, i) {
      return '<img src="' + img(g.file) + '" alt="' + g.caption + '" class="' + (i === 0 ? "is-active" : "") + '" />';
    }).join("");
    var caps = ABOUT_GALLERY.map(function (g, i) {
      return '<p class="' + (i === 0 ? "is-active" : "") + '">' + g.caption + "</p>";
    }).join("");
    var essay = ABOUT_ESSAY.map(function (p, i) {
      return '<p class="' + (i === ABOUT_ESSAY.length - 1 ? "rich-text-close" : "") + '">' + p + "</p>";
    }).join("");
    viewAbout.innerHTML =
      '<button type="button" class="page-about__close" data-nav="home" aria-label="Close about"><span class="x">✕</span></button>' +
      '<div class="page-about"><div class="page-about__inner">' +
        '<h1 class="page-about__title">About Field Notes Archive</h1>' +
        '<div class="page-about__essay">' + essay + "</div>" +
        '<div class="page-about__signature"><span class="signature" aria-label="Archivist signature"></span>' +
        '<p class="about-gallery__captions" style="opacity:.6">Field Notes Archive — Archivist</p></div>' +
      "</div>" +
      '<div class="about-gallery"><div class="about-gallery__stage"><div class="about-gallery__images">' + imgs + "</div></div>" +
        '<div class="about-gallery__captions">' + caps + "</div>" +
      "</div></div>";
  }

  // ================= Motion helpers =================
  function splitChars(el, text) {
    el.textContent = "";
    text.split("").forEach(function (ch) {
      var span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(span);
    });
  }
  function splitHeroChars() {
    var el = $("#heroTitle");
    var words = "American modernism".split(" ");
    el.innerHTML = "";
    words.forEach(function (w, wi) {
      var line = document.createElement("span"); line.className = "line";
      w.split("").forEach(function (ch, ci) {
        var s = document.createElement("span"); s.className = "char";
        s.setAttribute("aria-hidden", "true");
        s.textContent = ch; s.style.transitionDelay = (wi * 0.2 + ci * 0.03) + "s";
        line.appendChild(s);
      });
      if (wi === 0) line.appendChild(document.createTextNode("\u00a0"));
      el.appendChild(line);
    });
  }
  function revealHero() {
    var el = $("#heroTitle");
    el.classList.remove("is-revealed"); void el.offsetWidth; el.classList.add("is-revealed");
  }

  // ================= Draggable + undo =================
  function pct(n, max) {
    if (!max) return 0;
    return Math.max(0, Math.min(100, (n / max) * 100));
  }
  function makeDraggable(el, slug) {
    var sx, sy, ox, oy, dragging = false, moved = false, startX, startY;
    el.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".content-play")) return;
      dragging = true; moved = false;
      el.classList.add("dragging");
      sx = e.clientX; sy = e.clientY;
      var r = el.getBoundingClientRect(), pr = el.offsetParent.getBoundingClientRect();
      ox = r.left - pr.left; oy = r.top - pr.top;
      startX = pct(ox, pr.width);
      startY = pct(oy, pr.height);
      el.style.left = ox + "px"; el.style.top = oy + "px";
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - sx) > 2 || Math.abs(e.clientY - sy) > 2) moved = true;
      var pr = el.offsetParent.getBoundingClientRect();
      var newLeft = ox + e.clientX - sx;
      var newTop = oy + e.clientY - sy;
      newLeft = Math.max(0, Math.min(newLeft, pr.width - el.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, pr.height - el.offsetHeight));
      el.style.left = newLeft + "px";
      el.style.top = newTop + "px";
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      var pr = el.offsetParent.getBoundingClientRect();
      var leftPx = parseFloat(el.style.left) || 0;
      var topPx = parseFloat(el.style.top) || 0;
      var x = Math.round(pct(leftPx, pr.width) * 100) / 100;
      var y = Math.round(pct(topPx, pr.height) * 100) / 100;
      el.style.left = x + "%";
      el.style.top = y + "%";
      if (moved) {
        state.undoStack.push({
          slug: slug, id: el.dataset.itemId,
          from: { x: startX, y: startY },
          to: { x: x, y: y }
        });
        state.redoStack = [];
        recordOffset(slug, el.dataset.itemId, x, y);
      }
      setTimeout(function () { el.classList.remove("dragging"); }, 0);
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }
  function applyItemPos(slug, id, pos) {
    var el = viewCase.querySelector('.scrapbook-item[data-item-id="' + id + '"]');
    if (el) {
      el.style.left = pos.x + "%";
      el.style.top = pos.y + "%";
    }
    recordOffset(slug, id, pos.x, pos.y);
  }
  function undoScrapbook() {
    var entry = state.undoStack.pop();
    if (!entry) return { ok: true, empty: true };
    state.redoStack.push(entry);
    if (state.activeSlug === entry.slug) applyItemPos(entry.slug, entry.id, entry.from);
    else recordOffset(entry.slug, entry.id, entry.from.x, entry.from.y);
    return { ok: true };
  }
  function redoScrapbook() {
    var entry = state.redoStack.pop();
    if (!entry) return { ok: true, empty: true };
    state.undoStack.push(entry);
    if (state.activeSlug === entry.slug) applyItemPos(entry.slug, entry.id, entry.to);
    else recordOffset(entry.slug, entry.id, entry.to.x, entry.to.y);
    return { ok: true };
  }

  // ================= Routing =================
  function setActiveView(id) {
    [viewHome, viewCase, viewAbout].forEach(function (v) { v.classList.remove("is-active"); });
    var el = $("#" + id);
    if (el) el.classList.add("is-active");
    window.scrollTo(0, 0);
  }

  function goHome(opts) {
    opts = opts || {};
    stopGallery();
    state.route = "home"; state.activeSlug = null;
    header.classList.remove("is-hidden");
    header.style.transform = "";
    subHeader.classList.add("is-hidden");
    document.body.classList.remove("route-case", "route-about");
    document.body.classList.add("route-home");
    setActiveView("view-home");
    stopMedia();
    setDocumentTitle("home");
    if (!opts.skipHistory) syncHistory("home", opts.replace);
    revealHero();
    $("#stack").querySelectorAll(".tag").forEach(function (t, i) {
      t.classList.remove("is-visible");
      setTimeout(function () { t.classList.add("is-visible"); }, 200 + i * 60);
    });
    applyHomeFilters();
    updateNav();
  }

  function openCase(slug, transition, opts) {
    opts = opts || {};
    if (!ARCHITECTS[slug]) return false;
    stopGallery();
    state.route = slug; state.activeSlug = slug; state.folderOpen = false;
    stopMedia();
    renderCase(slug);
    header.classList.add("is-hidden");
    header.style.transform = "translateY(-100%)";
    subHeader.classList.remove("is-hidden");
    document.body.classList.remove("route-home", "route-about");
    document.body.classList.add("route-case");
    setActiveView("view-case");
    setDocumentTitle(slug);
    if (!opts.skipHistory) syncHistory(slug, opts.replace);

    var folder = $("#caseFolder");
    var sb = $("#scrapbook");
    var caseTitle = $("#caseTitle");
    viewCase.classList.add("case-enter");
    folder.classList.add("is-flipping");
    caseTitle.querySelectorAll(".char").forEach(function (c) {
      c.style.opacity = "0"; c.style.transform = "translateX(-40px)";
      c.style.transition = "opacity .5s ease, transform .5s cubic-bezier(.33,1,.68,1)";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        folder.classList.add("is-open");
        state.folderOpen = true;
        viewCase.classList.remove("case-enter");
        caseTitle.querySelectorAll(".char").forEach(function (c, i) {
          c.style.transitionDelay = (0.4 + i * 0.025) + "s";
          c.style.opacity = "1"; c.style.transform = "translateX(0)";
        });
        viewCase.querySelectorAll(".case-folder-tags .tag").forEach(function (t, i) {
          setTimeout(function () { t.classList.add("is-visible"); }, 850 + i * 80);
        });
        setTimeout(function () { sb.classList.add("is-revealed"); }, 1000);
        setTimeout(function () { folder.classList.remove("is-flipping"); }, 600);
      });
    });
    updateNav();
    return true;
  }

  function pageTurn() {
    var folder = $("#caseFolder");
    if (!folder) return;
    folder.classList.add("is-flipping");
    folder.classList.toggle("is-open");
    state.folderOpen = folder.classList.contains("is-open");
    setTimeout(function () { folder.classList.remove("is-flipping"); }, 800);
  }

  function advanceCase() {
    var order = ARCHITECT_SLUGS;
    var idx = order.indexOf(state.activeSlug);
    if (idx === -1) return { ok: false, error: "not on a case route" };
    var next = order[(idx + 1) % order.length];
    var el = $("#caseNext");
    if (el) el.classList.add("is-lifting");
    state.overscroll = 1;
    setTimeout(function () { openCase(next, "folder-next"); state.overscroll = 0; }, 350);
    return { ok: true, route: next };
  }

  function goAbout(opts) {
    opts = opts || {};
    state.route = "about";
    state.activeSlug = null;
    stopMedia();
    renderAbout();
    header.classList.add("is-hidden");
    header.style.transform = "translateY(-100%)";
    subHeader.classList.add("is-hidden");
    document.body.classList.remove("route-home", "route-case");
    document.body.classList.add("route-about");
    setActiveView("view-about");
    setDocumentTitle("about");
    if (!opts.skipHistory) syncHistory("about", opts.replace);
    viewAbout.classList.add("about-enter");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { viewAbout.classList.remove("about-enter"); });
    });
    startGallery();
    viewAbout.querySelectorAll("[data-nav]").forEach(bindNav);
    updateNav();
  }

  function startGallery() {
    stopGallery();
    state.gallerySlide = 0;
    galleryTimer = setInterval(function () {
      var imgs = viewAbout.querySelectorAll(".about-gallery__images img");
      var caps = viewAbout.querySelectorAll(".about-gallery__captions p");
      if (!imgs.length) return;
      imgs[state.gallerySlide].classList.remove("is-active");
      caps[state.gallerySlide].classList.remove("is-active");
      state.gallerySlide = (state.gallerySlide + 1) % imgs.length;
      imgs[state.gallerySlide].classList.add("is-active");
      caps[state.gallerySlide].classList.add("is-active");
    }, 2600);
  }
  function stopGallery() { if (galleryTimer) { clearInterval(galleryTimer); galleryTimer = null; } }

  function navigate(dest, opts) {
    opts = opts || {};
    if (dest === "home") { goHome(opts); return true; }
    if (dest === "about") { goAbout(opts); return true; }
    if (ARCHITECTS[dest]) { return openCase(dest, "folder-open", opts); }
    return false;
  }

  // ================= Popups + media =================
  function openPopup(kind, slug) {
    state.popup = { open: true, kind: kind, ref: slug };
    var a = ARCHITECTS[slug];
    popupMedia.innerHTML = ""; popupInfo.textContent = "";
    if (kind === "video") {
      var v = document.createElement("video");
      var webmName = a.video.replace(/\.mp4$/i, ".webm");
      var webmSrc = document.createElement("source");
      webmSrc.src = "/media/videos/" + webmName; webmSrc.type = "video/webm";
      var mp4Src = document.createElement("source");
      mp4Src.src = "/media/videos/" + a.video; mp4Src.type = "video/mp4";
      v.appendChild(webmSrc); v.appendChild(mp4Src);
      v.poster = img("video.avif");
      v.controls = true; v.playsInline = true; v.preload = "metadata";
      v.id = "popupVideo";
      popupMedia.appendChild(v);
      v.load();
      popupInfo.textContent = a.name + " — archival footage (local poster; offline player)";
      state.videoPlaying = false;
    } else if (kind === "pdf") {
      var im = document.createElement("img");
      im.src = img(a.pdf); im.alt = a.name + " document preview";
      popupMedia.appendChild(im);
      popupInfo.textContent = a.name + " — document preview";
    } else if (kind === "audio") {
      buildWavePlayer(popupMedia);
      popupInfo.textContent = "Julian Kade — recorded lecture (waveform player)";
    }
    popup.classList.add("is-open");
    requestAnimationFrame(function () { popup.classList.add("is-shown"); });
    document.body.classList.add("is-scroll-disabled");
  }

  function closePopup() {
    stopMedia();
    popup.classList.remove("is-shown");
    setTimeout(function () {
      popup.classList.remove("is-open");
      popupMedia.innerHTML = "";
    }, 300);
    state.popup = { open: false, kind: null, ref: null };
    document.body.classList.remove("is-scroll-disabled");
  }

  function playVideo() { var v = $("#popupVideo"); if (v) { v.play(); state.videoPlaying = true; return true; } return false; }
  function pauseVideo() { var v = $("#popupVideo"); if (v) { v.pause(); state.videoPlaying = false; } }

  var WAVE_PARTS = {
    1: { mp3: "/media/blob/audio/julian-kade-interview-part-1.mp3", json: "/media/blob/audio/julian_kade_part_1.json" },
    2: { mp3: "/media/blob/audio/julian-kade-interview-part-2.mp3", json: "/media/blob/audio/julian_kade_part_2.json" }
  };
  function buildWavePlayer(container) {
    var wrap = document.createElement("div");
    wrap.className = "wave-player"; wrap.id = "wavePlayer";
    wrap.innerHTML =
      '<div class="wave-player__title">Julian Kade — recorded lecture</div>' +
      '<canvas class="wave-player__canvas" id="waveCanvas" width="800" height="80"></canvas>' +
      '<div class="wave-player__controls">' +
        '<button type="button" class="wave-player__play" id="wavePlay" aria-label="Play audio">&#9658;</button>' +
        '<div class="wave-player__parts">' +
          '<button type="button" class="wave-player__part is-active" data-part="1">julian_kade_part_1</button>' +
          '<button type="button" class="wave-player__part" data-part="2">julian_kade_part_2</button>' +
        "</div>" +
      "</div>";
    container.appendChild(wrap);
    loadWavePart(1);
    $("#wavePlay").addEventListener("click", function () { state.audioPlaying ? pauseAudio() : playAudio(); });
    wrap.querySelectorAll(".wave-player__part").forEach(function (b) {
      b.addEventListener("click", function () {
        wrap.querySelectorAll(".wave-player__part").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        loadWavePart(parseInt(b.dataset.part, 10));
      });
    });
  }
  function loadWavePart(part) {
    state.audioPart = part;
    if (audioEl) { audioEl.pause(); }
    audioEl = new Audio(WAVE_PARTS[part].mp3);
    audioEl.preload = "metadata";
    state.audioPlaying = false;
    fetch(WAVE_PARTS[part].json).then(function (r) { return r.json(); }).then(function (d) {
      drawWave(d.data || []);
    }).catch(function () { drawWave([]); });
  }
  function drawWave(data, progress) {
    var c = $("#waveCanvas"); if (!c) return;
    var ctx = c.getContext("2d"); ctx.clearRect(0, 0, c.width, c.height);
    var n = Math.min(data.length, 400) || 100;
    var step = data.length ? Math.floor(data.length / n) : 1;
    var bw = c.width / n;
    for (var i = 0; i < n; i++) {
      var v = data.length ? Math.abs(data[i * step]) : (20 + Math.sin(i / 3) * 15 + Math.random() * 10);
      var h = Math.max(2, (v / (data.length ? 128 : 40)) * c.height);
      ctx.fillStyle = (progress != null && i / n < progress) ? "#FFE927" : "#fff";
      ctx.fillRect(i * bw, (c.height - h) / 2, Math.max(1, bw - 1), h);
    }
  }
  function playAudio() {
    if (!audioEl) return;
    audioEl.play(); state.audioPlaying = true;
    var wp = $("#wavePlayer"); if (wp) wp.classList.add("is-playing");
    var pb = $("#wavePlay"); if (pb) pb.innerHTML = "&#10073;&#10073;";
    if (waveInterval) clearInterval(waveInterval);
    waveInterval = setInterval(function () {
      if (!audioEl || !audioEl.duration) return;
      fetch(WAVE_PARTS[state.audioPart].json).then(function (r) { return r.json(); }).then(function (d) {
        drawWave(d.data || [], audioEl.currentTime / audioEl.duration);
      }).catch(function () {});
    }, 300);
  }
  function pauseAudio() {
    if (audioEl) audioEl.pause();
    state.audioPlaying = false;
    var wp = $("#wavePlayer"); if (wp) wp.classList.remove("is-playing");
    var pb = $("#wavePlay"); if (pb) pb.innerHTML = "&#9658;";
    if (waveInterval) { clearInterval(waveInterval); waveInterval = null; }
  }
  function stopMedia() {
    pauseVideo();
    if (audioEl) { audioEl.pause(); }
    state.audioPlaying = false; state.videoPlaying = false;
    if (waveInterval) { clearInterval(waveInterval); waveInterval = null; }
  }

  // ================= Chrome: reading list / dossier / palette =================
  function openReadingList() {
    state.readingListOpen = true;
    readingList.classList.add("is-open");
    readingList.setAttribute("aria-hidden", "false");
    renderReadingList();
    $("#readingListClose").focus();
  }
  function closeReadingList() {
    state.readingListOpen = false;
    readingList.classList.remove("is-open");
    readingList.setAttribute("aria-hidden", "true");
  }
  function renderReadingList() {
    var body = $("#readingListBody");
    if (!body) return;
    if (!state.pins.length) {
      body.innerHTML = '<p class="drawer__empty">No pinned architects yet. Pin a case to build your reading list.</p>';
      return;
    }
    body.innerHTML = state.pins.map(function (s) {
      var note = state.notes[s] || "";
      var preview = note.trim() ? note : '<span class="drawer__empty-note">empty note</span>';
      return '<article class="drawer__item" data-architect="' + s + '">' +
        '<h3>' + ARCHITECTS[s].name + "</h3>" +
        '<p class="drawer__note">' + preview + "</p>" +
        '<button type="button" data-open-case="' + s + '">Open case</button>' +
      "</article>";
    }).join("");
    body.querySelectorAll("[data-open-case]").forEach(function (b) {
      b.addEventListener("click", function () {
        closeReadingList();
        openCase(b.dataset.openCase, "folder-open");
      });
    });
  }

  function openDossier() {
    state.dossierOpen = true;
    dossierPanel.classList.add("is-open");
    dossierPanel.setAttribute("aria-hidden", "false");
    refreshDossierPreview();
    $("#dossierClose").focus();
  }
  function closeDossier() {
    state.dossierOpen = false;
    dossierPanel.classList.remove("is-open");
    dossierPanel.setAttribute("aria-hidden", "true");
  }
  function setDossierFormat(fmt) {
    if (fmt !== "json" && fmt !== "markdown") return { ok: false, error: "invalid format" };
    state.dossierFormat = fmt;
    $$(".dossier__format").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.format === fmt);
    });
    refreshDossierPreview();
    return { ok: true, format: fmt };
  }
  function copyDossier() {
    var text = dossierPreviewText();
    var done = function () {
      var el = $("#dossierCopied");
      if (el) { el.hidden = false; setTimeout(function () { el.hidden = true; }, 1500); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { done(); return { ok: true }; })
        .catch(function () { done(); return { ok: true }; });
    }
    done();
    return { ok: true };
  }
  function downloadDossier() {
    var text = dossierPreviewText();
    var ext = state.dossierFormat === "markdown" ? "md" : "json";
    var blob = new Blob([text], { type: state.dossierFormat === "markdown" ? "text/markdown" : "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "field-notes-archive-dossier." + ext;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    return { ok: true, format: state.dossierFormat, filename: a.download };
  }

  function openPalette() {
    if (state.paletteOpen) return;
    paletteFocusEl = document.activeElement;
    state.paletteOpen = true;
    state.paletteIndex = 0;
    commandPalette.classList.add("is-open");
    commandPalette.setAttribute("aria-hidden", "false");
    var input = $("#paletteInput");
    input.value = "";
    renderPalette("");
    input.focus();
  }
  function closePalette() {
    if (!state.paletteOpen) return;
    state.paletteOpen = false;
    commandPalette.classList.remove("is-open");
    commandPalette.setAttribute("aria-hidden", "true");
    if (paletteFocusEl && paletteFocusEl.focus) paletteFocusEl.focus();
  }
  function paletteResults(query) {
    var q = (query || "").trim().toLowerCase();
    return DESTINATIONS.filter(function (d) {
      if (!q) return true;
      return d.label.toLowerCase().indexOf(q) !== -1 || d.id.indexOf(q) !== -1;
    });
  }
  function renderPalette(query) {
    var list = $("#paletteList");
    var results = paletteResults(query);
    if (state.paletteIndex >= results.length) state.paletteIndex = Math.max(0, results.length - 1);
    list.innerHTML = results.map(function (d, i) {
      return '<li><button type="button" class="palette__item' + (i === state.paletteIndex ? " is-active" : "") +
        '" data-dest="' + d.id + '">' + d.label + "</button></li>";
    }).join("");
    list.querySelectorAll(".palette__item").forEach(function (b) {
      b.addEventListener("click", function () {
        navigate(b.dataset.dest);
        closePalette();
      });
    });
  }
  function activatePaletteSelection() {
    var results = paletteResults($("#paletteInput").value);
    var d = results[state.paletteIndex];
    if (!d) return;
    navigate(d.id);
    closePalette();
  }

  // ================= Header show/hide on scroll =================
  var lastScroll = 0;
  window.addEventListener("scroll", function () {
    if (state.route !== "home") return;
    var y = window.scrollY;
    if (y > lastScroll && y > 80) { header.classList.add("is-hidden"); state.headerVisible = false; }
    else { header.classList.remove("is-hidden"); state.headerVisible = true; }
    lastScroll = y;
  }, { passive: true });

  // ================= Nav wiring =================
  function bindNav(el) {
    if (el.dataset.navBound) return; el.dataset.navBound = "1";
    el.addEventListener("click", function () {
      var t = el.dataset.nav;
      if (t === "home") goHome();
      else if (t === "about") goAbout();
    });
  }
  function updateNav() {
    document.querySelectorAll(".the-nav__item").forEach(function (n) {
      n.classList.toggle("is-active", state.route === "about" && n.dataset.nav === "about");
    });
  }

  // ================= WebMCP surface =================
  var TOOLS = {};
  function reg(name, module, operation, description, handler) {
    TOOLS[name] = { name: name, module: module, operation: operation, description: description, handler: handler };
  }

  reg("browse_open", "browse-query-v1", "open",
    "Open one of the site's routes (home, about, or an architect case). Swaps the visible route via the same handler as clicking a stack tag or nav item.",
    function (args) {
      var d = args && args.destination;
      if (ROUTES.indexOf(d) === -1) return { ok: false, error: "unknown destination" };
      var ok = navigate(d);
      return { ok: !!ok, route: state.route, destination: d, title: document.title };
    });
  reg("browse_search", "browse-query-v1", "search",
    "Search architect tags on the home stack. args.query = substring of an architect name.",
    function (args) {
      return setSearchQuery(args && args.query);
    });
  reg("browse_apply_filter", "browse-query-v1", "apply_filter",
    "Apply a home category filter. args.filter = organic-early-modernism | expressive | monumental-modernism | place-culture-continuity.",
    function (args) {
      var f = args && (args.filter || args.value);
      return setCategoryFilter(f);
    });
  reg("browse_clear_filter", "browse-query-v1", "clear_filter",
    "Clear the home category filter (All) and optionally clear search.",
    function () {
      setCategoryFilter("all");
      return { ok: true, filter: "all" };
    });

  reg("session_play_video", "command-session-v1", "play-video",
    "Play the video in the open video popup (same as the popup play control).",
    function () {
      if (state.popup.kind !== "video") return { ok: false, error: "no video popup open" };
      playVideo();
      return { ok: true, playing: state.videoPlaying };
    });
  reg("session_pause_video", "command-session-v1", "pause-video",
    "Pause the video in the open video popup.",
    function () { pauseVideo(); return { ok: true, playing: state.videoPlaying }; });
  reg("session_play_audio", "command-session-v1", "play-audio",
    "Play the Julian Kade waveform audio (same as the player play control).",
    function () {
      if (state.popup.kind !== "audio") return { ok: false, error: "no audio popup open" };
      playAudio();
      return { ok: true, playing: state.audioPlaying };
    });
  reg("session_pause_audio", "command-session-v1", "pause-audio",
    "Pause the Julian Kade waveform audio.",
    function () { pauseAudio(); return { ok: true, playing: state.audioPlaying }; });
  reg("session_open_popup", "command-session-v1", "open-popup",
    "Open a media popup for the active case. args.type = video | pdf | audio.",
    function (args) {
      if (!state.activeSlug) return { ok: false, error: "not on a case route" };
      var type = args && args.type;
      var a = ARCHITECTS[state.activeSlug];
      if (type === "video" && !a.video) return { ok: false, error: "case has no video" };
      if (type === "pdf" && !a.pdf) return { ok: false, error: "case has no pdf" };
      if (type === "audio" && !a.audio) return { ok: false, error: "case has no audio" };
      openPopup(type, state.activeSlug);
      return { ok: true, popup: type };
    });
  reg("session_close_popup", "command-session-v1", "close-popup",
    "Close the open media popup.",
    function () { closePopup(); return { ok: true }; });
  reg("session_advance_case", "command-session-v1", "advance-case",
    "Advance from the active case to the next architect case (same as the overscroll affordance).",
    function () {
      if (!state.activeSlug) return { ok: false, error: "not on a case route" };
      advanceCase();
      return { ok: true, route: state.route };
    });

  reg("entity_create", "entity-collection-v1", "create",
    "Create/pin a bookmark. args.fields = { architect, note?, pinned? } — same as Pin + Save note.",
    function (args) {
      var fields = (args && args.fields) || args || {};
      if (fields.pinned == null) fields.pinned = true;
      return setBookmark(fields);
    });
  reg("entity_select", "entity-collection-v1", "select",
    "Select a bookmark by architect id and open that case (same as reading-list Open case).",
    function (args) {
      var id = args && args.id;
      if (!ARCHITECTS[id]) return { ok: false, error: "unknown architect" };
      openCase(id, "folder-open");
      return { ok: true, id: id, route: state.route, pinned: isPinned(id) };
    });
  reg("entity_update", "entity-collection-v1", "update",
    "Update bookmark fields. args.id = architect slug; args.fields = { note?, pinned? }.",
    function (args) {
      var id = args && args.id;
      var fields = Object.assign({ architect: id }, (args && args.fields) || {});
      if (fields.pinned == null) fields.pinned = isPinned(id);
      if (fields.note == null) fields.note = state.notes[id] || "";
      return setBookmark(fields);
    });
  reg("entity_delete", "entity-collection-v1", "delete",
    "Remove a bookmark pin. args.id = architect slug; requires confirm=true.",
    function (args) {
      return deleteBookmark(args && args.id, args && args.confirm);
    });
  reg("entity_toggle", "entity-collection-v1", "toggle",
    "Toggle the Pin control for an architect bookmark. args.id = architect slug.",
    function (args) {
      var id = args && args.id;
      if (!id && state.activeSlug) id = state.activeSlug;
      return togglePin(id);
    });

  reg("artifact_export", "artifact-transfer-v1", "export",
    "Open Export dossier and set format (json|markdown), then trigger Download. No file bytes in the result.",
    function (args) {
      var format = (args && args.format) || "json";
      if (format !== "json" && format !== "markdown") return { ok: false, error: "invalid format" };
      openDossier();
      setDossierFormat(format);
      var res = downloadDossier();
      return { ok: true, format: format, filename: res.filename };
    });
  reg("artifact_copy", "artifact-transfer-v1", "copy",
    "Open Export dossier and trigger Copy of the visible preview (clipboard verified in Playwright).",
    function () {
      openDossier();
      refreshDossierPreview();
      var r = copyDossier();
      if (r && typeof r.then === "function") return r.then(function () { return { ok: true, format: state.dossierFormat }; });
      return { ok: true, format: state.dossierFormat };
    });
  reg("artifact_import", "artifact-transfer-v1", "import",
    "Import dossier from the paste textarea (mode=dossier). Does not accept raw file bytes via WebMCP.",
    function (args) {
      var mode = (args && args.mode) || "dossier";
      if (mode !== "dossier") return { ok: false, error: "unsupported import mode" };
      openDossier();
      var text = $("#dossierImportArea") ? $("#dossierImportArea").value : "";
      return importDossierJson(text);
    });

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      site: "fieldnotesarchive",
      modules: ["browse-query-v1", "command-session-v1", "entity-collection-v1", "artifact-transfer-v1"],
      route: state.route,
      active_case: state.activeSlug,
      pins: state.pins.slice(),
      tool_count: Object.keys(TOOLS).length
    };
  };
  window.webmcp_list_tools = function () {
    return Object.keys(TOOLS).map(function (n) {
      return { name: n, module: TOOLS[n].module, operation: TOOLS[n].operation, description: TOOLS[n].description };
    });
  };
  window.webmcp_invoke_tool = function (name, args) {
    if (!TOOLS[name]) return { ok: false, error: "unknown tool: " + name };
    try { return TOOLS[name].handler(args || {}); }
    catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  };

  // ================= Boot =================
  function wireChrome() {
    document.querySelectorAll("[data-nav]").forEach(bindNav);
    $("#readingListBtn").addEventListener("click", openReadingList);
    $("#readingListBtnCase").addEventListener("click", openReadingList);
    $("#readingListClose").addEventListener("click", closeReadingList);
    $("#exportDossierBtn").addEventListener("click", openDossier);
    $("#exportDossierBtnCase").addEventListener("click", openDossier);
    $("#dossierClose").addEventListener("click", closeDossier);
    $$(".dossier__format").forEach(function (b) {
      b.addEventListener("click", function () { setDossierFormat(b.dataset.format); });
    });
    $("#dossierCopy").addEventListener("click", function () { copyDossier(); });
    $("#dossierDownload").addEventListener("click", downloadDossier);
    $("#dossierImportBtn").addEventListener("click", function () {
      importDossierJson($("#dossierImportArea").value);
    });
    $("#dossierImportFile").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        $("#dossierImportArea").value = String(reader.result || "");
        importDossierJson($("#dossierImportArea").value);
      };
      reader.readAsText(file);
    });
    $$(".home-filter").forEach(function (b) {
      b.addEventListener("click", function () { setCategoryFilter(b.dataset.filter); });
    });
    $("#homeSearch").addEventListener("input", function (e) {
      setSearchQuery(e.target.value);
    });
    $("#paletteInput").addEventListener("input", function (e) {
      state.paletteIndex = 0;
      renderPalette(e.target.value);
    });
    $("#paletteInput").addEventListener("keydown", function (e) {
      var results = paletteResults(e.target.value);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        state.paletteIndex = Math.min(results.length - 1, state.paletteIndex + 1);
        renderPalette(e.target.value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        state.paletteIndex = Math.max(0, state.paletteIndex - 1);
        renderPalette(e.target.value);
      } else if (e.key === "Enter") {
        e.preventDefault();
        activatePaletteSelection();
      }
    });

    popup.addEventListener("click", function (e) {
      var t = e.target;
      if (t === popup || (t && t.hasAttribute && t.hasAttribute("data-popup-close"))) {
        if (t.closest && t.closest(".popup__box") && !t.hasAttribute("data-popup-close")) return;
        closePopup();
      }
    });
    $$("[data-popup-close]", popup).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      });
    });

    document.addEventListener("keydown", function (e) {
      var meta = e.ctrlKey || e.metaKey;
      if (e.key === "Escape") {
        if (state.paletteOpen) { closePalette(); return; }
        if (state.dossierOpen) { closeDossier(); return; }
        if (state.readingListOpen) { closeReadingList(); return; }
        if (state.popup.open) { closePopup(); return; }
      }
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (state.paletteOpen) closePalette();
        else openPalette();
        return;
      }
      if (meta && e.key === "z" && !e.shiftKey) {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        e.preventDefault();
        undoScrapbook();
        return;
      }
      if (meta && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        e.preventDefault();
        redoScrapbook();
      }
    });

    window.addEventListener("popstate", function () {
      var route = routeFromPath(location.pathname) || "home";
      navigate(route, { skipHistory: true, replace: true });
    });
  }

  function bootFromLocation() {
    var route = routeFromPath(location.pathname);
    if (!route || route === "home") goHome({ replace: true });
    else navigate(route, { replace: true });
  }

  function boot() {
    wireChrome();
    splitHeroChars();
    renderStack();
    bootFromLocation();
    requestAnimationFrame(function () {
      app.classList.remove("is-loading");
      if (state.route === "home") {
        revealHero();
        $("#stack").querySelectorAll(".tag").forEach(function (t, i) {
          setTimeout(function () { t.classList.add("is-visible"); }, 300 + i * 60);
        });
      }
    });
  }

  function start() {
    fetch("/assets/manifest.json").then(function (r) { return r.json(); })
      .then(function (m) { MANIFEST = m; boot(); })
      .catch(function () { boot(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
