(() => {
  "use strict";

  const DAYS = [
    { date: "2025-07-05", short: "Sun 7/5", label: "Sunday, July 5", place: "Nice", color: "#20a7a0" },
    { date: "2025-07-06", short: "Mon 7/6", label: "Monday, July 6", place: "Monaco", color: "#7557c5" },
    { date: "2025-07-07", short: "Tue 7/7", label: "Tuesday, July 7", place: "Cannes", color: "#348ac7" },
    { date: "2025-07-08", short: "Wed 7/8", label: "Wednesday, July 8", place: "Antibes", color: "#ee6a51" },
    { date: "2025-07-09", short: "Thu 7/9", label: "Thursday, July 9", place: "Èze", color: "#2e9d68" },
    { date: "2025-07-10", short: "Fri 7/10", label: "Friday, July 10", place: "Saint-Tropez", color: "#db9637" },
    { date: "2025-07-11", short: "Sat 7/11", label: "Saturday, July 11", place: "Menton", color: "#4d6689" },
  ];
  const DAY_VALUES = [...DAYS.map((day) => day.date), "unscheduled"];
  const CATEGORIES = ["lodging", "food", "transit", "activity", "idea"];
  const COSTS = ["1", "2", "3", "4"];
  const STATUSES = ["to-visit", "reserved", "completed"];
  const dayOf = (date) => DAYS.find((day) => day.date === date);
  const uid = () => `stop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const stop = (id, title, day, location, startTime, endTime, category, costTier, status, tags, notes, lat, lng) => ({
    id, title, day, location, startTime, endTime, category, costTier, status, tags, notes, lat, lng,
  });
  const SEEDED = [
    stop("negresco", "Hotel Le Negresco", "2025-07-05", "37 Promenade des Anglais, Nice", "15:00", "16:00", "lodging", "4", "reserved", ["hotel", "iconic"], "Check in by the sea-facing lobby.", 43.6943, 7.2584),
    stop("old-nice", "Old Nice & Cours Saleya", "2025-07-05", "Vieux Nice, Nice", "09:00", "11:00", "activity", "1", "to-visit", ["market", "walk"], "Start at the flower market.", 43.6964, 7.2746),
    stop("monaco-palace", "Prince's Palace of Monaco", "2025-07-06", "Place du Palais, Monaco", "10:00", "12:00", "activity", "3", "reserved", ["history"], "Arrive before the guard ceremony.", 43.7311, 7.4207),
    stop("monaco-casino", "Casino de Monte-Carlo", "2025-07-06", "Place du Casino, Monaco", "15:30", "17:00", "activity", "4", "to-visit", ["architecture"], "Bring photo identification.", 43.7392, 7.4272),
    stop("cannes-croisette", "La Croisette in Cannes", "2025-07-07", "Boulevard de la Croisette, Cannes", "09:30", "11:00", "activity", "1", "to-visit", ["coast", "walk"], "Walk west toward the Palais.", 43.5509, 7.0251),
    stop("cannes-market", "Marché Forville", "2025-07-07", "6 Rue du Marché Forville, Cannes", "11:15", "12:30", "food", "2", "to-visit", ["market", "food"], "Try socca and seasonal fruit.", 43.5528, 7.0147),
    stop("picasso", "Musée Picasso, Antibes", "2025-07-08", "Place Mariejol, Antibes", "10:00", "12:00", "activity", "2", "reserved", ["museum", "art"], "Picasso collection in Château Grimaldi.", 43.5808, 7.1283),
    stop("cap-antibes", "Cap d'Antibes coastal walk", "2025-07-08", "Chemin des Douaniers, Antibes", "14:00", "16:30", "activity", "1", "to-visit", ["coast", "walk"], "Bring water and sun protection.", 43.5551, 7.1302),
    stop("eze-village", "Èze medieval village", "2025-07-09", "Èze Village", "09:30", "11:30", "activity", "2", "to-visit", ["village", "views"], "Climb to the panoramic garden.", 43.7277, 7.3617),
    stop("eze-garden", "Jardin Exotique d’Èze", "2025-07-09", "20 Rue du Château, Èze", "11:30", "12:30", "activity", "2", "reserved", ["garden", "views"], "Ticket saved with trip documents.", 43.7281, 7.3614),
    stop("st-tropez", "Saint-Tropez old port", "2025-07-10", "Vieux Port, Saint-Tropez", "10:30", "12:00", "activity", "2", "to-visit", ["port", "walk"], "Coffee near the waterfront.", 43.2726, 6.6374),
    stop("lices", "Place des Lices", "2025-07-10", "Place des Lices, Saint-Tropez", "12:15", "13:15", "food", "3", "to-visit", ["food", "square"], "Lunch beneath the plane trees.", 43.2693, 6.6404),
    stop("menton-garden", "Menton old town & gardens", "2025-07-11", "Vieille Ville, Menton", "09:30", "12:00", "activity", "1", "to-visit", ["garden", "walk"], "Follow the ochre stairways uphill.", 43.7765, 7.5049),
    stop("menton-lunch", "Lemon terrace lunch", "2025-07-11", "Quai Bonaparte, Menton", "12:30", "14:00", "food", "3", "reserved", ["food", "sea"], "Ask for the lemon tasting menu.", 43.7737, 7.5088),
    stop("idea-chagall", "Marc Chagall National Museum", "unscheduled", "Avenue Docteur Ménard, Nice", "", "", "idea", "2", "to-visit", ["museum", "art"], "Possible rainy-day stop.", 43.7092, 7.2698),
    stop("idea-ephrussi", "Villa Ephrussi de Rothschild", "unscheduled", "Saint-Jean-Cap-Ferrat", "", "", "idea", "3", "to-visit", ["garden", "villa"], "Leave room for the musical fountains.", 43.6961, 7.3282),
    stop("idea-beach", "Paloma Beach picnic", "unscheduled", "Saint-Jean-Cap-Ferrat", "", "", "idea", "2", "to-visit", ["beach", "food"], "Bring a light picnic and towels.", 43.6876, 7.3356),
  ];
  const cloneStops = (items) => items.map((item) => ({ ...item, tags: [...item.tags] }));

  const state = {
    stops: cloneStops(SEEDED), selectedId: null, selectedDay: "all", mode: "list", role: "Owner", theme: "light", timezone: "CET",
    filters: { category: "", costTier: "", status: "", tag: "", search: "" }, selectedBulk: new Set(), collapsed: new Set(), detailTab: "About",
    history: [], future: [], activities: [{ actor: "Sarah", text: "prepared the French Riviera itinerary", at: new Date() }], votes: {}, zoomedOut: false,
    exportFormat: "markdown", editingId: null, submitting: false, dragId: null, lastStopFocus: null, sort: "time",
    voteBusy: null, isochroneOn: false,
    lastAddedId: null, peerLatency: 320, accent: "teal", bulkConfirm: false, firstExportTip: false, firstPromoteTip: false, exportTrigger: null,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const els = {};
  let toastTimer;

  function showToast(message, options = {}) {
    const { type = "", action = null, duration = type === "error" ? 6200 : 2300 } = options;
    els.toast.textContent = "";
    els.toast.classList.toggle("error", type === "error");
    els.toast.classList.toggle("has-action", Boolean(action));
    const text = document.createElement("span");
    text.textContent = message;
    els.toast.append(text);
    if (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toast-action";
      button.textContent = action.label;
      button.setAttribute("aria-label", action.label);
      button.addEventListener("click", () => { try { action.onClick && action.onClick(); } catch (_) {} els.toast.classList.remove("show"); });
      els.toast.append(button);
    }
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), duration);
  }
  function announce(message) { els.announcer.textContent = ""; setTimeout(() => { els.announcer.textContent = message; }, 20); }
  function log(actor, text) { state.activities.unshift({ actor, text, at: new Date() }); renderActivity(); }
  function snapshot() { return cloneStops(state.stops); }
  function checkpoint() { state.history.push(snapshot()); if (state.history.length > 40) state.history.shift(); state.future = []; updateUndo(); }
  function updateUndo() { els.undo.disabled = state.history.length === 0; els.redo.disabled = state.future.length === 0; }
  function structuralChange(actor, text) { log(actor, text); renderAll(); }
  function roleCan(action = "edit") { return state.role !== "Viewer" && !(action === "delete" && state.role === "Editor"); }
  function guard(action = "edit") { if (roleCan(action)) return true; showToast(state.role === "Viewer" ? "Viewers cannot edit the plan" : "Editors cannot delete stops"); return false; }
  function selectedStop() { return state.stops.find((item) => item.id === state.selectedId) || null; }
  function stopPayload(item) { const { id, bufferMode, dayOrder, ...payload } = item; return { ...payload, tags: [...payload.tags] }; }
  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function stopTime(item) { return item.startTime || "99:99"; }
  function sorted(items) {
    if (state.sort === "title") return [...items].sort((a, b) => a.title.localeCompare(b.title));
    return [...items].sort((a, b) => (a.dayOrder ?? 9999) - (b.dayOrder ?? 9999) || stopTime(a).localeCompare(stopTime(b)));
  }
  function renumberDay(day) {
    sorted(state.stops.filter((item) => item.day === day)).forEach((item, index) => { item.dayOrder = index; });
  }
  function seedDayOrders() { DAY_VALUES.forEach((day) => { const items = state.stops.filter((item) => item.day === day).sort((a, b) => stopTime(a).localeCompare(stopTime(b))); items.forEach((item, index) => { item.dayOrder = index; }); }); }
  function dayNumber(date) { return DAYS.findIndex((day) => day.date === date) + 1; }
  function fmtStatus(status) { return ({ "to-visit": "To Visit", reserved: "Reserved", completed: "Completed" })[status] || status; }
  function fmtTime(time) {
    if (!time) return "Anytime";
    const [hour, minute] = time.split(":").map(Number);
    const delta = state.timezone === "ET" ? -6 : state.timezone === "UTC" ? -2 : 0;
    const shifted = (hour + delta + 24) % 24;
    return `${String(shifted).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${state.timezone}`;
  }
  function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
  function normalize(value) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " "); }
  function distance(a, b) { const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]); for (let j = 0; j <= a.length; j++) matrix[0][j] = j; for (let i = 1; i <= b.length; i++) for (let j = 1; j <= a.length; j++) matrix[i][j] = b[i - 1] === a[j - 1] ? matrix[i - 1][j - 1] : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1; return matrix[b.length][a.length]; }
  function fuzzyMatch(item, query) {
    if (!query) return true;
    const q = normalize(query).trim(); const hay = normalize(`${item.title} ${item.location} ${item.tags.join(" ")}`);
    if (hay.includes(q)) return true;
    return hay.split(/\s+/).some((word) => word.length > 4 && distance(word, q) <= 2);
  }
  function visibleStops() {
    return state.stops.filter((item) => (state.selectedDay === "all" || item.day === state.selectedDay) && (!state.filters.category || item.category === state.filters.category) && (!state.filters.costTier || item.costTier === state.filters.costTier) && (!state.filters.status || item.status === state.filters.status) && (!state.filters.tag || item.tags.includes(state.filters.tag)) && fuzzyMatch(item, state.filters.search));
  }

  function validateStop(raw) {
    const errors = {};
    const title = String(raw.title ?? "").trim(); const location = String(raw.location ?? "").trim(); const notes = String(raw.notes ?? "");
    const tags = Array.isArray(raw.tags) ? raw.tags.map(String).map((tag) => tag.trim()).filter(Boolean) : String(raw.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
    if (!title) errors.title = "Title is required"; else if (title.length > 120) errors.title = "Title must be 120 characters or fewer";
    if (!location) errors.location = "Location is required"; else if (location.length > 200) errors.location = "Location must be 200 characters or fewer";
    if (!DAY_VALUES.includes(String(raw.day))) errors.day = "Day must be a listed itinerary date or unscheduled";
    if (!CATEGORIES.includes(String(raw.category))) errors.category = "Category must be lodging, food, transit, activity, or idea";
    if (!COSTS.includes(String(raw.costTier))) errors.costTier = "CostTier must be 1, 2, 3, or 4";
    if (!STATUSES.includes(String(raw.status))) errors.status = "Status must be to-visit, reserved, or completed";
    const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (raw.startTime && !clock.test(String(raw.startTime))) errors.startTime = "StartTime must use HH:MM";
    if (raw.endTime && !clock.test(String(raw.endTime))) errors.endTime = "EndTime must use HH:MM";
    if (raw.endTime && !raw.startTime) errors.endTime = "EndTime requires startTime";
    if (raw.startTime && raw.endTime && String(raw.endTime) <= String(raw.startTime)) errors.endTime = "EndTime must be after startTime";
    if (tags.length > 8) errors.tags = "Tags must contain no more than 8 items"; else if (tags.some((tag) => tag.length < 1 || tag.length > 24)) errors.tags = "Each tag must be 1 to 24 characters";
    if (notes.length > 500) errors.notes = "Notes must be 500 characters or fewer";
    const lat = Number(raw.lat); const lng = Number(raw.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.lat = "Lat must be between -90 and 90";
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.lng = "Lng must be between -180 and 180";
    return { errors, value: { title, day: String(raw.day), location, startTime: raw.startTime ? String(raw.startTime) : "", endTime: raw.endTime ? String(raw.endTime) : "", category: String(raw.category), costTier: String(raw.costTier), status: String(raw.status), tags, notes, lat, lng } };
  }
  function validateTripDocument(doc) {
    if (!doc || typeof doc !== "object") throw new Error("Import must be a valid JSON object");
    if (doc.schemaVersion !== "1") throw new Error("Import schemaVersion must equal 1");
    if (!doc.trip || typeof doc.trip.title !== "string") throw new Error("Import trip.title is required");
    if (doc.trip.dateStart !== "2025-07-05") throw new Error("Import trip.dateStart must be 2025-07-05");
    if (doc.trip.dateEnd !== "2025-07-11") throw new Error("Import trip.dateEnd must be 2025-07-11");
    if (!Array.isArray(doc.stops)) throw new Error("Import stops must be an array");
    const values = doc.stops.map((raw, index) => { const result = validateStop(raw); const field = Object.keys(result.errors)[0]; if (field) throw new Error(`Stop ${index + 1}: ${result.errors[field]}`); return { id: uid(), ...result.value }; });
    return { title: doc.trip.title, stops: values };
  }

  function renderNav() {
    els.dayNav.innerHTML = DAYS.map((day) => `<button class="nav-item ${state.selectedDay === day.date ? "active" : ""}" data-day="${day.date}" style="--day:${day.color}"><span class="day-dot"></span><span>${day.short}</span><span class="nav-date">${state.stops.filter((item) => item.day === day.date).length}</span></button>`).join("");
    const overview = $('.nav-item[data-day="all"]'); overview.classList.toggle("active", state.selectedDay === "all");
  }
  function overlaps(item, dayItems) { if (!item.startTime || !item.endTime) return false; return dayItems.some((other) => other.id !== item.id && other.startTime && other.endTime && item.startTime < other.endTime && item.endTime > other.startTime); }
  function rowTemplate(item, dayItems) {
    const overlap = overlaps(item, dayItems); const checked = state.selectedBulk.has(item.id); const canEdit = roleCan(); const canDelete = roleCan("delete");
    const entering = state.lastAddedId === item.id;
    return `<article class="stop-row ${state.selectedId === item.id ? "selected" : ""} ${overlap ? "overlap" : ""} ${entering ? "row-enter" : ""}" draggable="${canEdit}" data-id="${item.id}" tabindex="0" aria-label="${esc(item.title)}, ${fmtTime(item.startTime)}, ${fmtStatus(item.status)}">
      <input class="select-stop mutating" type="checkbox" ${checked ? "checked" : ""} aria-label="Select ${esc(item.title)}" ${canEdit ? "" : "disabled"}>
      <span class="time">${item.startTime ? esc(fmtTime(item.startTime).replace(` ${state.timezone}`, "")) : "—"}</span>
      <div class="stop-main"><button class="stop-title select-row" title="${esc(item.title)}">${overlap ? "⚠ " : ""}${esc(item.title)}</button><div class="stop-meta"><span>${esc(item.location)}</span><span class="status-pill">${esc(fmtStatus(item.status))}</span><span>${"$".repeat(Number(item.costTier))}</span></div></div>
      <div class="row-actions"><button class="move-up mutating" aria-label="Move ${esc(item.title)} earlier" ${canEdit ? "" : "disabled"}>↑</button><button class="move-day mutating" aria-label="Move ${esc(item.title)} to next day" ${canEdit ? "" : "disabled"}>→</button><button class="edit-row mutating" aria-label="Edit ${esc(item.title)}" ${canEdit ? "" : "disabled"}>✎</button><button class="delete-row mutating owner-only" aria-label="Delete ${esc(item.title)}" ${canDelete ? "" : "disabled"}>×</button></div>
    </article>`;
  }
  function travelTemplate(a, b, index) {
    const mode = a.bufferMode || "Driving"; const duration = ({ Driving: 18, Walking: 42, Transit: 28 })[mode] + (index % 3) * 4;
    const gap = a.endTime && b.startTime ? (Number(b.startTime.slice(0, 2)) * 60 + Number(b.startTime.slice(3)) - Number(a.endTime.slice(0, 2)) * 60 - Number(a.endTime.slice(3))) : 999;
    return `<div class="travel-card ${gap < duration ? "impossible" : ""}" data-after="${a.id}"><span>${gap < duration ? "⚠ Impossible transit" : "↳ Travel buffer"}</span><select class="buffer-mode mutating" aria-label="Travel mode from ${esc(a.title)} to ${esc(b.title)}" ${roleCan() ? "" : "disabled"}><option ${mode === "Driving" ? "selected" : ""}>Driving</option><option ${mode === "Walking" ? "selected" : ""}>Walking</option><option ${mode === "Transit" ? "selected" : ""}>Transit</option></select><strong>${duration} min</strong></div>`;
  }
  function renderList() {
    const visible = visibleStops(); const scheduled = visible.filter((item) => item.day !== "unscheduled");
    if (!state.stops.length) { els.planList.innerHTML = `<div class="empty-state"><h3>Your itinerary is empty</h3><p>Add a stop or import a trip JSON package to begin again.</p><button class="btn primary mutating empty-add" ${roleCan() ? "" : "disabled"}>Add stop</button></div>`; state.lastAddedId = null; renderDensity(); return; }
    const daySet = state.selectedDay === "all" ? DAYS : DAYS.filter((day) => day.date === state.selectedDay);
    els.planList.innerHTML = daySet.map((day) => {
      const items = sorted(scheduled.filter((item) => item.day === day.date)); let content = "";
      items.forEach((item, index) => { content += rowTemplate(item, items); if (items[index + 1]) content += travelTemplate(item, items[index + 1], index); });
      if (!items.length) content = `<div class="empty-state"><h3>No stops for ${day.short}</h3><p>Add a stop, try clearing filters, or move an idea into this day.</p></div>`;
      return `<section class="day-section" data-day="${day.date}" style="--day:${day.color}"><header class="day-head"><button class="collapse-day" aria-expanded="${!state.collapsed.has(day.date)}" aria-label="${state.collapsed.has(day.date) ? "Expand" : "Collapse"} ${day.label}">⌄</button><span class="day-dot"></span><div><h2>${day.label}</h2><p>${day.place} · ${items.length} ${items.length === 1 ? "stop" : "stops"}</p></div><button class="focus-day">Focus map</button></header><div class="day-body ${state.collapsed.has(day.date) ? "collapsed" : ""}"><div class="day-body-inner">${content}</div></div></section>`;
    }).join("");
    state.lastAddedId = null;
    renderDensity();
  }
  function renderDensity() {
    if (!els.density) return;
    const max = Math.max(1, ...DAYS.map((day) => state.stops.filter((item) => item.day === day.date).length));
    els.density.innerHTML = DAYS.map((day) => {
      const count = state.stops.filter((item) => item.day === day.date).length;
      const level = count ? Math.round(20 + (count / max) * 80) : 12;
      return `<span class="density-cell ${count ? "" : "empty"}" style="--day:${day.color};height:${level}%" title="${day.short} · ${day.place} · ${count} ${count === 1 ? "stop" : "stops"}"></span>`;
    }).join("");
  }
  function renderBulk() { const n = state.selectedBulk.size; els.bulkBar.classList.toggle("hidden", n === 0); els.bulkCount.textContent = n; if (state.bulkConfirm) cancelBulkConfirm(); }
  function cancelBulkConfirm() { if (!els.bulkDelete) return; state.bulkConfirm = false; els.bulkDelete.classList.remove("confirming"); els.bulkDelete.textContent = "Delete selected"; }
  function renderKanban() {
    els.kanban.innerHTML = STATUSES.map((status) => { const items = visibleStops().filter((item) => item.status === status); return `<section class="kanban-col" data-status="${status}"><h2>${fmtStatus(status)} <span>${items.length}</span></h2>${items.map((item) => `<article class="kanban-card" draggable="${roleCan()}" data-id="${item.id}" style="--day:${dayOf(item.day)?.color || "#687985"}" tabindex="0"><strong>${esc(item.title)}</strong><small>${esc(dayOf(item.day)?.short || "Idea")} · ${esc(item.category)}</small></article>`).join("") || `<div class="empty-state">Drop stops here or add a stop</div>`}</section>`; }).join("");
  }
  function mapPoint(item) { const x = 8 + ((item.lng - 6.58) / 1.02) * 82; const y = 81 - ((item.lat - 43.24) / .57) * 68; return { x: Math.max(6, Math.min(94, x)), y: Math.max(12, Math.min(88, y)) }; }
  function renderMap() {
    const items = visibleStops(); const scheduled = items.filter((item) => item.day !== "unscheduled"); const ideas = items.filter((item) => item.day === "unscheduled");
    els.mapEmpty.classList.toggle("hidden", scheduled.length > 0); els.mapPins.innerHTML = ""; els.routes.innerHTML = "";
    if (state.zoomedOut && scheduled.length > 4) {
      const cluster = document.createElement("button"); cluster.className = "cluster"; cluster.style.left = "48%"; cluster.style.top = "45%"; cluster.textContent = scheduled.length; cluster.setAttribute("aria-label", `Expand cluster of ${scheduled.length} stops`); cluster.addEventListener("click", () => { state.zoomedOut = false; renderMap(); showToast("Cluster expanded into individual pins"); }); els.mapPins.append(cluster);
    } else {
      scheduled.forEach((item) => {
        const p = mapPoint(item); const selected = state.selectedId === item.id;
        const pin = document.createElement("button"); pin.className = `pin ${selected ? "selected" : ""}`; pin.dataset.id = item.id; pin.style.cssText = `left:${p.x}%;top:${p.y}%;--day:${dayOf(item.day).color}`; pin.innerHTML = `<span>${dayNumber(item.day)}</span>`; pin.setAttribute("aria-label", `${item.title}, Day ${dayNumber(item.day)}`); pin.addEventListener("click", () => selectStop(item.id, true)); els.mapPins.append(pin);
        if (selected) {
          const popup = document.createElement("div"); popup.className = "map-popup"; popup.dataset.id = item.id; popup.style.left = `${p.x}%`; popup.style.top = `${p.y}%`;
          popup.innerHTML = `<strong>${esc(item.title)}</strong><span>Day ${dayNumber(item.day)} · Côte d'Azur</span>`;
          popup.setAttribute("role", "status"); popup.setAttribute("aria-label", `${item.title}, Day ${dayNumber(item.day)} Côte d'Azur`);
          els.mapPins.append(popup);
        }
      });
      ideas.forEach((item) => {
        const p = mapPoint(item); const selected = state.selectedId === item.id;
        const pin = document.createElement("button"); pin.className = `pin idea-pin ${selected ? "selected" : ""}`; pin.dataset.id = item.id; pin.style.cssText = `left:${p.x}%;top:${p.y}%`; pin.innerHTML = "<span>•</span>"; pin.setAttribute("aria-label", `${item.title}, unscheduled idea`); pin.addEventListener("click", () => selectStop(item.id, true)); els.mapPins.append(pin);
        if (selected) {
          const popup = document.createElement("div"); popup.className = "map-popup"; popup.dataset.id = item.id; popup.style.left = `${p.x}%`; popup.style.top = `${p.y}%`;
          popup.innerHTML = `<strong>${esc(item.title)}</strong><span>Unscheduled idea</span>`;
          popup.setAttribute("role", "status"); els.mapPins.append(popup);
        }
      });
      DAYS.forEach((day) => {
        const dayItems = sorted(scheduled.filter((item) => item.day === day.date)); if (dayItems.length < 2) return;
        const points = dayItems.map(mapPoint);
        points.slice(0, -1).forEach((p, index) => {
          const next = points[index + 1]; const from = dayItems[index]; const to = dayItems[index + 1];
          const leg = document.createElementNS("http://www.w3.org/2000/svg", "line");
          leg.setAttribute("x1", p.x); leg.setAttribute("y1", p.y); leg.setAttribute("x2", next.x); leg.setAttribute("y2", next.y);
          leg.setAttribute("class", "route-line route-leg"); leg.dataset.day = day.date; leg.dataset.from = from.id; leg.dataset.to = to.id;
          leg.style.setProperty("--route", day.color); els.routes.append(leg);
          const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("x", (p.x + next.x) / 2); text.setAttribute("y", (p.y + next.y) / 2 - 1); text.setAttribute("class", "distance-label");
          const km = Math.max(.8, Math.hypot(next.x - p.x, next.y - p.y) * .34); text.textContent = `${km.toFixed(1)} km`; els.routes.append(text);
        });
      });
    }
    renderDetail();
  }
  function isNegresco(item) { return Boolean(item && /hotel\s+le\s+negresco/i.test(item.title)); }
  function flyTo(item) {
    if (!els.mapWorld) return;
    if (prefersReducedMotion() || !item || item.day === "unscheduled") { els.mapWorld.style.transform = ""; return; }
    const p = mapPoint(item);
    const tx = (50 - p.x) * 0.35; const ty = (50 - p.y) * 0.35;
    els.mapWorld.style.transform = `translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) scale(1.18)`;
  }
  function fitDay(dayDate) {
    if (!els.mapWorld) return;
    if (!dayDate || dayDate === "all") { els.mapWorld.style.transform = ""; return; }
    const dayItems = state.stops.filter((item) => item.day === dayDate);
    if (!dayItems.length || prefersReducedMotion()) { els.mapWorld.style.transform = ""; return; }
    const points = dayItems.map(mapPoint);
    const xs = points.map((p) => p.x); const ys = points.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2; const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 10);
    const scale = Math.min(1.85, Math.max(1.2, 52 / span));
    els.mapWorld.style.transform = `translate(${((50 - cx) * 0.6).toFixed(2)}%, ${((50 - cy) * 0.6).toFixed(2)}%) scale(${scale.toFixed(3)})`;
  }
  function positionIsochrone(item) {
    if (!item || !els.isochroneRing) return;
    const point = mapPoint(item);
    els.isochroneRing.style.left = `${point.x}%`;
    els.isochroneRing.style.top = `${point.y}%`;
  }
  function renderDetail() {
    const item = selectedStop(); if (!item) { els.detailCard.classList.add("hidden"); els.isochrone.classList.add("hidden"); els.isochroneRing.classList.add("hidden"); state.isochroneOn = false; return; }
    els.detailTitle.textContent = item.title; els.detailLocation.textContent = item.location; els.detailKicker.textContent = item.day === "unscheduled" ? "Unscheduled idea" : `Day ${dayNumber(item.day)} · Côte d'Azur`;
    const panels = { About: `${item.notes || "A memorable French Riviera stop."} ${item.startTime ? `Planned for ${fmtTime(item.startTime)}${item.endTime ? `–${fmtTime(item.endTime)}` : ""}.` : ""}`, Book: `${item.status === "reserved" ? "Reserved" : "No reservation yet"}. This frontend demo never leaves the planner.`, Reviews: "Sarah recommends this stop · 4.8 simulated rating", Photos: "Photo board ready for your trip memories.", Mentions: `${item.tags.length ? item.tags.map((tag) => `#${tag}`).join(" ") : "No tags yet."}` };
    els.detailPanel.textContent = panels[state.detailTab]; $$("[data-detail-tab]", els.detailCard).forEach((button) => button.setAttribute("aria-selected", String(button.dataset.detailTab === state.detailTab)));
    const showIso = isNegresco(item);
    els.isochrone.classList.toggle("hidden", !showIso);
    if (showIso) {
      positionIsochrone(item);
      els.isochroneRing.classList.toggle("hidden", !state.isochroneOn);
      els.isochrone.textContent = state.isochroneOn ? "Hide 1.25 km isochrone" : "Show 1.25 km isochrone";
    } else {
      els.isochroneRing.classList.add("hidden");
      state.isochroneOn = false;
    }
    els.detailCard.classList.remove("hidden");
    els.editSelected.disabled = !roleCan(); els.conflictOpen.disabled = !roleCan(); els.deleteSelected.disabled = !roleCan("delete");
  }
  function renderIdeas() {
    const ideas = state.stops.filter((item) => item.day === "unscheduled"); els.ideasCount.textContent = ideas.length;
    els.ideasList.innerHTML = ideas.length ? ideas.map((item) => {
      const count = state.votes[item.id] || 0;
      const busy = state.voteBusy === item.id;
      const canVote = roleCan() && !busy && count < 3;
      return `<article class="idea-card ${busy ? "voting" : ""}" data-id="${item.id}"><h3>${esc(item.title)}</h3><p>${esc(item.location)}</p><div class="vote-row"><span class="avatar ${count >= 1 ? "voted" : ""}">YOU</span><span class="avatar ${count >= 2 ? "voted" : ""}">S</span><span class="avatar ${count >= 3 ? "voted" : ""}">J</span><span class="avatar ${count >= 4 ? "voted" : ""}">M</span><button class="btn primary vote-btn mutating" aria-label="Vote for ${esc(item.title)}, ${count} of 4 votes" ${canVote ? "" : "disabled"}>Vote · ${count}/4</button></div></article>`;
    }).join("") : `<div class="empty-state"><h3>Ideas bucket is empty</h3><p>Every idea has joined the itinerary. To collect a fresh one, open Add stop and choose the idea category.</p></div>`;
  }
  function renderActivity() { if (!els.activityList) return; els.activityList.innerHTML = state.activities.map((entry) => `<article class="activity-item"><span class="activity-dot"></span><div><p><strong>${esc(entry.actor)}</strong> ${esc(entry.text)}</p><time>${entry.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></article>`).join(""); }
  function renderRole() { $$(".mutating").forEach((el) => { if (el.closest("#stop-dialog") || el.closest("#conflict-dialog")) return; el.disabled = !roleCan(); }); $$(".owner-only").forEach((el) => { el.disabled = !roleCan("delete"); }); els.roleSelect.value = state.role; }
  function renderAll() { renderNav(); renderList(); renderBulk(); renderKanban(); renderMap(); renderIdeas(); renderActivity(); renderRole(); updateUndo(); }

  function rememberStopFocus(id) {
    const active = document.activeElement;
    const surface = active?.closest?.(".pin") ? "pin" : active?.closest?.(".stop-row") ? "row" : null;
    if (surface) state.lastStopFocus = { id, surface };
  }
  function restoreStopFocus() {
    const remembered = state.lastStopFocus;
    if (!remembered) return;
    const selector = remembered.surface === "pin"
      ? `.pin[data-id="${CSS.escape(remembered.id)}"]`
      : `.stop-row[data-id="${CSS.escape(remembered.id)}"]`;
    ($(selector) || els.addStop)?.focus();
  }

  function selectStop(id, fromMap = false) {
    const item = state.stops.find((candidate) => candidate.id === id); if (!item) return false;
    rememberStopFocus(id);
    state.selectedId = id; state.detailTab = "About"; renderAll(); flyTo(item);
    if (fromMap) { const row = $(`.stop-row[data-id="${CSS.escape(id)}"]`); row?.scrollIntoView({ behavior: "smooth", block: "center" }); }
    showToast(`${item.title} selected`); return true;
  }
  function createStop(payload, options = {}) {
    if (!guard()) return { ok: false, error: "Viewers cannot edit the plan" };
    const result = validateStop(payload); const first = Object.keys(result.errors)[0]; if (first) return { ok: false, errors: result.errors, error: result.errors[first] };
    const duplicates = state.stops.filter((item) => item.title.toLowerCase() === result.value.title.toLowerCase() && item.startTime === result.value.startTime);
    if (options.repeat && duplicates.length) { showToast("Duplicate daily series found — no blocks added"); return { ok: false, error: "Duplicate daily series; no blocks added" }; }
    checkpoint();
    if (options.repeat) {
      const created = DAYS.map((day) => ({ id: uid(), ...result.value, day: day.date, dayOrder: state.stops.filter((candidate) => candidate.day === day.date).length })); state.stops.push(...created); created.forEach((item) => renumberDay(item.day)); state.selectedId = created[0].id; state.lastAddedId = created[0].id; structuralChange("You", `created ${result.value.title} on all seven days`); announce(`Created seven daily blocks for ${result.value.title}`); return { ok: true, count: 7, ids: created.map((item) => item.id) };
    }
    const item = { id: uid(), ...result.value }; item.dayOrder = state.stops.filter((candidate) => candidate.day === item.day).length; state.stops.push(item); state.selectedId = item.id; state.lastAddedId = item.id; structuralChange("You", `added ${item.title} to ${dayOf(item.day)?.short || "Ideas"}`); announce(`${item.title} added to the itinerary`); return { ok: true, id: item.id, item: stopPayload(item) };
  }
  function updateStop(id, fields) {
    if (!guard()) return { ok: false, error: "Viewers cannot edit the plan" }; const index = state.stops.findIndex((item) => item.id === id); if (index < 0) return { ok: false, error: `No activity with id ${id}` };
    const allowed = ["title", "day", "location", "startTime", "endTime", "category", "costTier", "status", "tags", "notes", "lat", "lng"]; const merged = stopPayload(state.stops[index]); allowed.forEach((key) => { if (Object.prototype.hasOwnProperty.call(fields, key)) merged[key] = fields[key]; });
    const result = validateStop(merged); const first = Object.keys(result.errors)[0]; if (first) return { ok: false, errors: result.errors, error: result.errors[first] };
    checkpoint(); const oldTitle = state.stops[index].title; const oldDay = state.stops[index].day; const dayOrder = state.stops[index].dayOrder; state.stops[index] = { id, dayOrder, ...result.value }; state.selectedId = id; if (result.value.day !== oldDay) { state.lastAddedId = id; renumberDay(oldDay); renumberDay(result.value.day); } structuralChange("You", `updated ${oldTitle}`); return { ok: true, id, item: result.value };
  }
  function deleteStop(id) {
    if (!guard("delete")) return { ok: false, error: `${state.role}s cannot delete stops` }; const item = state.stops.find((candidate) => candidate.id === id); if (!item) return { ok: false, error: `No activity with id ${id}` };
    checkpoint(); state.stops = state.stops.filter((candidate) => candidate.id !== id); state.selectedBulk.delete(id); if (state.selectedId === id) state.selectedId = null; renumberDay(item.day); structuralChange("You", `deleted ${item.title}`); announce(`${item.title} deleted`); return { ok: true, id, count: state.stops.length };
  }
  function animateThenDelete(id) {
    const row = $(`.stop-row[data-id="${CSS.escape(id)}"]`);
    if (row && !prefersReducedMotion()) { row.classList.add("row-exit"); setTimeout(() => deleteStop(id), 210); } else deleteStop(id);
  }
  function animateThenBulkDelete() {
    const ids = [...state.selectedBulk]; if (!ids.length) return;
    if (prefersReducedMotion()) { performBulkDelete(ids); return; }
    ids.forEach((id) => $(`.stop-row[data-id="${CSS.escape(id)}"]`)?.classList.add("row-exit"));
    setTimeout(() => performBulkDelete(ids), 210);
  }
  function performBulkDelete(ids) {
    if (!guard("delete")) return; const set = new Set(ids); checkpoint();
    const removed = state.stops.filter((item) => set.has(item.id)).length;
    const days = new Set(state.stops.filter((item) => set.has(item.id)).map((item) => item.day));
    state.stops = state.stops.filter((item) => !set.has(item.id)); state.selectedBulk.clear();
    if (state.selectedId && set.has(state.selectedId)) state.selectedId = null;
    days.forEach(renumberDay);
    state.bulkConfirm = false; structuralChange("You", `deleted ${removed} selected stops`); announce(`${removed} stops deleted`);
  }
  function reorderStop(id, targetDay, targetIndex = 0) {
    if (!guard()) return { ok: false, error: "Viewers cannot edit the plan" }; if (!DAY_VALUES.includes(targetDay)) return { ok: false, error: "day is outside the closed enum" };
    const index = state.stops.findIndex((item) => item.id === id); if (index < 0) return { ok: false, error: `No activity with id ${id}` }; checkpoint(); const [item] = state.stops.splice(index, 1); const oldDay = item.day; item.day = targetDay;
    const peers = sorted(state.stops.filter((candidate) => candidate.day === targetDay));
    const clamped = Math.max(0, Math.min(Number(targetIndex) || 0, peers.length));
    item.dayOrder = clamped; peers.forEach((peer, i) => { peer.dayOrder = i >= clamped ? i + 1 : i; });
    state.stops.push(item); if (oldDay !== targetDay) renumberDay(oldDay); renumberDay(targetDay);
    state.lastAddedId = id; structuralChange("You", `moved ${item.title} from ${dayOf(oldDay)?.short || "Ideas"} to ${dayOf(targetDay)?.short || "Ideas"}`); return { ok: true, id, day: targetDay };
  }

  function tripDocument() { return { schemaVersion: "1", trip: { title: els.tripTitle.textContent.trim(), dateStart: "2025-07-05", dateEnd: "2025-07-11" }, stops: state.stops.map(stopPayload) }; }
  function compileMarkdown() {
    const lines = [`# ${els.tripTitle.textContent.trim()}`, "", "July 5–11, 2025 · Côte d'Azur", ""];
    DAYS.forEach((day) => { lines.push(`## ${day.label} — ${day.place}`); const items = sorted(state.stops.filter((item) => item.day === day.date)); if (!items.length) lines.push("- No stops planned"); items.forEach((item) => { lines.push(`- ${item.startTime || "All day"}${item.endTime ? `–${item.endTime}` : ""} — **${item.title}** · ${item.location} · ${fmtStatus(item.status)}`); if (item.notes) lines.push(`  - Notes: ${item.notes}`); }); lines.push(""); });
    const ideas = state.stops.filter((item) => item.day === "unscheduled"); if (ideas.length) { lines.push("## Unscheduled ideas"); ideas.forEach((item) => { lines.push(`- **${item.title}** · ${item.location}`); if (item.notes) lines.push(`  - Notes: ${item.notes}`); }); }
    return lines.join("\n");
  }
  function icsEscape(value) { return String(value).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n"); }
  function nextDate(date) { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ""); }
  function compileIcs() {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Travel Planner//French Riviera//EN", "CALSCALE:GREGORIAN"];
    state.stops.filter((item) => item.day !== "unscheduled").forEach((item) => { const date = item.day.replace(/-/g, ""); lines.push("BEGIN:VEVENT", `UID:${item.id}@travel-planner.local`); if (item.startTime) { lines.push(`DTSTART;TZID=Europe/Paris:${date}T${item.startTime.replace(":", "")}00`); if (item.endTime) lines.push(`DTEND;TZID=Europe/Paris:${date}T${item.endTime.replace(":", "")}00`); } else { lines.push(`DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${nextDate(item.day)}`); } lines.push(`SUMMARY:${icsEscape(item.title)}`, `LOCATION:${icsEscape(item.location)}`, `DESCRIPTION:${icsEscape(item.notes)}`, "END:VEVENT"); });
    lines.push("END:VCALENDAR"); return lines.join("\r\n");
  }
  function exportText(format = state.exportFormat) { if (format === "ics") return compileIcs(); if (format === "trip-json") return JSON.stringify(tripDocument(), null, 2); return compileMarkdown(); }
  function renderExport() {
    const isImport = state.exportFormat === "import"; els.exportPreviewSection.classList.toggle("hidden", isImport); els.importSection.classList.toggle("hidden", !isImport);
    $$("[data-export]", els.exportDialog).forEach((button) => button.setAttribute("aria-selected", String(button.dataset.export === state.exportFormat)));
    if (!isImport) { els.exportPreview.textContent = exportText(); const label = state.exportFormat === "trip-json" ? "trip JSON" : state.exportFormat; els.copyFormat.textContent = label; els.downloadFormat.textContent = label; }
  }
  function openExport(format = "markdown") { state.exportFormat = format; renderExport(); if (!els.exportDialog.open) { state.exportTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : els.openExport; els.exportDialog.showModal(); } if (!state.firstExportTip) { state.firstExportTip = true; setTimeout(() => showToast("Tip: Copy trip JSON now to round-trip it later via Import."), 2700); } return { ok: true, format, scheduled_events: state.stops.filter((item) => item.day !== "unscheduled").length, stops: state.stops.length }; }
  function downloadExport() { const text = exportText(); const ext = state.exportFormat === "trip-json" ? "json" : state.exportFormat === "ics" ? "ics" : "md"; const blob = new Blob([text], { type: state.exportFormat === "trip-json" ? "application/json" : "text/plain" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `french-riviera-trip.${ext}`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); showToast(`Downloaded ${ext.toUpperCase()} from the live plan`); }
  async function copyExport() { try { await navigator.clipboard.writeText(exportText()); showToast(`Copied exact ${state.exportFormat === "trip-json" ? "trip JSON" : state.exportFormat} preview`); } catch { showToast("Clipboard permission was unavailable — preview remains selected"); els.exportPreview.focus(); } }
  function importDocumentText(text) { let parsed; try { parsed = JSON.parse(text); } catch (error) { return { ok: false, error: `Import must be valid JSON: ${error.message}` }; } try { const valid = validateTripDocument(parsed); checkpoint(); state.stops = valid.stops; seedDayOrders(); els.tripTitle.textContent = valid.title; state.selectedId = state.stops[0]?.id || null; state.selectedDay = "all"; structuralChange("You", `imported ${state.stops.length} stops from trip JSON`); return { ok: true, stops: state.stops.length }; } catch (error) { return { ok: false, error: error.message }; } }

  function openStopDialog(item = null) {
    if (!guard()) return; state.editingId = item?.id || null; els.stopDialogTitle.textContent = item ? "Edit stop" : "Add stop"; const form = els.stopForm; form.reset();
    const values = item || { title: "", day: state.selectedDay === "all" ? DAYS[0].date : state.selectedDay, location: "", startTime: "", endTime: "", category: "activity", costTier: "2", status: "to-visit", tags: [], notes: "", lat: 43.7102, lng: 7.262 };
    ["title", "day", "location", "startTime", "endTime", "category", "costTier", "status", "notes", "lat", "lng"].forEach((key) => { form.elements[key].value = values[key] ?? ""; }); form.elements.tags.value = (values.tags || []).join(", "); form.elements.repeat.closest("label").classList.toggle("hidden", Boolean(item)); clearFormErrors(); validateVisibleForm(); els.stopDialog.showModal(); setTimeout(() => form.elements.title.focus(), 10);
  }
  function formRaw() { return Object.fromEntries(new FormData(els.stopForm).entries()); }
  function clearFormErrors() { $$(".field-error", els.stopForm).forEach((el) => el.textContent = ""); els.formErrors.textContent = ""; }
  function validateVisibleForm() { const result = validateStop(formRaw()); $$(".field-error", els.stopForm).forEach((el) => el.textContent = result.errors[el.dataset.error] || ""); const messages = Object.values(result.errors); const valid = messages.length === 0; els.formErrors.textContent = valid ? "" : `Please fix: ${messages.join(". ")}.`; els.stopSubmit.disabled = !valid || state.submitting; return { ...result, valid }; }
  function closeDrawer() { $$(".drawer").forEach((drawer) => drawer.classList.add("hidden")); els.scrim.classList.add("hidden"); }
  function openDrawer(drawer) { closeDrawer(); drawer.classList.remove("hidden"); els.scrim.classList.remove("hidden"); drawer.querySelector("button")?.focus(); }
  function applyFilters(fields = {}) { Object.keys(state.filters).forEach((key) => { if (Object.prototype.hasOwnProperty.call(fields, key)) state.filters[key] = String(fields[key] ?? ""); }); els.search.value = state.filters.search; els.filterCategory.value = state.filters.category; els.filterCost.value = state.filters.costTier; els.filterStatus.value = state.filters.status; if (els.filterTag) els.filterTag.value = state.filters.tag; renderAll(); return visibleStops().length; }

  function bindEvents() {
    document.addEventListener("click", (event) => { const toastButton = event.target.closest("[data-toast]"); if (toastButton) { event.preventDefault(); showToast(toastButton.dataset.toast); } });
    els.themeToggle.addEventListener("click", () => { state.theme = state.theme === "light" ? "dark" : "light"; document.documentElement.dataset.theme = state.theme; els.themeToggle.textContent = state.theme === "light" ? "☾" : "☀"; els.themeToggle.setAttribute("aria-label", `Switch to ${state.theme === "light" ? "dark" : "light"} theme`); showToast(`${state.theme[0].toUpperCase() + state.theme.slice(1)} theme enabled`); });
    els.roleSelect.addEventListener("change", () => { state.role = els.roleSelect.value; renderAll(); showToast(state.role === "Viewer" ? "Viewer mode — mutating controls are disabled" : `${state.role} permissions active`); });
    els.listMode.addEventListener("click", () => setMode("list")); els.mapMode.addEventListener("click", () => setMode("map")); els.kanbanMode.addEventListener("click", () => setMode("kanban"));
    els.addStop.addEventListener("click", () => openStopDialog()); els.planList.addEventListener("click", handleListClick); els.planList.addEventListener("change", handleListChange);
    els.planList.addEventListener("mouseover", (event) => {
      const row = event.target.closest(".stop-row"); if (!row) return;
      $(`.pin[data-id="${CSS.escape(row.dataset.id)}"]`)?.classList.add("hovered");
      $$(".route-line", els.routes).forEach((line) => line.classList.toggle("emphasized", line.dataset.from === row.dataset.id || line.dataset.to === row.dataset.id));
    });
    els.planList.addEventListener("mouseout", (event) => {
      const row = event.target.closest(".stop-row"); if (!row) return;
      $(`.pin[data-id="${CSS.escape(row.dataset.id)}"]`)?.classList.remove("hovered");
      $$(".route-line", els.routes).forEach((line) => line.classList.remove("emphasized"));
    });
    els.planList.addEventListener("dragstart", (event) => { const row = event.target.closest(".stop-row"); if (!row || !guard()) return event.preventDefault(); state.dragId = row.dataset.id; row.classList.add("dragging"); event.dataTransfer.effectAllowed = "move"; });
    els.planList.addEventListener("dragend", (event) => { const row = event.target.closest(".stop-row"); if (row) row.classList.remove("dragging"); });
    els.planList.addEventListener("dragover", (event) => { if (event.target.closest(".day-section")) event.preventDefault(); });
    els.planList.addEventListener("drop", (event) => {
      const section = event.target.closest(".day-section"); if (!section || !state.dragId) return;
      event.preventDefault();
      const targetRow = event.target.closest(".stop-row");
      const peers = sorted(state.stops.filter((item) => item.day === section.dataset.day && item.id !== state.dragId));
      let targetIndex = peers.length;
      if (targetRow && targetRow.dataset.id !== state.dragId) {
        const idx = peers.findIndex((item) => item.id === targetRow.dataset.id);
        if (idx >= 0) targetIndex = idx;
      }
      reorderStop(state.dragId, section.dataset.day, targetIndex); state.dragId = null;
    });
    $$("[data-day]").forEach((button) => button.addEventListener("click", () => chooseDay(button.dataset.day))); els.dayNav.addEventListener("click", (event) => { const button = event.target.closest("[data-day]"); if (button) chooseDay(button.dataset.day); });
    els.search.addEventListener("input", () => applyFilters({ search: els.search.value })); els.filterCategory.addEventListener("change", () => applyFilters({ category: els.filterCategory.value })); els.filterCost.addEventListener("change", () => applyFilters({ costTier: els.filterCost.value })); els.filterStatus.addEventListener("change", () => applyFilters({ status: els.filterStatus.value })); if (els.filterTag) els.filterTag.addEventListener("change", () => applyFilters({ tag: els.filterTag.value })); els.clearFilters.addEventListener("click", clearFilters);
    els.timezone.addEventListener("change", () => { state.timezone = els.timezone.value; renderAll(); showToast(`Times now shown in ${state.timezone}`); });
    els.bulkClear.addEventListener("click", () => { state.selectedBulk.clear(); renderAll(); }); els.bulkTag.addEventListener("click", () => { if (!guard()) return; checkpoint(); state.stops.forEach((item) => { if (state.selectedBulk.has(item.id) && !item.tags.includes("favorite")) item.tags.push("favorite"); }); structuralChange("You", `tagged ${state.selectedBulk.size} stops as favorite`); });
    els.bulkDay.addEventListener("change", () => {
      const targetDay = els.bulkDay.value;
      if (!guard() || !targetDay) return;
      const moved = sorted(state.stops.filter((item) => state.selectedBulk.has(item.id)));
      if (!moved.length) return;
      checkpoint();
      const affectedDays = new Set(moved.map((item) => item.day));
      const destinationCount = state.stops.filter((item) => item.day === targetDay && !state.selectedBulk.has(item.id)).length;
      moved.forEach((item, index) => { item.day = targetDay; item.dayOrder = destinationCount + index; });
      affectedDays.add(targetDay);
      affectedDays.forEach(renumberDay);
      structuralChange("You", `moved ${moved.length} stops to ${dayOf(targetDay)?.short || "Ideas"}`);
    });
    els.bulkDelete.addEventListener("click", () => {
      if (!guard("delete")) return;
      if (!state.bulkConfirm) { state.bulkConfirm = true; els.bulkDelete.classList.add("confirming"); els.bulkDelete.textContent = `Confirm delete ${state.selectedBulk.size}?`; showToast(`Press “Confirm delete” again to remove ${state.selectedBulk.size} stops`); return; }
      els.bulkDelete.classList.remove("confirming"); animateThenBulkDelete();
    });
    els.undo.addEventListener("click", () => { if (!state.history.length) return; state.future.push(snapshot()); state.stops = state.history.pop(); state.selectedId = state.stops.some((item) => item.id === state.selectedId) ? state.selectedId : state.stops[0]?.id || null; state.lastAddedId = state.selectedId; log("You", "undid the previous structural change"); renderAll(); });
    els.redo.addEventListener("click", () => { if (!state.future.length) return; state.history.push(snapshot()); state.stops = state.future.pop(); state.selectedId = state.stops.some((item) => item.id === state.selectedId) ? state.selectedId : state.stops[0]?.id || null; state.lastAddedId = state.selectedId; log("You", "redid the structural change"); renderAll(); });
    els.ideasOpen.addEventListener("click", () => openDrawer(els.ideasDrawer)); els.activityOpen.addEventListener("click", () => openDrawer(els.activityDrawer)); $$(".drawer-close").forEach((button) => button.addEventListener("click", closeDrawer)); els.scrim.addEventListener("click", closeDrawer);
    els.ideasList.addEventListener("click", (event) => {
      const button = event.target.closest(".vote-btn"); if (!button || !guard()) return;
      const card = button.closest(".idea-card"); const id = card.dataset.id;
      if (!id || state.voteBusy === id || (state.votes[id] || 0) >= 3) return;
      startVoteSimulation(id);
    });
    els.detailClose.addEventListener("click", () => { state.selectedId = null; state.isochroneOn = false; renderAll(); restoreStopFocus(); }); $$("[data-detail-tab]").forEach((button) => button.addEventListener("click", () => { state.detailTab = button.dataset.detailTab; renderDetail(); }));
    els.editSelected.addEventListener("click", () => { const item = selectedStop(); if (item) openStopDialog(item); }); els.deleteSelected.addEventListener("click", () => { const item = selectedStop(); if (item) animateThenDelete(item.id); });
    els.isochrone.addEventListener("click", () => {
      const item = selectedStop(); if (!isNegresco(item)) return;
      state.isochroneOn = !state.isochroneOn;
      positionIsochrone(item);
      els.isochroneRing.classList.toggle("hidden", !state.isochroneOn);
      els.isochrone.textContent = state.isochroneOn ? "Hide 1.25 km isochrone" : "Show 1.25 km isochrone";
      showToast(state.isochroneOn ? "1.25 km isochrone drawn around Hotel Le Negresco" : "Isochrone overlay removed");
    });
    els.conflictOpen.addEventListener("click", () => { if (!guard()) return; const item = selectedStop(); if (!item) return; if (!state.lastStopFocus) state.lastStopFocus = { id: item.id, surface: "row" }; els.conflictCurrent.textContent = item.title; els.conflictIncoming.textContent = `${item.title} — sea entrance`; els.conflictDialog.showModal(); setTimeout(() => $$(".conflict-choice", els.conflictDialog)[0]?.focus(), 10); }); $$(".conflict-close").forEach((button) => button.addEventListener("click", () => { els.conflictDialog.close(); restoreStopFocus(); })); $$(".conflict-choice").forEach((button) => button.addEventListener("click", () => resolveConflict(button.dataset.choice)));
    els.conflictDialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || !els.conflictDialog.open) return;
      const focusable = $$("button", els.conflictDialog).filter((node) => !node.disabled);
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    els.stopForm.addEventListener("input", validateVisibleForm); els.stopForm.addEventListener("change", validateVisibleForm); $$(".modal-close").forEach((button) => button.addEventListener("click", () => els.stopDialog.close())); els.stopForm.addEventListener("submit", submitForm);
    els.openExport.addEventListener("click", () => openExport("markdown")); $$("[data-export]").forEach((button) => button.addEventListener("click", () => { state.exportFormat = button.dataset.export; renderExport(); })); $$(".export-close").forEach((button) => button.addEventListener("click", () => els.exportDialog.close())); els.exportDialog.addEventListener("close", () => requestAnimationFrame(() => state.exportTrigger?.focus?.())); els.copyExport.addEventListener("click", copyExport); els.downloadExport.addEventListener("click", downloadExport); els.printPreview.addEventListener("click", () => window.print());
    els.importFile.addEventListener("change", async () => { const file = els.importFile.files[0]; if (file) els.importText.value = await file.text(); }); els.importSubmit.addEventListener("click", () => { const before = state.stops.length; const result = importDocumentText(els.importText.value); if (!result.ok) { els.importError.textContent = result.error; showToast(result.error); } else { els.importError.textContent = ""; showToast(`Imported ${result.stops} stops; replaced previous ${before}`); } });
    els.mapLayer.addEventListener("change", () => { els.mapPane.classList.remove("terrain", "night"); if (els.mapLayer.value !== "coastal") els.mapPane.classList.add(els.mapLayer.value); showToast(`${els.mapLayer.options[els.mapLayer.selectedIndex].text} map layer enabled`); }); els.zoomOut.addEventListener("click", () => { state.zoomedOut = true; renderMap(); }); els.zoomIn.addEventListener("click", () => { state.zoomedOut = false; renderMap(); });
    els.kanban.addEventListener("dragstart", (event) => { const card = event.target.closest(".kanban-card"); if (!card || !guard()) return event.preventDefault(); state.dragId = card.dataset.id; }); els.kanban.addEventListener("dragover", (event) => { if (event.target.closest(".kanban-col")) event.preventDefault(); }); els.kanban.addEventListener("drop", (event) => { const col = event.target.closest(".kanban-col"); if (!col || !state.dragId) return; event.preventDefault(); updateStop(state.dragId, { status: col.dataset.status }); state.dragId = null; });
    els.mobileMenu.addEventListener("click", () => els.sidebar.classList.add("open")); els.closeSidebar.addEventListener("click", () => els.sidebar.classList.remove("open")); els.hideSidebar.addEventListener("click", hideSidebar); els.sidebarReopen.addEventListener("click", showSidebar);
    if (els.peerLatency) els.peerLatency.addEventListener("change", () => { state.peerLatency = Number(els.peerLatency.value) || 320; showToast(`Simulated peer latency set to ${els.peerLatency.options[els.peerLatency.selectedIndex].text}`); });
    if (els.accentSelect) els.accentSelect.addEventListener("change", () => { state.accent = els.accentSelect.value; document.documentElement.dataset.accent = state.accent; showToast(`${state.accent[0].toUpperCase() + state.accent.slice(1)} coastal accent applied`); });
    if (els.simError) els.simError.addEventListener("click", () => { log("System", "simulated a peer sync failure for the demo"); showToast("Simulated sync failure — a peer edit could not be applied. No changes were lost.", { type: "error", action: { label: "Dismiss", onClick: () => announce("Sync failure notice dismissed") } }); });
    bindCoachmark();
  }
  function setMode(mode) { state.mode = mode; els.planList.classList.toggle("hidden", mode !== "list"); els.kanban.classList.toggle("hidden", mode !== "kanban"); els.mapPane.classList.toggle("map-focus", mode === "map"); [els.listMode, els.mapMode, els.kanbanMode].forEach((button) => button.classList.remove("active")); ({ list: els.listMode, map: els.mapMode, kanban: els.kanbanMode })[mode].classList.add("active"); if (mode === "map" && innerWidth < 1024) els.mapPane.scrollIntoView({ behavior: "smooth" }); renderAll(); }
  function chooseDay(day) { state.selectedDay = day; renderAll(); const first = visibleStops().find((item) => item.day !== "unscheduled"); if (day !== "all" && first) state.selectedId = first.id; renderAll(); if (day === "all") fitDay(null); else fitDay(day); showToast(day === "all" ? "Overview restored — full-plan extent" : `${dayOf(day).short} focused on ${dayOf(day).place}`); }
  function clearFilters() { state.selectedDay = "all"; applyFilters({ category: "", costTier: "", status: "", tag: "", search: "" }); fitDay(null); showToast("All filters cleared"); }
  function handleListClick(event) {
    const row = event.target.closest(".stop-row"); const section = event.target.closest(".day-section");
    if (event.target.closest(".empty-add")) return openStopDialog(); if (event.target.closest(".collapse-day")) { const date = section.dataset.day; state.collapsed.has(date) ? state.collapsed.delete(date) : state.collapsed.add(date); renderList(); return; } if (event.target.closest(".focus-day")) return chooseDay(section.dataset.day); if (!row) return;
    const id = row.dataset.id; rememberStopFocus(id); if (event.target.closest(".edit-row")) return openStopDialog(state.stops.find((item) => item.id === id)); if (event.target.closest(".delete-row")) return animateThenDelete(id); if (event.target.closest(".move-up")) { const item = state.stops.find((candidate) => candidate.id === id); const peers = sorted(state.stops.filter((candidate) => candidate.day === item.day)); return reorderStop(id, item.day, Math.max(0, peers.findIndex((candidate) => candidate.id === id) - 1)); } if (event.target.closest(".move-day")) { const item = state.stops.find((candidate) => candidate.id === id); const current = DAY_VALUES.indexOf(item.day); return reorderStop(id, DAY_VALUES[(current + 1) % DAY_VALUES.length], 99); } if (!event.target.closest(".select-stop")) selectStop(id);
  }
  function handleListChange(event) { const row = event.target.closest(".stop-row"); if (event.target.matches(".select-stop") && row) { event.target.checked ? state.selectedBulk.add(row.dataset.id) : state.selectedBulk.delete(row.dataset.id); cancelBulkConfirm(); renderBulk(); } if (event.target.matches(".buffer-mode")) { const card = event.target.closest(".travel-card"); const item = state.stops.find((candidate) => candidate.id === card.dataset.after); if (item && guard()) { item.bufferMode = event.target.value; renderList(); } } }
  function submitForm(event) { event.preventDefault(); if (state.submitting) return; const result = validateVisibleForm(); if (!result.valid) { els.formErrors.textContent = "Fix the named fields before saving."; return; } state.submitting = true; els.stopSubmit.disabled = true; const repeat = els.stopForm.elements.repeat.checked; const outcome = state.editingId ? updateStop(state.editingId, result.value) : createStop(result.value, { repeat }); state.submitting = false; if (outcome.ok) { els.stopDialog.close(); showToast(state.editingId ? "Stop updated across list, map, and exports" : repeat ? "Exactly 7 daily blocks created" : "Stop added across list, map, and exports"); } else { els.formErrors.textContent = outcome.error; validateVisibleForm(); } }
  function startVoteSimulation(id) {
    const item = state.stops.find((candidate) => candidate.id === id);
    if (!item || item.day !== "unscheduled" || state.voteBusy) return;
    state.voteBusy = id;
    const reduced = prefersReducedMotion();
    const stepMs = reduced ? 40 : Math.max(40, Number(state.peerLatency) || 320);
    if (!reduced && stepMs >= 500) showToast(`Simulating peers at ${stepMs} ms latency — UI stays responsive`, { duration: stepMs });
    const paintVotes = (count) => {
      state.votes[id] = count;
      renderIdeas();
      announce(`${item.title}: ${count} of 4 votes`);
      showToast(`Simulated votes arriving · ${count}/4`);
    };
    paintVotes(1);
    setTimeout(() => {
      if (state.voteBusy !== id) return;
      paintVotes(2);
      setTimeout(() => {
        if (state.voteBusy !== id) return;
        paintVotes(3);
        setTimeout(() => {
          if (state.voteBusy !== id) return;
          const card = $(`.idea-card[data-id="${CSS.escape(id)}"]`);
          card?.classList.add("promoting");
          const promote = () => {
            checkpoint();
            item.day = "2025-07-09";
            item.category = "activity";
            item.startTime = item.startTime || "15:00";
            item.endTime = item.endTime || "16:30";
            renumberDay("unscheduled");
            renumberDay("2025-07-09");
            state.selectedId = id;
            state.selectedDay = "all";
            state.voteBusy = null;
            state.lastAddedId = id;
            structuralChange("Sarah, John, and you", `promoted ${item.title} to Thu 7/9`);
            announce(`${item.title} reached 3 of 4 votes and moved to Thursday`);
            showToast("Winning idea promoted to Day 5");
            if (!state.firstPromoteTip) { state.firstPromoteTip = true; setTimeout(() => showToast("Tip: a promoted idea lands on Thu 7/9 — drag it to another day if you prefer."), 2700); }
          };
          if (reduced) promote(); else setTimeout(promote, 220);
        }, stepMs);
      }, stepMs);
    }, stepMs);
  }
  function resolveConflict(choice) { const item = selectedStop(); if (!item || !guard()) return; checkpoint(); if (choice === "theirs") item.title = `${item.title} — sea entrance`; if (choice === "merge") item.notes = `${item.notes}${item.notes ? " " : ""}Meet by the sea entrance.`; structuralChange("You", `${choice === "merge" ? "merged John's edit into" : choice === "theirs" ? "accepted John's version of" : "kept your version of"} ${item.title}`); els.conflictDialog.close(); restoreStopFocus(); showToast(`Conflict resolved: ${choice === "mine" ? "Keep mine" : choice === "theirs" ? "Take theirs" : "Merge"}`); }
  function hideSidebar() { if (innerWidth <= 768) return els.sidebar.classList.remove("open"); document.querySelector(".app-shell").classList.add("sidebar-collapsed"); els.sidebar.classList.add("hidden"); els.sidebarReopen.classList.remove("hidden"); showToast("Sidebar hidden; current day preserved"); }
  function showSidebar() { document.querySelector(".app-shell").classList.remove("sidebar-collapsed"); els.sidebar.classList.remove("hidden"); els.sidebarReopen.classList.add("hidden"); }
  function bindCoachmark() { const steps = [
    { title: "Build your day-by-day plan", copy: "Your itinerary stays in sync with the map and exports.", className: "step-plan" },
    { title: "Explore the map pane", copy: "Select numbered pins, switch layers, and focus one day at a time.", className: "step-map" },
    { title: "Collect ideas together", copy: "Open the ideas bucket and vote to promote a stop into the timeline.", className: "step-ideas" },
  ]; let index = 0; const paint = () => { els.coachStep.textContent = `${index + 1} OF ${steps.length}`; els.coachTitle.textContent = steps[index].title; els.coachCopy.textContent = steps[index].copy; els.coachNext.textContent = index === steps.length - 1 ? "Start planning" : "Next"; els.coachmark.animate([{ opacity: .35, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 180 }); }; const close = () => els.coachmark.classList.add("hidden"); els.coachSkip.addEventListener("click", close); els.coachNext.addEventListener("click", () => { if (index === steps.length - 1) return close(); index++; paint(); }); paint(); }

  function registerWebMcp() {
    const destinations = ["overview", "day-detail", "activity-form", "export-canvas"];
    const filters = ["day", "category", "cost-tier", "status", "search"];
    const themes = ["light", "dark"];
    const entityFields = ["title", "day", "location", "startTime", "endTime", "category", "costTier", "status", "tags", "notes", "lat", "lng"];
    const exportFormats = ["ics", "trip-json", "markdown"];
    const objectSchema = (properties = {}, required = []) => ({
      type: "object", additionalProperties: false, ...(required.length ? { required } : {}), properties,
    });
    const fieldsSchema = { type: "object", additionalProperties: { type: "string", maxLength: 200 } };
    const validateInput = (schema, input) => {
      if (!input || typeof input !== "object" || Array.isArray(input)) return "arguments must be an object";
      const properties = schema.properties || {};
      const unknown = Object.keys(input).find((key) => !(key in properties));
      if (unknown) return `unknown argument: ${unknown}`;
      const missing = (schema.required || []).find((key) => input[key] === undefined);
      if (missing) return `missing required argument: ${missing}`;
      for (const [key, rule] of Object.entries(properties)) {
        const value = input[key];
        if (value === undefined) continue;
        if (rule.type === "string" && typeof value !== "string") return `${key} must be a string`;
        if (rule.type === "boolean" && typeof value !== "boolean") return `${key} must be a boolean`;
        if (rule.type === "integer" && (!Number.isInteger(value) || value < (rule.minimum || 0))) return `${key} must be a non-negative integer`;
        if (rule.type === "object" && (!value || typeof value !== "object" || Array.isArray(value))) return `${key} must be an object`;
        if (rule.maxLength && value.length > rule.maxLength) return `${key} is too long`;
        if (rule.enum && !rule.enum.includes(value)) return `${key} is outside the declared enum`;
        if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${rule.const}`;
        if (rule.type === "object") {
          const invalidField = Object.keys(value).find((field) => !entityFields.includes(field));
          if (invalidField) return `Unknown field: ${invalidField}`;
          const invalidValue = Object.entries(value).find(([, fieldValue]) => typeof fieldValue !== "string" || fieldValue.length > 200);
          if (invalidValue) return `${key}.${invalidValue[0]} must be a string of at most 200 characters`;
        }
      }
      return "";
    };
    const handlers = {
      "browse.open": ({ destination }) => { if (destination === "overview") chooseDay("all"); if (destination === "day-detail") chooseDay(DAY_VALUES.includes(state.selectedDay) ? state.selectedDay : DAYS[0].date); if (destination === "activity-form") openStopDialog(); if (destination === "export-canvas") openExport("markdown"); return { ok: true, destination }; },
      "browse.search": ({ query }) => ({ ok: true, query, visible: applyFilters({ search: query }) }),
      "browse.apply_filter": ({ filter, value = "" }) => {
        const allowedValues = { day: ["", "all", ...DAY_VALUES], category: ["", ...CATEGORIES], "cost-tier": ["", ...COSTS], status: ["", ...STATUSES] };
        if (allowedValues[filter] && !allowedValues[filter].includes(value)) return { ok: false, error: `${filter} value is outside the declared bounds` };
        const map = { category: "category", "cost-tier": "costTier", status: "status", search: "search" };
        if (filter === "day") chooseDay(value || "all"); else applyFilters({ [map[filter]]: value });
        return { ok: true, filter, value, visible: visibleStops().length };
      },
      "browse.clear_filter": ({ filter }) => {
        if (!filter) clearFilters();
        else if (filter === "day") chooseDay("all");
        else { const map = { category: "category", "cost-tier": "costTier", status: "status", search: "search" }; applyFilters({ [map[filter]]: "" }); }
        return { ok: true, filter: filter || "all", visible: visibleStops().length };
      },
      "browse.set_theme": ({ theme }) => { state.theme = theme; document.documentElement.dataset.theme = theme; els.themeToggle.textContent = theme === "light" ? "☾" : "☀"; els.themeToggle.setAttribute("aria-label", `Switch to ${theme === "light" ? "dark" : "light"} theme`); renderAll(); return { ok: true, theme }; },
      "entity.create": ({ fields = {} }) => createStop(fields),
      "entity.select": ({ id }) => ({ ok: selectStop(id), id }),
      "entity.update": ({ id, fields }) => updateStop(id, fields),
      "entity.delete": ({ id }) => deleteStop(id),
      "entity.toggle": ({ id }) => { if (!state.stops.some((item) => item.id === id)) return { ok: false, error: `No activity with id ${id}` }; const selected = state.selectedBulk.has(id); selected ? state.selectedBulk.delete(id) : state.selectedBulk.add(id); renderBulk(); return { ok: true, id, selected: !selected }; },
      "entity.reorder": ({ id, to_index: toIndex }) => { const item = state.stops.find((candidate) => candidate.id === id); return item ? reorderStop(id, item.day, toIndex) : { ok: false, error: `No activity with id ${id}` }; },
      "form.validate": ({ fields = {} }) => { const result = validateStop(fields); return { ok: !Object.keys(result.errors).length, errors: result.errors }; },
      "form.submit": ({ fields = {} }) => createStop(fields),
      "form.cancel": () => { if (els.stopDialog.open) els.stopDialog.close(); return { ok: true, cancelled: true }; },
      "artifact.export": ({ format }) => openExport(format),
      "artifact.import": () => { openExport("import"); return { ok: true, mode: "trip-json", awaiting_visible_input: true }; },
      "artifact.copy": async () => { if (!els.exportDialog.open || state.exportFormat === "import") openExport("trip-json"); await copyExport(); return { ok: true, copy_triggered: true }; },
      "artifact.print_preview": () => { if (!els.exportDialog.open || state.exportFormat === "import") openExport("markdown"); els.printPreview.click(); return { ok: true, print_preview: true }; },
    };
    const specs = {
      "browse.open": ["Open a declared destination (route, tab, section, or item).", objectSchema({ destination: { type: "string", enum: destinations, description: "Declared destination" } }, ["destination"])],
      "browse.search": ["Search within the browsable surface.", objectSchema({ query: { type: "string", maxLength: 200 } }, ["query"])],
      "browse.apply_filter": ["Apply a declared filter.", objectSchema({ filter: { type: "string", enum: filters }, value: { type: "string", maxLength: 200 } }, ["filter"])],
      "browse.clear_filter": ["Clear one or all declared filters.", objectSchema({ filter: { type: "string", enum: filters } })],
      "browse.set_theme": ["Switch to a declared theme.", objectSchema({ theme: { type: "string", enum: themes } }, ["theme"])],
      "entity.create": ["Create an entity using declared fields.", objectSchema({ fields: fieldsSchema })],
      "entity.select": ["Select an entity by public id.", objectSchema({ id: { type: "string", maxLength: 128 } }, ["id"])],
      "entity.update": ["Update declared fields on an entity.", objectSchema({ id: { type: "string", maxLength: 128 }, fields: fieldsSchema }, ["id", "fields"])],
      "entity.delete": ["Delete an entity with explicit confirmation.", objectSchema({ id: { type: "string", maxLength: 128 }, confirm: { type: "boolean", const: true } }, ["id", "confirm"])],
      "entity.toggle": ["Toggle a boolean field on an entity.", objectSchema({ id: { type: "string", maxLength: 128 }, field: { type: "string", enum: entityFields } }, ["id"])],
      "entity.reorder": ["Reorder an entity by index when gesture mechanics are excluded.", objectSchema({ id: { type: "string", maxLength: 128 }, to_index: { type: "integer", minimum: 0 } }, ["id", "to_index"])],
      "form.validate": ["Run declared form validation.", objectSchema({ fields: fieldsSchema })],
      "form.submit": ["Submit the form through the visible handler.", objectSchema({ fields: fieldsSchema })],
      "form.cancel": ["Cancel the active form workflow.", objectSchema({})],
      "artifact.export": ["Export using a declared format (no blob/base64 in results).", objectSchema({ format: { type: "string", enum: exportFormats } }, ["format"])],
      "artifact.import": ["Start a declared import mode (no file bytes in WebMCP).", objectSchema({ mode: { type: "string", enum: ["trip-json"] } }, ["mode"])],
      "artifact.copy": ["Trigger copy via the visible control (clipboard verified in Playwright).", objectSchema({})],
      "artifact.print_preview": ["Open print preview through the product handler.", objectSchema({})],
    };
    const tools = Object.entries(specs).map(([name, [description, inputSchema]]) => ({ name, description, inputSchema, handler: handlers[name] }));
    window.webmcp_session_info = () => ({ contract_version: "zto-webmcp-v1", modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"], tools: tools.map((tool) => tool.name), tool_count: tools.length });
    window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
    window.webmcp_invoke_tool = async (name, args = {}) => { const tool = tools.find((candidate) => candidate.name === name); if (!tool) return { ok: false, error: `unknown_tool: ${name}` }; const inputError = validateInput(tool.inputSchema, args); if (inputError) return { ok: false, error: inputError }; try { const result = await tool.handler(args); await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); return result; } catch (error) { return { ok: false, error: String(error && error.message ? error.message : error) }; } };
    try { if (navigator.modelContext?.registerTool) tools.forEach((tool) => navigator.modelContext.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, invoke: (args) => tool.handler(args || {}) })); } catch (_) { /* optional browser surface */ }
  }

  function cacheElements() {
    const ids = ["toast", "announcer", "day-nav", "plan-list", "kanban", "map-pins", "routes", "map-empty", "detail-card", "detail-title", "detail-location", "detail-kicker", "detail-panel", "detail-close", "edit-selected", "delete-selected", "conflict-open", "isochrone", "isochrone-ring", "ideas-count", "ideas-list", "activity-list", "role-select", "theme-toggle", "list-mode", "map-mode", "kanban-mode", "add-stop", "search", "filter-category", "filter-cost", "filter-status", "filter-tag", "clear-filters", "timezone", "bulk-bar", "bulk-count", "bulk-tag", "bulk-day", "bulk-delete", "bulk-clear", "undo", "redo", "ideas-open", "activity-open", "ideas-drawer", "activity-drawer", "scrim", "stop-dialog", "stop-form", "stop-dialog-title", "form-errors", "stop-submit", "conflict-dialog", "conflict-current", "conflict-incoming", "export-dialog", "export-preview-section", "import-section", "export-preview", "copy-export", "download-export", "copy-format", "download-format", "print-preview", "import-text", "import-file", "import-error", "import-submit", "open-export", "map-layer", "map-pane", "map-world", "zoom-out", "zoom-in", "mobile-menu", "sidebar", "close-sidebar", "hide-sidebar", "sidebar-reopen", "trip-title", "coachmark", "coach-step", "coach-title", "coach-copy", "coach-skip", "coach-next", "density", "peer-latency", "sim-error", "accent-select"];
    ids.forEach((id) => { els[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = document.getElementById(id); });
  }
  function populateSelects() { const options = DAYS.map((day) => `<option value="${day.date}">${day.short} · ${day.place}</option>`).join("") + '<option value="unscheduled">Unscheduled idea</option>'; els.stopForm.elements.day.innerHTML = options; els.bulkDay.innerHTML = '<option value="">Move to day…</option>' + options; }
  function boot() { cacheElements(); seedDayOrders(); document.documentElement.dataset.accent = state.accent; populateSelects(); bindEvents(); registerWebMcp(); renderAll(); }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
