(() => {
  "use strict";

  /* ============================================================
     Storyboard getting-started tutorial — single-file SPA
     One shared in-memory store drives every surface.
     ============================================================ */

  const SHOT_VALUES = ["wide", "medium", "close-up", "insert", "pov"];
  const SHOT_LABEL = { wide: "Wide", medium: "Medium", "close-up": "Close-up", insert: "Insert", pov: "POV" };
  const VIEW_MODES = ["tile", "list", "slide"];
  const SCHEMA_VERSION = "storyboard-tutorial-v1";
  const reduceMotion = () =>
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }
  function clampInt(v, lo, hi) {
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    if (n < lo || n > hi) return null;
    return n;
  }
  function trimLen(s, lo, hi) {
    const t = String(s == null ? "" : s).trim();
    return t.length >= lo && t.length <= hi ? t : null;
  }

  /* ---------- seed data ---------- */
  function seedScenes() {
    const base = [
      ["Welcome to Docs", "Welcome to Docs! This text is a scene description. You can edit it by clicking directly on the text. We have kept it simple to show you how the product works.", "wide", 18, "./assets/scenes/scene-01.webp"],
      ["Storyboard title and tools", "The header on the left displays the storyboard title and essential tools. Edit modifies your storyboard, Duplicate creates a copy, Share lets you collaborate, Lock prevents edits, and Archive organizes completed storyboards.", "medium", 24, "./assets/scenes/scene-02.webp"],
      ["Notifications and dashboard", "The right side of the header provides quick access to important updates and management tools. The bell icon keeps you updated with notifications, and the dashboard icon manages all your storyboards, invites members, and reviews archived content.", "close-up", 22, "./assets/scenes/scene-03.webp"],
      ["The user and app settings", "Click the user icon to reveal three tabs. Storyboards manages all storyboards, Settings customizes appearance and functionality, and Account adjusts account preferences. Each tab provides tools to control appearance and manage the account.", "insert", 26, "./assets/scenes/scene-04.webp"],
      ["Tile, list, or slide mode", "Control how scenes are displayed. Tile mode views scenes as a grid, list mode shows scene details in a vertical list, and slide mode displays one scene at a time. Refine these options further in Settings.", "wide", 21, "./assets/scenes/scene-05.webp"],
      ["Three-dot menu actions", "Hover over any image to reveal the three-dot menu for quick actions. Replace the image, add or edit the description, or reorder, duplicate, or delete scenes. The same menu exposes every per-scene control.", "pov", 25, "./assets/scenes/scene-06.webp"],
      ["Add Scene options", "The Add Scene button offers flexible options. Add Scene immediately adds a single scene, while the dropdown lets you import images to upload multiple scenes or change the sort order with precision.", "medium", 23, "./assets/scenes/scene-07.webp"],
      ["Help and support", "Keep learning and check out the next demo, Create Your First Storyboard. For answers to common questions visit the FAQ, or contact the support team for help with anything else along the way.", "close-up", 22, "./assets/scenes/scene-08.webp"],
    ];
    let i = 0;
    const scenes = base.map((b) => ({
      id: "scene-" + (++i),
      title: b[0],
      body: b[1],
      shotType: b[2],
      duration: b[3],
      img: b[4],
      alt: "Storyboard scene " + i + " illustration for the getting started tutorial",
    }));
    scenes.push({ id: "scene-" + (++i), title: "Add a frame here", body: "Camera placeholder. Click the add-image button to attach a frame for this beat of the storyboard, then write what the audience should see.", shotType: "insert", duration: 5, img: null, alt: "Empty camera placeholder scene " + i });
    scenes.push({ id: "scene-" + (++i), title: "Add a frame here", body: "Camera placeholder. Add an image here when you are ready to extend the sequence with another shot and its description.", shotType: "pov", duration: 5, img: null, alt: "Empty camera placeholder scene " + i });
    return scenes;
  }

  /* ---------- store ---------- */
  let uid = 1000;
  const newId = () => "scene-" + (++uid);

  const store = {
    scenes: seedScenes(),
    viewMode: "tile",
    slideIndex: 0,
    selection: new Set(),
    search: "",
    shotFilter: "all",
    lastEditedId: null,
    presenter: { open: false, index: 0, remainingMs: 0, paused: false, finished: false, startedAt: 0, elapsedBefore: 0 },
    history: { undo: [], redo: [] },
    coach: { firstRunDone: false, exportTipDone: false },
    ui: { exporting: false, importing: false },
  };

  function cloneScenes(arr) { return arr.map((s) => Object.assign({}, s)); }
  function snapshot() { return { scenes: cloneScenes(store.scenes), selection: Array.from(store.selection) }; }
  function pushHistory() {
    store.history.undo.push(snapshot());
    if (store.history.undo.length > 100) store.history.undo.shift();
    store.history.redo = [];
    syncHistoryButtons();
  }
  function restore(snap) {
    store.scenes = cloneScenes(snap.scenes);
    store.selection = new Set(snap.selection.filter((id) => store.scenes.some((s) => s.id === id)));
  }

  function totalDuration() {
    return store.scenes.reduce((a, s) => a + (Number(s.duration) || 0), 0);
  }
  function imagedScenes() { return store.scenes.filter((s) => s.img); }
  function allScenesForCount() { return store.scenes; }

  function filteredScenes() {
    const q = store.search.trim().toLowerCase();
    const shot = store.shotFilter;
    return store.scenes.filter((s) => {
      if (shot !== "all" && s.shotType !== shot) return false;
      if (q) {
        const hay = (s.title + " " + s.body).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }
  function isFiltering() { return store.search.trim() !== "" || store.shotFilter !== "all"; }

  /* ---------- validation ---------- */
  function validateSceneFields(v) {
    const e = {};
    const title = trimLen(v.title, 1, 80);
    if (title == null) e.title = v.title && String(v.title).trim().length > 80
      ? "Title is too long. Keep it under 80 characters."
      : "Title is required. Enter a name for the scene (1 to 80 characters).";
    const body = trimLen(v.body, 1, 500);
    if (body == null) e.body = v.body && String(v.body).trim().length > 500
      ? "Description is too long. Keep it under 500 characters."
      : "Description is required. Describe what happens in the scene (1 to 500 characters).";
    const dur = clampInt(v.duration, 1, 300);
    if (dur == null) e.duration = "Duration must be a whole number of seconds between 1 and 300.";
    if (!SHOT_VALUES.includes(v.shotType)) e.shotType = "Shot type is required. Choose Wide, Medium, Close-up, Insert, or POV.";
    return { errors: e, valid: Object.keys(e).length === 0,
      clean: { title: title == null ? String(v.title || "").trim() : title,
               body: body == null ? String(v.body || "").trim() : body,
               duration: dur == null ? 1 : dur,
               shotType: SHOT_VALUES.includes(v.shotType) ? v.shotType : "wide" } };
  }

  function validateDocument(doc) {
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) return { error: "The document must be a JSON object with schemaVersion, title, viewMode, totalDuration, and scenes." };
    if (doc.schemaVersion !== SCHEMA_VERSION) return { error: "schemaVersion must be exactly \"" + SCHEMA_VERSION + "\"." };
    if (typeof doc.title !== "string" || !doc.title.trim()) return { error: "title is required and must be a non-empty string." };
    if (!VIEW_MODES.includes(doc.viewMode)) return { error: "viewMode must be one of tile, list, or slide." };
    if (!Array.isArray(doc.scenes)) return { error: "scenes must be an array of scene objects." };
    const sum = doc.scenes.reduce((a, s) => a + (Number(s && s.duration) || 0), 0);
    if (typeof doc.totalDuration !== "number" || !Number.isInteger(doc.totalDuration) || doc.totalDuration < 0) return { error: "totalDuration must be a non-negative integer." };
    if (doc.totalDuration !== sum) return { error: "totalDuration must equal the sum of every scene duration." };
    const orders = [];
    for (let i = 0; i < doc.scenes.length; i++) {
      const s = doc.scenes[i];
      const p = "scenes[" + i + "].";
      if (!s || typeof s !== "object") return { error: p + "each scene must be an object." };
      if (typeof s.id !== "string" || !s.id.trim()) return { error: p + "id is required and must be a non-empty string." };
      if (typeof s.title !== "string" || !trimLen(s.title, 1, 80)) return { error: p + "title must be a string of 1 to 80 characters." };
      if (typeof s.body !== "string" || !trimLen(s.body, 1, 500)) return { error: p + "body must be a string of 1 to 500 characters." };
      if (clampInt(s.duration, 1, 300) == null) return { error: p + "duration must be an integer between 1 and 300." };
      if (!SHOT_VALUES.includes(s.shotType)) return { error: p + "shotType must be one of wide, medium, close-up, insert, or pov." };
      if (clampInt(s.order, 1, doc.scenes.length) == null) return { error: p + "order must be a 1-based integer with no gaps." };
      if (s.order !== i + 1) return { error: p + "order must match the scene's 1-based position in the scenes array." };
      orders.push(s.order);
    }
    const sorted = orders.slice().sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) if (sorted[i] !== i + 1) return { error: "order values must run from 1 to " + doc.scenes.length + " with no gaps or duplicates." };
    if (new Set(orders).size !== orders.length) return { error: "order values must be unique." };
    return { ok: true };
  }

  /* ---------- DOM refs ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const grid = $("#scenes-grid");
  const filmstrip = $("#filmstrip");
  const bulkBar = $("#bulk-bar");
  const emptyState = $("#empty-state");
  const filteredEmpty = $("#filtered-empty");
  const slideControls = $(".slide-controls");
  const live = $("#live-region");
  const liveAssert = $("#live-assertive");
  const toastStack = $("#toast-stack");
  const overlay = $("#overlay");
  const dialog = $("#dialog");
  const presenterEl = $("#presenter");
  const coachEl = $("#coachmark");

  /* ---------- announce / toast ---------- */
  let liveToken = 0;
  function announce(text, assertive) {
    const node = assertive ? liveAssert : live;
    const t = ++liveToken;
    node.textContent = "";
    setTimeout(() => { if (t === liveToken) node.textContent = text; }, 30);
  }
  function toast(msg, ok) {
    const el = document.createElement("div");
    el.className = "toast" + (ok ? " toast-ok" : "");
    el.setAttribute("role", "status");
    el.innerHTML = '<span class="icon ' + (ok ? "icon-check" : "icon-film") + '" aria-hidden="true"></span><span></span>';
    el.lastChild.textContent = msg;
    toastStack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 320);
    }, 1800);
  }

  /* ============================================================
     Rendering
     ============================================================ */
  let enteringIds = new Set();

  function cardHTML(s, order) {
    const selected = store.selection.has(s.id);
    const isPh = !s.img;
    const last = store.lastEditedId === s.id ? " is-lastedit" : "";
    const sel = selected ? " is-selected" : "";
    const meta = '<div class="scene-meta"><span class="shot-badge">' + esc(SHOT_LABEL[s.shotType]) + '</span><span class="dur-badge"><span class="icon icon-clock" aria-hidden="true"></span>' + (Number(s.duration) || 0) + 's</span></div>';
    const media = isPh
      ? '<div class="scene-image placeholder" role="img" aria-label="' + esc(s.alt) + '">' +
          '<button type="button" class="scene-actions" data-act="menu" data-id="' + s.id + '" aria-label="Scene ' + order + ' actions"><span class="icon icon-kebab" aria-hidden="true"></span></button>' +
          '<div class="placeholder-center"><button type="button" class="btn-camera inert-nav" aria-label="Add image to scene ' + order + '"><span class="icon icon-camera" aria-hidden="true"></span></button></div>' +
          meta +
        '</div>'
      : '<div class="scene-image" role="img" aria-label="' + esc(s.alt) + '">' +
          '<img src="' + esc(s.img) + '" alt="' + esc(s.alt) + '" loading="lazy">' +
          '<button type="button" class="scene-actions" data-act="menu" data-id="' + s.id + '" aria-label="Scene ' + order + ' actions"><span class="icon icon-kebab" aria-hidden="true"></span></button>' +
          meta +
        '</div>';
    return '' +
      '<div class="scene-column" data-col="' + s.id + '">' +
        '<div class="scene-position">' + order + '</div>' +
        '<div class="scene-item' + sel + last + '" data-card="' + s.id + '">' +
          '<input type="checkbox" class="scene-select" data-act="select" data-id="' + s.id + '"' + (selected ? " checked" : "") + ' aria-label="Select scene ' + order + '">' +
          '<div class="scene-card-wrap">' +
            media +
            '<h2 class="scene-title">' + esc(s.title) + '</h2>' +
            '<textarea class="scene-body-field thin-scrollbar" data-act="body" data-id="' + s.id + '" rows="3" aria-label="Scene ' + order + ' description">' + esc(s.body) + '</textarea>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  let firstGridRender = true;
  function renderGrid(animateFlip) {
    const visible = filteredScenes();
    const mode = store.viewMode;

    let firsts = null;
    if (animateFlip && !reduceMotion()) {
      firsts = new Map();
      grid.querySelectorAll("[data-card]").forEach((el) => firsts.set(el.getAttribute("data-card"), el.getBoundingClientRect()));
    }
    grid.classList.toggle("is-list", mode === "list");
    grid.classList.toggle("is-slide", mode === "slide");

    const filtering = isFiltering();
    const totalAll = store.scenes.length;

    let html = "";
    if (mode === "slide") {
      visible.forEach((s, idx) => {
        const order = store.scenes.indexOf(s) + 1;
        html += cardHTML(s, order).replace('class="scene-column"', 'class="scene-column' + (idx === store.slideIndex ? " is-slide-active" : "") + '"');
      });
    } else {
      visible.forEach((s) => { html += cardHTML(s, store.scenes.indexOf(s) + 1); });
      // trailing placeholders are part of scenes already (img:null). Add Scene control:
      html += '<div class="add-scene-column"><div class="add-scene-wrap"><div class="add-scene-group">' +
              '<button type="button" class="add-scene" data-act="add" aria-label="Add Scene">Add Scene</button>' +
              '<button type="button" class="add-scene-dropdown" data-act="add" aria-label="Add Scene options"><span class="icon icon-chevron-down" aria-hidden="true"></span></button>' +
              '</div></div></div>';
    }
    grid.innerHTML = html;

    grid.querySelectorAll("[data-card]").forEach((el, index) => {
      const id = el.getAttribute("data-card");
      if (firstGridRender && !reduceMotion()) {
        el.classList.add("is-initial-enter");
        el.style.setProperty("--enter-delay", Math.min(index * 55, 440) + "ms");
      } else if (enteringIds.has(id) && !reduceMotion()) {
        el.classList.add("is-initial-enter");
      }
    });
    firstGridRender = false;
    enteringIds.clear();

    // entrance animation
    if (!reduceMotion()) {
      enteringIds.forEach((id) => {
        const el = grid.querySelector('[data-card="' + cssEsc(id) + '"]');
        if (el) { el.classList.add("is-entering"); }
      });
      if (enteringIds.size) {
        requestAnimationFrame(() => {
          enteringIds.forEach((id) => {
            const el = grid.querySelector('[data-card="' + cssEsc(id) + '"]');
            if (el) { requestAnimationFrame(() => { el.classList.add("is-entered"); el.classList.remove("is-entering"); }); }
          });
          enteringIds = new Set();
        });
      }
    } else {
      enteringIds = new Set();
    }

    // FLIP
    if (firsts) {
      grid.querySelectorAll("[data-card]").forEach((el) => {
        const id = el.getAttribute("data-card");
        const f = firsts.get(id);
        if (!f) return;
        const l = el.getBoundingClientRect();
        const dx = f.left - l.left, dy = f.top - l.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.style.transition = "none";
        el.style.transform = "translate(" + dx + "px," + dy + "px)";
        requestAnimationFrame(() => {
          el.style.transition = "transform 320ms cubic-bezier(0.2,0.8,0.2,1)";
          el.style.transform = "";
          const clear = () => { el.style.transition = ""; el.removeEventListener("transitionend", clear); };
          el.addEventListener("transitionend", clear);
          setTimeout(clear, 380);
        });
      });
    }

    // autosize body fields
    grid.querySelectorAll("textarea.scene-body-field").forEach(autoSize);

    // empty states
    emptyState.hidden = !(totalAll === 0);
    filteredEmpty.hidden = !(totalAll > 0 && visible.length === 0);
    grid.hidden = (totalAll === 0) || (totalAll > 0 && visible.length === 0) ? false : false;
    grid.style.display = (totalAll === 0 || (totalAll > 0 && visible.length === 0)) ? "none" : "";

    updateChrome(visible);
  }

  function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }

  function autoSize(ta) {
    ta.style.height = "auto";
    ta.style.height = Math.max(60, ta.scrollHeight) + "px";
  }

  function updateChrome(visible) {
    // view toggles
    document.querySelectorAll(".view-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === store.viewMode)));
    // slide controls
    const showSlide = store.viewMode === "slide";
    slideControls.hidden = !showSlide;
    const total = visible.length;
    if (showSlide) {
      if (store.slideIndex > total - 1) store.slideIndex = Math.max(0, total - 1);
      $(".slide-counter").textContent = total ? (store.slideIndex + 1) + " / " + total : "0 / 0";
      const prev = $('.slide-nav[data-slide-dir="-1"]'), next = $('.slide-nav[data-slide-dir="1"]');
      prev.disabled = store.slideIndex <= 0;
      next.disabled = store.slideIndex >= total - 1;
      grid.querySelectorAll("[data-col]").forEach((c) => {
        const id = c.getAttribute("data-col");
        const idx = visible.findIndex((s) => s.id === id);
        c.classList.toggle("is-slide-active", idx === store.slideIndex);
      });
    }
    // total duration
    $("#total-duration").textContent = "Total duration " + totalDuration() + "s";
    // search clear btn
    $("#search-clear").hidden = store.search === "";
    // shot chips
    document.querySelectorAll(".shot-chip").forEach((c) => c.setAttribute("aria-pressed", String(c.getAttribute("data-shot") === store.shotFilter)));
    // filter count
    const fc = $("#filter-count");
    if (isFiltering()) { fc.hidden = false; fc.textContent = visible.length + " of " + store.scenes.length + " scenes"; }
    else fc.hidden = true;
    // present disabled when no visible scenes
    $("#present-btn").disabled = visible.length === 0;
    // bulk bar
    const selCount = store.selection.size;
    if (selCount >= 2) {
      bulkBar.hidden = false;
      $("#bulk-count").textContent = selCount + " selected";
    } else bulkBar.hidden = true;
    // history buttons
    syncHistoryButtons();
    // filmstrip
    renderFilmstrip();
    // live total for AT
  }

  function syncHistoryButtons() {
    $("#undo-btn").disabled = store.history.undo.length === 0;
    $("#redo-btn").disabled = store.history.redo.length === 0;
  }

  function renderFilmstrip() {
    const visible = filteredScenes();
    let html = "";
    store.scenes.forEach((s, i) => {
      const order = i + 1;
      const isActive = store.viewMode === "slide" && visible[store.slideIndex] && visible[store.slideIndex].id === s.id;
      const last = store.lastEditedId === s.id ? " is-lastedit" : "";
      const ph = !s.img ? " is-ph" : "";
      const inner = s.img
        ? '<img src="' + esc(s.img) + '" alt="' + esc(s.alt || s.title) + '">'
        : '<span class="icon icon-camera" aria-hidden="true"></span>';
      html += '<button type="button" class="film-thumb' + (isActive ? " is-active" : "") + last + ph + '" data-film="' + s.id + '" role="listitem" aria-label="Go to scene ' + order + ': ' + esc(s.title) + '">' + inner + '<span class="film-num">' + order + '</span></button>';
    });
    filmstrip.innerHTML = html;
  }

  function render(animateFlip) { renderGrid(animateFlip); if (store.presenter.open) renderPresenter(); if (store.ui.exporting) refreshExportPreview(); }

  /* ============================================================
     Mutations
     ============================================================ */
  function addScene(clean, opts) {
    opts = opts || {};
    pushHistory();
    const scene = { id: newId(), title: clean.title, body: clean.body, duration: clean.duration, shotType: clean.shotType, img: null, alt: "Storyboard scene illustration" };
    store.scenes.push(scene);
    store.selection = new Set();
    store.lastEditedId = scene.id; sessionStorage.setItem("sb_last_id", scene.id);
    enteringIds = new Set([scene.id]);
    if (store.viewMode === "slide") store.slideIndex = filteredScenes().length; // will clamp in render to last visible
    render(true);
    if (!opts.silent) { toast("Scene added"); announce("Scene added: " + clean.title + ". Total duration " + totalDuration() + " seconds."); }
    maybeExportCoach();
    return scene;
  }

  function updateScene(id, patch, opts) {
    opts = opts || {};
    const s = store.scenes.find((x) => x.id === id);
    if (!s) return null;
    pushHistory();
    Object.assign(s, patch);
    store.lastEditedId = id; sessionStorage.setItem("sb_last_id", id);
    render(true);
    if (!opts.silent) { toast("Scene updated"); announce("Scene updated. Total duration " + totalDuration() + " seconds."); }
    maybeExportCoach();
    return s;
  }

  function deleteScene(id, opts) {
    opts = opts || {};
    const idx = store.scenes.findIndex((x) => x.id === id);
    if (idx < 0) return false;
    const doCommit = () => {
      pushHistory();
      store.scenes.splice(idx, 1);
      store.selection.delete(id);
      if (store.lastEditedId === id) store.lastEditedId = window._lastActiveScene || null;
      render(true);
      if (!opts.silent) { toast("Scene deleted"); announce("Scene deleted. Total duration " + totalDuration() + " seconds."); }
    };
    if (opts.animate && !reduceMotion()) animateRemovalGhosts([id]);
    doCommit();
    return true;
  }

  function animateRemovalGhosts(ids) {
    ids.forEach((id) => {
      const el = grid.querySelector('[data-card="' + cssEsc(id) + '"]');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ghost = el.cloneNode(true);
      ghost.className = "scene-item removal-ghost";
      ghost.removeAttribute("data-card");
      ghost.querySelectorAll("[data-act],[data-id]").forEach((node) => { node.removeAttribute("data-act"); node.removeAttribute("data-id"); });
      ghost.querySelectorAll(".scene-title,.scene-body-field,.scene-select,.scene-actions,.scene-meta").forEach((node) => node.remove());
      Object.assign(ghost.style, { position: "fixed", left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px", margin: "0" });
      ghost.setAttribute("aria-hidden", "true");
      document.body.appendChild(ghost);
      requestAnimationFrame(() => ghost.classList.add("is-removing"));
      setTimeout(() => ghost.remove(), 260);
    });
  }

  function deleteSelected() {
    const ids = Array.from(store.selection);
    if (ids.length < 2) return;
    pushHistory();
    const finish = () => {
      store.scenes = store.scenes.filter((s) => !store.selection.has(s.id));
      const n = ids.length;
      store.selection = new Set();
      if (store.lastEditedId && ids.includes(store.lastEditedId)) store.lastEditedId = window._lastActiveScene || null;
      render(true);
      toast(n + " scenes deleted");
      announce(n + " scenes deleted. Total duration " + totalDuration() + " seconds.");
    };
    if (!reduceMotion()) animateRemovalGhosts(ids);
    finish();
  }

  function duplicateSelected() {
    const ids = Array.from(store.selection);
    if (ids.length < 1) return;
    pushHistory();
    const copies = [];
    ids.forEach((id) => {
      const s = store.scenes.find((x) => x.id === id);
      if (!s) return;
      const title = (s.title + " (copy)").slice(0, 80);
      const c = { id: newId(), title, body: s.body, duration: s.duration, shotType: s.shotType, img: s.img, alt: s.alt };
      copies.push(c);
    });
    store.scenes = store.scenes.concat(copies);
    enteringIds = new Set(copies.map((c) => c.id));
    store.selection = new Set();
    render(true);
    toast(copies.length + " scene" + (copies.length > 1 ? "s" : "") + " duplicated");
    announce(copies.length + " scenes duplicated. Total duration " + totalDuration() + " seconds.");
  }

  function moveScene(id, delta) {
    const i = store.scenes.findIndex((x) => x.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= store.scenes.length) return;
    pushHistory();
    const tmp = store.scenes[i];
    store.scenes[i] = store.scenes[j];
    store.scenes[j] = tmp;
    render(true);
    toast("Scene moved");
  }

  function toggleSelect(id) {
    if (store.selection.has(id)) store.selection.delete(id); else store.selection.add(id);
    render(false);
  }

  function setViewMode(mode) {
    if (!VIEW_MODES.includes(mode) || mode === store.viewMode) return;
    store.viewMode = mode;
    if (mode === "slide") store.slideIndex = Math.min(store.slideIndex, Math.max(0, filteredScenes().length - 1));
    render(true);
    toast(mode === "tile" ? "Tile mode" : mode === "list" ? "List mode" : "Slide mode");
  }

  function setSearch(q) { store.search = q; store.slideIndex = 0; render(true); }
  function setShotFilter(shot) { store.shotFilter = shot; store.slideIndex = 0; render(true); }
  function clearFilters() { store.search = ""; store.shotFilter = "all"; $("#search-input").value = ""; store.slideIndex = 0; render(true); }

  /* undo / redo */
  function undo() {
    if (!store.history.undo.length) return;
    store.history.redo.push(snapshot());
    restore(store.history.undo.pop());
    render(true);
    announce("Undone.");
  }
  function redo() {
    if (!store.history.redo.length) return;
    store.history.undo.push(snapshot());
    restore(store.history.redo.pop());
    render(true);
    announce("Redone.");
  }

  /* import */
  function applyDocument(doc) {
    pushHistory();
    const ordered = doc.scenes.slice().sort((a, b) => a.order - b.order);
    store.scenes = ordered.map((s) => ({ id: String(s.id), title: s.title, body: s.body, duration: s.duration, shotType: s.shotType, img: null, alt: "Imported storyboard scene illustration" }));
    store.viewMode = doc.viewMode;
    store.selection = new Set();
    store.search = "";
    store.shotFilter = "all";
    store.slideIdx = 0;

    // apply viewMode in DOM immediately
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-mode") === store.viewMode ? "true" : "false");
    });

    render(true);
  }

  /* ============================================================
     Dialogs (focus-managed, focus trap, labelled fields)
     ============================================================ */
  let lastFocus = null;
  let lastFocusSelector = null;
  let dialogOnClose = null;

  function openDialog(html, opts) {
    opts = opts || {};
    lastFocus = document.activeElement;
    lastFocusSelector = lastFocus && lastFocus.id ? "#" + cssEsc(lastFocus.id) :
      lastFocus && lastFocus.getAttribute && lastFocus.getAttribute("data-act") ? '[data-act="' + lastFocus.getAttribute("data-act") + '"]' : null;
    dialog.className = "dialog" + (opts.wide ? " dialog-wide" : "");
    dialog.innerHTML = html;
    overlay.hidden = false;
    dialogOnClose = opts.onClose || null;
    const focusTarget = dialog.querySelector("[data-autofocus]") || dialog.querySelector("input,textarea,select,button");
    if (focusTarget) focusTarget.focus(); else dialog.focus();
  }
  function closeDialog() {
    overlay.hidden = true;
    dialog.innerHTML = "";
    const cb = dialogOnClose; dialogOnClose = null;
    const returnTarget = lastFocus && lastFocus.isConnected ? lastFocus : lastFocusSelector ? document.querySelector(lastFocusSelector) : null;
    if (returnTarget && returnTarget.focus) returnTarget.focus();
    else setTimeout(() => {
      const fallback = lastFocusSelector ? document.querySelector(lastFocusSelector) : document.querySelector(".add-scene");
      if (fallback) fallback.focus();
    }, 0);
    if (cb) cb();
  }
  function focusables(root) {
    return Array.from(root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      .filter((el) => el.offsetParent !== null || el === document.activeElement);
  }
  function trapFocus(e, root) {
    if (e.key !== "Tab") return;
    const f = focusables(root);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- create / edit form ---------- */
  function openSceneForm(scene) {
    const editing = !!scene;
    const v = editing ? scene : { title: "", body: "", duration: 5, shotType: "" };
    const opts = editing ? { title: scene.title, body: scene.body, duration: scene.duration, shotType: scene.shotType } : { title: "", body: "", duration: 5, shotType: "" };
    const touched = { title: editing, body: editing, duration: editing, shotType: editing };
    const html =
      '<div class="dialog-head"><h2 class="dialog-title" id="dialog-title">' + (editing ? "Edit scene" : "Add scene") + '</h2>' +
      '<button type="button" class="dialog-close" data-close aria-label="Close form"><span class="icon icon-x" aria-hidden="true"></span></button></div>' +
      '<div class="dialog-body">' +
        fieldHTML("f-title", "Title", "text", opts.title, true, "Name of the scene") +
        fieldHTML("f-body", "Description", "textarea", opts.body, true, "What happens in the scene") +
        '<div class="field-row" style="display:flex;gap:14px">' +
          '<div class="field" style="flex:1"><label for="f-duration">Duration <span class="req">*</span></label><input type="number" id="f-duration" data-field="duration" min="1" max="300" step="1" value="' + esc(opts.duration) + '"><div class="field-error" id="err-duration" role="alert"></div></div>' +
          '<div class="field" style="flex:1"><label for="f-shot">Shot type <span class="req">*</span></label><select id="f-shot" data-field="shotType">' +
            '<option value="">Choose…</option>' + SHOT_VALUES.map((s) => '<option value="' + s + '"' + (opts.shotType === s ? " selected" : "") + ">" + SHOT_LABEL[s] + "</option>").join("") +
          '</select><div class="field-error" id="err-shotType" role="alert"></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="dialog-foot"><div id="form-status" aria-live="polite" class="sr-only"></div><button type="button" class="btn" data-close>Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="scene-submit">' + (editing ? "Save changes" : "Add scene") + '</button></div>';

    openDialog(html);
    const form = dialog;
    const getVals = () => ({
      title: form.querySelector("#f-title").value,
      body: form.querySelector("#f-body").value,
      duration: form.querySelector("#f-duration").value,
      shotType: form.querySelector("#f-shot").value,
    });
    function showErrors(res) {
      ["title", "body", "duration", "shotType"].forEach((k) => {
        const errEl = form.querySelector("#err-" + k);
        const inp = form.querySelector('[data-field="' + k + '"]') || form.querySelector("#f-" + k);
        const has = res.errors[k];
        if (touched[k]) {
          errEl.textContent = has || "";
          errEl.classList.toggle("show", !!has);
          if (inp) inp.classList.toggle("input-error", !!has);
        } else { errEl.classList.remove("show"); if (inp) inp.classList.remove("input-error"); }
      });
      const msg = Object.values(res.errors).find(Boolean);
      if (msg && Object.values(touched).some(Boolean)) announce("Validation: " + msg);
    }
    function refresh() {
      const res = validateSceneFields(getVals());
      showErrors(res);
      form.querySelector("#scene-submit").disabled = false;
      return res;
    }
    form.querySelectorAll("[data-field],#f-title,#f-body").forEach((inp) => {
      const k = inp.getAttribute("data-field") || (inp.id === "f-title" ? "title" : "body");
      inp.addEventListener("input", () => { touched[k] = true; refresh(); });
      inp.addEventListener("blur", () => { touched[k] = true; refresh(); });
    });
    refresh();
        form.querySelector("#scene-submit").addEventListener("click", () => {
      Object.keys(touched).forEach((k) => (touched[k] = true));
      const res = refresh();
      if (!res.valid) {
          const firstErr = Object.values(res.errors).find(Boolean);
          form.querySelector("#form-status").textContent = "Validation error: " + firstErr;
          return;
      }
      form.querySelector("#form-status").textContent = "";
      if (editing) updateScene(scene.id, { title: res.clean.title, body: res.clean.body, duration: res.clean.duration, shotType: res.clean.shotType });
      else addScene(res.clean);
      closeDialog();
    });
  }

  function fieldHTML(id, label, type, value, required, hint) {
    const ctrl = type === "textarea"
      ? '<textarea id="' + id + '" data-field="' + (id === "f-title" ? "title" : "body") + '" data-autofocus' + (type === "textarea" ? "" : "") + ' aria-describedby="err-' + (id === "f-title" ? "title" : "body") + '">' + esc(value) + '</textarea>'
      : '<input type="' + type + '" id="' + id + '" data-field="' + (id === "f-title" ? "title" : "body") + '" value="' + esc(value) + '" data-autofocus aria-describedby="err-' + (id === "f-title" ? "title" : "body") + '">';
    const key = id === "f-title" ? "title" : "body";
    return '<div class="field"><label for="' + id + '">' + label + (required ? ' <span class="req">*</span>' : "") + '</label>' + ctrl + '<div class="field-error" id="err-' + key + '" role="alert"></div></div>';
  }

  /* ---------- confirm ---------- */
  function openConfirm(title, text, confirmLabel, onConfirm) {
    const html =
      '<div class="dialog-head"><h2 class="dialog-title" id="dialog-title">' + esc(title) + '</h2>' +
      '<button type="button" class="dialog-close" data-close aria-label="Cancel"><span class="icon icon-x" aria-hidden="true"></span></button></div>' +
      '<div class="dialog-body"><p class="confirm-text">' + esc(text) + '</p></div>' +
      '<div class="dialog-foot"><div id="form-status" aria-live="polite" class="sr-only"></div><button type="button" class="btn" data-close>Cancel</button>' +
      '<button type="button" class="btn btn-danger" id="confirm-ok">' + esc(confirmLabel) + '</button></div>';
    openDialog(html);
    dialog.querySelector("#confirm-ok").addEventListener("click", () => { closeDialog(); onConfirm(); });
  }

  /* ---------- action menu ---------- */
  let menuEl = null;
  function openActionMenu(id, trigger) {
    closeActionMenu();
    const s = store.scenes.find((x) => x.id === id);
    if (!s) return;
    const idx = store.scenes.indexOf(s);
    menuEl = document.createElement("div");
    menuEl.className = "action-menu";
    menuEl.setAttribute("role", "menu");
    menuEl.setAttribute("aria-label", "Scene actions");
    const items = [
      ["icon-edit", "Edit scene", "edit"],
      ["icon-up", "Move earlier", "up", idx === 0],
      ["icon-down", "Move later", "down", idx === store.scenes.length - 1],
      ["icon-duplicate", "Duplicate scene", "dup"],
      ["sep"],
      ["icon-trash", "Delete scene", "del"],
    ];
    menuEl.innerHTML = items.map((it) => {
      if (it[0] === "sep") return '<div class="menu-sep" role="separator"></div>';
      return '<button type="button" role="menuitem" data-m="' + it[2] + '"' + (it[3] ? " disabled" : "") + '><span class="icon ' + it[0] + '" aria-hidden="true"></span>' + it[1] + '</button>';
    }).join("");
    document.body.appendChild(menuEl);
    const r = trigger.getBoundingClientRect();
    const mw = 200, mh = menuEl.offsetHeight || 240;
    let top = r.bottom + 6, left = r.right - mw;
    if (left < 8) left = 8;
    if (top + mh > window.innerHeight - 8) top = r.top - mh - 6;
    menuEl.style.top = Math.max(8, top) + "px";
    menuEl.style.left = left + "px";
    menuEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]");
      if (!b || b.disabled) return;
      const m = b.getAttribute("data-m");
      closeActionMenu();
      if (m === "edit") openSceneForm(s);
      else if (m === "up") moveScene(id, -1);
      else if (m === "down") moveScene(id, 1);
      else if (m === "dup") { store.selection = new Set([id]); duplicateSelected(); }
      else if (m === "del") openConfirm("Delete scene?", "This removes " + s.title + " from the storyboard. You can undo this afterwards.", "Delete scene", () => deleteScene(id, { animate: true }));
    });
    menuEl.addEventListener("keydown", (e) => {
      const items = focusables(menuEl);
      const i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); closeActionMenu(); trigger.focus(); }
    });
    setTimeout(() => { const f = focusables(menuEl)[0]; if (f) f.focus(); }, 10);
  }
  function closeActionMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }

  /* ============================================================
     Export / Import
     ============================================================ */
  let exportFormat = "json";
  function buildDocument() {
    return {
      schemaVersion: SCHEMA_VERSION,
      title: "1. Getting Started",
      viewMode: store.viewMode,
      totalDuration: totalDuration(),
      scenes: store.scenes.map((s, i) => ({ id: s.id, title: s.title, body: s.body, duration: Number(s.duration) || 0, shotType: s.shotType, order: i + 1 })),
    };
  }
  function buildMarkdown() {
    const d = buildDocument();
    let md = "# " + d.title + " — Storyboard shot list\n\n";
    md += "Total duration: " + d.totalDuration + " seconds (" + d.scenes.length + " scene" + (d.scenes.length === 1 ? "" : "s") + ")\n";
    md += "View mode: " + d.viewMode + "\n\n";
    d.scenes.forEach((s) => {
      md += "## " + s.order + ". " + s.title + "\n";
      md += "- Shot type: " + SHOT_LABEL[s.shotType] + "\n";
      md += "- Duration: " + s.duration + "s\n";
      md += "- Description: " + s.body + "\n\n";
    });
    return md;
  }
  function buildOutlineText() {
    const d = buildDocument();
    let t = d.title + "\nTotal duration: " + d.totalDuration + " seconds\n\n";
    d.scenes.forEach((s) => { t += s.order + ". " + s.title + " — " + SHOT_LABEL[s.shotType] + " — " + s.duration + "s\n"; });
    return t;
  }
  function outlineHTML() {
    const d = buildDocument();
    return '<div class="ol-head"><div class="ol-title">' + esc(d.title) + '</div><div class="ol-total">Total duration: ' + d.totalDuration + ' seconds · ' + d.scenes.length + ' scenes</div></div>' +
      d.scenes.map((s) => '<div class="ol-row"><span class="ol-num">' + s.order + '</span><span class="ol-title2">' + esc(s.title) + '</span><span class="ol-shot">' + esc(SHOT_LABEL[s.shotType]) + '</span><span class="ol-dur">' + s.duration + 's</span></div>').join("");
  }
  function exportText() { return exportFormat === "json" ? JSON.stringify(buildDocument(), null, 2) : exportFormat === "markdown" ? buildMarkdown() : buildOutlineText(); }

  function openExport() {
    store.ui.exporting = true;
    const html =
      '<div class="dialog-head"><h2 class="dialog-title" id="dialog-title">Export storyboard</h2>' +
      '<button type="button" class="dialog-close" data-close aria-label="Close export"><span class="icon icon-x" aria-hidden="true"></span></button></div>' +
      '<div class="dialog-body">' +
        '<div class="export-tabs" role="tablist" aria-label="Export format">' +
          '<button type="button" class="export-tab" role="tab" data-fmt="json" aria-selected="true">Storyboard JSON</button>' +
          '<button type="button" class="export-tab" role="tab" data-fmt="markdown" aria-selected="false">Markdown shot list</button>' +
          '<button type="button" class="export-tab" role="tab" data-fmt="outline" aria-selected="false">Printable outline</button>' +
        '</div>' +
        '<div class="export-actions">' +
          '<button type="button" class="btn" id="exp-copy"><span class="icon icon-copy" style="width:15px;height:15px;vertical-align:-2px;margin-right:6px" aria-hidden="true"></span>Copy</button>' +
          '<button type="button" class="btn" id="exp-download"><span class="icon icon-download" style="width:15px;height:15px;vertical-align:-2px;margin-right:6px" aria-hidden="true"></span>Download</button>' +
          '<button type="button" class="btn" id="exp-print" hidden><span class="icon icon-print" style="width:15px;height:15px;vertical-align:-2px;margin-right:6px" aria-hidden="true"></span>Print</button>' +
        '</div>' +
        '<div id="exp-preview" class="export-preview thin-scrollbar" tabindex="0" aria-live="polite" aria-label="Export preview"></div>' +
      '</div>';
    openDialog(html, { wide: true });
    dialog.querySelectorAll(".export-tab").forEach((t) => t.addEventListener("click", () => {
      exportFormat = t.getAttribute("data-fmt");
      dialog.querySelectorAll(".export-tab").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
      dialog.querySelector("#exp-print").hidden = exportFormat !== "outline";
      refreshExportPreview();
    }));
    dialog.querySelector("#exp-copy").addEventListener("click", copyExport);
    dialog.querySelector("#exp-download").addEventListener("click", downloadExport);
    dialog.querySelector("#exp-print").addEventListener("click", printOutline);
    refreshExportPreview();
  }
  function refreshExportPreview() {
    const prev = dialog.querySelector("#exp-preview");
    if (!prev) return;
    dialog.querySelector("#exp-print").hidden = exportFormat !== "outline";
    if (exportFormat === "outline") { prev.className = "export-preview outline-preview thin-scrollbar"; prev.innerHTML = outlineHTML(); }
    else { prev.className = "export-preview thin-scrollbar"; prev.textContent = exportText(); }
  }
  function copyExport() {
    const text = exportText();
    const done = () => { toast("Copied!", true); announce("Copied to clipboard."); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove(); done();
  }
  function downloadExport() {
    const ext = exportFormat === "json" ? "json" : exportFormat === "markdown" ? "md" : "txt";
    const mime = exportFormat === "json" ? "application/json" : "text/plain";
    const blob = new Blob([exportText()], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "storyboard." + ext;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Download started");
  }
  function printOutline() {
    let root = document.getElementById("print-root");
    if (!root) { root = document.createElement("div"); root.id = "print-root"; document.body.appendChild(root); }
    root.innerHTML = '<div class="outline-preview" style="font-family:var(--f1)">' + outlineHTML() + "</div>";
    setTimeout(() => { window.print(); }, 60);
    announce("Print preview opened.");
  }

  function openImport() {
    store.ui.importing = true;
    const html =
      '<div class="dialog-head"><h2 class="dialog-title" id="dialog-title">Import storyboard</h2>' +
      '<button type="button" class="dialog-close" data-close aria-label="Close import"><span class="icon icon-x" aria-hidden="true"></span></button></div>' +
      '<div class="dialog-body">' +
        '<div class="import-file-row"><label for="imp-file" class="btn" style="display:inline-flex;align-items:center;height:38px"><span class="icon icon-upload" style="width:15px;height:15px;margin-right:6px" aria-hidden="true"></span>Choose file</label>' +
        '<input type="file" id="imp-file" accept="application/json,.json" hidden><span id="imp-filename" class="field-hint"></span></div>' +
        '<label for="imp-area" class="sr-only">Paste storyboard JSON</label>' +
        '<textarea id="imp-area" class="import-area thin-scrollbar" placeholder="Paste a Storyboard JSON document here" spellcheck="false"></textarea>' +
        '<div class="import-status" id="imp-status" role="alert" aria-live="polite"></div>' +
      '</div>' +
      '<div class="dialog-foot"><div id="form-status" aria-live="polite" class="sr-only"></div><button type="button" class="btn" data-close>Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="imp-ok" disabled>Import</button></div>';
    openDialog(html, { wide: true });
    const area = dialog.querySelector("#imp-area");
    const status = dialog.querySelector("#imp-status");
    const okBtn = dialog.querySelector("#imp-ok");
    okBtn.disabled = false;
    function check(isSubmit) {
      const raw = area.value.trim();
      if (!raw) { status.textContent = "Please provide storyboard JSON to import."; status.className = "import-status error"; if (isSubmit === true) announce("Import error: Please provide storyboard JSON to import."); return null; }
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) { status.textContent = "Invalid JSON: " + e.message + " Fix the JSON syntax and try again."; status.className = "import-status error"; if (isSubmit === true) announce("Import error: invalid JSON."); return null; }
      const v = validateDocument(parsed);
      if (v.error) { status.textContent = v.error; status.className = "import-status error"; if (isSubmit === true) announce("Import error: " + v.error); return null; }
      status.textContent = "Valid Storyboard document with " + parsed.scenes.length + " scene" + (parsed.scenes.length === 1 ? "" : "s") + ". Ready to import."; status.className = "import-status ok";
      if (isSubmit === true) announce("Ready to import.");
      return parsed;
    }
    area.addEventListener("input", check);
    dialog.querySelector("#imp-file").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      dialog.querySelector("#imp-filename").textContent = f.name;
      const rd = new FileReader();
      rd.onload = () => { area.value = String(rd.result || ""); check(); };
      rd.readAsText(f);
    });
    okBtn.addEventListener("click", () => { const doc = check(true); if (!doc) return; applyDocument(doc); closeDialog(); toast("Storyboard imported"); announce("Storyboard imported. Total duration " + totalDuration() + " seconds."); });
    check();
  }

  /* ============================================================
     Presenter
     ============================================================ */
  let rafId = 0;
  function startPresenter() {
    const visible = filteredScenes();
    if (!visible.length) return;
    store.presenter = { open: true, index: 0, remainingMs: visible[0].duration * 1000, paused: false, finished: false, startedAt: 0, elapsedBefore: 0 };
    presenterEl.style.opacity = "0";
    presenterEl.hidden = false;
    // trigger reflow
    void presenterEl.offsetWidth;
    presenterEl.style.opacity = "1";
    document.body.style.overflow = "hidden";
    renderPresenter();
    startTimer();
    const f = presenterEl.querySelector(".pres-btn"); if (f) f.focus();
  }
  function presenterVisible() { return filteredScenes(); }
  function startTimer() {
    cancelAnimationFrame(rafId);
    if (store.presenter.paused || store.presenter.finished) return;
    store.presenter.startedAt = performance.now();
    const tick = (now) => {
      const p = store.presenter;
      if (!p.open || p.paused || p.finished) return;
      const elapsed = p.elapsedBefore + (now - p.startedAt);
      p.remainingMs = Math.max(0, (presenterVisible()[p.index].duration * 1000) - elapsed);
      updateCountdown();
      if (p.remainingMs <= 0) {
          advancePresenter(1, true);
          return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }
  function updateCountdown() {
    const p = store.presenter;
    const visible = presenterVisible();
    const scene = visible[p.index];
    if (!scene) return;
    const cd = presenterEl.querySelector(".presenter-countdown");
    const fill = presenterEl.querySelector(".presenter-bar-fill");
    if (cd) { const sec = Math.ceil(p.remainingMs / 1000); cd.textContent = sec + "s"; cd.classList.toggle("low", sec <= 3); }
    if (fill) {
      const before = visible.slice(0, p.index).reduce((a, s) => a + (Number(s.duration) || 0), 0);
      const into = (Number(scene.duration) || 0) - p.remainingMs / 1000;
      const total = totalDurationOf(visible);
      const pct = total > 0 ? Math.min(100, ((before + Math.max(0, into)) / total) * 100) : 0;
      fill.style.width = pct + "%";
    }
  }
  function totalDurationOf(arr) { return arr.reduce((a, s) => a + (Number(s.duration) || 0), 0); }

  function advancePresenter(delta, auto) {
    const visible = presenterVisible();
    const p = store.presenter;
    const ni = p.index + delta;
    if (ni < 0) { p.index = 0; }
    else if (ni >= visible.length) { finishPresenter(); return; }
    else p.index = ni;
    p.remainingMs = visible[p.index].duration * 1000;
    p.elapsedBefore = 0; p.paused = false;
    animatePresenterCard();
    startTimer();
    announce("Scene " + (p.index + 1) + " of " + visible.length + ": " + visible[p.index].title);
  }
  function animatePresenterCard() {
    const card = presenterEl.querySelector(".presenter-card");
    if (!card) return;
    if (reduceMotion()) { renderPresenterStage(); return; }
    card.classList.add("slide-anim");
    setTimeout(() => {
        renderPresenterStage();
        card.classList.remove("slide-anim");
    }, 150);
  }
    card.classList.add("slide-anim");
    renderPresenterStage();
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("slide-anim")));
  }
  function togglePause() {
    const p = store.presenter;
    if (p.finished) return;
    if (p.paused) { p.paused = false; startTimer(); }
    else {
      p.paused = true;
      cancelAnimationFrame(rafId);
      p.elapsedBefore += performance.now() - p.startedAt;
    }
    renderPresenterControls();
    wirePresenter(presenterEl.querySelector("#pres-controls"));
  }
  function finishPresenter() {
    cancelAnimationFrame(rafId);
    store.presenter.finished = true;
    store.presenter.paused = true;
    renderPresenter();
    announce("Presentation finished.");
  }
  function exitPresenter() {
    cancelAnimationFrame(rafId);
    store.presenter.open = false;
    presenterEl.style.opacity = "0";
    setTimeout(() => {
        presenterEl.hidden = true;
        presenterEl.style.opacity = "1";
        presenterEl.innerHTML = "";
        document.body.style.overflow = "";
        render(false);
        const btn = $("#present-btn"); if (btn) btn.focus();
        announce("Exited presentation.");
    }, 240);
  }
  function renderPresenter() {
    const visible = presenterVisible();
    const p = store.presenter;
    if (p.finished) {
      const total = totalDurationOf(visible);
      const longest = visible.reduce((m, s) => (Number(s.duration) || 0) > (Number(m.duration) || 0) ? s : m, visible[0] || { duration: 0, title: "" });
      presenterEl.innerHTML =
        '<div class="presenter-top"><span class="presenter-progress-readout">Rehearsal complete</span>' +
        '<button type="button" class="pres-btn" data-p="exit"><span class="icon icon-exit" aria-hidden="true"></span>Exit</button></div>' +
        '<div class="presenter-stage"><div class="presenter-finished"><h2>That’s a wrap</h2>' +
        '<ul class="rehearsal"><li><span>Scenes presented</span><b>' + visible.length + '</b></li>' +
        '<li><span>Total duration</span><b>' + total + 's</b></li>' +
        '<li><span>Longest scene</span><b>' + esc(longest.title) + ' (' + longest.duration + 's)</b></li></ul>' +
        '<div class="presenter-controls" style="padding:0"><button type="button" class="pres-btn primary" data-p="restart"><span class="icon icon-redo" aria-hidden="true"></span>Restart</button>' +
        '<button type="button" class="pres-btn" data-p="exit">Exit</button></div></div></div>';
      wirePresenter();
      return;
    }
    presenterEl.innerHTML =
      '<div class="presenter-top"><span class="presenter-progress-readout" id="pres-readout"></span>' +
      '<button type="button" class="pres-btn" data-p="exit"><span class="icon icon-exit" aria-hidden="true"></span>End presentation</button></div>' +
      '<div class="presenter-stage"><div class="presenter-card" id="pres-card"></div></div>' +
      '<div class="presenter-controls" id="pres-controls"></div>';
    renderPresenterStage();
    renderPresenterControls();
    wirePresenter();
  });
      presenterEl.innerHTML =
        '<div class="presenter-top"><span class="presenter-progress-readout">Rehearsal complete</span>' +
        '<button type="button" class="pres-btn" data-p="exit"><span class="icon icon-exit" aria-hidden="true"></span>Exit</button></div>' +
        '<div class="presenter-stage"><div class="presenter-finished"><h2>That’s a wrap</h2>' +
        '<ul class="rehearsal"><li><span>Scenes presented</span><b>' + visible.length + '</b></li>' +
        '<li><span>Total time presented</span><b>' + total + 's</b></li>' +
        '<li><span>Longest scene</span><b>#' + (visible.indexOf(longest) + 1) + ' · ' + esc(longest.title || "") + ' (' + (Number(longest.duration) || 0) + 's)</b></li></ul>' +
        '<div style="display:flex;gap:12px;justify-content:center">' +
        '<button type="button" class="pres-btn primary" data-p="restart"><span class="icon icon-restart" aria-hidden="true"></span>Restart</button>' +
        '<button type="button" class="pres-btn" data-p="exit"><span class="icon icon-exit" aria-hidden="true"></span>End presentation</button></div>' +
        '</div></div>';
      wirePresenter();
      return;
    }
    presenterEl.innerHTML =
      '<div class="presenter-top"><span class="presenter-progress-readout" id="pres-readout"></span>' +
      '<button type="button" class="pres-btn" data-p="exit"><span class="icon icon-exit" aria-hidden="true"></span>End presentation</button></div>' +
      '<div class="presenter-stage"><div class="presenter-card" id="pres-card"></div></div>' +
      '<div class="presenter-controls" id="pres-controls"></div>';
    renderPresenterStage();
    renderPresenterControls();
    wirePresenter();
  }
  function renderPresenterStage() {
    const visible = presenterVisible();
    const p = store.presenter;
    const s = visible[p.index];
    const card = presenterEl.querySelector("#pres-card");
    if (!card || !s) return;
    const media = s.img
      ? '<div class="presenter-media"><img src="' + esc(s.img) + '" alt="' + esc(s.alt) + '"></div>'
      : '<div class="presenter-media is-ph"><span class="icon icon-camera" aria-hidden="true"></span></div>';
    card.innerHTML = media +
      '<div class="presenter-info"><span class="presenter-num">Scene ' + (p.index + 1) + '</span>' +
      '<h2 class="presenter-title">' + esc(s.title) + '</h2>' +
      '<p class="presenter-body">' + esc(s.body) + '</p>' +
      '<span class="shot-badge presenter-shot">' + esc(SHOT_LABEL[s.shotType]) + '</span>' +
      '<div class="presenter-countdown" aria-label="Countdown">' + Math.ceil(p.remainingMs / 1000) + 's</div>' +
      '<div class="presenter-bar"><div class="presenter-bar-fill"></div></div></div>';
    const ro = presenterEl.querySelector("#pres-readout");
    if (ro) ro.textContent = "Scene " + (p.index + 1) + " of " + visible.length;
    updateCountdown();
  }
  function renderPresenterControls() {
    const c = presenterEl.querySelector("#pres-controls");
    if (!c) return;
    const p = store.presenter;
    c.innerHTML =
      '<button type="button" class="pres-btn" data-p="prev" aria-label="Previous scene"><span class="icon icon-chevron-left" aria-hidden="true"></span></button>' +
      '<button type="button" class="pres-btn primary" data-p="pause"><span class="icon ' + (p.paused ? "icon-play" : "icon-pause") + '" aria-hidden="true"></span>' + (p.paused ? "Resume" : "Pause") + '</button>' +
      '<button type="button" class="pres-btn" data-p="next" aria-label="Next scene"><span class="icon icon-chevron-right" aria-hidden="true"></span></button>';
  }
  function wirePresenter(root) {
    (root || presenterEl).querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
      const a = b.getAttribute("data-p");
      if (a === "exit") exitPresenter();
      else if (a === "pause") togglePause();
      else if (a === "next") advancePresenter(1, false);
      else if (a === "prev") advancePresenter(-1, false);
      else if (a === "restart") { startPresenter(); }
    }));
  }

  /* ============================================================
     Coachmarks + shortcuts
     ============================================================ */
  const coachSteps = [
    { sel: ".view-toggle", text: "Switch between Tile, List, and Slide to see the same scenes three ways.", arrow: "bottom" },
    { sel: ".add-scene", text: "Add Scene creates a new beat on the board with a title, description, duration, and shot type.", arrow: "top" },
    { sel: ".scene-actions", text: "The three-dot menu on a card edits, reorders, duplicates, or deletes that scene.", arrow: "bottom" },
  ];
  let coachIdx = 0;
  function runCoachmarks() {
    if (store.coach.firstRunDone) return;
    store.coach.firstRunDone = true;
    coachIdx = 0;
    showCoachStep();
  }
  function showCoachStep() {
    if (coachIdx >= coachSteps.length) { hideCoach(); return; }
    const step = coachSteps[coachIdx];
    const target = document.querySelector(step.sel);
    if (!target) { coachIdx++; showCoachStep(); return; }
    document.querySelectorAll(".coach-target").forEach((e) => e.classList.remove("coach-target"));
    target.classList.add("coach-target");
    const r = target.getBoundingClientRect();
    coachEl.hidden = false;
    coachEl.className = "coachmark arrow-" + step.arrow;
    coachEl.innerHTML =
      '<div class="coach-step">Tip ' + (coachIdx + 1) + " of " + coachSteps.length + '</div>' +
      '<p class="coach-text">' + esc(step.text) + '</p>' +
      '<div class="coach-actions"><span class="coach-dots">' + coachSteps.map((_, i) => '<i class="' + (i <= coachIdx ? "on" : "") + '"></i>').join("") + '</span>' +
      '<div><button type="button" class="coach-btn coach-skip" data-coach="skip">Skip tour</button>' +
      '<button type="button" class="coach-btn coach-next" data-coach="next">' + (coachIdx === coachSteps.length - 1 ? "Done" : "Next") + '</button></div></div>';
    // position
    const cw = 300, ch = coachEl.offsetHeight || 130;
    let left = Math.min(Math.max(8, r.left), window.innerWidth - cw - 8);
    let top = step.arrow === "bottom" ? r.bottom + 12 : r.top - ch - 12;
    if (top < 8) top = r.bottom + 12;
    coachEl.style.left = left + "px";
    coachEl.style.top = Math.max(8, top) + "px";
  }
  function hideCoach() {
    coachEl.hidden = true; coachEl.innerHTML = "";
    document.querySelectorAll(".coach-target").forEach((e) => e.classList.remove("coach-target"));
  }
  function maybeExportCoach() {
    if (store.coach.exportTipDone) return;
    store.coach.exportTipDone = true;
    const target = $("#export-btn");
    if (!target) return;
    const r = target.getBoundingClientRect();
    coachEl.hidden = false;
    coachEl.className = "coachmark arrow-top";
    coachEl.innerHTML = '<div class="coach-step">Nice edit</div><p class="coach-text">Your storyboard is saved in memory. Export it to copy, download, or print the JSON, Markdown, or outline.</p>' +
      '<div class="coach-actions"><span class="coach-dots"><i class="on"></i></span><button type="button" class="coach-btn coach-next" data-coach="dismiss">Got it</button></div>';
    const cw = 300;
    coachEl.style.left = Math.min(Math.max(8, r.right - cw), window.innerWidth - cw - 8) + "px";
    coachEl.style.top = Math.max(8, r.bottom + 12) + "px";
  }
  coachEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-coach]");
    if (!b) return;
    const a = b.getAttribute("data-coach");
    if (a === "skip" || a === "dismiss") hideCoach();
    else if (a === "next") { coachIdx++; showCoachStep(); }
  });

  function openShortcuts() {
    const rows = [
      ["A", "Add scene"], ["1 / 2 / 3", "Tile / List / Slide mode"], ["P", "Present storyboard"],
      ["← / →", "Previous / next scene (Slide & presenter)"], ["Ctrl + Z", "Undo"], ["Ctrl + Shift + Z / Ctrl + Y", "Redo"],
      ["Esc", "Close dialog or exit presenter"], ["?", "This shortcuts panel"],
    ];
    const html =
      '<div class="dialog-head"><h2 class="dialog-title" id="dialog-title">Keyboard shortcuts</h2>' +
      '<button type="button" class="dialog-close" data-close aria-label="Close"><span class="icon icon-x" aria-hidden="true"></span></button></div>' +
      '<div class="dialog-body"><div class="shortcuts">' + rows.map((r) => '<div class="shortcut-row"><span>' + esc(r[1]) + '</span><kbd>' + esc(r[0]) + '</kbd></div>').join("") + '</div></div>';
    openDialog(html);
  }

  /* ============================================================
     Global events
     ============================================================ */
  function typingTarget(el) { return el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el && el.isContentEditable); }

  document.addEventListener("keydown", (e) => {
    // presenter keys
    if (store.presenter.open) {
      if (e.key === "Escape") { e.preventDefault(); exitPresenter(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); advancePresenter(1, false); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); advancePresenter(-1, false); }
      else if (e.key === " ") { e.preventDefault(); togglePause(); }
      return;
    }
    if (!overlay.hidden) {
      if (e.key === "Escape") { e.preventDefault(); closeDialog(); }
      else trapFocus(e, dialog);
      return;
    }
    if (menuEl) {
      if (e.key === "Escape") { const t = menuEl; closeActionMenu(); }
      return;
    }
    if (typingTarget(document.activeElement)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if (e.key === "a" || e.key === "A") { e.preventDefault(); openSceneForm(null); return; }
    if (e.key === "p" || e.key === "P") { e.preventDefault(); startPresenter(); return; }
    if (e.key === "1") { setViewMode("tile"); return; }
    if (e.key === "2") { setViewMode("list"); return; }
    if (e.key === "3") { setViewMode("slide"); return; }
    if (e.key === "?") { e.preventDefault(); openShortcuts(); return; }
    if (store.viewMode === "slide") {
      if (e.key === "ArrowRight") { e.preventDefault(); advanceSlide(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); advanceSlide(-1); }
    }
  });

  function advanceSlide(d) {
    const total = filteredScenes().length;
    const ni = Math.max(0, Math.min(total - 1, store.slideIndex + d));
    if (ni === store.slideIndex) return;
    store.slideIndex = ni;
    render(true);
  }

  // delegate clicks on grid
  grid.addEventListener("click", (e) => {
    const sel = e.target.closest("[data-act=select]");
    if (sel) { toggleSelect(sel.getAttribute("data-id")); return; }
    const menu = e.target.closest("[data-act=menu]");
    if (menu) { e.stopPropagation(); openActionMenu(menu.getAttribute("data-id"), menu); return; }
    const add = e.target.closest("[data-act=add]");
    if (add) { openSceneForm(null); return; }
    const cam = e.target.closest(".btn-camera");
    if (cam) { toast("Add image — demo only"); return; }
  });

  // body field editing
  grid.addEventListener("input", (e) => {
    const ta = e.target.closest("[data-act=body]");
    if (!ta) return;
    autoSize(ta);
    const len = ta.value.trim().length;
    ta.classList.toggle("is-invalid", len > 500);
  });
  grid.addEventListener("focusout", (e) => {
    const ta = e.target.closest("[data-act=body]");
    if (!ta) return;
    const id = ta.getAttribute("data-id");
    const s = store.scenes.find((x) => x.id === id);
    if (!s) return;
    const v = ta.value.trim();
    if (v.length >= 1 && v.length <= 500) {
      if (v !== s.body) { updateScene(id, { body: v }, { silent: false }); }
    } else {
      ta.value = s.body; autoSize(ta); ta.classList.remove("is-invalid");
      announce("Description could not be saved. A scene description must be 1 to 500 characters.");
      toast("Description needs 1 to 500 characters");
    }
  });
  grid.addEventListener("keydown", (e) => {
    const ta = e.target.closest("[data-act=body]");
    if (ta && e.key === "Escape") ta.blur();
  });

  // nav controls
  $(".view-toggle").addEventListener("click", (e) => { const b = e.target.closest(".view-btn"); if (b) setViewMode(b.getAttribute("data-mode")); });
  slideControls.addEventListener("click", (e) => { const b = e.target.closest("[data-slide-dir]"); if (b && !b.disabled) advanceSlide(Number(b.getAttribute("data-slide-dir"))); });
  $("#search-input").addEventListener("input", (e) => setSearch(e.target.value));
  $("#search-clear").addEventListener("click", () => { $("#search-input").value = ""; setSearch(""); $("#search-input").focus(); });
  $(".shot-chips").addEventListener("click", (e) => { const c = e.target.closest(".shot-chip"); if (c) setShotFilter(c.getAttribute("data-shot")); });
  $("#present-btn").addEventListener("click", startPresenter);
  $("#filtered-clear").addEventListener("click", clearFilters);
  $("#empty-add").addEventListener("click", () => openSceneForm(null));

  // filmstrip
  filmstrip.addEventListener("click", (e) => {
    const t = e.target.closest("[data-film]");
    if (!t) return;
    const id = t.getAttribute("data-film");
    store.lastEditedId = id; sessionStorage.setItem("sb_last_id", id);
    if (store.viewMode === "slide") {
      const visible = filteredScenes();
      const idx = visible.findIndex((s) => s.id === id);
      if (idx >= 0) { store.slideIndex = idx; render(true); }
    } else {
      render(false);
      const col = grid.querySelector('[data-col="' + cssEsc(id) + '"]');
      if (col) col.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    }
  });

  // bulk bar
  bulkBar.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "bulk-delete") openConfirm("Delete selected scenes?", "This removes " + store.selection.size + " scenes from the board. You can undo this afterwards.", "Delete scenes", deleteSelected);
    else if (b.id === "bulk-duplicate") duplicateSelected();
    else if (b.id === "bulk-clear") { store.selection = new Set(); render(false); }
  });

  // header tools
  $("#undo-btn").addEventListener("click", undo);
  $("#redo-btn").addEventListener("click", redo);
  $("#export-btn").addEventListener("click", openExport);
  $("#import-btn").addEventListener("click", openImport);
  $("#help-btn").addEventListener("click", openShortcuts);
  document.querySelectorAll(".inert-nav").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    const label = b.getAttribute("aria-label") || (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40) || "Action";
    toast(label + " — demo only");
  }));

  // overlay close
  overlay.addEventListener("click", (e) => { if (e.target === overlay || e.target.closest("[data-close]")) closeDialog(); });

  // close action menu on outside click
  document.addEventListener("mousedown", (e) => { if (menuEl && !menuEl.contains(e.target) && !e.target.closest("[data-act=menu]")) closeActionMenu(); });

  // back to top
  const backTop = $(".back-to-top");
  function syncBackTop() { backTop.hidden = window.scrollY <= 400; }
  window.addEventListener("scroll", syncBackTop, { passive: true });
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }));
  syncBackTop();

  /* ============================================================
     WebMCP contract (same handlers as the visible UI)
     ============================================================ */
  const TOOLS = [
    // browse-query-v1
    { name: "browse_open", description: "Open a declared storyboard destination.", inputSchema: { type: "object", properties: { destination: { type: "string", enum: ["scene-list", "scene-editor", "tutorial-steps", "export-center", "presenter"] } }, required: ["destination"], additionalProperties: false } },
    { name: "browse_search", description: "Set the scene search query (same handler as the visible search field).", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false } },
    { name: "browse_apply_filter", description: "Apply a shot-type filter chip (same handler as the visible chips).", inputSchema: { type: "object", properties: { filter: { type: "string", enum: ["shot-type"] }, value: { type: "string", enum: SHOT_VALUES.concat(["all"]) } }, required: ["filter", "value"], additionalProperties: false } },
    { name: "browse_clear_filter", description: "Clear search and shot-type filter, restoring the full set.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
    // form-workflow-v1
    { name: "form_validate", description: "Validate Add Scene create-form fields against the Scene field contract.", inputSchema: { type: "object", properties: { title: { type: "string" }, body: { type: "string" }, duration: {}, "shot-type": { type: "string" } }, additionalProperties: false } },
    { name: "form_submit", description: "Submit the Add Scene create form (same logic as the visible submit).", inputSchema: { type: "object", properties: { title: { type: "string" }, body: { type: "string" }, duration: {}, "shot-type": { type: "string" } }, required: ["title", "body", "duration", "shot-type"], additionalProperties: false } },
    { name: "form_cancel", description: "Cancel / close the Add Scene form without changes.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
    { name: "form_advance", description: "Advance the create/review workflow step.", inputSchema: { type: "object", properties: { step: { type: "string", enum: ["intro", "edit", "review"] } }, additionalProperties: false } },
    { name: "form_return", description: "Return to the previous workflow step.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
    // entity-collection-v1
    { name: "entity_create", description: "Create a scene (same logic as Add Scene).", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["scene"] }, title: { type: "string" }, body: { type: "string" }, duration: {}, "shot-type": { type: "string" } }, required: ["entity", "title", "body", "duration", "shot-type"], additionalProperties: false } },
    { name: "entity_select", description: "Toggle selection of a scene for bulk actions.", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["scene"] }, id: { type: "string" } }, required: ["entity", "id"], additionalProperties: false } },
    { name: "entity_update", description: "Update a scene's title/body/duration/shot-type (Scene field contract).", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["scene"] }, id: { type: "string" }, title: { type: "string" }, body: { type: "string" }, duration: {}, "shot-type": { type: "string" } }, required: ["entity", "id"], additionalProperties: false } },
    { name: "entity_delete", description: "Delete a scene (confirm=true required).", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["scene"] }, id: { type: "string" }, confirm: { type: "boolean" } }, required: ["entity", "id", "confirm"], additionalProperties: false } },
    { name: "entity_reorder", description: "Move a scene earlier or later in board order.", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["scene"] }, id: { type: "string" }, direction: { type: "string", enum: ["earlier", "later"] } }, required: ["entity", "id", "direction"], additionalProperties: false } },
    { name: "entity_toggle", description: "Toggle the shot-type filter to a scene's shot type (same handler as chips).", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["scene"] }, id: { type: "string" } }, required: ["entity", "id"], additionalProperties: false } },
    // artifact-transfer-v1
    { name: "artifact_export", description: "Compile an export format from the live store and open the Export center.", inputSchema: { type: "object", properties: { format: { type: "string", enum: ["json", "markdown", "outline"] } }, required: ["format"], additionalProperties: false } },
    { name: "artifact_import", description: "Import a Storyboard JSON document (mode storyboard-json); rejects the whole document on any contract error.", inputSchema: { type: "object", properties: { mode: { type: "string", enum: ["storyboard-json"] }, json: { type: "string" } }, required: ["mode", "json"], additionalProperties: false } },
    { name: "artifact_copy", description: "Copy the active export format text (same handler as the visible Copy control).", inputSchema: { type: "object", properties: { format: { type: "string", enum: ["json", "markdown", "outline"] } }, additionalProperties: false } },
    { name: "artifact_print_preview", description: "Open the Printable outline and the browser print preview.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  ];

  function shotFromArgs(a) { return a["shot-type"] != null ? a["shot-type"] : a.shotType; }

  function invoke(name, args) {
    args = args || {};
    switch (name) {
      case "browse_open": {
        const d = args.destination;
        if (d === "export-center") { openExport(); return { ok: true, destination: d, opened: "export-center" }; }
        if (d === "presenter") { startPresenter(); return { ok: true, destination: d, opened: "presenter" }; }
        if (d === "scene-editor") { openSceneForm(null); return { ok: true, destination: d, opened: "scene-editor" }; }
        if (d === "tutorial-steps") { runCoachmarks(); return { ok: true, destination: d, opened: "tutorial-steps" }; }
        if (d === "scene-list") { setViewMode("tile"); clearFilters(); return { ok: true, destination: d, opened: "scene-list", scenes: store.scenes.length }; }
        return { ok: false, error: "Unknown destination" };
      }
      case "browse_search": { const q = String(args.query || ""); $("#search-input").value = q; setSearch(q); return { ok: true, query: q, visible: filteredScenes().length }; }
      case "browse_apply_filter": { const v = args.value; setShotFilter(v); return { ok: true, filter: "shot-type", value: v, visible: filteredScenes().length }; }
      case "browse_clear_filter": { clearFilters(); $("#search-input").value = ""; return { ok: true, visible: filteredScenes().length }; }
      case "form_validate": {
        const r = validateSceneFields({ title: args.title, body: args.body, duration: args.duration, shotType: shotFromArgs(args) });
        return { ok: r.valid, errors: r.errors };
      }
      case "form_submit": {
        const r = validateSceneFields({ title: args.title, body: args.body, duration: args.duration, shotType: shotFromArgs(args) });
        if (!r.valid) return { ok: false, errors: r.errors };
        const s = addScene(r.clean, { silent: false });
        closeDialog();
        return { ok: true, created: s.id, total: store.scenes.length, totalDuration: totalDuration() };
      }
      case "form_cancel": { closeDialog(); return { ok: true, cancelled: true }; }
      case "form_advance": { return { ok: true, step: args.step || "edit", note: "workflow step advanced" }; }
      case "form_return": { return { ok: true, step: "intro", note: "workflow step returned" }; }
      case "entity_create": {
        const r = validateSceneFields({ title: args.title, body: args.body, duration: args.duration, shotType: shotFromArgs(args) });
        if (!r.valid) return { ok: false, errors: r.errors };
        const s = addScene(r.clean, { silent: false });
        return { ok: true, id: s.id, total: store.scenes.length, totalDuration: totalDuration() };
      }
      case "entity_select": { toggleSelect(args.id); return { ok: true, selected: store.selection.has(args.id), selectionCount: store.selection.size }; }
      case "entity_update": {
        const s = store.scenes.find((x) => x.id === args.id);
        if (!s) return { ok: false, error: "Scene not found" };
        const patch = {};
        if (args.title != null) patch.title = String(args.title).trim();
        if (args.body != null) patch.body = String(args.body).trim();
        if (args.duration != null) patch.duration = clampInt(args.duration, 1, 300);
        if (shotFromArgs(args) != null) patch.shotType = shotFromArgs(args);
        const merged = Object.assign({ title: s.title, body: s.body, duration: s.duration, shotType: s.shotType }, patch);
        const r = validateSceneFields(merged);
        if (!r.valid) return { ok: false, errors: r.errors };
        updateScene(args.id, { title: r.clean.title, body: r.clean.body, duration: r.clean.duration, shotType: r.clean.shotType }, { silent: true });
        return { ok: true, id: args.id, totalDuration: totalDuration() };
      }
      case "entity_delete": {
        if (args.confirm !== true) return { ok: false, error: "confirm=true is required to delete" };
        const existed = deleteScene(args.id, { silent: true, animate: false });
        return { ok: existed, id: args.id, total: store.scenes.length, totalDuration: totalDuration() };
      }
      case "entity_reorder": { moveScene(args.id, args.direction === "earlier" ? -1 : 1); return { ok: true, id: args.id, totalDuration: totalDuration() }; }
      case "entity_toggle": { const s = store.scenes.find((x) => x.id === args.id); if (!s) return { ok: false }; setShotFilter(store.shotFilter === s.shotType ? "all" : s.shotType); return { ok: true, shotFilter: store.shotFilter }; }
      case "artifact_export": {
        exportFormat = args.format === "markdown" ? "markdown" : args.format === "outline" ? "outline" : "json";
        openExport();
        return { ok: true, format: exportFormat, sceneCount: store.scenes.length, totalDuration: totalDuration(), viewMode: store.viewMode };
      }
      case "artifact_import": {
        let doc; try { doc = JSON.parse(String(args.json || "")); } catch (e) { return { ok: false, error: "Invalid JSON: " + e.message }; }
        const v = validateDocument(doc);
        if (v.error) return { ok: false, error: v.error };
        applyDocument(doc);
        return { ok: true, sceneCount: store.scenes.length, viewMode: store.viewMode, totalDuration: totalDuration() };
      }
      case "artifact_copy": { if (args.format) exportFormat = args.format; copyExport(); return { ok: true, format: exportFormat }; }
      case "artifact_print_preview": { exportFormat = "outline"; openExport(); printOutline(); return { ok: true, opened: "print-preview" }; }
      default: return { ok: false, error: "Unknown tool: " + name };
    }
  }

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      app: "storyboard-getting-started",
      modules: ["browse-query-v1", "form-workflow-v1", "entity-collection-v1", "artifact-transfer-v1"],
      tools: TOOLS.map((t) => t.name),
    };
  };
  window.webmcp_list_tools = function () {
    return TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
  };
  window.webmcp_invoke_tool = function (name, args) {
    try { return invoke(name, args); }
    catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  };

  /* ============================================================
     Boot
     ============================================================ */
  function boot() {
    render(false);
    syncBackTop();
    // entrance stagger on first paint
    if (!reduceMotion()) {
      const cards = grid.querySelectorAll("[data-card]");
      cards.forEach((c, i) => {
        c.classList.add("is-entering");
        setTimeout(() => { c.classList.add("is-entered"); c.classList.remove("is-entering"); }, 50 + i * 45);
      });
    }
    setTimeout(runCoachmarks, 700);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
