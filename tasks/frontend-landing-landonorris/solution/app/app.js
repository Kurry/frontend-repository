'use strict';
/* =========================================================================
   Avery Vale / Nova Racing — fictional driver homepage oracle.
   In-memory Svelte-store-style state (no browser storage). All UI controls
   and the WebMCP tools call the same handlers.
   ========================================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Seed data ---------------- */
  const SEED_RACES = [
    { id: 'r1', circuit: 'Alpine GP',         date: '2025-03-16', status: 'Upcoming'  },
    { id: 'r2', circuit: 'Bayfront Circuit',  date: '2025-04-06', status: 'Upcoming'  },
    { id: 'r3', circuit: 'Ridgeway GP',       date: '2025-05-04', status: 'Completed' },
    { id: 'r4', circuit: 'Solstice GP',       date: '2025-06-15', status: 'Upcoming'  },
    { id: 'r5', circuit: 'Meridian Night Run',date: '2025-07-20', status: 'Upcoming'  },
    { id: 'r6', circuit: 'Cascade Finale',    date: '2025-09-07', status: 'Upcoming'  },
  ];
  const EDITORIALS = [
    { index: 1, label: 'ON TRACK', img: '/editorial/strip-1.svg' },
    { index: 2, label: 'SPEED',    img: '/editorial/strip-2.svg' },
    { index: 3, label: 'OFF TRACK',img: '/editorial/strip-3.svg' },
    { index: 4, label: 'FOCUS',    img: '/editorial/strip-4.svg' },
    { index: 5, label: 'GARAGE',   img: '/editorial/strip-5.svg' },
    { index: 6, label: 'PODIUM',   img: '/editorial/strip-6.svg' },
  ];
  const HELMETS = [
    { index: 1, label: 'AURA GEOMETRY', base: '/helmets/helmet-1-base.svg', reveal: '/helmets/helmet-1-reveal.svg' },
    { index: 2, label: 'IRIDESCENT',    base: '/helmets/helmet-2-base.svg', reveal: '/helmets/helmet-2-reveal.svg' },
    { index: 3, label: 'TYPO STACK',    base: '/helmets/helmet-3-base.svg', reveal: '/helmets/helmet-3-reveal.svg' },
  ];
  const MARKS = ['/marks/mark-1.svg','/marks/mark-2.svg','/marks/mark-3.svg','/marks/mark-4.svg','/marks/mark-5.svg'];
  const DESTINATIONS = ['hero','horizontal-media','helmet-grid','race-calendar','collabs','social-stream','footer','menu','press-kit'];

  /* ---------------- State ---------------- */
  const state = {
    races: SEED_RACES.map(r => ({ ...r, selected: false, uid: 'avery-' + r.id + '@averyvale.example' })),
    shortlist: [],           // array of {kind,label,index}
    subscriber: null,        // email string or null
    filter: 'All',
    activeTab: 'json',
    menuOpen: false,
    pressKitOpen: false,
    paletteOpen: false,
    videoPlaying: false,
    undoStack: [],
    redoStack: [],
  };
  let lastFocus = null;

  /* ---------------- Schema validation (mirrors API-shaped contracts) ---------------- */
  const isPlainStr = v => typeof v === 'string';
  function validateEmail(raw) {
    if (!isPlainStr(raw)) return { ok: false, error: 'email must be text' };
    const email = raw.trim();
    const at = email.split('@');
    if (at.length !== 2) return { ok: false, error: 'email must contain exactly one @' };
    if (at[0].length === 0) return { ok: false, error: 'email local part must not be empty' };
    if (!/\./.test(at[1]) || at[1].length < 3) return { ok: false, error: 'email domain must contain a dot' };
    return { ok: true, value: email };
  }
  function validateRaceRecord(r) {
    if (!r || typeof r !== 'object') return 'race must be an object';
    if (!isPlainStr(r.id) || !r.id.trim()) return 'race id required';
    if (!isPlainStr(r.circuit) || !r.circuit.trim() || r.circuit.trim().length > 80) return 'race circuit invalid';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return 'race date must be YYYY-MM-DD';
    if (r.status !== 'Upcoming' && r.status !== 'Completed') return 'race status must be Upcoming or Completed';
    if (typeof r.selected !== 'boolean') return 'race selected must be boolean';
    if (!isPlainStr(r.uid) || !r.uid.trim()) return 'race uid required';
    return null;
  }
  function validateShortlist(s) {
    if (!s || typeof s !== 'object') return 'shortlist entry must be an object';
    if (s.kind !== 'helmet' && s.kind !== 'editorial') return 'shortlist kind must be helmet or editorial';
    if (!isPlainStr(s.label) || !s.label.trim() || s.label.trim().length > 60) return 'shortlist label invalid';
    if (!Number.isInteger(s.index) || s.index < 1) return 'shortlist index must be integer >= 1';
    return null;
  }
  function validatePressKit(doc) {
    if (!doc || typeof doc !== 'object') return 'press kit must be a JSON object';
    if (doc.schemaVersion !== 1) return 'schemaVersion must be 1';
    if (doc.driver !== 'Avery Vale') return 'driver must be Avery Vale';
    if (doc.team !== 'Nova Racing') return 'team must be Nova Racing';
    if (doc.season !== 2025) return 'season must be 2025';
    if (doc.newsletter !== 'none' && !validateEmail(doc.newsletter).ok) return 'newsletter must be none or a valid email';
    if (!Array.isArray(doc.races)) return 'races must be an array';
    for (const r of doc.races) { const e = validateRaceRecord(r); if (e) return e; if (r.selected !== true) return 'races must all be selected'; if (!SEED_RACES.some(sr => sr.id === r.id)) return 'race id must match a known race'; }
    if (!Array.isArray(doc.shortlist)) return 'shortlist must be an array';
    for (const s of doc.shortlist) { const e = validateShortlist(s); if (e) return e; }
    if (!isPlainStr(doc.generatedAt) || !/Z$/.test(doc.generatedAt) || Number.isNaN(Date.parse(doc.generatedAt))) return 'generatedAt must be ISO-8601 ending in Z';
    return null;
  }

  /* ---------------- Announcer ---------------- */
  const announcer = $('[data-announcer]');
  function announce(msg) { if (announcer) { announcer.textContent = ''; requestAnimationFrame(() => { announcer.textContent = msg; }); } }

  /* ---------------- Derived / render ---------------- */
  function selectedRaces() { return state.races.filter(r => r.selected); }
  function raceRecord(r) { return { id: r.id, circuit: r.circuit, date: r.date, status: r.status, selected: r.selected, uid: r.uid }; }

  function renderCounts() {
    $('[data-selected-count]').textContent = String(selectedRaces().length);
    $('[data-shortlist-count]').textContent = String(state.shortlist.length);
  }

  function renderShortlistButtons() {
    $$('.shortlist-btn').forEach(btn => {
      const kind = btn.dataset.kind, index = Number(btn.dataset.index);
      const on = state.shortlist.some(s => s.kind === kind && s.index === index);
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
      const label = btn.dataset.label;
      btn.setAttribute('aria-label', (on ? 'Remove from shortlist: ' : 'Add to shortlist: ') + label);
    });
  }

  /* ---------------- Undo/redo command stack ---------------- */
  function pushCommand(cmd) {
    state.undoStack.push(cmd);
    if (state.undoStack.length > 200) state.undoStack.shift();
    state.redoStack.length = 0;
  }
  function undo() {
    if (!state.undoStack.length) return false;
    const cmd = state.undoStack.pop();
    cmd.undo();
    state.redoStack.push(cmd);
    afterMutation();
    return true;
  }
  function redo() {
    if (!state.redoStack.length) return false;
    const cmd = state.redoStack.pop();
    cmd.redo();
    state.undoStack.push(cmd);
    afterMutation();
    return true;
  }
  function afterMutation() {
    renderCounts();
    renderShortlistButtons();
    renderCalendarRows();
    if (state.pressKitOpen) renderPreview();
  }

  /* ---------------- Race calendar handlers ---------------- */
  function setRaceSelected(id, selected, record = true) {
    const r = state.races.find(x => x.id === id);
    if (!r || r.selected === selected) return;
    const prev = r.selected;
    r.selected = selected;
    if (record) pushCommand({ undo: () => { r.selected = prev; }, redo: () => { r.selected = selected; } });
    afterMutation();
    announce('Selected races ' + selectedRaces().length);
  }
  function toggleRace(id) {
    const r = state.races.find(x => x.id === id);
    if (r) setRaceSelected(id, !r.selected);
  }
  function updateRaceStatus(id, status) {
    if (status !== 'Upcoming' && status !== 'Completed') return { ok: false, error: 'status must be Upcoming or Completed' };
    const r = state.races.find(x => x.id === id);
    if (!r) return { ok: false, error: 'race not found' };
    r.status = status;
    afterMutation();
    return { ok: true };
  }
  function updateRaceField(id, field, value) {
    const r = state.races.find(x => x.id === id);
    if (!r) return { ok: false, error: 'race not found' };
    if (field === 'selected') { setRaceSelected(id, value === true || value === 'true'); return { ok: true }; }
    if (field === 'status') return updateRaceStatus(id, value);
    if (field === 'circuit') {
      if (!isPlainStr(value) || !value.trim() || value.trim().length > 80) return { ok: false, error: 'circuit invalid' };
      r.circuit = value.trim(); afterMutation(); return { ok: true };
    }
    if (field === 'date') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false, error: 'date must be YYYY-MM-DD' };
      r.date = value; afterMutation(); return { ok: true };
    }
    return { ok: false, error: 'unknown field' };
  }

  function buildCalendar() {
    const list = $('#calendarList');
    list.innerHTML = '';
    state.races.forEach(r => {
      const li = document.createElement('li');
      li.className = 'race-row';
      li.dataset.raceId = r.id;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'race-toggle';
      toggle.dataset.raceToggle = '';
      toggle.textContent = r.circuit;
      const date = document.createElement('span');
      date.className = 'race-date';
      date.dataset.raceDate = '';
      date.textContent = r.date;
      const status = document.createElement('span');
      status.className = 'race-status ' + r.status;
      status.dataset.raceStatus = '';
      status.textContent = r.status;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'race-edit';
      edit.dataset.raceEdit = '';
      edit.textContent = 'Edit status';
      li.append(toggle, date, status, edit);
      list.appendChild(li);
    });
    renderCalendarRows();
  }
  function renderCalendarRows() {
    $$('#calendarList .race-row').forEach(row => {
      const r = state.races.find(x => x.id === row.dataset.raceId);
      if (!r) return;
      row.classList.toggle('is-selected', r.selected);
      const visible = state.filter === 'All' || r.status === state.filter;
      row.hidden = !visible;
      const st = row.querySelector('[data-race-status]');
      if (st) { st.textContent = r.status; st.className = 'race-status ' + r.status; }
      const toggle = row.querySelector('[data-race-toggle]');
      if (toggle) { toggle.textContent = r.circuit; toggle.setAttribute('aria-pressed', String(r.selected)); }
      const date = row.querySelector('[data-race-date]');
      if (date) date.textContent = r.date;
    });
  }
  function setFilter(f) {
    if (!['All','Upcoming','Completed'].includes(f)) return;
    state.filter = f;
    $$('.filter-btn').forEach(b => b.classList.toggle('is-active', b.dataset.filter === f));
    renderCalendarRows();
  }

  /* ---------------- Shortlist handlers ---------------- */
  function toggleShortlist(kind, index, label, record = true) {
    const i = state.shortlist.findIndex(s => s.kind === kind && s.index === index);
    if (i >= 0) {
      const removed = state.shortlist[i];
      state.shortlist.splice(i, 1);
      if (record) pushCommand({ undo: () => state.shortlist.push(removed), redo: () => { const j = state.shortlist.findIndex(s => s.kind === kind && s.index === index); if (j >= 0) state.shortlist.splice(j, 1); } });
    } else {
      const entry = { kind, label, index };
      state.shortlist.push(entry);
      if (record) pushCommand({ undo: () => { const j = state.shortlist.findIndex(s => s.kind === kind && s.index === index); if (j >= 0) state.shortlist.splice(j, 1); }, redo: () => state.shortlist.push(entry) });
    }
    afterMutation();
    announce('Shortlist ' + state.shortlist.length);
  }

  /* ---------------- Build editorial + helmet cards ---------------- */
  function buildEditorial() {
    const track = $('#horizontalTrack');
    track.innerHTML = '';
    EDITORIALS.forEach(e => {
      const card = document.createElement('div');
      card.className = 'h-card';
      card.innerHTML = `
        <img src="${e.img}" alt="Editorial ${e.label.toLowerCase()} composition ${e.index}" />
        <span class="h-card-cap">${e.label}</span>
        <button type="button" class="shortlist-btn" data-kind="editorial" data-index="${e.index}" data-label="${e.label}">Shortlist</button>`;
      track.appendChild(card);
    });
  }
  function buildHelmets() {
    const grid = $('#helmetGrid');
    grid.innerHTML = '';
    HELMETS.forEach(h => {
      const card = document.createElement('div');
      card.className = 'helmet-card';
      card.innerHTML = `
        <img class="helmet-card-base" src="${h.base}" alt="Helmet livery ${h.label.toLowerCase()}" />
        <img class="helmet-card-reveal" src="${h.reveal}" alt="" aria-hidden="true" />
        <span class="helmet-index">0${h.index}</span>
        <button type="button" class="shortlist-btn" data-kind="helmet" data-index="${h.index}" data-label="${h.label}">Shortlist</button>`;
      grid.appendChild(card);
    });
  }
  function buildMarquees() {
    const mk = () => MARKS.map(m => `<li><img src="${m}" alt="Partner mark" /></li>`).join('');
    ['#collabList','#collabList2','#footerMarquee','#footerMarquee2'].forEach(sel => { $(sel).innerHTML = mk(); });
  }

  /* ---------------- Press kit builders ---------------- */
  function pressKitJSON() {
    return {
      schemaVersion: 1,
      driver: 'Avery Vale',
      team: 'Nova Racing',
      season: 2025,
      newsletter: (state.subscriber && validateEmail(state.subscriber).ok) ? state.subscriber.trim() : 'none',
      races: selectedRaces().map(raceRecord),
      shortlist: state.shortlist.map(s => ({ kind: s.kind, label: s.label, index: s.index })),
      generatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    };
  }
  function pressKitMarkdown() {
    const doc = pressKitJSON();
    const lines = [];
    lines.push('# Avery Vale — Nova Racing Press Kit');
    lines.push('');
    lines.push('Driver: Avery Vale  ');
    lines.push('Team: Nova Racing  ');
    lines.push('Season: 2025  ');
    lines.push('Newsletter: ' + doc.newsletter);
    lines.push('');
    lines.push('## Selected races');
    if (!doc.races.length) lines.push('_Selection list is empty._');
    doc.races.forEach(r => lines.push(`- ${r.circuit} — ${r.date} (${r.status})`));
    lines.push('');
    lines.push('## Shortlist');
    if (!doc.shortlist.length) lines.push('_Shortlist is empty._');
    doc.shortlist.forEach(s => lines.push(`- [${s.kind}] ${s.label} (#${s.index})`));
    return lines.join('\n');
  }
  function pressKitICS() {
    const doc = pressKitJSON();
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Avery Vale//Press Kit//EN', 'CALSCALE:GREGORIAN'];
    doc.races.forEach(r => {
      out.push('BEGIN:VEVENT');
      out.push('UID:' + r.uid);
      out.push('DTSTART;VALUE=DATE:' + r.date.replace(/-/g, ''));
      out.push('SUMMARY:' + r.circuit);
      out.push('STATUS:' + (r.status === 'Upcoming' ? 'CONFIRMED' : 'CANCELLED'));
      out.push('END:VEVENT');
    });
    out.push('END:VCALENDAR');
    return out.join('\r\n');
  }
  function currentPreviewText() {
    if (state.activeTab === 'json') return JSON.stringify(pressKitJSON(), null, 2);
    if (state.activeTab === 'markdown') return pressKitMarkdown();
    return pressKitICS();
  }
  function renderPreview() { $('[data-presskit-preview]').textContent = currentPreviewText(); }

  /* ---------------- Import ---------------- */
  function importPressKit(text) {
    const msg = $('[data-import-msg]');
    const fail = (e) => { msg.textContent = 'Import error: ' + e; msg.className = 'presskit-import-msg is-error'; return { ok: false, error: e }; };
    let doc;
    try { doc = JSON.parse(text); } catch (_) { return fail('malformed JSON'); }
    const err = validatePressKit(doc);
    if (err) return fail(err);
    // apply (no mutation happened before this point)
    state.races.forEach(r => { r.selected = false; });
    doc.races.forEach(rec => {
      // validatePressKit already rejected any id outside SEED_RACES, so every
      // rec here matches an existing seeded row; the calendar never grows.
      const r = state.races.find(x => x.id === rec.id);
      if (r) { r.selected = true; r.status = rec.status; r.circuit = rec.circuit; r.date = rec.date; r.uid = rec.uid; }
    });
    state.shortlist = doc.shortlist.map(s => ({ kind: s.kind, label: s.label, index: s.index }));
    state.subscriber = (doc.newsletter === 'none') ? null : doc.newsletter;
    state.undoStack.length = 0; state.redoStack.length = 0;
    buildCalendar();
    afterMutation();
    syncNewsletterFromState();
    msg.textContent = 'Imported ' + doc.races.length + ' selected race(s), ' + doc.shortlist.length + ' shortlist item(s).';
    msg.className = 'presskit-import-msg is-ok';
    return { ok: true };
  }

  /* ---------------- Download / Copy ---------------- */
  function download(format) {
    const prev = state.activeTab; state.activeTab = format;
    const map = { json: ['avery-vale-press-kit.json', 'application/json'], markdown: ['avery-vale-press-kit.md', 'text/markdown'], ics: ['avery-vale-press-kit.ics', 'text/calendar'] };
    const [name, mime] = map[format] || map.json;
    const text = format === 'json' ? JSON.stringify(pressKitJSON(), null, 2) : (format === 'markdown' ? pressKitMarkdown() : pressKitICS());
    state.activeTab = prev;
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  }
  async function copyActive() {
    const text = currentPreviewText();
    let ok = true;
    try { await navigator.clipboard.writeText(text); } catch (_) { ok = false; /* clipboard may be blocked; preview still authoritative */ }
    const c = $('[data-presskit-confirm]');
    c.textContent = ok ? 'Copied' : 'Copy failed';
    setTimeout(() => { c.textContent = ''; }, 1500);
    return ok;
  }

  /* ---------------- Newsletter ---------------- */
  function syncNewsletterFromState() {
    const input = $('#newsletterEmail');
    input.value = state.subscriber || '';
    validateNewsletterLive();
  }
  function validateNewsletterLive() {
    const input = $('#newsletterEmail');
    const btn = $('#newsletterSubmit');
    const msg = $('[data-newsletter-msg]');
    const res = validateEmail(input.value);
    if (input.value.trim() === '') {
      btn.disabled = true; msg.className = 'newsletter-msg'; msg.textContent = ''; return;
    }
    if (!res.ok) {
      btn.disabled = true;
      msg.textContent = 'Please enter a valid email in the email field: ' + res.error + '.';
      msg.className = 'newsletter-msg is-shown is-error';
    } else {
      btn.disabled = false;
      msg.className = 'newsletter-msg';
      msg.textContent = '';
    }
  }
  function submitNewsletter() {
    const input = $('#newsletterEmail');
    const msg = $('[data-newsletter-msg]');
    const res = validateEmail(input.value);
    if (!res.ok) {
      msg.textContent = 'Please enter a valid email in the email field.';
      msg.className = 'newsletter-msg is-shown is-error';
      announce('Newsletter error: invalid email');
      return { ok: false };
    }
    state.subscriber = res.value;
    input.value = '';
    $('#newsletterSubmit').disabled = true;
    msg.textContent = 'Thanks — your signup to the Nova Racing dispatch succeeded.';
    msg.className = 'newsletter-msg is-shown is-ok';
    announce('Newsletter signup succeeded');
    if (state.pressKitOpen) renderPreview();
    return { ok: true, value: res.value };
  }

  /* ---------------- Navigation / scroll ---------------- */
  function goTo(dest) {
    if (dest === 'menu') { openMenu(); return; }
    if (state.menuOpen) closeMenu();
    if (dest === 'press-kit') { openPressKit(); return; }
    const el = document.getElementById(dest);
    if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------------- Menu overlay (modal, focus trap) ---------------- */
  const menu = $('#navMenu');
  const ham = $('#navHam');
  function focusable(container) {
    return $$('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])', container).filter(el => el.offsetParent !== null || el === document.activeElement);
  }
  function trapFocus(container, event, isOpen) {
    if (event.key !== 'Tab' || !isOpen) return;
    const items = focusable(container); if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function openMenu() {
    if (state.menuOpen) return;
    state.menuOpen = true; lastFocus = document.activeElement;
    menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false');
    ham.setAttribute('aria-expanded', 'true');
    const first = $('.nav-menu-close', menu);
    if (first) first.focus();
  }
  function closeMenu() {
    if (!state.menuOpen) return;
    state.menuOpen = false;
    menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true');
    ham.setAttribute('aria-expanded', 'false');
    if (ham) ham.focus();
  }

  /* ---------------- Press kit drawer ---------------- */
  const drawer = $('#pressKitDrawer');
  const drawerScrim = $('[data-presskit-scrim]');
  function openPressKit() {
    if (state.menuOpen) closeMenu();
    if (state.pressKitOpen) return;
    state.pressKitOpen = true; lastFocus = document.activeElement;
    drawerScrim.hidden = false;
    drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false');
    renderPreview();
    const c = $('[data-presskit-close]'); if (c) c.focus();
  }
  function closePressKit() {
    if (!state.pressKitOpen) return;
    state.pressKitOpen = false;
    drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true');
    drawerScrim.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function setTab(tab) {
    if (!['json','markdown','ics'].includes(tab)) return;
    state.activeTab = tab;
    $$('.presskit-tab').forEach(t => { const on = t.dataset.tab === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); });
    renderPreview();
  }

  /* ---------------- Command palette ---------------- */
  const palette = $('#commandPalette');
  const paletteScrim = $('[data-palette-scrim]');
  const paletteInput = $('#paletteInput');
  const COMMANDS = [
    { id: 'go-home', label: 'Go HOME', run: () => { closePalette(); goTo('hero'); } },
    { id: 'go-ontrack', label: 'Go ON TRACK', run: () => { closePalette(); goTo('horizontal-media'); } },
    { id: 'go-offtrack', label: 'Go OFF TRACK', run: () => { closePalette(); goTo('social-stream'); } },
    { id: 'go-calendar', label: 'Go CALENDAR', run: () => { closePalette(); goTo('race-calendar'); } },
    { id: 'open-presskit', label: 'Open press kit', run: () => { closePalette(); openPressKit(); } },
    { id: 'undo', label: 'Undo', run: () => { undo(); } },
    { id: 'redo', label: 'Redo', run: () => { redo(); } },
  ];
  let paletteActive = 0;
  function renderPalette() {
    const q = paletteInput.value.trim().toLowerCase();
    const items = COMMANDS.filter(c => c.label.toLowerCase().includes(q));
    const list = $('#paletteList');
    list.innerHTML = '';
    items.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'palette-item' + (i === paletteActive ? ' is-active' : '');
      li.setAttribute('role', 'option');
      li.dataset.cmd = c.id;
      li.textContent = c.label;
      li.addEventListener('click', () => c.run());
      list.appendChild(li);
    });
    if (paletteActive >= items.length) paletteActive = Math.max(0, items.length - 1);
    return items;
  }
  function openPalette() {
    if (state.paletteOpen) return;
    state.paletteOpen = true; lastFocus = document.activeElement;
    paletteScrim.hidden = false;
    palette.classList.add('is-open'); palette.setAttribute('aria-hidden', 'false');
    paletteInput.value = ''; paletteActive = 0; renderPalette();
    paletteInput.focus();
  }
  function closePalette() {
    if (!state.paletteOpen) return;
    state.paletteOpen = false;
    palette.classList.remove('is-open'); palette.setAttribute('aria-hidden', 'true');
    paletteScrim.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------- Video hover-to-play ---------------- */
  const video = $('#socialVideo');
  const videoWrap = $('[data-video-stream-wrap]');
  function playVideo() { state.videoPlaying = true; videoWrap.classList.add('is-playing'); const p = video.play(); if (p && p.catch) p.catch(() => {}); }
  function pauseVideo() { state.videoPlaying = false; videoWrap.classList.remove('is-playing'); video.pause(); }
  function restartVideo() { video.currentTime = 0; playVideo(); }

  /* ---------------- Wire UI ---------------- */
  function wire() {
    // preloader
    const pre = $('#preloader');
    const dismiss = () => pre.classList.add('is-done');
    if (prefersReduced()) dismiss(); else setTimeout(dismiss, 1400);

    // nav
    $('#navHam').addEventListener('click', openMenu);
    $('#navClose').addEventListener('click', closeMenu);
    $('#storeBtn').addEventListener('click', () => goTo('hero'));
    $('#pressKitBtn').addEventListener('click', openPressKit);

    // menu links / socials / business / legal (in-page, no navigation)
    $$('[data-menu-link]').forEach(el => el.addEventListener('click', (e) => {
      e.preventDefault();
      const dest = el.dataset.dest;
      if (state.menuOpen) closeMenu();
      goTo(dest);
    }));
    $$('[data-social], [data-legal]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); }));

    // calendar
    $$('.filter-btn').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
    $('#calendarList').addEventListener('click', (e) => {
      const row = e.target.closest('.race-row'); if (!row) return;
      const id = row.dataset.raceId;
      if (e.target.closest('[data-race-edit]')) { openRaceEditor(row, id); return; }
      if (e.target.closest('.race-edit-form')) return;
      toggleRace(id);
    });

    // shortlist (delegated)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.shortlist-btn');
      if (!btn) return;
      toggleShortlist(btn.dataset.kind, Number(btn.dataset.index), btn.dataset.label);
    });

    // newsletter
    $('#newsletterEmail').addEventListener('input', validateNewsletterLive);
    $('#newsletterForm').addEventListener('submit', (e) => { e.preventDefault(); submitNewsletter(); });

    // press kit
    $('[data-presskit-close]').addEventListener('click', closePressKit);
    drawerScrim.addEventListener('click', closePressKit);
    $$('.presskit-tab').forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)));
    $('[data-presskit-copy]').addEventListener('click', copyActive);
    $('[data-presskit-download]').addEventListener('click', () => download(state.activeTab));
    $('[data-import-paste]').addEventListener('click', () => importPressKit($('[data-import-area]').value));
    $('[data-import-file]').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => importPressKit(String(reader.result));
      reader.readAsText(f);
    });

    // palette
    paletteScrim.addEventListener('click', closePalette);
    paletteInput.addEventListener('input', () => { paletteActive = 0; renderPalette(); });
    paletteInput.addEventListener('keydown', (e) => {
      const items = renderPalette();
      if (e.key === 'ArrowDown') { e.preventDefault(); paletteActive = Math.min(items.length - 1, paletteActive + 1); renderPalette(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); paletteActive = Math.max(0, paletteActive - 1); renderPalette(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[paletteActive]) items[paletteActive].run(); }
    });

    // video hover
    ['mouseenter', 'focus'].forEach(ev => videoWrap.addEventListener(ev, playVideo));
    ['mouseleave', 'blur'].forEach(ev => videoWrap.addEventListener(ev, pauseVideo));

    // global keys
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); state.paletteOpen ? closePalette() : openPalette(); return; }
      if (e.key === 'Escape') {
        if (state.paletteOpen) { closePalette(); return; }
        if (state.pressKitOpen) { closePressKit(); return; }
        if (state.menuOpen) { closeMenu(); return; }
      }
    });

    // modal focus traps
    menu.addEventListener('keydown', (e) => trapFocus(menu, e, state.menuOpen));
    drawer.addEventListener('keydown', (e) => trapFocus(drawer, e, state.pressKitOpen));
    palette.addEventListener('keydown', (e) => trapFocus(palette, e, state.paletteOpen));

    // marquee inview
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => en.target.classList.toggle('is-inview', en.isIntersecting));
    }, { threshold: 0.05 });
    $$('.marquee').forEach(m => io.observe(m));

    // split-text fill on scroll
    setupSplitText('.text-impact');
    setupSplitText('.footer-statement');

    // horizontal scroll-linked track
    setupHorizontal();

    // hero canvas
    drawHero();
  }

  function openRaceEditor(row, id) {
    if (row.querySelector('.race-edit-form')) return;
    const r = state.races.find(x => x.id === id);
    const editBtn = row.querySelector('[data-race-edit]');
    editBtn.style.display = 'none';
    const form = document.createElement('form');
    form.className = 'race-edit-form';
    form.innerHTML = `
      <label class="visually-hidden" for="edit-${id}">Edit status for ${r.circuit}</label>
      <select id="edit-${id}" data-status-select>
        <option value="Upcoming">Upcoming</option>
        <option value="Completed">Completed</option>
        <option value="Retired">Retired (invalid)</option>
      </select>
      <button type="submit" class="race-edit">Save</button>
      <button type="button" class="race-edit" data-cancel>Cancel</button>
      <span class="race-edit-error" data-edit-error></span>`;
    row.appendChild(form);
    const sel = form.querySelector('[data-status-select]');
    sel.value = r.status;
    form.querySelector('[data-cancel]').addEventListener('click', () => { form.remove(); editBtn.style.display = ''; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = updateRaceStatus(id, sel.value);
      if (!res.ok) { form.querySelector('[data-edit-error]').textContent = res.error; announce('Status error'); return; }
      form.remove(); editBtn.style.display = '';
    });
    sel.focus();
  }

  /* ---------------- Split text ---------------- */
  function setupSplitText(sel) {
    const el = $(sel); if (!el) return;
    const text = el.getAttribute('aria-label') || el.textContent;
    el.textContent = '';
    const chars = [];
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'char'; span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(span); chars.push(span);
    }
    const fill = () => chars.forEach((c, i) => setTimeout(() => c.classList.add('is-filled'), prefersReduced() ? 0 : i * 40));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { fill(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(el);
  }

  /* ---------------- Horizontal scroll-linked ---------------- */
  function setupHorizontal() {
    const section = $('#horizontal-media');
    const track = $('#horizontalTrack');
    if (!section || !track) return;
    function onScroll() {
      if (prefersReduced()) { track.style.transform = 'none'; return; }
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / (total || 1)));
      const max = track.scrollWidth - window.innerWidth;
      track.style.transform = 'translateX(' + (-progress * Math.max(0, max)) + 'px)';
    }
    // give the pinned section extra scroll height for the travel
    section.style.height = (200 + 100) + 'vh';
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------------- Hero canvas (original decorative composition) ---------------- */
  function drawHero() {
    const c = $('[data-hero-canvas]'); if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const hero = c.closest('.home-hero');
    if (!hero) return;
    const size = 480; c.width = size; c.height = size;
    let t = 0, raf, pointerX = 0, pointerY = 0, interaction = 0, hovered = false, pressed = false, scrollProgress = 0;
    const updatePointer = (event) => {
      const rect = hero.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    hero.addEventListener('pointerenter', () => { hovered = true; });
    hero.addEventListener('pointermove', updatePointer);
    hero.addEventListener('pointerdown', () => { pressed = true; });
    hero.addEventListener('pointerup', () => { pressed = false; });
    hero.addEventListener('pointerleave', () => { hovered = false; pressed = false; pointerX = 0; pointerY = 0; });
    window.addEventListener('scroll', () => {
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
    }, { passive: true });
    function frame() {
      ctx.clearRect(0, 0, size, size);
      const targetInteraction = pressed ? 1 : hovered ? 0.55 : 0;
      interaction += (targetInteraction - interaction) * 0.12;
      const menuPulse = state.menuOpen ? 18 : 0;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const r = 60 + i * 32 + Math.sin(t / (40 - interaction * 14) + i) * (10 + interaction * 9) + scrollProgress * 24 + menuPulse;
        ctx.arc(size / 2 + pointerX * (12 + i * 2), size / 2 + pointerY * (12 + i * 2), r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 ? `rgba(210,255,0,${0.5 + interaction * 0.35})` : 'rgba(17,17,18,0.35)';
        ctx.lineWidth = 2 + interaction * 2; ctx.stroke();
      }
      t++;
      if (!prefersReduced()) raf = requestAnimationFrame(frame);
    }
    frame();
    if (prefersReduced() && raf) cancelAnimationFrame(raf);
  }

  /* ---------------- WebMCP (delivery contract; same handlers as UI) ---------------- */
  function registerWebMCP() {
    const tools = [];
    const T = (name, description, handler) => tools.push({ name, description, handler });

    // browse-query-v1
    T('browse_open', 'Scroll/open a homepage destination. arg: destination', (a) => {
      if (!DESTINATIONS.includes(a && a.destination)) return { ok: false, error: 'unknown destination' };
      goTo(a.destination); return { ok: true, destination: a.destination };
    });
    T('browse_apply_filter', 'Apply race status filter. arg: value (All|Upcoming|Completed)', (a) => {
      const v = a && a.value;
      if (!['All','Upcoming','Completed'].includes(v)) return { ok: false, error: 'invalid filter' };
      setFilter(v); return { ok: true, filter: v };
    });
    T('browse_clear_filter', 'Clear the race status filter (All).', () => { setFilter('All'); return { ok: true, filter: 'All' }; });

    // command-session-v1 (social video)
    T('session_start', 'Start the social video playback.', () => { playVideo(); return { ok: true }; });
    T('session_pause', 'Pause the social video playback.', () => { pauseVideo(); return { ok: true }; });
    T('session_restart', 'Restart the social video from the beginning.', () => { restartVideo(); return { ok: true }; });

    // entity-collection-v1 (race)
    T('entity_select', 'Select a race by id. arg: id', (a) => {
      const r = state.races.find(x => x.id === (a && a.id)); if (!r) return { ok: false, error: 'race not found' };
      setRaceSelected(r.id, true); return { ok: true, id: r.id, selected: true };
    });
    T('entity_toggle', 'Toggle a race selection by id. arg: id', (a) => {
      const r = state.races.find(x => x.id === (a && a.id)); if (!r) return { ok: false, error: 'race not found' };
      toggleRace(r.id); return { ok: true, id: r.id, selected: r.selected };
    });
    T('entity_update', 'Update a race field. args: id, field (selected|status|circuit|date), value', (a) => {
      if (!a || !['selected','status','circuit','date'].includes(a.field)) return { ok: false, error: 'invalid field' };
      return updateRaceField(a.id, a.field, a.value);
    });

    // artifact-transfer-v1 (press kit)
    T('artifact_export', 'Download the press kit in a format. arg: format (json|markdown|ics)', (a) => {
      const f = a && a.format; if (!['json','markdown','ics'].includes(f)) return { ok: false, error: 'invalid format' };
      openPressKit(); const name = download(f); return { ok: true, format: f, filename: name };
    });
    T('artifact_copy', 'Copy the press kit preview for a format. arg: format', async (a) => {
      const f = a && a.format; if (!['json','markdown','ics'].includes(f)) return { ok: false, error: 'invalid format' };
      openPressKit(); setTab(f);
      const copied = await copyActive();
      return { ok: copied, format: f };
    });
    T('artifact_import', 'Import press kit from the paste textarea (paste mode only). arg: mode', (a) => {
      const mode = (a && a.mode) || 'paste';
      if (mode !== 'paste') return { ok: false, error: 'only paste mode is available via WebMCP' };
      openPressKit();
      const res = importPressKit($('[data-import-area]').value);
      return res;
    });

    const byName = Object.fromEntries(tools.map(t => [t.name, t]));
    window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', app: 'avery-vale-homepage', tools: tools.map(t => t.name) });
    window.webmcp_list_tools = () => tools.map(t => ({ name: t.name, description: t.description }));
    window.webmcp_invoke_tool = (name, args) => {
      const t = byName[name];
      if (!t) return { ok: false, error: 'unknown tool: ' + name };
      try { return t.handler(args || {}); } catch (err) { return { ok: false, error: String(err && err.message || err) }; }
    };
  }

  /* ---------------- Init ---------------- */
  function init() {
    buildEditorial();
    buildHelmets();
    buildMarquees();
    buildCalendar();
    renderCounts();
    renderShortlistButtons();
    wire();
    registerWebMCP();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
