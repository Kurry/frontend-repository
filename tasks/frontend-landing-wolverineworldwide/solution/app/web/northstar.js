(function () {
  "use strict";

  const BRANDS = ["Trailmark", "Cadence", "Forgeworks", "Alder & Ash", "Ironcat", "Solstice", "Hearthstep", "First Mile", "Highline", "Wildhorse", "Foundry"];
  const TITLES = [
    "Northstar Earns People-First Workplace Certification",
    "Trailmark Celebrates 45 Years Outside",
    "Cadence Velocity Pro Wins Best Racing Shoe",
    "Northstar Studio Receives Four Creative Honors",
    "Cadence Brings the Daily Runner Back",
    "Trailmark Launches a Flow-Focused Trail Shoe",
    "Forgeworks Steps Onto the Small Screen",
    "Northstar Named Company of the Year"
  ];
  const DEFAULT_CONSENT = { necessary: true, analytics: false, marketing: false, functional: false };
  const state = {
    pinnedTitles: [], consent: { ...DEFAULT_CONSENT }, consentSet: false, bannerVisible: true,
    activeFormat: "json", generatedAt: new Date().toISOString(), undo: [], redo: [], carouselIndex: 0,
    filter: "all", sort: "original"
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let lastFocus = null;
  let copyTimer = 0;
  let refreshCarousel = () => {};

  function snapshot() {
    return { pinnedTitles: [...state.pinnedTitles], consent: { ...state.consent }, consentSet: state.consentSet, bannerVisible: state.bannerVisible, generatedAt: state.generatedAt };
  }
  function restore(value) {
    state.pinnedTitles = [...value.pinnedTitles];
    state.consent = { ...value.consent };
    state.consentSet = value.consentSet;
    state.bannerVisible = value.bannerVisible;
    state.generatedAt = value.generatedAt;
    renderAll();
  }
  function mutate(label, callback) {
    const before = snapshot();
    callback();
    state.generatedAt = new Date().toISOString();
    state.undo.push({ label, before, after: snapshot() });
    state.redo = [];
    renderAll();
  }
  function undo() {
    const entry = state.undo.pop();
    if (!entry) return false;
    state.redo.push(entry);
    restore(entry.before);
    return true;
  }
  function redo() {
    const entry = state.redo.pop();
    if (!entry) return false;
    state.undo.push(entry);
    restore(entry.after);
    return true;
  }

  function briefingObject() {
    return {
      schemaVersion: 1,
      company: "Northstar Collective, Inc. (NST)",
      quote: { value: 18.16, currency: "USD", daysHigh: 18.6, daysLow: 18.16, daysVolume: 38982, lastUpdated: "2hours ago" },
      brands: [...BRANDS],
      pinnedTitles: [...state.pinnedTitles],
      consent: { ...state.consent },
      generatedAt: state.generatedAt
    };
  }
  function markdownBriefing() {
    const pins = state.pinnedTitles.length ? state.pinnedTitles.map((title) => `- ${title}`).join("\n") : "No stories pinned yet";
    return `# Northstar Collective Investor Briefing\n\n## Market quote\n18.16 USD — Northstar Collective, Inc. (NST)\n\n## Pinned stories\n${pins}\n\n## Portfolio\n${BRANDS.map((brand) => `- ${brand}`).join("\n")}\n\n## Consent\n- Necessary: ${state.consent.necessary}\n- Analytics: ${state.consent.analytics}\n- Marketing: ${state.consent.marketing}\n- Functional: ${state.consent.functional}\n\nGenerated: ${state.generatedAt}`;
  }
  function activeBriefingText() {
    return state.activeFormat === "json" ? JSON.stringify(briefingObject(), null, 2) : markdownBriefing();
  }

  function renderPins(refreshTrack = false) {
    $$(".news-card").forEach((card) => {
      const pinned = state.pinnedTitles.includes(card.dataset.title);
      card.hidden = state.filter === "pinned" && !pinned;
      const button = $(".pin-button", card);
      button.textContent = pinned ? "Unpin" : "Pin to briefing";
      button.setAttribute("aria-pressed", String(pinned));
      card.classList.toggle("pinned", pinned);
    });
    const list = $("#shortlist-items");
    list.replaceChildren();
    if (!state.pinnedTitles.length) {
      const li = document.createElement("li"); li.className = "empty"; li.textContent = "No stories pinned yet"; list.append(li);
    } else {
      state.pinnedTitles.forEach((title) => { const li = document.createElement("li"); li.textContent = title; list.append(li); });
    }
    $("#shortlist-count").textContent = `${state.pinnedTitles.length} of 8`;
    $("#header-count").textContent = state.pinnedTitles.length;
    refreshCarousel(refreshTrack);
  }
  function renderConsent() {
    const layer = $("#cookie-layer");
    const modalOpen = !$("#preferences-modal").hidden;
    const banner = $("#cookie-banner");
    layer.hidden = !state.bannerVisible && !modalOpen;
    banner.hidden = !state.bannerVisible;
    banner.inert = modalOpen;
  }
  function renderBriefing() {
    const preview = $("#briefing-preview");
    preview.textContent = activeBriefingText();
    $("#briefing-panel").classList.toggle("markdown", state.activeFormat === "markdown");
    $("#tab-json").setAttribute("aria-selected", String(state.activeFormat === "json"));
    $("#tab-markdown").setAttribute("aria-selected", String(state.activeFormat === "markdown"));
  }
  function renderHistory() {
    $("#undo").disabled = !state.undo.length;
    $("#redo").disabled = !state.redo.length;
  }
  function renderAll() { renderPins(); renderConsent(); renderBriefing(); renderHistory(); }

  function setPinned(title, shouldPin) {
    if (!TITLES.includes(title)) return { ok: false, error: "Unknown news title" };
    const isPinned = state.pinnedTitles.includes(title);
    if (isPinned === shouldPin) return { ok: true, changed: false, pinned: shouldPin };
    mutate(shouldPin ? "pin" : "unpin", () => {
      state.pinnedTitles = shouldPin ? [...state.pinnedTitles, title] : state.pinnedTitles.filter((item) => item !== title);
    });
    return { ok: true, changed: true, pinned: shouldPin, count: state.pinnedTitles.length };
  }
  function togglePinned(title) { return setPinned(title, !state.pinnedTitles.includes(title)); }

  function validateConsent(value) {
    const errors = {};
    ["necessary", "analytics", "marketing", "functional"].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(value, key) || typeof value[key] !== "boolean") errors[key] = `${key} must be a boolean`;
    });
    if (value.necessary !== true) errors.necessary = "necessary must remain true";
    return { valid: !Object.keys(errors).length, errors };
  }
  function showConsentErrors(errors) {
    $$('[data-error]').forEach((node) => { node.textContent = errors[node.dataset.error] || ""; });
  }
  function applyConsent(payload, label) {
    const result = validateConsent(payload);
    showConsentErrors(result.errors);
    if (!result.valid) return { ok: false, errors: result.errors };
    closePreferences();
    mutate(label, () => { state.consent = { ...payload }; state.consentSet = true; state.bannerVisible = false; });
    return { ok: true, consent: { ...state.consent } };
  }
  function consentDraft() {
    return {
      necessary: $("#consent-necessary").checked,
      analytics: $("#consent-analytics").checked,
      marketing: $("#consent-marketing").checked,
      functional: $("#consent-functional").checked
    };
  }

  function closeOtherLayers(except) {
    if (except !== "menu") closeMobile(false);
    if (except !== "briefing") closeBriefing(false);
    if (except !== "command") closeCommand(false);
    if (except !== "preferences") closePreferences(false);
    closeResponsibility();
  }
  function focusable(container) {
    return $$('a[href],button:not([disabled]),input:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])', container).filter((el) => !el.hidden && el.offsetParent !== null);
  }
  function trapTab(event, container) {
    if (event.key !== "Tab") return;
    const items = focusable(container); if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function updateBodyLock() {
    const locked = [$("#mobile-menu"), $("#briefing-panel"), $("#command-palette"), $("#preferences-modal")].some((el) => !el.hidden);
    document.body.classList.toggle("locked", locked);
  }
  function openMobile() {
    closeOtherLayers("menu"); lastFocus = $("#menu-open");
    if (state.bannerVisible) $("#cookie-layer").hidden = true;
    const menu = $("#mobile-menu"); menu.hidden = false; requestAnimationFrame(() => menu.classList.add("open"));
    $("#menu-open").setAttribute("aria-expanded", "true"); $("#menu-close").focus(); updateBodyLock();
  }
  function closeMobile(returnFocus = true) {
    const menu = $("#mobile-menu"); if (menu.hidden) return;
    menu.classList.remove("open"); menu.hidden = true; $("#menu-open").setAttribute("aria-expanded", "false"); renderConsent(); updateBodyLock();
    if (returnFocus) $("#menu-open").focus();
  }
  function openBriefing() {
    closeOtherLayers("briefing"); lastFocus = document.activeElement;
    if (state.bannerVisible) $("#cookie-layer").hidden = true;
    $("#briefing-panel").hidden = false; renderBriefing(); $("#briefing-close").focus(); updateBodyLock();
  }
  function closeBriefing(returnFocus = true) {
    if ($("#briefing-panel").hidden) return;
    $("#briefing-panel").hidden = true; renderConsent(); updateBodyLock(); if (returnFocus && lastFocus) lastFocus.focus();
  }
  const COMMANDS = [
    { label: "Hero", detail: "Section", run: () => openSection("hero") },
    { label: "Brand portfolio", detail: "Section", run: () => openSection("portfolio") },
    { label: "2025 Annual Report", detail: "Section", run: () => openSection("annual-report") },
    { label: "Culture statement", detail: "Section", run: () => openSection("culture") },
    { label: "Market Snapshot", detail: "Section", run: () => openSection("market") },
    { label: "Latest News", detail: "Section", run: () => openSection("latest-news") },
    { label: "Creating Your Future With Us", detail: "Section", run: () => openSection("careers") },
    { label: "Open cookie preferences", detail: "Action", run: () => openPreferences() },
    { label: "Open Investor briefing", detail: "Action", run: () => openBriefing() },
    ...TITLES.map((title) => ({ label: title, detail: "News story", run: () => { openSection("latest-news"); const card = $(`.news-card[data-title="${CSS.escape(title)}"]`); if (card) card.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", inline: "center" }); } }))
  ];
  function fuzzy(value, query) {
    const target = value.toLowerCase(), wanted = query.toLowerCase().trim();
    if (!wanted) return true; if (target.includes(wanted)) return true;
    let at = 0; for (const char of target) if (char === wanted[at]) at += 1; return at === wanted.length;
  }
  function renderCommands() {
    const query = $("#command-search").value;
    const results = COMMANDS.filter((item) => fuzzy(item.label, query)).slice(0, 10);
    const list = $("#command-results"); list.replaceChildren();
    results.forEach((item, index) => { const li = document.createElement("li"); const button = document.createElement("button"); button.type = "button"; button.id = `command-option-${index}`; button.className = index === 0 ? "active" : ""; button.setAttribute("role", "option"); button.setAttribute("aria-selected", String(index === 0)); button.dataset.commandIndex = String(COMMANDS.indexOf(item)); button.innerHTML = `<span>${item.label}</span><small>${item.detail}</small>`; li.append(button); list.append(li); });
    const first = $("#command-results button");
    if (first) $("#command-search").setAttribute("aria-activedescendant", first.id);
    else $("#command-search").removeAttribute("aria-activedescendant");
  }
  function moveCommandSelection(delta) {
    const buttons = $$("#command-results button");
    if (!buttons.length) return;
    const current = Math.max(0, buttons.findIndex((button) => button.classList.contains("active")));
    const next = (current + delta + buttons.length) % buttons.length;
    buttons.forEach((button, index) => {
      button.classList.toggle("active", index === next);
      button.setAttribute("aria-selected", String(index === next));
    });
    $("#command-search").setAttribute("aria-activedescendant", buttons[next].id);
    buttons[next].scrollIntoView({ block: "nearest" });
  }
  function openCommand() {
    if (!$("#command-palette").hidden) {
      $("#command-search").focus();
      return;
    }
    closeOtherLayers("command"); lastFocus = document.activeElement;
    if (state.bannerVisible) $("#cookie-layer").hidden = true;
    $("#command-palette").hidden = false; $("#command-search").value = ""; renderCommands(); $("#command-search").focus(); updateBodyLock();
  }
  function closeCommand(returnFocus = true) { if ($("#command-palette").hidden) return; $("#command-palette").hidden = true; renderConsent(); updateBodyLock(); if (returnFocus && lastFocus) lastFocus.focus(); }

  function openPreferences(payload) {
    const otherLayerOpen = [$("#mobile-menu"), $("#briefing-panel"), $("#command-palette")].some((layer) => !layer.hidden);
    const opener = otherLayerOpen && lastFocus ? lastFocus : document.activeElement;
    closeOtherLayers("preferences"); lastFocus = opener;
    const source = payload && typeof payload === "object" ? payload : state.consent;
    $("#consent-necessary").checked = source.necessary !== false;
    $("#consent-analytics").checked = Boolean(source.analytics);
    $("#consent-marketing").checked = Boolean(source.marketing);
    $("#consent-functional").checked = Boolean(source.functional);
    showConsentErrors({}); $("#preferences-modal").hidden = false; renderConsent(); $("#preferences-close").focus(); updateBodyLock();
  }
  function closePreferences(returnFocus = true) {
    if ($("#preferences-modal").hidden) return;
    $("#preferences-modal").hidden = true; renderConsent(); updateBodyLock(); if (returnFocus && lastFocus) lastFocus.focus();
  }
  function openResponsibility() { closeOtherLayers("responsibility"); const menu = $("#responsibility-menu"); menu.hidden = false; $("#responsibility-toggle").setAttribute("aria-expanded", "true"); }
  function closeResponsibility() { $("#responsibility-menu").hidden = true; $("#responsibility-toggle").setAttribute("aria-expanded", "false"); }
  function openSection(id) {
    closeCommand(false); closeBriefing(false); closeMobile(false); closePreferences(false); closeResponsibility();
    const target = document.getElementById(id); if (!target) return { ok: false, error: "Section not found" };
    target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }); return { ok: true, destination: id };
  }
  function reducedMotion() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function validateBriefing(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "briefing must be a single JSON object";
    if (value.schemaVersion !== 1) return "schemaVersion must be exactly 1";
    if (value.company !== "Northstar Collective, Inc. (NST)") return "company must be Northstar Collective, Inc. (NST)";
    const q = value.quote;
    if (!q || q.value !== 18.16 || q.currency !== "USD" || q.daysHigh !== 18.6 || q.daysLow !== 18.16 || q.daysVolume !== 38982 || q.lastUpdated !== "2hours ago") return "quote is missing or does not match the Northstar market snapshot";
    if (!Array.isArray(value.brands) || value.brands.length !== BRANDS.length || value.brands.some((brand, index) => brand !== BRANDS[index])) return "brands must contain all eleven Northstar brands in order";
    if (!Array.isArray(value.pinnedTitles) || value.pinnedTitles.some((title) => !TITLES.includes(title)) || new Set(value.pinnedTitles).size !== value.pinnedTitles.length) return "pinnedTitles contains an unknown or duplicate news title";
    const consentResult = validateConsent(value.consent || {}); if (!consentResult.valid) return `consent is invalid: ${Object.values(consentResult.errors).join(", ")}`;
    if (typeof value.generatedAt !== "string" || !value.generatedAt.endsWith("Z") || Number.isNaN(Date.parse(value.generatedAt))) return "generatedAt must be an ISO-8601 datetime ending in Z";
    return "";
  }
  function importBriefingText(text) {
    let value;
    try { value = JSON.parse(text); } catch (_) { $("#import-error").textContent = "Malformed JSON: check the pasted briefing syntax."; return { ok: false, error: "Malformed JSON" }; }
    const error = validateBriefing(value); if (error) { $("#import-error").textContent = error; return { ok: false, error }; }
    $("#import-error").textContent = "";
    mutate("import", () => { state.pinnedTitles = [...value.pinnedTitles]; state.consent = { ...value.consent }; state.consentSet = true; state.bannerVisible = false; });
    return { ok: true, pinnedCount: state.pinnedTitles.length, consent: { ...state.consent } };
  }
  function downloadBriefing() {
    const text = $("#briefing-preview").textContent;
    const ext = state.activeFormat === "json" ? "json" : "md";
    const blob = new Blob([text], { type: state.activeFormat === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `northstar-investor-briefing.${ext}`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
    return { ok: true, format: state.activeFormat, filename: link.download };
  }
  async function copyBriefing() {
    const text = $("#briefing-preview").textContent;
    try { await navigator.clipboard.writeText(text); } catch (_) { const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0"; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); }
    clearTimeout(copyTimer); $("#copy-status").textContent = "Copied briefing"; copyTimer = setTimeout(() => { $("#copy-status").textContent = ""; }, 2000);
    return { ok: true, format: state.activeFormat };
  }

  function setupCarousel() {
    const track = $("#news-track");
    const visibleCards = () => $$(".news-card:not([hidden])", track);
    const maxIndex = () => {
      const cards = visibleCards();
      if (!cards.length) return 0;
      return Math.max(0, cards.length - Math.max(1, Math.floor(track.clientWidth / cards[0].getBoundingClientRect().width)));
    };
    function go(next) {
      const cards = visibleCards();
      state.carouselIndex = Math.max(0, Math.min(maxIndex(), next));
      if (cards.length) cards[state.carouselIndex].scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest", inline: "start" });
      $("#news-prev").disabled = state.carouselIndex === 0;
      $("#news-next").disabled = !cards.length || state.carouselIndex >= maxIndex();
    }
    refreshCarousel = (reset = false) => go(reset ? 0 : state.carouselIndex);
    $("#news-prev").addEventListener("click", () => go(state.carouselIndex - 1)); $("#news-next").addEventListener("click", () => go(state.carouselIndex + 1));
    let down = false, startX = 0, startScroll = 0;
    track.addEventListener("pointerdown", (event) => { down = true; startX = event.clientX; startScroll = track.scrollLeft; track.classList.add("dragging"); track.setPointerCapture(event.pointerId); });
    track.addEventListener("pointermove", (event) => { if (down) track.scrollLeft = startScroll - (event.clientX - startX); });
    function release(event) { if (!down) return; down = false; track.classList.remove("dragging"); if (event && track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId); const cards = visibleCards(); if (!cards.length) return go(0); const cardWidth = cards[0].getBoundingClientRect().width + 20; go(Math.round(track.scrollLeft / cardWidth)); }
    track.addEventListener("pointerup", release); track.addEventListener("pointercancel", release);
    window.addEventListener("resize", () => go(Math.min(state.carouselIndex, maxIndex())));
  }
  function setupParticles() {
    if (reducedMotion()) return;
    const cards = $$(".galaxy-card"); let target = 0, current = 0, frame = 0;
    function tick() { current += (target - current) * .1; cards.forEach((card, index) => { const speed = .15 + index * .025; const y = current * speed * .05; const scale = Math.max(.5, Math.min(1.2, 1 - Math.abs(y) * .0004)); card.style.transform = `translate3d(0,${y}px,0) scale(${scale})`; }); frame = requestAnimationFrame(tick); }
    window.addEventListener("scroll", () => { const section = $("#portfolio"); target = window.scrollY - section.offsetTop; }, { passive: true });
    frame = requestAnimationFrame(tick); window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });
  }

  function setupHeroVideoFallback() {
    const video = $("#hero-video");
    const showPoster = () => { video.hidden = true; };
    video.addEventListener("error", showPoster);
    $("source", video)?.addEventListener("error", showPoster);
    if (video.error) showPoster();
    else {
      const playback = video.play();
      if (playback && typeof playback.catch === "function") playback.catch(showPoster);
    }
  }

  function bindEvents() {
    window.addEventListener("scroll", () => $("[data-header]").classList.toggle("scrolled", window.scrollY > 30), { passive: true });
    $("#responsibility-toggle").addEventListener("click", () => $("#responsibility-menu").hidden ? openResponsibility() : closeResponsibility());
    $(".responsibility-wrap").addEventListener("mouseenter", openResponsibility); $(".responsibility-wrap").addEventListener("mouseleave", closeResponsibility);
    $$("#responsibility-menu a").forEach((link) => link.addEventListener("click", closeResponsibility));
    $("#menu-open").addEventListener("click", openMobile); $("#menu-close").addEventListener("click", () => closeMobile());
    $$("#mobile-menu a").forEach((link, index) => { link.style.setProperty("--index", index); link.addEventListener("click", () => closeMobile()); });
    $("#briefing-open").addEventListener("click", openBriefing); $("#briefing-open-secondary").addEventListener("click", openBriefing); $("#briefing-close").addEventListener("click", () => closeBriefing());
    $("#tab-json").addEventListener("click", () => { state.activeFormat = "json"; renderBriefing(); }); $("#tab-markdown").addEventListener("click", () => { state.activeFormat = "markdown"; renderBriefing(); });
    $("#download-briefing").addEventListener("click", downloadBriefing); $("#copy-briefing").addEventListener("click", copyBriefing);
    $("#import-form").addEventListener("submit", (event) => { event.preventDefault(); importBriefingText($("#import-text").value); });
    $("#import-file").addEventListener("change", (event) => { const file = event.target.files && event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.addEventListener("load", () => { $("#import-text").value = String(reader.result || ""); importBriefingText($("#import-text").value); }); reader.addEventListener("error", () => { $("#import-error").textContent = "File could not be decoded as briefing JSON."; }); reader.readAsText(file); });
    $$(".pin-button").forEach((button) => button.addEventListener("click", () => togglePinned(button.closest(".news-card").dataset.title)));
    $("#undo").addEventListener("click", undo); $("#redo").addEventListener("click", redo);
    $("#accept-all").addEventListener("click", () => applyConsent({ necessary: true, analytics: true, marketing: true, functional: true }, "accept all"));
    $("#reject-all").addEventListener("click", () => applyConsent({ necessary: true, analytics: false, marketing: false, functional: false }, "reject all"));
    $("#manage-preferences").addEventListener("click", () => openPreferences()); $("#preferences-close").addEventListener("click", () => closePreferences());
    $("#preferences-form").addEventListener("submit", (event) => { event.preventDefault(); applyConsent(consentDraft(), "save preferences"); });
    $("#command-open").addEventListener("click", openCommand); $("#command-close").addEventListener("click", () => closeCommand()); $("#command-search").addEventListener("input", renderCommands);
    $("#command-results").addEventListener("click", (event) => { const button = event.target.closest("button[data-command-index]"); if (!button) return; const command = COMMANDS[Number(button.dataset.commandIndex)]; closeCommand(); command.run(); });
    $("#command-search").addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveCommandSelection(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Enter") {
        const active = $("#command-results button.active") || $("#command-results button");
        if (active) { event.preventDefault(); active.click(); }
      }
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openCommand(); return; }
      if (event.key === "Escape") { if (!$("#preferences-modal").hidden) closePreferences(); else if (!$("#command-palette").hidden) closeCommand(); else if (!$("#briefing-panel").hidden) closeBriefing(); else if (!$("#mobile-menu").hidden) closeMobile(); else closeResponsibility(); return; }
      if (!$("#preferences-modal").hidden) trapTab(event, $("#preferences-modal")); else if (!$("#command-palette").hidden) trapTab(event, $(".command-dialog")); else if (!$("#briefing-panel").hidden) trapTab(event, $("#briefing-panel")); else if (!$("#mobile-menu").hidden) trapTab(event, $("#mobile-menu"));
    });
    document.addEventListener("click", (event) => { const link = event.target.closest('a[href^="#"]'); if (!link) return; const id = link.getAttribute("href").slice(1); if (!id) { event.preventDefault(); return; } const target = document.getElementById(id); if (target) { event.preventDefault(); openSection(id); } });
  }

  window.NorthstarApp = {
    BRANDS, TITLES, state,
    openSection, openMobile, openResponsibility, openBriefing, openCommand, openPreferences,
    setPinned, togglePinned, undo, redo, validateConsent, applyConsent, consentDraft,
    briefingObject, markdownBriefing, activeBriefingText, validateBriefing, importBriefingText,
    downloadBriefing, copyBriefing,
    setFormat(format) { if (!["json", "markdown"].includes(format)) return { ok: false, error: "format must be json or markdown" }; state.activeFormat = format; renderBriefing(); return { ok: true, format }; },
    setFilter(filter) { if (!["all", "pinned"].includes(filter)) return { ok: false, error: "filter must be all or pinned" }; state.filter = filter; renderPins(true); return { ok: true, filter }; },
    clearFilter() { state.filter = "all"; renderPins(true); return { ok: true, filter: "all" }; },
    sortNews(sort) { if (!["original", "reverse"].includes(sort)) return { ok: false, error: "sort must be original or reverse" }; state.sort = sort; const track = $("#news-track"); const cards = $$(".news-card", track); (sort === "reverse" ? cards.reverse() : cards.sort((a,b) => TITLES.indexOf(a.dataset.title)-TITLES.indexOf(b.dataset.title))).forEach((card) => track.append(card)); refreshCarousel(true); return { ok: true, sort }; },
    renderAll
  };

  bindEvents(); setupCarousel(); setupParticles(); setupHeroVideoFallback(); renderAll(); updateBodyLock();
})();
