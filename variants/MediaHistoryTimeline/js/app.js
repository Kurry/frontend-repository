/* MediaHistoryTimeline — pan, zoom, filters, detail panel */
(function () {
  "use strict";

  const data = window.MT_DATA;
  if (!data) {
    console.error("MT_DATA missing");
    return;
  }

  const catsById = Object.fromEntries(data.categories.map((c) => [c.id, c]));

  const state = {
    from: data.defaultFrom,
    to: data.defaultTo,
    query: "",
    activeCats: new Set(data.categories.map((c) => c.id)),
    selectedId: null,
    panX: 0,
    dragging: false,
    dragStartX: 0,
    panStart: 0,
    filterOpen: false,
    aboutOpen: false,
  };

  const els = {
    viewport: document.getElementById("timelineViewport"),
    canvas: document.getElementById("timelineCanvas"),
    eventLayer: document.getElementById("eventLayer"),
    eraLayer: document.getElementById("eraLayer"),
    detail: document.getElementById("detailPanel"),
    filterDrawer: document.getElementById("filterDrawer"),
    about: document.getElementById("aboutOverlay"),
    rangeFrom: document.getElementById("rangeFrom"),
    rangeTo: document.getElementById("rangeTo"),
    fill: document.getElementById("rangeFill"),
    readout: document.getElementById("rangeReadout"),
    count: document.getElementById("eventCount"),
    eraLabel: document.getElementById("eraLabel"),
    search: document.getElementById("searchInput"),
    yearFromInput: document.getElementById("yearFromInput"),
    yearToInput: document.getElementById("yearToInput"),
    catGrid: document.getElementById("catGrid"),
    resultNote: document.getElementById("resultNote"),
    tip: document.getElementById("tip"),
    empty: document.getElementById("emptyState"),
    eraTicks: document.getElementById("eraTicks"),
    btnFilter: document.getElementById("btnFilter"),
    btnAbout: document.getElementById("btnAbout"),
    btnClear: document.getElementById("btnClearFilters"),
    btnFitAll: document.getElementById("btnFitAll"),
    brandHome: document.getElementById("brandHome"),
  };

  const ERA_TINTS = {
    origins: "#0d7c8f",
    classical: "#2f5d8c",
    manuscript: "#8b6239",
    print: "#1b6b4a",
    electric: "#c45c26",
    mass: "#a33b4a",
    networked: "#0e7490",
  };

  const ctx = els.canvas.getContext("2d");

  function formatYear(y) {
    if (y < 0) return `${Math.abs(y)} BCE`;
    if (y === 0) return "1 CE";
    return `${y} CE`;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function parseYear(value, fallback) {
    if (value === "" || value === null || value === undefined) return fallback;
    const n = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(n)) return fallback;
    return Math.round(n);
  }

  function isEditableTarget(el) {
    if (!el || !(el instanceof Element)) return false;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return el.isContentEditable;
  }

  function shouldIgnoreTimelineKeys(e) {
    return isEditableTarget(e.target) || isEditableTarget(document.activeElement);
  }

  function syncRangeHandleStack() {
    const from = Number(els.rangeFrom.value);
    const to = Number(els.rangeTo.value);
    const span = data.yearMax - data.yearMin || 1;
    const proximity = Math.abs(to - from) / span < 0.04;
    if (proximity) {
      els.rangeFrom.style.zIndex = "6";
      els.rangeTo.style.zIndex = "5";
    } else {
      els.rangeFrom.style.zIndex = "";
      els.rangeTo.style.zIndex = "";
    }
  }

  function yearToX(year, width) {
    const span = state.to - state.from || 1;
    return ((year - state.from) / span) * width + state.panX;
  }

  function filteredEvents() {
    const q = state.query.trim().toLowerCase();
    return data.events.filter((ev) => {
      if (ev.year < state.from || ev.year > state.to) return false;
      if (!ev.categories.some((c) => state.activeCats.has(c))) return false;
      if (!q) return true;
      const hay = `${ev.title} ${ev.place} ${ev.summary} ${ev.detail}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function currentEra() {
    const mid = (state.from + state.to) / 2;
    return (
      data.eras.find((e) => mid >= e.from && mid <= e.to) ||
      data.eras[data.eras.length - 1]
    );
  }

  function hexAlpha(hex, a) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function syncRangeInputs() {
    const min = data.yearMin;
    const max = data.yearMax;
    els.rangeFrom.min = min;
    els.rangeFrom.max = max;
    els.rangeTo.min = min;
    els.rangeTo.max = max;
    els.rangeFrom.value = state.from;
    els.rangeTo.value = state.to;
    els.yearFromInput.value = state.from;
    els.yearToInput.value = state.to;

    const span = max - min;
    const left = ((state.from - min) / span) * 100;
    const right = ((state.to - min) / span) * 100;
    els.fill.style.left = `${left}%`;
    els.fill.style.width = `${Math.max(2, right - left)}%`;
    els.readout.textContent = `${formatYear(state.from)} – ${formatYear(state.to)}`;
    syncRangeHandleStack();
  }

  function drawAxis() {
    const dpr = window.devicePixelRatio || 1;
    const rect = els.viewport.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    els.canvas.width = w * dpr;
    els.canvas.height = h * dpr;
    els.canvas.style.width = `${w}px`;
    els.canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const axisY = h * 0.72;

    data.eras.forEach((era) => {
      if (era.to < state.from || era.from > state.to) return;
      const x0 = yearToX(Math.max(era.from, state.from), w);
      const x1 = yearToX(Math.min(era.to, state.to), w);
      const tint = era.tint || ERA_TINTS[era.id] || "#0d7c8f";
      const wash = ctx.createLinearGradient(0, 0, 0, h);
      wash.addColorStop(0, hexAlpha(tint, 0.07));
      wash.addColorStop(0.55, hexAlpha(tint, 0.02));
      wash.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(x0, 0, Math.max(2, x1 - x0), h * 0.78);
    });

    const span = state.to - state.from || 1;
    const roughStep = span / 8;
    const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    let step = nice[0];
    for (const n of nice) {
      if (roughStep <= n) {
        step = n;
        break;
      }
      step = n;
    }

    const startTick = Math.ceil(state.from / step) * step;
    for (let y = startTick; y <= state.to; y += step) {
      const x = yearToX(y, w);
      if (x < -40 || x > w + 40) continue;
      ctx.strokeStyle = "rgba(18, 32, 43, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.12);
      ctx.lineTo(x, axisY - 10);
      ctx.stroke();
    }

    const glow = ctx.createLinearGradient(0, axisY - 18, 0, axisY + 18);
    glow.addColorStop(0, "rgba(13, 124, 143, 0)");
    glow.addColorStop(0.5, "rgba(13, 124, 143, 0.14)");
    glow.addColorStop(1, "rgba(196, 92, 38, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, axisY - 18, w, 36);

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(154, 175, 192, 0)");
    grad.addColorStop(0.08, "rgba(13, 124, 143, 0.75)");
    grad.addColorStop(0.5, "rgba(24, 163, 181, 0.95)");
    grad.addColorStop(0.92, "rgba(196, 92, 38, 0.8)");
    grad.addColorStop(1, "rgba(154, 175, 192, 0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.02, axisY);
    ctx.lineTo(w * 0.98, axisY);
    ctx.stroke();

    ctx.font = "600 12px Sora, sans-serif";
    ctx.textAlign = "center";

    for (let y = startTick; y <= state.to; y += step) {
      const x = yearToX(y, w);
      if (x < -40 || x > w + 40) continue;
      ctx.strokeStyle = "rgba(18, 32, 43, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, axisY - 9);
      ctx.lineTo(x, axisY + 9);
      ctx.stroke();
      ctx.fillStyle = "#3d4d5c";
      ctx.fillText(formatYear(y), x, axisY + 26);
    }

    for (let i = 0; i < 36; i++) {
      const x = ((i * 97 + state.panX * 0.2) % w + w) % w;
      const y = 36 + ((i * 53) % Math.max(1, h * 0.48));
      ctx.fillStyle = i % 5 === 0 ? "rgba(196, 92, 38, 0.14)" : "rgba(13, 124, 143, 0.1)";
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + (i % 3) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function layoutEras() {
    const w = els.viewport.clientWidth;
    els.eraLayer.innerHTML = "";
    data.eras.forEach((era) => {
      if (era.to < state.from || era.from > state.to) return;
      const x0 = yearToX(Math.max(era.from, state.from), w);
      const x1 = yearToX(Math.min(era.to, state.to), w);
      const band = document.createElement("div");
      band.className = "era-band";
      band.style.left = `${x0}px`;
      band.style.width = `${Math.max(24, x1 - x0)}px`;
      band.style.setProperty("--era-tint", era.tint || ERA_TINTS[era.id] || "#0d7c8f");
      const label = document.createElement("span");
      label.textContent = era.label;
      band.appendChild(label);
      els.eraLayer.appendChild(band);
    });
  }

  function layoutScrubberEras() {
    if (!els.eraTicks) return;
    const span = data.yearMax - data.yearMin || 1;
    els.eraTicks.innerHTML = "";
    data.eras.forEach((era) => {
      const left = ((era.from - data.yearMin) / span) * 100;
      const tick = document.createElement("div");
      tick.className = "era-tick";
      tick.style.left = `${left}%`;
      const label = document.createElement("span");
      label.textContent = era.label.split(" ")[0];
      tick.appendChild(label);
      els.eraTicks.appendChild(tick);
    });
  }

  function laneForEvent(ev, index) {
    const hash = [...ev.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = 0.34 + ((hash % 7) / 7) * 0.24;
    const stagger = (index % 5) * 0.042;
    return clamp(base - stagger, 0.2, 0.58);
  }

  function renderPins() {
    const events = filteredEvents().sort(
      (a, b) => a.year - b.year || a.title.localeCompare(b.title)
    );
    const w = els.viewport.clientWidth;
    const h = els.viewport.clientHeight;
    els.eventLayer.innerHTML = "";

    els.count.textContent = `${events.length} event${events.length === 1 ? "" : "s"} in view`;
    els.eraLabel.textContent = currentEra().label;
    els.empty.classList.toggle("is-visible", events.length === 0);
    els.resultNote.textContent = state.query
      ? `Search matched ${events.length} event(s) in the selected range.`
      : `Showing ${events.length} of ${data.events.length} catalogued events.`;

    if (
      state.selectedId &&
      !events.some((ev) => ev.id === state.selectedId)
    ) {
      state.selectedId = null;
      els.detail.classList.remove("is-open");
      els.detail.innerHTML = "";
    }

    const byYear = new Map();
    events.forEach((ev) => {
      if (!byYear.has(ev.year)) byYear.set(ev.year, []);
      byYear.get(ev.year).push(ev);
    });

    events.forEach((ev) => {
      const bucket = byYear.get(ev.year);
      const idx = bucket.indexOf(ev);
      const x = yearToX(ev.year, w);
      if (x < -60 || x > w + 60) return;

      const yRatio = laneForEvent(ev, idx);
      const color = catsById[ev.categories[0]]?.color || "#0d7c8f";
      const pinY = h * yRatio;
      const axisY = h * 0.72;
      const stemH = Math.max(18, axisY - pinY);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "event-pin" + (state.selectedId === ev.id ? " is-active" : "");
      btn.style.left = `${x}px`;
      btn.style.top = `${pinY}px`;
      btn.style.setProperty("--pin-color", color);
      btn.style.setProperty("--stem-h", `${stemH}px`);
      btn.setAttribute("aria-label", `${ev.title}, ${formatYear(ev.year)}`);
      btn.dataset.id = ev.id;

      const label = document.createElement("div");
      label.className = "event-label";
      if (x < 150) label.classList.add("is-left");
      else if (x > w - 150) label.classList.add("is-right");
      label.innerHTML = `<strong>${escapeHtml(ev.title)}</strong><span>${escapeHtml(ev.place)} · ${formatYear(ev.year)}</span>`;
      btn.appendChild(label);

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        selectEvent(ev.id);
      });

      els.eventLayer.appendChild(btn);
    });
  }

  function selectEvent(id) {
    state.selectedId = id;
    const ev = data.events.find((e) => e.id === id);
    if (!ev) {
      els.detail.classList.remove("is-open");
      renderPins();
      return;
    }

    const cats = ev.categories
      .map((c) => catsById[c])
      .filter(Boolean)
      .map(
        (c) =>
          `<span class="cat-pill" style="--c:${c.color}">${escapeHtml(c.label)}</span>`
      )
      .join("");

    els.detail.innerHTML = `
      <button type="button" class="icon-btn detail-close" id="detailClose" aria-label="Close detail">✕</button>
      <p class="detail-kicker">${formatYear(ev.year)} · ${escapeHtml(ev.place)}</p>
      <h2>${escapeHtml(ev.title)}</h2>
      <p class="detail-meta">${escapeHtml(
        ev.categories
          .map((c) => catsById[c]?.label)
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ") || "Milestone"
      )}</p>
      <div class="detail-cats">${cats}</div>
      <p class="lead">${escapeHtml(ev.summary)}</p>
      <p>${escapeHtml(ev.detail)}</p>
      <div class="detail-nav">
        <button type="button" class="chip-btn" id="prevEvent">Previous</button>
        <button type="button" class="chip-btn" id="nextEvent">Next</button>
      </div>
    `;
    els.detail.classList.add("is-open");
    document.getElementById("detailClose").addEventListener("click", () => {
      state.selectedId = null;
      els.detail.classList.remove("is-open");
      els.detail.innerHTML = "";
      renderPins();
    });
    document.getElementById("prevEvent").addEventListener("click", () => stepEvent(-1));
    document.getElementById("nextEvent").addEventListener("click", () => stepEvent(1));
    renderPins();
  }

  function stepEvent(dir) {
    const list = filteredEvents().sort(
      (a, b) => a.year - b.year || a.title.localeCompare(b.title)
    );
    if (!list.length) return;
    const idx = list.findIndex((e) => e.id === state.selectedId);
    const next = list[(idx + dir + list.length) % list.length];
    selectEvent(next.id);
  }

  function render() {
    syncRangeInputs();
    drawAxis();
    layoutEras();
    renderPins();
  }

  function setRange(from, to, { keepPan } = {}) {
    let a = clamp(Math.round(from), data.yearMin, data.yearMax - 1);
    let b = clamp(Math.round(to), data.yearMin + 1, data.yearMax);
    if (b <= a) b = Math.min(data.yearMax, a + 1);
    state.from = a;
    state.to = b;
    if (!keepPan) state.panX = 0;
    render();
  }

  function buildCategoryToggles() {
    els.catGrid.innerHTML = "";
    data.categories.forEach((cat) => {
      const label = document.createElement("label");
      label.className = "cat-toggle";
      label.style.setProperty("--c", cat.color);
      label.innerHTML = `
        <input type="checkbox" value="${cat.id}" ${state.activeCats.has(cat.id) ? "checked" : ""} />
        <span class="cat-dot" aria-hidden="true"></span>
        <span>${escapeHtml(cat.label)}</span>
      `;
      label.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) state.activeCats.add(cat.id);
        else state.activeCats.delete(cat.id);
        render();
      });
      els.catGrid.appendChild(label);
    });
  }

  function toggleFilter(open) {
    state.filterOpen = open ?? !state.filterOpen;
    els.filterDrawer.classList.toggle("is-open", state.filterOpen);
    els.filterDrawer.setAttribute("aria-hidden", String(!state.filterOpen));
    els.btnFilter.setAttribute("aria-pressed", String(state.filterOpen));
    els.btnFilter.setAttribute("aria-expanded", String(state.filterOpen));
  }

  function toggleAbout(open) {
    state.aboutOpen = open ?? !state.aboutOpen;
    els.about.classList.toggle("is-open", state.aboutOpen);
    els.btnAbout.setAttribute("aria-pressed", String(state.aboutOpen));
    if (state.aboutOpen) {
      els.about.querySelector("[data-close-about]")?.focus();
    }
  }

  els.viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".event-pin")) return;
    state.dragging = true;
    state.dragStartX = e.clientX;
    state.panStart = state.panX;
    els.viewport.classList.add("is-dragging");
    els.viewport.setPointerCapture(e.pointerId);
  });

  els.viewport.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    state.panX = state.panStart + (e.clientX - state.dragStartX);
    drawAxis();
    layoutEras();
    renderPins();
  });

  function endDrag(e) {
    if (!state.dragging) return;
    state.dragging = false;
    els.viewport.classList.remove("is-dragging");
    try {
      els.viewport.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }

  els.viewport.addEventListener("pointerup", endDrag);
  els.viewport.addEventListener("pointercancel", endDrag);

  els.viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const span = state.to - state.from;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const dx = e.deltaX || e.deltaY;
        const yearDelta = (dx / els.viewport.clientWidth) * span;
        setRange(state.from + yearDelta, state.to + yearDelta, { keepPan: true });
        return;
      }
      const zoom = e.deltaY > 0 ? 1.12 : 0.9;
      const mid = (state.from + state.to) / 2;
      const half = clamp((span * zoom) / 2, 15, (data.yearMax - data.yearMin) / 2);
      setRange(mid - half, mid + half);
    },
    { passive: false }
  );

  els.rangeFrom.addEventListener("input", () => {
    let from = parseYear(els.rangeFrom.value, state.from);
    const to = parseYear(els.rangeTo.value, state.to);
    if (from >= to) from = to - 1;
    setRange(from, to, { keepPan: true });
  });

  els.rangeTo.addEventListener("input", () => {
    const from = parseYear(els.rangeFrom.value, state.from);
    let to = parseYear(els.rangeTo.value, state.to);
    if (to <= from) to = from + 1;
    setRange(from, to, { keepPan: true });
  });

  els.rangeFrom.addEventListener("pointerdown", () => {
    els.rangeFrom.style.zIndex = "7";
    els.rangeTo.style.zIndex = "5";
  });
  els.rangeTo.addEventListener("pointerdown", () => {
    els.rangeTo.style.zIndex = "7";
    els.rangeFrom.style.zIndex = "5";
  });

  els.yearFromInput.addEventListener("change", () => {
    const next = parseYear(els.yearFromInput.value, state.from);
    els.yearFromInput.value = String(next);
    setRange(next, state.to, { keepPan: true });
  });
  els.yearToInput.addEventListener("change", () => {
    const next = parseYear(els.yearToInput.value, state.to);
    els.yearToInput.value = String(next);
    setRange(state.from, next, { keepPan: true });
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    render();
  });

  els.btnFilter.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFilter();
  });
  els.btnAbout.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAbout(true);
  });
  els.about.addEventListener("click", (e) => {
    if (e.target === els.about || e.target.closest("[data-close-about]")) {
      toggleAbout(false);
    }
  });
  els.about.querySelector(".about-card")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-about]")) return;
    e.stopPropagation();
  });

  els.btnClear.addEventListener("click", () => {
    state.query = "";
    els.search.value = "";
    state.activeCats = new Set(data.categories.map((c) => c.id));
    buildCategoryToggles();
    setRange(data.defaultFrom, data.defaultTo);
  });

  els.btnFitAll.addEventListener("click", () => {
    setRange(data.yearMin, data.yearMax);
  });

  els.brandHome?.addEventListener("click", () => {
    setRange(data.defaultFrom, data.defaultTo);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.aboutOpen) toggleAbout(false);
      else if (state.filterOpen) toggleFilter(false);
      else if (state.selectedId) {
        state.selectedId = null;
        els.detail.classList.remove("is-open");
        els.detail.innerHTML = "";
        renderPins();
      }
      return;
    }
    if (shouldIgnoreTimelineKeys(e)) return;
    if (e.key === "ArrowLeft" && state.selectedId) {
      e.preventDefault();
      stepEvent(-1);
    }
    if (e.key === "ArrowRight" && state.selectedId) {
      e.preventDefault();
      stepEvent(1);
    }
  });

  if (els.tip) {
    els.tip.querySelector("button")?.addEventListener("click", () => els.tip.remove());
    setTimeout(() => els.tip?.remove(), 8000);
  }

  window.addEventListener("resize", () => render());

  buildCategoryToggles();
  layoutScrubberEras();
  document.title = `${data.productName} — ${data.tagline}`;
  render();
})();
