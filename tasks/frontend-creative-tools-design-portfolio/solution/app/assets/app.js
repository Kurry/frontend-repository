/* designer.portfolio — CLI terminal portfolio with Projects Board, Export center,
   Archive vault, command palette, undo/redo, and a WebMCP action contract.
   All state is in-memory only: reload returns to the seeded baseline. */
(function () {
  'use strict';

  // ============ UTILITIES ============
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uidCounter = 0;
  const uid = () => 'p' + Date.now().toString(36) + '-' + (++uidCounter);

  // ============ CONSTANTS ============
  const STATUS_ENUM = ['shipped', 'wip', 'archived'];
  const THEME_ENUM = ['dark', 'light', 'retro', 'glass'];
  const CONSENT_ENUM = ['accepted', 'declined', 'not-set'];
  const SLUG_RE = /^[a-z0-9-]+$/;
  const CURRENT_YEAR = new Date().getFullYear();
  const EMAIL_ADDR = ['hello', 'example.com'].join('@');

  // ============ SEED DATA (12 projects) ============
  function seedProjects() {
    return [
      { id: 'p-signals', name: 'Signals', slug: 'signals', blurb: 'Redesigned dense research dashboards for clarity. Tabbed navigation, sticky metrics, dynamic filtering.', status: 'shipped', tags: ['UX Design', 'Dashboard', 'Research'], stats: ['60% faster retrieval', '100% WCAG', '5x less scrolling'], type: 'Research Integrity Platform', year: 2024 },
      { id: 'p-anylyze', name: 'Anylyze', slug: 'anylyze', blurb: 'Rebuilt the data visualization layer with three-tiered typography and five component states so the data always reads.', status: 'shipped', tags: ['Dashboard UX', 'Data Viz', 'SaaS'], stats: ['38% faster tasks', '71% fewer errors', '9.4/10 confidence'], type: 'Analytics Data Platform', year: 2024 },
      { id: 'p-liveu', name: 'LiveU — Signa Design System', slug: 'liveu', blurb: '120+ components for a global live video platform. Atomic design, dual-typeface system, 8px grid.', status: 'shipped', tags: ['Design System', 'Enterprise', 'Broadcasting'], stats: ['60% faster velocity', '120+ components', '100% consistency'], type: 'Broadcasting Enterprise', year: 2024 },
      { id: 'p-tuiasi', name: 'TUIASI — University Redesign', slug: 'tuiasi', blurb: 'Emergency four-week rebuild of a decade-old university site. Record admissions followed.', status: 'shipped', tags: ['Web Design', 'Education UX', 'Architecture'], stats: ['+4,200 students', '91% lighter pages', '10x faster'], type: 'Education Platform', year: 2023 },
      { id: 'p-resnet', name: 'ResNet AI', slug: 'resnet', blurb: 'Tamed 1,300+ scattered design variants into a governed token-based system with full documentation.', status: 'shipped', tags: ['Design System', 'Tokens', 'SaaS'], stats: ['60% fewer components', '40% faster handoff', '100% a11y'], type: 'Hospitality Design System', year: 2023 },
      { id: 'p-socyal', name: 'Socyal', slug: 'socyal', blurb: 'Took an HR tool to an investor-ready standalone mobile product in five months. #3 Product of the Day on Product Hunt.', status: 'wip', tags: ['Product Design', 'Mobile UX', 'Product Hunt'], stats: ['#3 Product Hunt', '5-month delivery'], type: 'HR Mobile Platform', year: 2023 },
      { id: 'p-app4home', name: 'App4Home', slug: 'app4home', blurb: 'Reimagined smart home controls with a time-aware dashboard, room-based navigation, and AI recommendations.', status: 'shipped', tags: ['Mobile UX', 'IoT', 'Product Design'], stats: ['40% less clutter', '2x faster onboarding'], type: 'Smart Home IoT App', year: 2024 },
      { id: 'p-cyberghost', name: 'CyberGhost VPN', slug: 'cyberghost', blurb: 'Made a VPN accessible to non-technical users. Dark-mode-first, slide-to-connect, 30-second onboarding.', status: 'shipped', tags: ['Cybersecurity', 'Mobile UX', 'Product Design'], stats: ['3-step onboarding', 'Privacy UX leader'], type: 'Consumer Privacy App', year: 2018 },
      { id: 'p-cognitiveseo', name: 'CognitiveSEO', slug: 'cognitiveseo', blurb: 'Three-module restructure with progressive disclosure. Power users kept everything; marketers finally got clarity.', status: 'shipped', tags: ['Dashboard UX', 'Data Viz', 'SaaS'], stats: ['40% faster tasks', '30% retention up', '45% less load'], type: 'SEO Dashboard', year: 2017 },
      { id: 'p-big5', name: 'Big5 American Diner', slug: 'big5', blurb: 'Full brand system anchored around five founding recipes. Mid-century American diner aesthetic.', status: 'wip', tags: ['Branding', 'Packaging', 'Storytelling'], stats: ['#1 hospitality brand locally', '100% organic growth'], type: 'Restaurant Brand Identity', year: 2020 },
      { id: 'p-darnic', name: 'Darnic for Education', slug: 'darnic', blurb: '"Generosity builds futures." A cohesive brand for a gift-giving campaign for underserved children.', status: 'wip', tags: ['Logo Design', 'NGO', 'Brand Guidelines'], stats: ['3x faster kit production', '100% visual cohesion'], type: 'NGO Campaign Branding', year: 2024 },
      { id: 'p-crafting', name: 'Crafting Social Stories', slug: 'crafting-social', blurb: 'Dual-appeal identity for children\'s workshops — playful for kids, credible for corporate donors.', status: 'shipped', tags: ['Branding', 'NGO', 'Visual Identity'], stats: ['Volunteer sign-ups up', 'Donor engagement up'], type: 'Educational Workshop Brand', year: 2024 },
    ];
  }

  // ============ STORE (in-memory only — never persisted) ============
  const store = {
    projects: seedProjects(),
    archive: [],
    theme: 'dark',
    consent: 'not-set',
    mode: 'terminal',          // terminal | board | export | archive
    query: '',                 // board search / filter syntax
    selection: new Set(),      // selected project ids on the board
    undoStack: [],             // [{label, projects, archive}]
    redoStack: [],
    lastExportJson: null,      // last compiled Portfolio JSON (artifact round-trip)
    exportTab: 'json',         // json | markdown
    draft: null,               // create/edit form draft
    draftSlugTouched: false,
    editingId: null,
    justAddedId: null,
    formBusy: false,
    boardMotion: '',
  };
  let commandHistory = [];
  let historyIndex = -1;
  let acItems = [];
  let acIndex = -1;
  let bootedOnce = false;

  // ============ DOM ============
  const wallpaper = document.getElementById('wallpaper');
  const terminal = document.getElementById('terminal');
  const terminalBody = document.getElementById('terminalBody');
  const terminalCore = document.getElementById('terminalCore');
  const outputArea = document.getElementById('outputArea');
  const cmdInput = document.getElementById('cmdInput');
  const autocompleteEl = document.getElementById('autocomplete');
  const asciiNameEl = document.getElementById('asciiName');
  const bootText = document.getElementById('bootText');
  const closeOverlay = document.getElementById('closeOverlay');
  const boardView = document.getElementById('boardView');
  const exportView = document.getElementById('exportView');
  const archiveView = document.getElementById('archiveView');
  const boardGrid = document.getElementById('boardGrid');
  const boardEmpty = document.getElementById('boardEmpty');
  const boardCount = document.getElementById('boardCount');
  const boardSearchEl = document.getElementById('boardSearch');
  const tagFilterEl = document.getElementById('tagFilter');
  const statusChipsEl = document.getElementById('statusChips');
  const statsStrip = document.getElementById('statsStrip');
  const selectAllEl = document.getElementById('selectAll');
  const bulkBar = document.getElementById('bulkBar');
  const bulkCount = document.getElementById('bulkCount');
  const formSlot = document.getElementById('formSlot');
  const exportPreview = document.getElementById('exportPreview');
  const tabJson = document.getElementById('tabJson');
  const tabMd = document.getElementById('tabMd');
  const copyConfirm = document.getElementById('copyConfirm');
  const importPanel = document.getElementById('importPanel');
  const importText = document.getElementById('importText');
  const importMsg = document.getElementById('importMsg');
  const vaultList = document.getElementById('vaultList');
  const vaultEmpty = document.getElementById('vaultEmpty');
  const vaultCount = document.getElementById('vaultCount');
  const paletteOverlay = document.getElementById('paletteOverlay');
  const paletteInput = document.getElementById('paletteInput');
  const paletteList = document.getElementById('paletteList');
  const toastWrap = document.getElementById('toastWrap');
  const liveRegion = document.getElementById('liveRegion');
  const statusThemeBtn = document.getElementById('statusTheme');
  const statusProjects = document.getElementById('statusProjects');
  const statusConsent = document.getElementById('statusConsent');
  const statusClock = document.getElementById('statusClock');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const matrixCanvas = document.getElementById('matrixCanvas');
  const confettiCanvas = document.getElementById('confettiCanvas');
  document.getElementById('emailSubtitle').textContent = EMAIL_ADDR;

  const ASCII_NAME = String.raw`
██╗   ██╗ ██████╗ ██╗   ██╗██████╗     ███╗   ██╗ █████╗ ███╗   ███╗███████╗
╚██╗ ██╔╝██╔═══██╗██║   ██║██╔══██╗    ████╗  ██║██╔══██╗████╗ ████║██╔════╝
 ╚████╔╝ ██║   ██║██║   ██║██████╔╝    ██╔██╗ ██║███████║██╔████╔██║█████╗
  ╚██╔╝  ██║   ██║██║   ██║██╔══██╗    ██║╚██╗██║██╔══██║██║╚██╔╝██║██╔══╝
   ██║   ╚██████╔╝╚██████╔╝██║  ██║    ██║ ╚████║██║  ██║██║ ╚═╝ ██║███████╗
   ╚═╝    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝     ╚═╝╚══════╝`.trim();

  // ============ LIVE REGION + TOASTS ============
  function announce(msg) {
    liveRegion.textContent = '';
    window.setTimeout(() => { liveRegion.textContent = msg; }, 40);
  }
  function toast(msg, ms) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    toastWrap.appendChild(t);
    window.setTimeout(() => {
      t.classList.add('out');
      window.setTimeout(() => t.remove(), 320);
    }, ms || 2400);
    announce(msg);
  }

  // ============ WALLPAPER (lazy sharp + subtle parallax) ============
  let sharpLoaded = false;
  function loadSharpWallpaper() {
    if (sharpLoaded) return;
    sharpLoaded = true;
    const sharp = document.getElementById('wallpaper-sharp');
    if (!sharp) return;
    sharp.querySelectorAll('source[data-srcset]').forEach((s) => { s.srcset = s.dataset.srcset; });
    const img = sharp.querySelector('img[data-src]');
    if (img) img.src = img.dataset.src;
  }
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(loadSharpWallpaper, { timeout: 3000 });
    else window.setTimeout(loadSharpWallpaper, 1200);
  }, { once: true });

  let parallaxRAF = null;
  window.addEventListener('pointermove', (e) => {
    if (reducedMotion() || parallaxRAF !== null) return;
    if (document.body.classList.contains('minimized')) return;
    const cx = e.clientX, cy = e.clientY;
    parallaxRAF = requestAnimationFrame(() => {
      parallaxRAF = null;
      const dx = (cx / window.innerWidth - 0.5) * -14;
      const dy = (cy / window.innerHeight - 0.5) * -10;
      wallpaper.style.setProperty('--px', dx.toFixed(1) + 'px');
      wallpaper.style.setProperty('--py', dy.toFixed(1) + 'px');
    });
  });

  // ============ WINDOW CHROME ============
  function restoreFromMinimize() {
    terminal.classList.remove('minimized');
    document.body.classList.remove('minimized');
    terminal.dataset.wasMaximized = '';
    cmdInput.focus();
  }
  let lastFocusBeforeOverlay = null;

  function setTerminalInert(value) {
    terminal.inert = value;
    if (value) terminal.setAttribute('aria-hidden', 'true');
    else terminal.removeAttribute('aria-hidden');
  }

  $('#dotClose').addEventListener('click', () => {
    lastFocusBeforeOverlay = document.activeElement;
    closeOverlay.classList.add('visible');
    closeOverlay.setAttribute('aria-hidden', 'false');
    setTerminalInert(true);
    $('#closeReopen').focus({ preventScroll: true });
  });
  function reopenTerminal() {
    closeOverlay.classList.remove('visible');
    closeOverlay.setAttribute('aria-hidden', 'true');
    setTerminalInert(false);
    terminal.style.display = '';
    terminal.classList.remove('minimized');
    document.body.classList.remove('minimized');
    if (lastFocusBeforeOverlay && lastFocusBeforeOverlay.focus) {
      try { lastFocusBeforeOverlay.focus({ preventScroll: true }); } catch (e) { cmdInput.focus(); }
    } else {
      cmdInput.focus();
    }
  }
  $('#closeReopen').addEventListener('click', reopenTerminal);

  // Focus stays inside the exit overlay while it is open
  closeOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); reopenTerminal(); return; }
    if (e.key !== 'Tab') return;
    const focusables = $$('button', closeOverlay).filter((b) => !b.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  $('#dotMinimize').addEventListener('click', () => {
    loadSharpWallpaper();
    const isMinimized = terminal.classList.toggle('minimized');
    document.body.classList.toggle('minimized', isMinimized);
    if (isMinimized) {
      terminal.dataset.wasMaximized = terminal.classList.contains('maximized') ? '1' : '';
      terminal.classList.remove('maximized');
      document.body.classList.remove('maximized');
    } else {
      if (terminal.dataset.wasMaximized === '1') {
        terminal.classList.add('maximized');
        document.body.classList.add('maximized');
      }
      cmdInput.focus();
    }
  });

  $('#dotMaximize').addEventListener('click', () => {
    if (terminal.classList.contains('minimized')) {
      terminal.classList.remove('minimized');
      document.body.classList.remove('minimized');
    }
    const isMaximized = terminal.classList.toggle('maximized');
    document.body.classList.toggle('maximized', isMaximized);
    cmdInput.focus();
  });

  // ============ ASCII + ROCKET SCALE-TO-FIT ============
  function fitWidePre(el, fontShrink) {
    if (!el) return;
    requestAnimationFrame(() => {
      const parent = el.parentElement;
      if (!parent) return;
      el.style.transform = '';
      el.style.height = '';
      const parentW = parent.clientWidth - 8;
      const w = el.scrollWidth;
      if (w > parentW && parentW > 0) {
        const scale = parentW / w;
        el.style.transform = 'scale(' + scale + ')';
        el.style.transformOrigin = 'top left';
        el.style.height = (el.scrollHeight * scale) + 'px';
      }
    });
  }
  function fitTerminalArt() {
    fitWidePre(asciiNameEl);
    fitWidePre($('.pixel-rocket'));
  }
  window.addEventListener('resize', fitTerminalArt);

  // ============ THEME ============
  function applyTheme(t, opts) {
    opts = opts || {};
    if (THEME_ENUM.indexOf(t) === -1) return false;
    store.theme = t;
    const root = document.documentElement;
    THEME_ENUM.forEach((x) => root.classList.remove('theme-' + x));
    if (t !== 'dark') root.classList.add('theme-' + t);
    renderStatusbar();
    renderExportPreview();
    if (!opts.silent) announce('Theme switched to ' + t);
    return true;
  }

  // ============ STATUS BAR + CLOCK ============
  const MODE_LABELS = { terminal: 'Terminal CLI', board: 'Projects Board', export: 'Export center', archive: 'Archive vault' };
  function consentLabel() { return store.consent === 'not-set' ? 'not set' : store.consent; }
  function countsInfo() {
    return { active: store.projects.length, archived: store.archive.length };
  }
  function renderStatusbar() {
    statusThemeBtn.textContent = '● ' + store.theme;
    statusProjects.textContent = store.projects.length + ' projects';
    statusConsent.textContent = 'consent: ' + consentLabel();
    $$('.mode-btn').forEach((b) => {
      const on = b.dataset.mode === store.mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const lastUndo = store.undoStack[store.undoStack.length - 1];
    const lastRedo = store.redoStack[store.redoStack.length - 1];
    undoBtn.disabled = !lastUndo;
    redoBtn.disabled = !lastRedo;
    undoBtn.title = lastUndo ? 'Undo — ' + lastUndo.label : 'Undo (empty history)';
    redoBtn.title = lastRedo ? 'Redo — ' + lastRedo.label : 'Redo (empty history)';
  }
  function tickClock() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    statusClock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  window.setInterval(tickClock, 1000);
  tickClock();

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  statusThemeBtn.addEventListener('click', () => {
    const next = THEME_ENUM[(THEME_ENUM.indexOf(store.theme) + 1) % THEME_ENUM.length];
    applyTheme(next);
    appendOutputLines([
      { text: '  Theme cycled to ' + next + ' — /themes to browse all four.', cls: 'accent' },
    ]);
  });
  $$('.mode-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  // ============ MODES / VIEWS ============
  const MODE_TITLES = {
    terminal: 'Your Name | Product Designer & Design Systems Lead',
    board: 'Projects | Your Name — Product Designer',
    export: 'Export center | Your Name — Product Designer',
    archive: 'Archive vault | Your Name — Product Designer',
  };
  function updateDocTitle(cmdSlug) {
    const ROUTE_TITLES = {
      about: 'About | Product Designer & Design Systems Lead',
      work: 'Work | Selected Projects | Product Designer',
      clients: 'Clients | Selected Companies | Product Designer',
      skills: 'Skills | Design Systems, UX, Product Design',
      contact: 'Contact | Product Designer & Design Systems Lead',
      social: 'Social Profiles | Product Designer',
      philosophy: 'Design philosophy | Product Designer',
      testimonials: 'Testimonials | What Clients & Peers Say',
      awards: 'Awards & Recognition | Product Designer',
      privacy: 'Privacy Policy',
      articles: 'Articles on Design Systems, UX & Strategy',
    };
    if (cmdSlug && ROUTE_TITLES[cmdSlug]) document.title = ROUTE_TITLES[cmdSlug];
    else document.title = MODE_TITLES[store.mode] || MODE_TITLES.terminal;
  }

  function setMode(mode, opts) {
    opts = opts || {};
    if (['terminal', 'board', 'export', 'archive'].indexOf(mode) === -1) mode = 'terminal';
    const previousMode = store.mode;
    store.mode = mode;
    terminalCore.hidden = mode !== 'terminal';
    boardView.hidden = mode !== 'board';
    exportView.hidden = mode !== 'export';
    archiveView.hidden = mode !== 'archive';
    document.body.dataset.mode = mode;
    if (mode === 'board') renderBoard();
    if (mode === 'export') renderExportPreview();
    if (mode === 'archive') renderArchive();
    renderStatusbar();
    updateDocTitle();
    if (previousMode !== mode && !reducedMotion()) {
      const activeView = mode === 'terminal' ? terminalCore : mode === 'board' ? boardView : mode === 'export' ? exportView : archiveView;
      activeView.classList.remove('view-enter');
      void activeView.offsetWidth;
      activeView.classList.add('view-enter');
      window.setTimeout(() => activeView.classList.remove('view-enter'), 320);
    }
    if (mode === 'terminal') {
      terminalBody.scrollTop = terminalBody.scrollHeight;
      if (!opts.noFocus) cmdInput.focus();
    } else {
      terminalBody.scrollTop = 0;
      if (!opts.noFocus) {
        if (mode === 'board') boardSearchEl.focus();
      }
    }
  }

  // ============ BOOT SEQUENCE ============
  const bootLines = [
    { text: 'Initializing portfolio system...', delay: 180 },
    { text: 'Loading design tokens... ', delay: 140 },
    { text: '[████████████████████████] ', delay: 100, append: true },
    { text: 'done', delay: 90, cls: 'done', append: true },
    { text: '\nResolving 12 projects...', delay: 140 },
    { text: 'Connecting to design systems core... ', delay: 180 },
    { text: 'ok', delay: 80, cls: 'done', append: true },
    { text: '\nDesign systems: operational', delay: 100 },
    { text: 'UX research modules: loaded', delay: 100 },
    { text: 'Don\'t search for /secrets here...', delay: 80, cls: 'dim' },
    { text: 'Strategic thinking: engaged', delay: 100 },
    { text: '\n✦ ', delay: 260 },
    { text: 'designer.portfolio v10.0', delay: 80, cls: 'accent', append: true },
    { text: ' — ready.\n', delay: 180, append: true },
    { text: 'Press Enter to continue...', delay: 100 },
  ];

  function finishBoot() {
    terminal.classList.remove('booting');
    bootText.textContent = '';
    asciiNameEl.textContent = ASCII_NAME;
    fitTerminalArt();
    cmdInput.focus();
    if (!bootedOnce) {
      bootedOnce = true;
      window.setTimeout(() => { if (store.consent === 'not-set') showConsentBanner(); }, reducedMotion() ? 100 : 650);
    }
  }

  async function runBoot() {
    if (reducedMotion()) { finishBoot(); return; }
    let dismissed = false;
    const waiter = new Promise((resolve) => {
      function onDismiss(e) {
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        dismissed = true;
        document.removeEventListener('keydown', onDismiss);
        document.removeEventListener('click', onDismiss);
        document.removeEventListener('touchstart', onDismiss);
        document.removeEventListener('pointerdown', onDismiss);
        resolve();
      }
      document.addEventListener('keydown', onDismiss);
      document.addEventListener('click', onDismiss);
      document.addEventListener('touchstart', onDismiss);
      document.addEventListener('pointerdown', onDismiss);
    });
    for (const step of bootLines) {
      if (dismissed) break;
      await sleep(step.delay || 100);
      if (dismissed) break;
      const el = document.createElement(step.append ? 'span' : 'div');
      if (step.cls) el.className = step.cls;
      el.textContent = step.text;
      bootText.appendChild(el);
    }
    if (!dismissed) await waiter;
    finishBoot();
  }

  // ============ CONSENT BANNER ============
  function showConsentBanner() {
    if (store.consent !== 'not-set') return;
    if ($('#consentBanner')) return;
    const banner = document.createElement('div');
    banner.className = 'output-block';
    banner.id = 'consentBanner';
    banner.innerHTML =
      '<div class="output-line dim" style="font-style:italic">  <span class="accent" style="opacity:0.7">[system]</span> This site uses analytics cookies (GA4) to understand traffic. No analytics library is bundled in this demo.</div>' +
      '<div class="output-line" style="margin-top:8px"><span style="margin-left:2ch">' +
      '<button type="button" id="consentAccept" class="btn" style="min-width:96px">Accept</button> ' +
      '<button type="button" id="consentDecline" class="btn btn-ghost" style="min-width:96px">Decline</button> ' +
      '<span class="dim" style="font-style:italic">· /privacy for details</span></span></div>';
    outputArea.appendChild(banner);
    terminalBody.scrollTop = terminalBody.scrollHeight;

    const choose = (value) => {
      store.consent = value;
      banner.innerHTML = '<div class="output-line dim" style="font-style:italic">  <span class="accent" style="opacity:0.7">[system]</span> Analytics cookies ' +
        (value === 'accepted' ? 'accepted. Thank you.' : 'declined. No tracking cookies will be used.') + '</div>';
      renderStatusbar();
      renderExportPreview();
      announce('Cookie consent: ' + value);
      window.setTimeout(() => banner.remove(), 2600);
    };
    $('#consentAccept').addEventListener('click', () => choose('accepted'));
    $('#consentDecline').addEventListener('click', () => choose('declined'));
  }

  // ============ FIELD CONTRACT VALIDATION ============
  function coerceTags(v) {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }
  function coerceStats(v) { return coerceTags(v); }
  function coerceYear(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v.trim());
    return NaN;
  }

  // Project field contract — shared by the create/edit form, Import, and WebMCP entity ops.
  function validateProject(p, opts) {
    opts = opts || {};
    const list = opts.projects || store.projects;
    const exId = opts.excludeId || null;
    const errors = {};
    const name = typeof p.name === 'string' ? p.name.trim() : '';
    if (!name) errors.name = 'Name is required (1–80 characters).';
    else if (name.length > 80) errors.name = 'Name must be 80 characters or fewer (got ' + name.length + ').';
    const slug = typeof p.slug === 'string' ? p.slug.trim() : '';
    if (!slug) errors.slug = 'Slug is required (1–48 characters).';
    else if (!SLUG_RE.test(slug)) errors.slug = 'Slug may only contain lowercase letters, digits, and hyphens ("' + slug + '" is illegal).';
    else if (slug.length > 48) errors.slug = 'Slug must be 48 characters or fewer.';
    else if (list.some((q) => q.id !== exId && q.slug === slug)) errors.slug = 'Slug "' + slug + '" is already used by another active project — pick a unique slug.';
    const blurb = typeof p.blurb === 'string' ? p.blurb.trim() : '';
    if (!blurb) errors.blurb = 'Blurb is required (1–280 characters).';
    else if (blurb.length > 280) errors.blurb = 'Blurb must be 280 characters or fewer (got ' + blurb.length + ').';
    if (STATUS_ENUM.indexOf(p.status) === -1) errors.status = 'Status must be exactly one of shipped, wip, or archived (got "' + String(p.status) + '").';
    const tags = p.tags;
    if (!Array.isArray(tags) || tags.length === 0) errors.tags = 'Tags are required — provide 1 to 8 unique tags.';
    else if (tags.length > 8) errors.tags = 'Too many tags — provide 1 to 8 (got ' + tags.length + ').';
    else if (tags.some((t) => typeof t !== 'string' || !t.trim())) errors.tags = 'Each tag must be a non-empty string (1–24 characters).';
    else if (tags.some((t) => t.trim().length > 24)) errors.tags = 'Each tag must be 24 characters or fewer.';
    else if (new Set(tags.map((t) => t.trim().toLowerCase())).size !== tags.length) errors.tags = 'Tags must be unique — remove the duplicates.';
    const stats = p.stats;
    if (!Array.isArray(stats) || stats.length === 0) errors.stats = 'Stats are required — provide 1 to 4 stat chips.';
    else if (stats.length > 4) errors.stats = 'Too many stats — provide 1 to 4 (got ' + stats.length + ').';
    else if (stats.some((s) => typeof s !== 'string' || !s.trim() || s.trim().length > 32)) errors.stats = 'Each stat must be a non-empty string of 32 characters or fewer.';
    const type = typeof p.type === 'string' ? p.type.trim() : '';
    if (!type) errors.type = 'Type is required (1–40 characters) — the project type label.';
    else if (type.length > 40) errors.type = 'Type must be 40 characters or fewer.';
    const yn = coerceYear(p.year);
    if (!Number.isInteger(yn)) errors.year = 'Year is required and must be an integer from 1990 to 2100.';
    else if (yn < 1990 || yn > 2100) errors.year = 'Year must be between 1990 and 2100 (got ' + yn + ').';
    return errors;
  }

  // Portfolio JSON field contract — shared by the Import panel and artifact_import.
  function validatePortfolio(doc) {
    const errs = [];
    if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
      errs.push('root: must be a JSON object with version, theme, consent, and projects keys');
      return errs;
    }
    if (!('version' in doc)) errs.push('version: required and must be exactly "1.0"');
    else if (doc.version !== '1.0') errs.push('version: must be exactly "1.0" (got ' + JSON.stringify(doc.version) + ')');
    if (!('theme' in doc)) errs.push('theme: required (one of dark, light, retro, glass)');
    else if (THEME_ENUM.indexOf(doc.theme) === -1) errs.push('theme: must be one of dark, light, retro, glass (got ' + JSON.stringify(doc.theme) + ')');
    if (!('consent' in doc)) errs.push('consent: required (one of accepted, declined, not-set)');
    else if (CONSENT_ENUM.indexOf(doc.consent) === -1) errs.push('consent: must be one of accepted, declined, not-set (got ' + JSON.stringify(doc.consent) + ')');
    if (!('projects' in doc)) errs.push('projects: required and must be an array of project objects');
    else if (!Array.isArray(doc.projects)) errs.push('projects: must be an array of project objects');
    else {
      const seen = new Map();
      doc.projects.forEach((p, i) => {
        if (p === null || typeof p !== 'object' || Array.isArray(p)) {
          errs.push('projects[' + i + ']: must be an object matching the project field contract');
          return;
        }
        const ve = validateProject(p, { projects: [], excludeId: null });
        Object.keys(ve).forEach((f) => errs.push('projects[' + i + '].' + f + ': ' + ve[f]));
        if (typeof p.slug === 'string' && SLUG_RE.test(p.slug)) {
          if (seen.has(p.slug)) errs.push('projects[' + i + '].slug: duplicate slug "' + p.slug + '" within the import set (first at projects[' + seen.get(p.slug) + '])');
          else seen.set(p.slug, i);
        }
      });
    }
    return errs;
  }

  function slugify(s) {
    let base = String(s || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'project';
    let out = base, i = 2;
    while (store.projects.some((p) => p.slug === out)) out = base + '-' + (i++);
    return out;
  }

  function defaultsFor(name) {
    return {
      slug: slugify(name),
      blurb: 'A fresh portfolio project — details coming soon.',
      status: 'wip',
      tags: ['Product Design'],
      stats: ['Just added'],
      type: 'Design project',
      year: CURRENT_YEAR,
    };
  }

  function publicRecord(p) {
    return { name: p.name, slug: p.slug, blurb: p.blurb, status: p.status, tags: p.tags.slice(), stats: p.stats.slice(), type: p.type, year: p.year };
  }

  // ============ MUTATIONS + UNDO/REDO ============
  function snapshot() { return { projects: clone(store.projects), archive: clone(store.archive) }; }
  function pushUndo(label) {
    store.undoStack.push({ label: label, projects: clone(store.projects), archive: clone(store.archive) });
    if (store.undoStack.length > 80) store.undoStack.shift();
    store.redoStack.length = 0;
  }
  function undo() {
    if (!store.undoStack.length) { announce('Nothing to undo — the history stack is empty.'); return false; }
    const entry = store.undoStack.pop();
    store.redoStack.push({ label: entry.label, projects: clone(store.projects), archive: clone(store.archive) });
    store.projects = entry.projects;
    store.archive = entry.archive;
    store.selection.clear();
    renderAll();
    toast('Undid: ' + entry.label);
    return true;
  }
  function redo() {
    if (!store.redoStack.length) { announce('Nothing to redo — the redo stack is empty.'); return false; }
    const entry = store.redoStack.pop();
    store.undoStack.push({ label: entry.label, projects: clone(store.projects), archive: clone(store.archive) });
    store.projects = entry.projects;
    store.archive = entry.archive;
    store.selection.clear();
    renderAll();
    toast('Redid: ' + entry.label);
    return true;
  }

  function byId(id) { return store.projects.find((p) => p.id === id) || null; }
  function findBySlug(slug) { return store.projects.find((p) => p.slug === String(slug).toLowerCase()) || null; }

  function createProject(rec, opts) {
    opts = opts || {};
    pushUndo('Created "' + rec.name + '"');
    const record = {
      id: uid(),
      name: rec.name.trim(),
      slug: rec.slug.trim(),
      blurb: rec.blurb.trim(),
      status: rec.status,
      tags: rec.tags.map((t) => t.trim()),
      stats: rec.stats.map((s) => s.trim()),
      type: rec.type.trim(),
      year: coerceYear(rec.year),
    };
    store.projects.push(record);
    store.justAddedId = record.id;
    renderAll();
    store.justAddedId = null;
    if (!opts.quiet) toast('Created "' + record.name + '" — shortcut /' + record.slug + ' is live');
    return record;
  }

  function updateProject(id, rec, opts) {
    opts = opts || {};
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const old = store.projects[idx];
    pushUndo('Edited "' + old.name + '"');
    store.projects[idx] = {
      id: old.id,
      name: rec.name.trim(),
      slug: rec.slug.trim(),
      blurb: rec.blurb.trim(),
      status: rec.status,
      tags: rec.tags.map((t) => t.trim()),
      stats: rec.stats.map((s) => s.trim()),
      type: rec.type.trim(),
      year: coerceYear(rec.year),
    };
    renderAll();
    if (!opts.quiet) toast('Updated "' + store.projects[idx].name + '" across board, /work, and export');
    return store.projects[idx];
  }

  function deleteProject(id, opts) {
    opts = opts || {};
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const p = store.projects[idx];
    pushUndo('Deleted "' + p.name + '"');
    store.projects.splice(idx, 1);
    store.selection.delete(id);
    store.boardMotion = 'delete';
    if (!store.projects.length) store.query = '';
    renderAll();
    if (!opts.quiet) toast('Deleted "' + p.name + '" — Ctrl+Z to undo');
    return true;
  }

  function archiveProjects(ids, opts) {
    opts = opts || {};
    const moving = store.projects.filter((p) => ids.indexOf(p.id) !== -1);
    if (!moving.length) return;
    pushUndo('Archived ' + moving.length + ' project' + (moving.length > 1 ? 's' : ''));
    store.projects = store.projects.filter((p) => ids.indexOf(p.id) === -1);
    moving.forEach((p) => store.archive.push(clone(p)));
    ids.forEach((id) => store.selection.delete(id));
    store.boardMotion = 'archive';
    if (!store.projects.length) store.query = '';
    renderAll();
    if (!opts.quiet) toast('Archived ' + moving.length + ' project' + (moving.length > 1 ? 's' : '') + ' — see /archive');
  }

  function restoreProject(id, opts) {
    opts = opts || {};
    const idx = store.archive.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const p = store.archive[idx];
    pushUndo('Restored "' + p.name + '"');
    store.archive.splice(idx, 1);
    store.projects.push(clone(p));
    store.justAddedId = p.id;
    renderAll();
    store.justAddedId = null;
    if (!opts.quiet) toast('Restored "' + p.name + '" to the board');
    return true;
  }

  function applyImportedProjects(doc, opts) {
    opts = opts || {};
    pushUndo('Imported ' + doc.projects.length + ' project' + (doc.projects.length === 1 ? '' : 's'));
    store.projects = doc.projects.map((p) => ({
      id: uid(),
      name: String(p.name).trim(),
      slug: String(p.slug).trim(),
      blurb: String(p.blurb).trim(),
      status: p.status,
      tags: p.tags.map((t) => String(t).trim()),
      stats: p.stats.map((s) => String(s).trim()),
      type: String(p.type).trim(),
      year: coerceYear(p.year),
    }));
    store.selection.clear();
    if (THEME_ENUM.indexOf(doc.theme) !== -1) applyTheme(doc.theme, { silent: true });
    if (CONSENT_ENUM.indexOf(doc.consent) !== -1) store.consent = doc.consent;
    renderAll();
    if (!opts.quiet) toast('Imported ' + store.projects.length + ' projects — board, /work, /stats, and export updated');
    return store.projects.length;
  }

  // ============ BOARD: FILTERING ============
  function parseQuery(q) {
    const out = { status: null, tag: null, terms: [] };
    const toks = String(q || '').trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      const m = tok.match(/^(status|tag):(.*)$/i);
      if (!m) { out.terms.push(tok.toLowerCase()); continue; }
      const kind = m[1].toLowerCase();
      const parts = [m[2]];
      if (kind === 'tag') {
        // tag values may contain spaces ("tag:design system") — consume tokens
        // until the next status:/tag: token
        while (i + 1 < toks.length && !/^(status|tag):/i.test(toks[i + 1])) {
          i++;
          parts.push(toks[i]);
        }
      }
      const value = parts.join(' ').trim();
      if (kind === 'status') out.status = value.toLowerCase() || null;
      else out.tag = value || null;
    }
    return out;
  }
  function projectMatches(p, pq) {
    if (pq.status && p.status !== pq.status) return false;
    if (pq.tag && !p.tags.some((t) => t.toLowerCase() === pq.tag.toLowerCase())) return false;
    if (pq.terms.length) {
      const hay = (p.name + ' ' + p.slug + ' ' + p.type + ' ' + p.tags.join(' ')).toLowerCase();
      if (!pq.terms.every((t) => hay.indexOf(t) !== -1)) return false;
    }
    return true;
  }
  function filteredProjects() {
    const pq = parseQuery(store.query);
    return store.projects.filter((p) => projectMatches(p, pq));
  }
  function statusCounts() {
    const c = { shipped: 0, wip: 0, archived: 0 };
    store.projects.forEach((p) => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }
  function tagFrequencies(list) {
    const freq = new Map();
    list.forEach((p) => p.tags.forEach((t) => freq.set(t, (freq.get(t) || 0) + 1)));
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  // ============ BOARD: RENDER ============
  function cardHtml(p) {
    const checked = store.selection.has(p.id) ? ' checked' : '';
    const sel = store.selection.has(p.id) ? ' selected' : '';
    return '<article class="board-card' + sel + '" data-id="' + escapeHtml(p.id) + '">' +
      '<div class="board-card-top">' +
      '<label class="card-check"><input type="checkbox" data-check' + checked + ' aria-label="Select ' + escapeHtml(p.name) + '"></label>' +
      '<h3>' + escapeHtml(p.name) + '</h3>' +
      '<span class="card-year">' + escapeHtml(String(p.year)) + '</span>' +
      '</div>' +
      '<div class="card-type">' + escapeHtml(p.type) + ' <span class="status-badge ' + p.status + '">' + p.status + '</span></div>' +
      '<p class="card-blurb">' + escapeHtml(p.blurb) + '</p>' +
      '<div class="card-tags">' + p.tags.map((t) => '<span class="project-tag">' + escapeHtml(t) + '</span>').join('') + '</div>' +
      '<div class="card-stats">' + p.stats.map((s) => '<span class="card-stat">✦ ' + escapeHtml(s) + '</span>').join('') + '</div>' +
      '<div class="card-actions">' +
      '<button type="button" class="btn" data-act="view">View</button>' +
      '<button type="button" class="btn" data-act="edit">Edit</button>' +
      '<button type="button" class="btn" data-act="archive">Archive</button>' +
      '<button type="button" class="btn danger" data-act="delete">Delete</button>' +
      '</div></article>';
  }

  function renderBoard() {
    const pq = parseQuery(store.query);
    if (document.activeElement !== boardSearchEl) boardSearchEl.value = store.query;

    $$('.chip', statusChipsEl).forEach((c) => {
      c.classList.toggle('active', (c.dataset.status || '') === (pq.status || ''));
    });

    const allTags = Array.from(new Set(store.projects.flatMap((p) => p.tags))).sort((a, b) => a.localeCompare(b));
    const currentTag = pq.tag ? pq.tag.toLowerCase() : '';
    tagFilterEl.innerHTML = '<option value="">All tags</option>' +
      allTags.map((t) => '<option value="' + escapeHtml(t) + '"' + (t.toLowerCase() === currentTag ? ' selected' : '') + '>' + escapeHtml(t) + '</option>').join('');

    const counts = statusCounts();
    boardCount.textContent = store.projects.length + ' active';
    statsStrip.textContent = store.projects.length + ' active · ' + counts.shipped + ' shipped · ' + counts.wip + ' wip · vault ' + store.archive.length;

    const list = filteredProjects();
    boardGrid.innerHTML = list.map(cardHtml).join('');
    if (store.boardMotion && !reducedMotion()) {
      $$('.board-card', boardGrid).forEach((card, i) => {
        card.classList.add('card-reflow');
        card.style.animationDelay = Math.min(i * 18, 126) + 'ms';
      });
    }
    store.boardMotion = '';
    if (store.justAddedId) {
      const el = boardGrid.querySelector('[data-id="' + (window.CSS && CSS.escape ? CSS.escape(store.justAddedId) : store.justAddedId) + '"]');
      if (el) el.classList.add('card-enter');
    }

    if (store.projects.length === 0) {
      boardEmpty.hidden = false;
      boardEmpty.innerHTML = '<span class="empty-title">No projects in the collection</span>' +
        'The board is empty. Create the first project here or run <b>/create</b> in the terminal.<br>' +
        '<button type="button" class="btn btn-primary" data-act="create-project">+ New project</button>';
    } else if (list.length === 0) {
      boardEmpty.hidden = false;
      boardEmpty.innerHTML = '<span class="empty-title">No projects match "' + escapeHtml(store.query) + '"</span>' +
        'Try a different status, tag, or name — or clear the filter to see every project again.<br>' +
        '<button type="button" class="btn" data-act="clear-filters">Clear filters</button>';
    } else {
      boardEmpty.hidden = true;
      boardEmpty.innerHTML = '';
    }

    const visIds = list.map((p) => p.id);
    selectAllEl.checked = visIds.length > 0 && visIds.every((id) => store.selection.has(id));
    selectAllEl.indeterminate = !selectAllEl.checked && visIds.some((id) => store.selection.has(id));
    syncBulkbar();
  }

  function syncBulkbar() {
    bulkBar.hidden = store.selection.size === 0;
    bulkCount.textContent = store.selection.size + ' selected';
  }
  function syncSelectionUI() {
    $$('.board-card', boardGrid).forEach((card) => {
      const id = card.dataset.id;
      card.classList.toggle('selected', store.selection.has(id));
      const cb = card.querySelector('input[data-check]');
      if (cb) cb.checked = store.selection.has(id);
    });
    const list = filteredProjects();
    const visIds = list.map((p) => p.id);
    selectAllEl.checked = visIds.length > 0 && visIds.every((id) => store.selection.has(id));
    selectAllEl.indeterminate = !selectAllEl.checked && visIds.some((id) => store.selection.has(id));
    syncBulkbar();
    renderStatusbar();
  }

  function animateCardsOut(ids, done) {
    const cards = ids.map((id) => boardGrid.querySelector('[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]')).filter(Boolean);
    if (reducedMotion() || !cards.length || store.mode !== 'board') { done(); return; }
    cards.forEach((c) => c.classList.add('card-exit'));
    window.setTimeout(done, 280);
  }

  // ============ BOARD: EVENTS ============
  boardGrid.addEventListener('change', (e) => {
    const cb = e.target.closest ? e.target.closest('input[data-check]') : null;
    if (!cb) return;
    const card = cb.closest('.board-card');
    const id = card && card.dataset.id;
    if (!id) return;
    if (cb.checked) store.selection.add(id); else store.selection.delete(id);
    syncSelectionUI();
  });

  boardGrid.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!btn) return;
    const act = btn.dataset.act;
    const card = btn.closest('.board-card');
    const id = card ? card.dataset.id : null;
    const p = id ? byId(id) : null;
    if (act === 'view' && p) { setMode('terminal'); executeCommand('/' + p.slug); return; }
    if (act === 'edit' && p) { openEditForm(p.id); return; }
    if (act === 'archive' && p) { animateCardsOut([p.id], () => archiveProjects([p.id])); return; }
    if (act === 'delete' && p) { animateCardsOut([p.id], () => deleteProject(p.id)); return; }
  });

  boardEmpty.addEventListener('click', (e) => {
    const create = e.target.closest ? e.target.closest('[data-act="create-project"]') : null;
    if (create) { openCreateForm(); return; }
    const btn = e.target.closest ? e.target.closest('[data-act="clear-filters"]') : null;
    if (!btn) return;
    store.query = '';
    renderBoard();
  });

  statusChipsEl.addEventListener('click', (e) => {
    const chip = e.target.closest ? e.target.closest('.chip') : null;
    if (!chip) return;
    const s = chip.dataset.status || '';
    store.query = s ? 'status:' + s : '';
    renderBoard();
  });

  tagFilterEl.addEventListener('change', () => {
    const pq = parseQuery(store.query);
    const parts = [];
    if (pq.status) parts.push('status:' + pq.status);
    if (tagFilterEl.value) parts.push('tag:' + tagFilterEl.value);
    parts.push.apply(parts, pq.terms);
    store.query = parts.join(' ');
    renderBoard();
  });

  boardSearchEl.addEventListener('input', () => {
    store.query = boardSearchEl.value;
    renderBoard();
  });
  boardSearchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); renderBoard(); }
  });

  selectAllEl.addEventListener('change', () => {
    const visIds = filteredProjects().map((p) => p.id);
    if (selectAllEl.checked) visIds.forEach((id) => store.selection.add(id));
    else visIds.forEach((id) => store.selection.delete(id));
    renderBoard();
  });

  $('#bulkArchiveBtn').addEventListener('click', () => {
    const ids = Array.from(store.selection);
    if (!ids.length) return;
    animateCardsOut(ids, () => archiveProjects(ids));
  });
  $('#bulkClearBtn').addEventListener('click', () => {
    store.selection.clear();
    renderBoard();
  });
  $('#newProjectBtn').addEventListener('click', () => openCreateForm());

  // ============ PROJECT FORM (create + edit) ============
  const FORM_FIELDS = [
    { key: 'name', label: 'Name', required: true, wide: false, placeholder: 'Northline Studio', hint: '' },
    { key: 'slug', label: 'Slug', required: true, wide: false, placeholder: 'northline-studio', hint: '' },
    { key: 'blurb', label: 'Blurb', required: true, wide: true, placeholder: 'One or two sentences describing the project', hint: '', textarea: true },
    { key: 'status', label: 'Status', required: true, wide: false, select: STATUS_ENUM },
    { key: 'tags', label: 'Tags (comma separated, 1–8)', required: true, wide: false, placeholder: 'UX Design, Dashboard' },
    { key: 'stats', label: 'Stat chips (comma separated, 1–4)', required: true, wide: false, placeholder: '38% faster tasks, 9.4/10 confidence' },
    { key: 'type', label: 'Type', required: true, wide: false, placeholder: 'Analytics Data Platform' },
    { key: 'year', label: 'Year (1990–2100)', required: true, wide: false, placeholder: String(CURRENT_YEAR) },
  ];

  function openCreateForm() {
    store.formBusy = false;
    store.editingId = null;
    store.draft = { name: '', slug: '', blurb: '', status: 'shipped', tags: '', stats: '', type: '', year: String(CURRENT_YEAR) };
    store.draftSlugTouched = false;
    setMode('board', { noFocus: true });
    renderForm();
    const f = $('#f-name');
    if (f) f.focus();
  }
  function openEditForm(id) {
    const p = byId(id);
    if (!p) return;
    store.formBusy = false;
    store.editingId = id;
    store.draft = { name: p.name, slug: p.slug, blurb: p.blurb, status: p.status, tags: p.tags.join(', '), stats: p.stats.join(', '), type: p.type, year: String(p.year) };
    store.draftSlugTouched = true;
    setMode('board', { noFocus: true });
    renderForm();
  }
  function closeForm() {
    store.editingId = null;
    store.draft = null;
    formSlot.innerHTML = '';
  }

  function renderForm() {
    const d = store.draft || {};
    const editing = !!store.editingId;
    let html = '<form class="form-panel" id="projectForm" novalidate>' +
      '<div class="form-head"><h3>' + (editing ? 'Edit project' : 'New project') + '</h3>' +
      '<span class="dim">Every field follows the project field contract' + (editing ? ' · editing "' + escapeHtml((byId(store.editingId) || {}).name || '') + '"' : '') + '</span></div>' +
      '<div class="form-grid">';
    FORM_FIELDS.forEach((f) => {
      const val = d[f.key] != null ? d[f.key] : '';
      html += '<div class="field' + (f.wide ? ' wide' : '') + '">' +
        '<label for="f-' + f.key + '">' + f.label + (f.required ? ' <b>*</b>' : '') + '</label>';
      if (f.select) {
        html += '<select id="f-' + f.key + '" data-field="' + f.key + '">' +
          f.select.map((o) => '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
      } else if (f.textarea) {
        html += '<textarea id="f-' + f.key + '" data-field="' + f.key + '" rows="2" placeholder="' + escapeHtml(f.placeholder || '') + '">' + escapeHtml(val) + '</textarea>';
      } else {
        html += '<input id="f-' + f.key + '" data-field="' + f.key + '" type="text" value="' + escapeHtml(val) + '" placeholder="' + escapeHtml(f.placeholder || '') + '"' + (f.key === 'year' ? ' inputmode="numeric"' : '') + '>';
      }
      html += '<div class="field-error" id="err-' + f.key + '" hidden></div></div>';
    });
    html += '</div><div class="form-actions">' +
      '<button type="submit" class="btn btn-primary" id="formSubmit">' + (editing ? 'Save changes' : 'Create project') + '</button>' +
      '<button type="button" class="btn btn-ghost" id="formCancel">Cancel</button>' +
      '<span class="form-note">* required · slug: lowercase a–z, 0–9, hyphens · year 1990–2100</span>' +
      '</div></form>';
    formSlot.innerHTML = html;

    const form = $('#projectForm');
    form.addEventListener('input', (e) => {
      const el = e.target;
      const field = el.dataset && el.dataset.field;
      if (!field) return;
      store.draft[field] = el.value;
      if (field === 'name' && !store.draftSlugTouched) {
        store.draft.slug = slugify(el.value);
        const slugInput = $('#f-slug');
        if (slugInput) slugInput.value = store.draft.slug;
      }
      if (field === 'slug' && el.value !== slugify(store.draft.name)) store.draftSlugTouched = true;
      const err = $('#err-' + field);
      if (err) { err.hidden = true; err.textContent = ''; }
      el.removeAttribute('aria-invalid');
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (store.formBusy) return;
      store.formBusy = true;
      const submit = $('#formSubmit');
      if (submit) { submit.disabled = true; submit.setAttribute('aria-disabled', 'true'); }
      const committed = submitProjectForm();
      if (!committed) {
        store.formBusy = false;
        if (submit) { submit.disabled = false; submit.removeAttribute('aria-disabled'); }
      }
    });
    $('#formCancel').addEventListener('click', closeForm);
  }

  function collectDraft() {
    const d = store.draft || {};
    return {
      name: String(d.name || '').trim(),
      slug: String(d.slug || '').trim().toLowerCase(),
      blurb: String(d.blurb || '').trim(),
      status: d.status,
      tags: coerceTags(d.tags),
      stats: coerceStats(d.stats),
      type: String(d.type || '').trim(),
      year: d.year,
    };
  }

  function submitProjectForm() {
    const rec = collectDraft();
    const errors = validateProject(rec, { excludeId: store.editingId });
    const keys = Object.keys(errors);
    if (keys.length) {
      keys.forEach((k) => {
        const err = $('#err-' + k);
        const input = $('#f-' + k);
        if (err) { err.hidden = false; err.textContent = errors[k]; }
        if (input) input.setAttribute('aria-invalid', 'true');
      });
      const first = $('#f-' + keys[0]);
      if (first) first.focus();
      announce(keys.length + ' field' + (keys.length > 1 ? 's' : '') + ' need attention: ' + keys.join(', '));
      return false;
    }
    if (store.editingId) {
      updateProject(store.editingId, rec);
    } else {
      createProject(rec);
    }
    closeForm();
    return true;
  }

  // ============ ARCHIVE VAULT ============
  function renderArchive() {
    vaultCount.textContent = store.archive.length + ' archived';
    if (!store.archive.length) {
      vaultList.innerHTML = '';
      vaultEmpty.hidden = false;
      vaultEmpty.innerHTML = '<span class="empty-title">Archive vault is empty</span>' +
        'Archived projects wait here. On the Projects Board, select projects and choose <b>Archive selected</b>, or use a project\'s Archive action. Restore any of them back to the board at any time.';
      return;
    }
    vaultEmpty.hidden = true;
    vaultList.innerHTML = store.archive.map((p) =>
      '<div class="vault-row" data-id="' + escapeHtml(p.id) + '">' +
      '<h3>' + escapeHtml(p.name) + '</h3>' +
      '<span class="vault-meta">' + escapeHtml(p.type) + ' · ' + escapeHtml(String(p.year)) + ' · <span class="status-badge ' + p.status + '">' + p.status + '</span></span>' +
      '<button type="button" class="btn" data-act="restore">Restore</button>' +
      '</div>').join('');
  }
  vaultList.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-act="restore"]') : null;
    if (!btn) return;
    const row = btn.closest('.vault-row');
    if (row && row.dataset.id) restoreProject(row.dataset.id);
  });

  // ============ EXPORT CENTER ============
  function portfolioObject() {
    return {
      version: '1.0',
      theme: store.theme,
      consent: store.consent,
      projects: store.projects.map((p) => ({
        name: p.name, slug: p.slug, blurb: p.blurb, status: p.status,
        tags: p.tags.slice(), stats: p.stats.slice(), type: p.type, year: p.year,
      })),
    };
  }
  function portfolioJsonText() { return JSON.stringify(portfolioObject(), null, 2); }
  function resumeMarkdownText() {
    const L = [];
    L.push('# Your Name — Product Designer');
    L.push('');
    L.push('Your City, Country · ' + EMAIL_ADDR + ' · designstudio.example');
    L.push('');
    L.push('## Projects');
    L.push('');
    if (!store.projects.length) {
      L.push('_No active projects in this session._');
    }
    store.projects.forEach((p) => {
      L.push('### ' + p.name + ' (' + p.year + ')');
      L.push('- Status: ' + p.status + ' · Type: ' + p.type + ' · Slug: ' + p.slug);
      L.push('- ' + p.blurb);
      L.push('- Tags: ' + p.tags.join(' · '));
      L.push('- Highlights: ' + p.stats.join(' · '));
      L.push('');
    });
    L.push('---');
    L.push('');
    L.push('_Generated live from the session store — ' + store.projects.length + ' active project' + (store.projects.length === 1 ? '' : 's') + ', theme "' + store.theme + '", consent "' + store.consent + '"._');
    return L.join('\n');
  }
  function currentExportText() { return exportPreview.textContent; }

  function renderExportPreview() {
    if (!exportPreview) return;
    exportPreview.textContent = store.exportTab === 'markdown' ? resumeMarkdownText() : portfolioJsonText();
    tabJson.classList.toggle('active', store.exportTab === 'json');
    tabMd.classList.toggle('active', store.exportTab === 'markdown');
    tabJson.setAttribute('aria-selected', store.exportTab === 'json' ? 'true' : 'false');
    tabMd.setAttribute('aria-selected', store.exportTab === 'markdown' ? 'true' : 'false');
  }
  tabJson.addEventListener('click', () => { store.exportTab = 'json'; renderExportPreview(); });
  tabMd.addEventListener('click', () => { store.exportTab = 'markdown'; renderExportPreview(); });

  let copyConfirmTimer = null;
  function showCopyConfirm(msg) {
    copyConfirm.textContent = msg;
    copyConfirm.hidden = false;
    copyConfirm.classList.remove('hide');
    if (copyConfirmTimer) clearTimeout(copyConfirmTimer);
    copyConfirmTimer = window.setTimeout(() => {
      copyConfirm.classList.add('hide');
      window.setTimeout(() => { copyConfirm.hidden = true; }, 320);
    }, 1900);
  }

  async function copyExportText(format) {
    if (format === 'markdown') store.exportTab = 'markdown';
    else if (format === 'json') store.exportTab = 'json';
    renderExportPreview();
    const text = currentExportText();
    store.lastExportJson = portfolioJsonText();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (err) {
      try {
        const range = document.createRange();
        range.selectNodeContents(exportPreview);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e2) { /* leave preview as-is */ }
    }
    showCopyConfirm(ok ? 'Copied to clipboard ✓' : 'Clipboard blocked — preview text selected, press Ctrl+C');
    announce(ok ? 'Export copied to clipboard' : 'Clipboard unavailable, preview text selected');
    return ok;
  }
  $('#copyExportBtn').addEventListener('click', () => copyExportText(store.exportTab));

  $('#downloadExportBtn').addEventListener('click', () => {
    const isJson = store.exportTab === 'json';
    const text = currentExportText();
    store.lastExportJson = portfolioJsonText();
    const blob = new Blob([text], { type: isJson ? 'application/json' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isJson ? 'portfolio.json' : 'resume.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Downloaded ' + (isJson ? 'portfolio.json' : 'resume.md'));
  });

  $('#toggleImportBtn').addEventListener('click', () => {
    importPanel.hidden = !importPanel.hidden;
    if (!importPanel.hidden) importText.focus();
  });

  function setImportMsg(kind, html) {
    importMsg.className = 'import-msg ' + kind;
    importMsg.innerHTML = html;
  }

  function runImportFromText(raw) {
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch (err) {
      setImportMsg('bad', 'Malformed JSON — ' + escapeHtml(String(err.message || err)) + '. Nothing was changed.');
      announce('Import failed: malformed JSON');
      return { ok: false };
    }
    const problems = validatePortfolio(doc);
    if (problems.length) {
      setImportMsg('bad', 'Import rejected — the payload violates the Portfolio JSON field contract:<br>· ' +
        problems.slice(0, 5).map(escapeHtml).join('<br>· ') +
        (problems.length > 5 ? '<br>· … and ' + (problems.length - 5) + ' more' : '') +
        '<br>Nothing was changed.');
      announce('Import rejected: ' + problems[0]);
      return { ok: false, problems: problems };
    }
    const n = applyImportedProjects(doc);
    setImportMsg('ok', 'Imported ' + n + ' project' + (n === 1 ? '' : 's') + ' — board, /work, /stats, and both export tabs now match the package.');
    announce('Imported ' + n + ' projects');
    return { ok: true, count: n };
  }
  $('#runImportBtn').addEventListener('click', () => runImportFromText(importText.value));
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importText.value = String(reader.result || '');
      runImportFromText(importText.value);
    };
    reader.readAsText(file);
  });

  function renderAll() {
    renderBoard();
    renderArchive();
    renderExportPreview();
    renderStatusbar();
  }

  // ============ TERMINAL OUTPUT HELPERS ============
  function appendOutputLines(lines) {
    const block = document.createElement('div');
    block.className = 'output-block';
    lines.forEach((line) => {
      const div = document.createElement('div');
      div.className = 'output-line' + (line.cls ? ' ' + line.cls : '');
      if (line.style) div.setAttribute('style', line.style);
      if (line.html) div.innerHTML = line.html;
      else div.textContent = line.text != null ? line.text : '';
      block.appendChild(div);
    });
    outputArea.appendChild(block);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    return block;
  }

  function applyStagger(container) {
    if (reducedMotion()) return;
    const children = container.querySelectorAll('.output-line, .project-card, .client-item, .skill-bar, .social-link');
    let index = 0;
    children.forEach((el) => {
      if (el.closest('.cmd-echo')) return;
      el.classList.add('stagger-child');
      el.style.setProperty('--i', Math.min(index, 26));
      index++;
    });
  }

  function makeBlockWithEcho(typed) {
    const block = document.createElement('div');
    block.className = 'output-block';
    const echo = document.createElement('div');
    echo.className = 'cmd-echo';
    echo.innerHTML = '<span class="prompt-symbol">&gt;</span> ' + escapeHtml(typed);
    block.appendChild(echo);
    outputArea.appendChild(block);
    return block;
  }

  function renderInto(block, result) {
    if (result instanceof HTMLElement) {
      block.appendChild(result);
    } else if (Array.isArray(result)) {
      result.forEach((line) => {
        const div = document.createElement('div');
        div.className = 'output-line' + (line.cls ? ' ' + line.cls : '');
        if (line.style) div.setAttribute('style', line.style);
        if (line.html) div.innerHTML = line.html;
        else div.textContent = line.text != null ? line.text : '';
        block.appendChild(div);
      });
    }
    applyStagger(block);
    requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });
    window.setTimeout(() => {
      block.querySelectorAll('.bar-fill').forEach((el) => { el.style.width = el.dataset.width; });
    }, 120);
  }

  function thinkingEl(verb) {
    const t = document.createElement('div');
    t.className = 'thinking-indicator';
    t.innerHTML = '<span class="thinking-text">' + escapeHtml(verb || 'Processing') + '</span>' +
      '<span class="thinking-dots"><span></span><span></span><span></span></span>';
    return t;
  }

  // ============ COMMAND CONTENT ============
  const CLIENTS = ['CyberGhost VPN', 'LiveU', 'CognitiveSEO', 'Signals', 'Anylyze', 'ResNet AI', 'Socyal', 'App4Home', 'Comodo', 'Dribbble', 'GlobalAI', 'Golden Path', 'Optymyze', 'SkyControl', 'Nestle', 'WHO', 'FameUp', 'Horexa', 'Digitail', 'BrandMentions', 'SedCom Libris', 'Portokal', 'Big5 American Diner', 'Katiusa', 'TUIASI', 'Holy Cow', 'Ideate Plus', 'Wawsome', 'Local Happinez', 'Uzina de Zambete'];

  function cmdHelp() {
    const rows = (entries) => entries.map((e) => ({ html: '  <span class="cmd-name">' + e[0] + '</span> <span class="cmd-desc">' + e[1] + '</span>' }));
    const group = (title) => [{ text: '' }, { text: title, cls: 'heading' }, { text: '' }];
    const lines = [{ text: 'Command index', cls: 'heading' }, { text: '' }, { text: '  Every command below resolves in this terminal. Aliases and plain phrases work too.', cls: 'dim' }];
    lines.push.apply(lines, group('Explore'));
    lines.push.apply(lines, rows([
      ['/about', 'Print the designer\'s bio, career path, and mentoring work'],
      ['/work', 'List every active project with year, type, status, and tags'],
      ['/work board', 'Open the visual Projects Board with filters and bulk actions'],
      ['/clients', 'List the companies and studios behind the work'],
      ['/skills', 'Draw ten labeled skill bars with target percentages'],
      ['/philosophy', 'Print the five principles behind the work'],
      ['/social', 'Show social profile rows (placeholder handles, never navigates)'],
      ['/articles', 'List published articles grouped by topic'],
      ['/testimonials', 'Print quote cards from clients, peers, and mentees'],
      ['/awards', 'List this portfolio\'s award rows (inert)'],
    ]));
    lines.push.apply(lines, group('Projects'));
    lines.push.apply(lines, rows([
      ['/create', 'Open the project create form on the Projects Board'],
      ['/<slug>', 'Print one project\'s detail block — try /signals'],
      ['/stats', 'Show active totals, per-status counts, and top tag frequencies'],
    ]));
    lines.push.apply(lines, group('Themes'));
    lines.push.apply(lines, rows([
      ['/themes', 'Browse the four themes with swatches and activate one'],
      ['/dark', 'Switch to the default dark theme'],
      ['/light', 'Switch to the light theme'],
      ['/retro', 'Switch to the CRT phosphor theme with scanlines'],
      ['/glass', 'Switch to the translucent glass theme'],
    ]));
    lines.push.apply(lines, group('Export & import'));
    lines.push.apply(lines, rows([
      ['/export', 'Open the Export center — Portfolio JSON and Resume Markdown, compiled live'],
      ['/import', 'Import a Portfolio JSON package with full contract validation'],
    ]));
    lines.push.apply(lines, group('Archive & history'));
    lines.push.apply(lines, rows([
      ['/archive', 'Open the archive vault and restore archived projects'],
      ['/undo', 'Reverse the last project mutation (also Ctrl+Z)'],
      ['/redo', 'Reapply the last undone mutation (also Ctrl+Shift+Z)'],
    ]));
    lines.push.apply(lines, group('Utility'));
    lines.push.apply(lines, rows([
      ['/clear', 'Clear the terminal output (keeps history and projects)'],
      ['/privacy', 'Show the privacy policy and your current consent choice'],
      ['/help', 'Show this command index'],
    ]));
    lines.push.apply(lines, group('Quick info'));
    lines.push.apply(lines, rows([
      ['/linkedin', 'Print the placeholder LinkedIn handle inline'],
      ['/facebook', 'Print the placeholder Facebook handle inline'],
      ['/instagram', 'Print the placeholder Instagram handle inline'],
      ['/phone', 'Print the placeholder phone number inline'],
      ['/email', 'Print the placeholder email address inline'],
      ['/agency', 'Print the placeholder agency details inline'],
      ['/location', 'Print the placeholder location inline'],
    ]));
    lines.push({ text: '' });
    lines.push({ text: '  Aliases: /portfolio → /work · /projects → /work · /me → /about · /hire → /contact · /mail → /email', cls: 'dim' });
    lines.push({ text: '  Tip: ↑↓ walks command history · Tab completes · Ctrl+K opens the command palette', cls: 'dim' });
    lines.push({ text: '' });
    lines.push({ text: '  …and a few others, if you know where to look.', cls: 'dim', style: 'opacity:0.5;font-style:italic' });
    return lines;
  }

  function cmdAbout() {
    return [
      { text: 'About the designer', cls: 'heading' },
      { text: '' },
      { text: '  Product designer with 15+ years building interfaces people actually want to use. Design Systems Lead at Design Studio — shipping products across multiple markets.' },
      { text: '' },
      { text: 'What I do', cls: 'heading' },
      { text: '' },
      { text: '  I turn complexity into clarity. From enterprise dashboards to consumer mobile apps, the work sits at the intersection of design craft, systems thinking, and business strategy.' },
      { text: '' },
      { text: '  At every stage I ask: "Does this remove friction?" Complexity isn\'t the enemy — confusion is.' },
      { text: '' },
      { text: 'Career path', cls: 'heading' },
      { text: '' },
      { text: '  Started freelancing while studying design and digital media. Joined a consumer privacy product in 2018 and redesigned their app into a 3-step, 30-second onboarding experience.' },
      { text: '' },
      { text: '  Co-founded Design Studio. Through the studio: a 120+ component design system for a live-video platform, research dashboards for Signals, an analytics platform for Anylyze, a record-breaking university redesign (+4,200 students), and an HR product that launched #3 Product of the Day on Product Hunt.', cls: 'accent' },
      { text: '' },
      { text: 'Teaching & mentoring', cls: 'heading' },
      { text: '' },
      { text: '  Dribbble Education mentor (2021–2023), teaching Design Systems, Product Design, and UI Design. Product Psychology Masterclass — Growth.Design (2025). 17+ published articles.' },
      { text: '' },
      { text: 'Beyond the screen', cls: 'heading' },
      { text: '' },
      { text: '  ◆ Mentor to the next wave of UX/UI talent', cls: 'cyan' },
      { text: '  ◆ Workshop facilitator & public speaker', cls: 'cyan' },
      { text: '  ◆ NGO collaborator — designing for education', cls: 'cyan' },
      { text: '' },
      { text: '  → /work to see what has shipped', cls: 'dim' },
      { text: '  → /testimonials to see what people say', cls: 'dim' },
    ];
  }

  function workListLines(list, headingNote) {
    const lines = [];
    lines.push({ text: 'Projects', cls: 'heading' });
    if (!store.projects.length) {
      lines.push({ text: '' });
      lines.push({ text: '  No projects in the collection.', cls: 'yellow' });
      lines.push({ text: '  Run /create (or click "+ New project" on the board) to add one.', cls: 'dim' });
      return lines;
    }
    lines.push({ text: '  ' + (headingNote || (list.length + ' active project' + (list.length === 1 ? '' : 's') + ', 2017–' + CURRENT_YEAR)), cls: 'dim' });
    lines.push({ text: '' });
    list.forEach((p) => {
      lines.push({ html: '  • <span class="accent">' + escapeHtml(p.name) + '</span> <span class="dim">(' + escapeHtml(String(p.year)) + ')</span> — ' + escapeHtml(p.type) + ' <span class="status-badge ' + p.status + '">' + p.status + '</span> <span class="dim">· tags: ' + escapeHtml(p.tags.join(', ')) + '</span>' });
    });
    lines.push({ text: '' });
    lines.push({ text: '  → /clients for the client list · type /work board for the visual board', cls: 'dim' });
    return lines;
  }

  function cmdWork(arg) {
    const a = String(arg || '').trim().toLowerCase();
    if (a === 'board') {
      setMode('board');
      return [{ text: '  Opening the Projects Board — filters, bulk actions, and the create form live there.', cls: 'accent' }];
    }
    let list = store.projects.slice();
    if (a) {
      const pq = parseQuery(a);
      list = list.filter((p) => projectMatches(p, pq));
      if (!list.length) {
        return workListLines([], 'no projects match "' + a + '" — clear the query to see all ' + store.projects.length);
      }
      return workListLines(list, list.length + ' of ' + store.projects.length + ' projects match "' + a + '"');
    }
    return workListLines(list);
  }

  function cmdClients() {
    const container = document.createElement('div');
    container.innerHTML = '<div class="output-line heading">Clients</div>' +
      '<div class="output-line dim" style="margin-bottom:12px">  Across Europe, US, Israel, and UAE</div>';
    const grid = document.createElement('div');
    grid.className = 'client-grid';
    CLIENTS.forEach((c) => {
      const item = document.createElement('div');
      item.className = 'client-item';
      item.textContent = c;
      grid.appendChild(item);
    });
    container.appendChild(grid);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /work for the projects themselves';
    container.appendChild(hint);
    return container;
  }

  function cmdSkills() {
    const skills = [
      { name: 'Product Design', pct: 97, color: 'accent' },
      { name: 'Design Systems', pct: 95, color: 'accent' },
      { name: 'UX Research & Strategy', pct: 91, color: 'green' },
      { name: 'UI & Visual Design', pct: 94, color: 'green' },
      { name: 'Data Visualization', pct: 88, color: 'blue' },
      { name: 'Brand & Identity', pct: 85, color: 'purple' },
      { name: 'Design Leadership', pct: 92, color: 'purple' },
      { name: 'Accessibility (WCAG)', pct: 90, color: 'cyan' },
      { name: 'Prototyping & Motion', pct: 86, color: 'cyan' },
      { name: 'Workshop Facilitation', pct: 89, color: 'blue' },
    ];
    const container = document.createElement('div');
    container.innerHTML = '<div class="output-line heading">Skills & expertise</div><div style="height:8px"></div>';
    skills.forEach((s) => {
      const bar = document.createElement('div');
      bar.className = 'skill-bar';
      bar.innerHTML = '<span class="skill-label">' + s.name + '</span>' +
        '<div class="bar-track"><div class="bar-fill ' + s.color + '" data-width="' + s.pct + '%"></div></div>' +
        '<span class="skill-pct">' + s.pct + '%</span>';
      container.appendChild(bar);
    });
    const tools = document.createElement('div');
    tools.innerHTML = '<div class="output-line heading" style="margin-top:20px">Tools</div>' +
      '<div class="output-line" style="margin-top:4px">  Figma · Adobe XD · Sketch · After Effects</div>' +
      '<div class="output-line">  Miro · FigJam · Notion · Linear</div>' +
      '<div class="output-line">  HTML/CSS · Webflow · Framer</div>' +
      '<div class="output-line dim" style="margin-top:12px">  → /philosophy to see how I think</div>';
    container.appendChild(tools);
    return container;
  }

  function cmdPhilosophy() {
    return [
      { text: 'Design philosophy', cls: 'heading' },
      { text: '' },
      { text: '  "Does this remove friction?"', cls: 'accent' },
      { text: '  — The question asked at every stage.' },
      { text: '' },
      { text: '  ◆ Research first', cls: 'green' },
      { text: '    Analytics, session recordings, user feedback. Intuition is a hypothesis — data is the proof.' },
      { text: '' },
      { text: '  ◆ Built to scale', cls: 'green' },
      { text: '    Design systems for faster dev cycles and consistent experiences across platforms.' },
      { text: '' },
      { text: '  ◆ Outcomes over outputs', cls: 'green' },
      { text: '    Beautiful screens mean nothing without measurable business results.' },
      { text: '' },
      { text: '  ◆ Clarity over density', cls: 'green' },
      { text: '    Complexity isn\'t the enemy — confusion is. Every element earns its pixel.' },
      { text: '' },
      { text: '  ◆ Accessibility as baseline', cls: 'green' },
      { text: '    Not an afterthought. WCAG compliance is where design starts, not where it ends.' },
      { text: '' },
      { text: '  → /contact to start a conversation', cls: 'dim' },
    ];
  }

  function socialRow(icon, name, handle, color) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'social-link inert-nav';
    row.innerHTML = '<span class="social-badge ' + color + '">' + icon + '</span>' +
      '<span class="social-name">' + name + '</span>' +
      '<span class="social-handle">' + handle + '</span>' +
      '<span class="social-arrow">→</span>';
    return row;
  }

  function cmdSocial() {
    const container = document.createElement('div');
    container.innerHTML = '<div class="output-line heading">Social profiles</div><div style="height:8px"></div>';
    container.appendChild(socialRow('in', 'LinkedIn', 'linkedin.com/in/yourname', 'blue'));
    container.appendChild(socialRow('fb', 'Facebook', 'facebook.com/yourname', 'blue'));
    container.appendChild(socialRow('ig', 'Instagram', '@yourname', 'purple'));
    container.appendChild(socialRow('🚀', 'Design Studio', 'designstudio.example', 'accent'));
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  Placeholder handles — none of these navigate. → /contact to get in touch directly';
    container.appendChild(hint);
    return container;
  }

  function cmdAwards() {
    const container = document.createElement('div');
    container.innerHTML = '<div class="output-line heading">Awards & recognition</div>' +
      '<div class="output-line dim" style="margin-bottom:12px">  this portfolio — 2026</div>';
    container.appendChild(socialRow('✦', 'Awwwards', 'Honorable Mention', 'accent'));
    container.appendChild(socialRow('✦', 'The FWA', 'Featured Case', 'purple'));
    container.appendChild(socialRow('✦', 'CSS Design Awards', 'Best UI · Best UX · Innovation', 'green'));
    container.appendChild(socialRow('✦', 'CSS Winner', 'Site of the Day', 'blue'));
    const blurb = document.createElement('div');
    blurb.className = 'output-line dim';
    blurb.style.marginTop = '12px';
    blurb.textContent = '  Four international design awards for one CLI-themed portfolio in a single year.';
    container.appendChild(blurb);
    const cert = document.createElement('div');
    cert.className = 'output-line heading';
    cert.style.marginTop = '18px';
    cert.textContent = 'Certifications';
    container.appendChild(cert);
    container.appendChild(socialRow('✓', 'Growth.Design', 'Product Psychology Masterclass · 2025', 'green'));
    return container;
  }

  function cmdContact() {
    return [
      { text: 'Get in touch', cls: 'heading' },
      { text: '' },
      { text: '  ✉  ' + EMAIL_ADDR, cls: 'accent' },
      { text: '  📞  +1 (555) 000-0000', cls: 'blue' },
      { text: '  📍  Your City, Country', cls: 'purple' },
      { text: '  🚀  designstudio.example — agency', cls: 'green' },
      { text: '' },
      { text: '  Open to: design leadership roles, consulting, design system engagements, workshops & talks.' },
      { text: '' },
      { text: '  All placeholder details — this is a demo.', cls: 'dim' },
      { text: '  → /social for every profile', cls: 'dim' },
    ];
  }

  function cmdTestimonials() {
    const testimonials = [
      { name: 'Jessica Ibbotson', title: 'Education Support, Dribbble', color: 'accent', quote: 'One of the original mentors for the Design Systems course. A clear expert who sculpted each lesson with clarity and precision, transforming complexity into teachability.' },
      { name: 'Adrian Banu', title: 'VP, Product at Optymyze', color: 'blue', quote: 'A top-notch Product Design expert whose work makes a difference in every project. Great at communicating, great at listening, and always comes up with smart solutions.' },
      { name: 'Lead Experience Designer', title: 'EPAM Systems', color: 'green', quote: 'A rare combination of creativity, technical expertise, and leadership. Fosters a collaborative work environment where ideas are freely exchanged.' },
      { name: 'Ionut Patrascoiu', title: 'CEO & Founder, FameUp', color: 'purple', quote: 'Outstanding skills in UI/UX design. Exemplary leadership qualities and a proactive approach to every task.' },
      { name: 'Earl Carvalho', title: 'Product Solutions Manager', color: 'cyan', quote: 'A knack for thinking outside the box and bringing innovative solutions to the table. Consistently impresses.' },
      { name: 'Lavinia Gherasim', title: 'Senior Java Software Engineer', color: 'purple', quote: 'Designs that are consistently intuitive, creating an effortless experience for end-users. Impressive grasp of technical aspects.' },
      { name: 'Elena Levy', title: 'UX/UI & Design Systems Designer', color: 'blue', quote: 'Among the best design mentors I\'ve worked with. A brilliant technical mindset and a sophisticated visual design aesthetic.' },
    ];
    const container = document.createElement('div');
    container.innerHTML = '<div class="output-line heading">Testimonials</div>' +
      '<div class="output-line dim" style="margin-bottom:12px">  Anonymized quotes from colleagues, clients, and mentees</div>';
    testimonials.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = '<div class="project-name" style="font-size:0.85em">"' + t.quote + '"</div>' +
        '<div style="margin-top:8px"><span class="' + t.color + '" style="font-weight:600">— ' + t.name + '</span>' +
        ' <span class="dim" style="margin-left:4px">' + t.title + '</span></div>';
      container.appendChild(card);
    });
    return container;
  }

  function cmdArticles() {
    const groups = [
      { cat: 'Design systems', items: ['The complete guide to Design Systems in 2026', 'Design System 101: building a scalable system from scratch', 'Design tokens: the complete technical guide', 'Design system governance: who owns what', 'Design System vs. style guide vs. pattern library', 'Glossary of scalable Design Systems'] },
      { cat: 'UX & product', items: ['UX design guide: best practices, metrics, and modern workflows', 'Design-led development: how to truly blend UX and Agile', 'AI in UX: best practices for designing with artificial intelligence'] },
      { cat: 'Branding & strategy', items: ['Branding for digital products: a strategy blueprint', 'Strategic storytelling: a practical guide for business growth', 'Beyond the slogan: mastering brand messaging through story'] },
      { cat: 'SEO & content', items: ['Content marketing for SaaS: what actually works', 'SEO and content strategy for product companies', 'Technical SEO checklist for product websites', 'How to build topical authority', 'Storytelling formats that win: getting featured in AI answers'] },
    ];
    const container = document.createElement('div');
    container.innerHTML = '<div class="output-line heading">Published articles</div>' +
      '<div class="output-line dim" style="margin-bottom:12px">  17 articles on designstudio.example (placeholder publication)</div>';
    groups.forEach((g) => {
      const head = document.createElement('div');
      head.className = 'output-line accent';
      head.style.cssText = 'margin-top:12px;font-weight:600';
      head.textContent = g.cat;
      container.appendChild(head);
      g.items.forEach((t) => container.appendChild(socialRow('¶', t, 'designstudio.example', 'green')));
    });
    return container;
  }

  // ============ QUICK INFO ============
  function quickInfo(lines) { return lines; }
  function cmdLinkedin() { return quickInfo([
    { text: 'LinkedIn', cls: 'heading' }, { text: '' },
    { text: '  linkedin.com/in/yourname', cls: 'accent' },
    { text: '  Placeholder handle — never navigates.', cls: 'dim' },
  ]); }
  function cmdFacebook() { return quickInfo([
    { text: 'Facebook', cls: 'heading' }, { text: '' },
    { text: '  facebook.com/yourname', cls: 'accent' },
    { text: '  Placeholder handle — never navigates.', cls: 'dim' },
  ]); }
  function cmdInstagram() { return quickInfo([
    { text: 'Instagram', cls: 'heading' }, { text: '' },
    { text: '  @yourname', cls: 'accent' },
    { text: '  Placeholder handle — never navigates.', cls: 'dim' },
  ]); }
  function cmdPhone() { return quickInfo([
    { text: 'Phone', cls: 'heading' }, { text: '' },
    { text: '  +1 (555) 000-0000', cls: 'accent' },
    { text: '  Placeholder number — never dials.', cls: 'dim' },
  ]); }
  function cmdEmail() { return quickInfo([
    { text: 'Email', cls: 'heading' }, { text: '' },
    { text: '  ' + EMAIL_ADDR, cls: 'accent' },
    { text: '  Placeholder address — never opens a mail client.', cls: 'dim' },
  ]); }
  function cmdAgency() { return quickInfo([
    { text: 'Design Studio', cls: 'heading' }, { text: '' },
    { text: '  designstudio.example — product & design studio', cls: 'accent' },
    { text: '  Based in Your City, Country. Interfaces people actually want to use.', cls: 'dim' },
  ]); }
  function cmdLocation() { return quickInfo([
    { text: 'Location', cls: 'heading' }, { text: '' },
    { text: '  📍  Your City, Country', cls: 'accent' },
    { text: '  🌍  Working across Europe, US, Israel, UAE', cls: 'dim' },
  ]); }
  function cmdPrivacy() {
    const status = consentLabel();
    const cls = store.consent === 'accepted' ? 'green' : store.consent === 'declined' ? 'red' : 'dim';
    return [
      { text: 'Privacy policy', cls: 'heading' },
      { text: '' },
      { text: '  Last updated: March 2026' },
      { text: '' },
      { text: 'What this site collects', cls: 'heading' },
      { text: '' },
      { text: '  This site would use Google Analytics 4 to understand traffic — pages viewed, time spent, general patterns. No analytics library is bundled in this demo, so Accept and Decline only update the in-memory consent state.' },
      { text: '' },
      { text: 'Cookies', cls: 'heading' },
      { text: '' },
      { text: '  Analytics cookies would only be set after Accept. Decline means cookieless, aggregated-only measurement.' },
      { text: '' },
      { text: '  Your current choice: ' + status, cls: cls },
      { text: '' },
      { text: 'Your rights (GDPR)', cls: 'heading' },
      { text: '' },
      { text: '  ◆ Know what data is collected about you', cls: 'cyan' },
      { text: '  ◆ Request deletion of your data', cls: 'cyan' },
      { text: '  ◆ Withdraw consent at any time', cls: 'cyan' },
      { text: '' },
      { text: '  Data controller: Your Name, Design Studio (designstudio.example), ' + EMAIL_ADDR, cls: 'dim' },
    ];
  }

  // ============ PROJECT DETAIL + STATS ============
  function cmdProject(p) {
    const container = document.createElement('div');
    container.innerHTML =
      '<div class="output-line heading">' + escapeHtml(p.name) + '<span class="status-badge ' + p.status + '">' + p.status + '</span></div>' +
      '<div class="output-line dim">  ' + escapeHtml(p.type) + ' · ' + escapeHtml(String(p.year)) + ' · shortcut /' + escapeHtml(p.slug) + '</div>' +
      '<div style="height:6px"></div>' +
      '<div class="project-card">' +
      '<div class="project-desc">' + escapeHtml(p.blurb) + '</div>' +
      '<div class="project-tags">' + p.tags.map((t) => '<span class="project-tag">' + escapeHtml(t) + '</span>').join('') + '</div>' +
      '<div class="project-stats">' + p.stats.map((s) => '<span class="project-stat">✦ ' + escapeHtml(s) + '</span>').join('') + '</div>' +
      '</div>' +
      '<div class="output-line dim" style="margin-top:10px">  → /work for all projects · /contact to discuss this project</div>';
    return container;
  }

  function cmdStats() {
    const counts = statusCounts();
    const top = tagFrequencies(store.projects).slice(0, 5).map((e) => e[0] + ' (' + e[1] + ')').join(', ') || '—';
    return [
      { text: 'Stats', cls: 'heading' },
      { text: '' },
      { text: '  Total active: ' + store.projects.length, cls: 'accent' },
      { text: '  shipped: ' + counts.shipped + ' · wip: ' + counts.wip, cls: 'green' },
      { text: '  Archived vault: ' + store.archive.length, cls: 'dim' },
      { text: '  Top tags: ' + top, cls: 'dim' },
      { text: '' },
      { text: '  Figures compile live from the active collection — the board\'s stats strip matches.', cls: 'dim' },
    ];
  }

  // ============ THEMES ============
  function themeLine(t, msg, cls) {
    applyTheme(t);
    return [{ text: '  ' + msg, cls: cls || 'accent' }];
  }
  function cmdDark() { return themeLine('dark', '✦ Dark mode activated. The way it should be.'); }
  function cmdLight() { return themeLine('light', '☀ Light mode activated. My eyes… but okay.', 'yellow'); }
  function cmdRetro() {
    return themeLine('retro', '▓ CRT mode engaged. Welcome to 1983. Scanlines: ON · Phosphor: GREEN', 'green').concat([
      { text: '  Nostalgia: MAX', cls: 'dim' },
    ]);
  }
  function cmdGlass() { return themeLine('glass', '◈ Glass mode activated. Transparency at its finest.'); }
  function cmdThemes() {
    const themes = [
      { cmd: '/dark', label: 'dark', desc: 'Default — deep tones, easy on the eyes', colors: ['#1a1a2e', '#252540', '#e8a87c', '#c3c7d1'] },
      { cmd: '/light', label: 'light', desc: 'Clean, bright, and professional', colors: ['#eef0f6', '#ffffff', '#c47840', '#2a2a3e'] },
      { cmd: '/retro', label: 'retro', desc: '1983 CRT phosphor glow — scanlines included', colors: ['#04120a', '#06170d', '#33ff66', '#14663a'] },
      { cmd: '/glass', label: 'glass', desc: 'Frosted glass with depth and blur', colors: ['#0f0f1a', '#a78bfa', '#86efac', '#67e8f9'] },
    ];
    const container = document.createElement('div');
    container.innerHTML = '<div class="output-line heading">Themes</div>' +
      '<div class="output-line" style="margin-bottom:12px">  Type a theme name to switch. Current: <span class="accent">' + store.theme + '</span></div>';
    themes.forEach((t) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'social-link inert-nav';
      const active = store.theme === t.label;
      const swatches = t.colors.map((c) => '<span style="display:inline-block;width:13px;height:13px;border-radius:3px;background:' + c + ';border:1px solid rgba(128,128,128,0.4)"></span>').join('');
      row.innerHTML = '<span style="display:flex;gap:4px">' + swatches + '</span>' +
        '<span class="social-name">' + t.cmd + '</span><span class="social-handle">' + t.desc + '</span>' +
        (active ? '<span class="accent" style="font-size:0.72rem">● active</span>' : '<span class="social-arrow">→</span>');
      row.addEventListener('click', () => executeCommand(t.cmd));
      container.appendChild(row);
    });
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.cssText = 'margin-top:12px;font-style:italic';
    hint.textContent = '  Themes persist for the session. Reload resets everything.';
    container.appendChild(hint);
    return container;
  }

  // ============ EASTER EGGS ============
  const HIDDEN_COMMANDS = {};
  function registerHidden(name, fn) { HIDDEN_COMMANDS[name] = fn; }

  registerHidden('/secrets', function () {
    return [
      { text: 'Secret commands', cls: 'heading' },
      { text: '  Shhh… you found the cheat sheet.', cls: 'dim' },
      { text: '' },
      { text: 'Hidden commands', cls: 'heading' },
      { html: '  <span class="cmd-name">sudo hire designer</span> <span class="cmd-desc">Fake contract with a live progress bar</span>' },
      { html: '  <span class="cmd-name">/matrix</span> <span class="cmd-desc">Green matrix rain over the whole viewport</span>' },
      { html: '  <span class="cmd-name">/konami</span> <span class="cmd-desc">Confetti party (also via ↑↑↓↓←→←→BA)</span>' },
      { html: '  <span class="cmd-name">rm -rf doubts</span> <span class="cmd-desc">Remove all your doubts</span>' },
      { html: '  <span class="cmd-name">whoami</span> <span class="cmd-desc">The terminal knows you</span>' },
      { html: '  <span class="cmd-name">ls</span> <span class="cmd-desc">Skills as Linux files</span>' },
      { html: '  <span class="cmd-name">git log</span> <span class="cmd-desc">A totally real commit history</span>' },
      { html: '  <span class="cmd-name">cat readme.md</span> <span class="cmd-desc">A hidden personal message</span>' },
      { html: '  <span class="cmd-name">ping designer</span> <span class="cmd-desc">Am I available? Find out</span>' },
      { html: '  <span class="cmd-name">/coffee</span> <span class="cmd-desc">Design fuel status</span>' },
      { html: '  <span class="cmd-name">/figma</span> <span class="cmd-desc">Where I actually live</span>' },
      { text: '' },
      { text: 'Beyond the spec', cls: 'heading' },
      { html: '  <span class="cmd-name">/now</span> <span class="cmd-desc">Live local time panel — the status bar clock ticks all session</span>' },
      { html: '  <span class="cmd-name">/flip</span> <span class="cmd-desc">Turn the terminal upside down (run again to restore)</span>' },
      { html: '  <span class="cmd-name">pointer move</span> <span class="cmd-desc">The wallpaper drifts with your cursor (parallax)</span>' },
      { text: '' },
      { text: '  Themes: /dark /light /retro /glass', cls: 'dim' },
    ];
  });
  registerHidden('/easter-eggs', function () { return HIDDEN_COMMANDS['/secrets'](); });
  registerHidden('/eastereggs', function () { return HIDDEN_COMMANDS['/secrets'](); });

  registerHidden('/matrix', function () {
    if (reducedMotion()) {
      return [
        { text: '  Entering the Matrix…', cls: 'green' },
        { text: '  [matrix rain skipped — prefers-reduced-motion is on]', cls: 'dim' },
      ];
    }
    runMatrixRain();
    return [
      { text: '  Entering the Matrix...', cls: 'green' },
      { text: '  There is no spoon. Only good design. (Esc or /clear stops the rain)', cls: 'dim' },
    ];
  });

  registerHidden('sudo hire designer', function () {
    const container = document.createElement('div');
    container.innerHTML =
      '<div class="output-line green">  [sudo] password for visitor: ********</div>' +
      '<div class="output-line green">  ✓ Authentication successful.</div>' +
      '<div class="output-line" style="margin-top:8px">  Sending contract to Your Name...</div>' +
      '<div class="output-line dim hire-progress">  [░░░░░░░░░░░░░░░░░░░░] 0%</div>' +
      '<div class="output-line accent hire-done" style="display:none;margin-top:8px">  ✦ Contract sent! Your Name will be in touch shortly.</div>' +
      '<div class="output-line dim hire-hint" style="display:none"></div>';
    const bar = container.querySelector('.hire-progress');
    const done = container.querySelector('.hire-done');
    const hint = container.querySelector('.hire-hint');
    const finish = () => {
      bar.textContent = '  [████████████████████] 100%';
      bar.className = 'output-line green hire-progress';
      done.style.display = '';
      hint.textContent = '  (Okay fine, just email ' + EMAIL_ADDR + ')';
      hint.style.display = '';
      terminalBody.scrollTop = terminalBody.scrollHeight;
    };
    if (reducedMotion()) { window.setTimeout(finish, 60); return container; }
    let pct = 0;
    const iv = window.setInterval(() => {
      pct += 3 + Math.random() * 6;
      if (pct >= 100) { pct = 100; clearInterval(iv); finish(); return; }
      const filled = Math.round(pct / 5);
      bar.textContent = '  [' + '█'.repeat(filled) + '░'.repeat(20 - filled) + '] ' + Math.round(pct) + '%';
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }, 130);
    return container;
  });

  registerHidden('rm -rf doubts', function () {
    return [
      { text: '  $ rm -rf doubts/', cls: 'dim' },
      { text: '  Removing doubts/impostor-syndrome... done', cls: 'green' },
      { text: '  Removing doubts/will-they-deliver... done', cls: 'green' },
      { text: '  Removing doubts/are-they-expensive... done', cls: 'green' },
      { text: '' },
      { text: '  ✦ All doubts removed. You should definitely hire this designer.', cls: 'accent' },
    ];
  });

  registerHidden('/figma', function () {
    return [
      { text: '  I live in Figma. Send help.', cls: 'accent' },
      { text: '  Current tab count: ∞', cls: 'dim' },
      { text: '  Unsaved changes: always', cls: 'dim' },
    ];
  });

  registerHidden('/coffee', function () {
    return [
      { text: '           ( (' , cls: 'dim' },
      { text: '            ) )', cls: 'dim' },
      { text: '         ........', cls: 'dim' },
      { text: '         |      |]', cls: 'accent' },
      { text: '         \\      /', cls: 'accent' },
      { text: '          `----´', cls: 'accent' },
      { text: '' },
      { text: '  Design fuel level: [████████████████░░░░] 80%', cls: 'green' },
      { text: '  Status: caffeinated and pixel-pushing', cls: 'dim' },
    ];
  });

  registerHidden('ls', function () {
    return [
      { text: '  drwxr-xr-x  you   design-systems.exe', cls: 'green' },
      { text: '  drwxr-xr-x  you   ux-research.doc', cls: 'blue' },
      { text: '  -rwxr-xr-x  you   figma-mastery.cfg', cls: 'accent' },
      { text: '  -rw-r--r--  you   pixel-perfection.so', cls: 'purple' },
      { text: '  -rwxr-xr-x  you   strategic-thinking.bin', cls: 'cyan' },
      { text: '  -rw-r--r--  you   accessibility.a11y', cls: 'yellow' },
      { text: '  -rw-------  you   secret-design-sauce.enc', cls: 'red' },
    ];
  });

  registerHidden('cat readme.md', function () {
    return [
      { text: '  # README.md', cls: 'heading' },
      { text: '' },
      { text: '  Hey, you found this. Nice.' },
      { text: '' },
      { text: '  If you\'re reading this, you\'re the kind of person who inspects' },
      { text: '  elements, reads source code, and appreciates the details.' },
      { text: '  We\'d get along.' },
      { text: '' },
      { text: '  The world has enough pretty mockups that never ship.' },
      { text: '  I build things that do.', cls: 'green' },
      { text: '' },
      { text: '  — Your Name', cls: 'accent' },
    ];
  });

  registerHidden('ping designer', function () {
    return [
      { text: '  PING designer.portfolio (192.168.1.337): 56 data bytes', cls: 'dim' },
      { text: '  64 bytes from HQ: icmp_seq=0 ttl=64 time=0.1ms — Always online', cls: 'green' },
      { text: '  64 bytes from HQ: icmp_seq=1 ttl=64 time=0.2ms — Available for great projects', cls: 'green' },
      { text: '  64 bytes from HQ: icmp_seq=2 ttl=64 time=0.1ms — Responds faster than your current designer', cls: 'green' },
      { text: '  --- designer.portfolio ping statistics ---', cls: 'dim' },
      { text: '  3 packets transmitted, 3 received, 0% packet loss', cls: 'dim' },
    ];
  });

  registerHidden('git log', function () {
    return [
      { text: '  commit a1b2c3d (HEAD -> main)', cls: 'yellow' },
      { text: '  Author: Your Name <' + EMAIL_ADDR + '>', cls: 'dim' },
      { text: '      Fixed pixel that was 1px off. Again.', cls: 'accent' },
      { text: '' },
      { text: '  commit e4f5g6h', cls: 'yellow' },
      { text: '      Removed 47 unnecessary gradients from a client mockup', cls: 'dim' },
      { text: '' },
      { text: '  commit i7j8k9l', cls: 'yellow' },
      { text: '      Convinced a stakeholder that Comic Sans is not on-brand', cls: 'dim' },
      { text: '' },
      { text: '  commit m0n1o2p', cls: 'yellow' },
      { text: '      Refactored the entire design system at 2am. No regrets.', cls: 'dim' },
    ];
  });

  registerHidden('whoami', function () {
    return [
      { text: '  You\'re the person about to hire a great designer.', cls: 'accent' },
      { text: '  (Trust the terminal. It knows things.)', cls: 'dim' },
    ];
  });

  registerHidden('exit', function () {
    return [
      { text: '  There is no escape.', cls: 'red' },
      { text: '  But /contact is a way forward.', cls: 'green' },
    ];
  });
  registerHidden('quit', function () { return HIDDEN_COMMANDS['exit'](); });
  registerHidden('/exit', function () { return HIDDEN_COMMANDS['exit'](); });
  registerHidden('/quit', function () { return HIDDEN_COMMANDS['exit'](); });

  registerHidden('/konami', function () {
    konamiCelebrate();
    return [
      { text: '  🎉 ↑ ↑ ↓ ↓ ← → ← → B A', cls: 'accent' },
      { text: '  PARTY MODE ACTIVATED!', cls: 'yellow' },
      { text: '  ★ Achievement unlocked: Konami commando. Have some confetti.', cls: 'green' },
    ];
  });

  registerHidden('/now', function () {
    const d = new Date();
    const up = Math.round((Date.now() - sessionStart) / 1000);
    const mins = Math.floor(up / 60);
    return [
      { text: 'Session clock', cls: 'heading' },
      { text: '' },
      { text: '  Local time: ' + d.toLocaleTimeString(), cls: 'accent' },
      { text: '  Date: ' + d.toDateString(), cls: 'green' },
      { text: '  UTC: ' + d.toISOString().replace('T', ' ').slice(0, 19), cls: 'blue' },
      { text: '  Timezone: UTC' + (d.getTimezoneOffset() <= 0 ? '+' : '-') + Math.abs(d.getTimezoneOffset() / 60), cls: 'dim' },
      { text: '  Session uptime: ' + (mins > 0 ? mins + 'm ' : '') + (up % 60) + 's — the status bar keeps ticking', cls: 'dim' },
    ];
  });

  registerHidden('/flip', function () {
    const flipped = terminal.classList.toggle('flipped');
    return [
      { text: flipped ? '  The terminal is now upside down. Run /flip again to restore.' : '  And back the right way it goes.', cls: 'accent' },
    ];
  });
  registerHidden('/unflip', function () {
    terminal.classList.remove('flipped');
    return [{ text: '  Right side up again.', cls: 'accent' }];
  });

  // ============ MATRIX + CONFETTI ============
  let matrixRAF = null;
  function stopMatrix() {
    if (matrixRAF !== null) { cancelAnimationFrame(matrixRAF); matrixRAF = null; }
    matrixCanvas.classList.remove('active');
    const ctx = matrixCanvas.getContext('2d');
    ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  }
  function runMatrixRain() {
    stopMatrix();
    const ctx = matrixCanvas.getContext('2d');
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    matrixCanvas.classList.add('active');
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789DESIGNER';
    const fontSize = 14;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    const drops = Array(columns).fill(1);
    let frame = 0;
    const maxFrames = 300;
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      ctx.fillStyle = '#33ff33';
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      frame++;
      if (frame < maxFrames && matrixCanvas.classList.contains('active')) {
        matrixRAF = requestAnimationFrame(draw);
      } else {
        stopMatrix();
      }
    }
    matrixRAF = requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { if (matrixCanvas.classList.contains('active')) stopMatrix(); });

  function runConfetti() {
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#e8a87c', '#7ec89b', '#7caae8', '#e87c7c', '#b88ce8', '#e8d87c', '#7ce8d8'];
    const particles = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 8 + 4, h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.2,
      });
    }
    let frame = 0;
    const maxFrames = 180;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      const fade = frame > 120 ? 1 - (frame - 120) / 60 : 1;
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.05;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (frame < maxFrames) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(draw);
  }

  function konamiCelebrate() {
    toast('★ Achievement unlocked — Konami code! 30 style points.');
    if (!reducedMotion()) runConfetti();
  }

  const konamiSequence = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let konamiIndex = 0;
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        konamiIndex = 0;
        executeCommand('/konami');
      }
    } else if (key !== konamiSequence[0]) {
      konamiIndex = 0;
    }
  });

  // ============ COMMAND REGISTRY ============
  const COMMANDS = {
    '/help': { desc: 'Show the command index', fn: cmdHelp },
    '/about': { desc: 'Bio, career path, mentoring', fn: cmdAbout },
    '/work': { desc: 'List every active project', fn: cmdWork },
    '/clients': { desc: 'Companies behind the work', fn: cmdClients },
    '/skills': { desc: 'Ten labeled skill bars', fn: cmdSkills },
    '/philosophy': { desc: 'Five design principles', fn: cmdPhilosophy },
    '/social': { desc: 'Social profile rows', fn: cmdSocial },
    '/articles': { desc: 'Articles grouped by topic', fn: cmdArticles },
    '/testimonials': { desc: 'Quote cards from peers', fn: cmdTestimonials },
    '/awards': { desc: 'Award rows (inert)', fn: cmdAwards },
    '/contact': { desc: 'Placeholder contact details', fn: cmdContact },
    '/privacy': { desc: 'Privacy policy + consent', fn: cmdPrivacy },
    '/stats': { desc: 'Live totals, statuses, top tags', fn: cmdStats },
    '/create': { desc: 'Open the project create form', fn: () => { openCreateForm(); return [{ text: '  Project form opened on the board — every field follows the project field contract.', cls: 'accent' }]; } },
    '/export': { desc: 'Open the Export center', fn: () => { setMode('export'); return [{ text: '  Export center opened — Portfolio JSON and Resume Markdown compile live from session state.', cls: 'accent' }]; } },
    '/import': { desc: 'Import a Portfolio JSON package', fn: () => { setMode('export'); importPanel.hidden = false; window.setTimeout(() => importText.focus(), 50); return [{ text: '  Import panel opened — paste a Portfolio JSON package (version "1.0") or choose a file.', cls: 'accent' }]; } },
    '/archive': { desc: 'Open the archive vault', fn: () => { setMode('archive'); return [{ text: '  Archive vault opened — Restore returns any project to the board with its prior fields.', cls: 'accent' }]; } },
    '/undo': { desc: 'Reverse the last project mutation', fn: () => { const ok = undo(); return [{ text: ok ? '  Undone. Board, /work, /stats, archive, and export are back in sync.' : '  Nothing to undo — the history stack is empty.', cls: ok ? 'green' : 'dim' }]; } },
    '/redo': { desc: 'Reapply the last undone mutation', fn: () => { const ok = redo(); return [{ text: ok ? '  Redone. All surfaces re-applied the mutation.' : '  Nothing to redo — the redo stack is empty.', cls: ok ? 'green' : 'dim' }]; } },
  };

  const INFO_COMMANDS = {
    '/linkedin': { desc: 'Placeholder LinkedIn handle', fn: cmdLinkedin },
    '/facebook': { desc: 'Placeholder Facebook handle', fn: cmdFacebook },
    '/instagram': { desc: 'Placeholder Instagram handle', fn: cmdInstagram },
    '/phone': { desc: 'Placeholder phone number', fn: cmdPhone },
    '/email': { desc: 'Placeholder email address', fn: cmdEmail },
    '/agency': { desc: 'Placeholder agency details', fn: cmdAgency },
    '/location': { desc: 'Placeholder location', fn: cmdLocation },
  };

  const THEME_COMMANDS = {
    '/dark': { desc: 'Dark theme (default)', fn: cmdDark },
    '/light': { desc: 'Light theme', fn: cmdLight },
    '/retro': { desc: 'Retro CRT theme', fn: cmdRetro },
    '/glass': { desc: 'Glass theme', fn: cmdGlass },
    '/themes': { desc: 'Browse all four themes', fn: cmdThemes },
  };

  const ALIASES = {
    '/portfolio': '/work', '/projects': '/work', '/works': '/work', '/board': '/work board',
    '/me': '/about', '/who': '/about', '/info': '/about',
    '/expertise': '/skills', '/services': '/skills',
    '/writing': '/articles', '/blog': '/articles', '/publications': '/articles',
    '/reviews': '/testimonials', '/recommendations': '/testimonials',
    '/recognition': '/awards', '/award': '/awards', '/trophies': '/awards',
    '/hire': '/contact', '/links': '/social', '/profiles': '/social', '/socials': '/social',
    '/reset': '/clear', '/cls': '/clear',
    '/call': '/phone', '/mail': '/email',
    '/designstudio': '/agency', '/design-studio': '/agency',
    '/fb': '/facebook', '/ig': '/instagram', '/insta': '/instagram',
    '/theme': '/themes', '/colors': '/themes', '/appearance': '/themes',
    '/darkmode': '/dark', '/lightmode': '/light', '/dark mode': '/dark', '/light mode': '/light',
    '/vault': '/archive', '/archived': '/archive',
    '/new': '/create', '/add': '/create',
  };

  const COMMAND_GROUPS = [COMMANDS, INFO_COMMANDS, THEME_COMMANDS];

  // ============ NATURAL LANGUAGE INTENT ============
  const INTENT_MAP = [
    { cmd: '/about', phrases: ['about the designer', 'about designer', 'who is this', 'tell me about', 'who are you', 'about you', 'introduce yourself', 'bio', 'what do you do'] },
    { cmd: '/contact', phrases: ['get in touch', 'reach out', 'hire designer', 'contact designer', 'how to reach', 'how to contact', 'want to hire', 'book a call', 'talk to the designer', 'i need a designer', 'looking for a designer'] },
    { cmd: '/work', phrases: ['show work', 'show me your work', 'show portfolio', 'show projects', 'your work', 'your projects', 'what have you done', 'what did you build', 'see your work', 'previous work', 'past projects', 'portfolio pieces', 'show me the projects'] },
    { cmd: '/skills', phrases: ['what can you do', 'your skills', 'your capabilities', 'your expertise', 'what do you know', 'skill set', 'services you offer', 'what services'] },
    { cmd: '/clients', phrases: ['who have you worked with', 'your clients', 'client list', 'past clients', 'which companies'] },
    { cmd: '/social', phrases: ['social media', 'social links', 'social profiles', 'follow the designer', 'your socials', 'online presence'] },
    { cmd: '/testimonials', phrases: ['what people say', 'client feedback', 'recommendations for you', 'endorsements'] },
    { cmd: '/philosophy', phrases: ['design philosophy', 'how do you work', 'your approach', 'your process', 'design approach', 'your principles', 'your values'] },
    { cmd: '/email', phrases: ['email address', 'your email', 'designer email', 'send email'] },
    { cmd: '/phone', phrases: ['phone number', 'your phone', 'designer phone', 'telephone'] },
    { cmd: '/location', phrases: ['where are you', 'your location', 'where based', 'which city', 'which country'] },
    { cmd: '/articles', phrases: ['your articles', 'blog posts', 'what have you written', 'your writing', 'read articles'] },
    { cmd: '/awards', phrases: ['your awards', 'won any awards', 'design awards', 'awwwards', 'the fwa', 'css design awards', 'css winner'] },
    { cmd: '/agency', phrases: ['your agency', 'design studio', 'your company', 'your studio'] },
    { cmd: '/themes', phrases: ['change theme', 'switch theme', 'change appearance', 'change the look', 'theme options'] },
    { cmd: '/stats', phrases: ['how many projects', 'project count', 'show stats', 'portfolio stats', 'project statistics'] },
    { cmd: '/export', phrases: ['export portfolio', 'download portfolio', 'get the json', 'export the json', 'portfolio package'] },
    { cmd: '/archive', phrases: ['archived projects', 'show archive', 'open the vault', 'archive vault'] },
    { cmd: '/help', phrases: ['help me', 'list commands', 'show commands', 'available commands', 'how does this work', 'what is this'] },
  ];

  function matchIntent(input) {
    const lower = input.toLowerCase().trim();
    let best = null, bestScore = 0;
    for (const intent of INTENT_MAP) {
      for (const phrase of intent.phrases) {
        if (lower === phrase) return intent.cmd;
        if (lower.indexOf(phrase) !== -1) {
          const score = phrase.length / lower.length;
          if (score > bestScore) { bestScore = score; best = intent.cmd; }
          continue;
        }
        const inputWords = lower.split(/\s+/);
        const phraseWords = phrase.split(/\s+/);
        const matching = phraseWords.filter((w) => inputWords.indexOf(w) !== -1);
        if (matching.length >= 2 || (matching.length === 1 && phraseWords.length === 1)) {
          const score = (matching.length / phraseWords.length) * 0.8;
          if (score > bestScore) { bestScore = score; best = intent.cmd; }
        }
      }
    }
    return bestScore >= 0.4 ? best : null;
  }

  // ============ COMMAND RESOLUTION ============
  function lookupGroup(key) {
    for (const g of COMMAND_GROUPS) if (g[key]) return g[key];
    return null;
  }
  function resolveCommand(raw) {
    // hidden commands (exact, incl. multi-word shell extras)
    if (HIDDEN_COMMANDS[raw]) return { kind: 'hidden', key: raw, fn: HIDDEN_COMMANDS[raw] };

    // split head + arg ("/work board", "/work status:shipped")
    const sp = raw.indexOf(' ');
    const head = sp === -1 ? raw : raw.slice(0, sp);
    const arg = sp === -1 ? '' : raw.slice(sp + 1).trim();

    let key = ALIASES[head] || head;
    let keySp = key.indexOf(' ');
    let finalArg = arg;
    if (keySp !== -1) { finalArg = key.slice(keySp + 1) + (arg ? ' ' + arg : ''); key = key.slice(0, keySp); }

    // dynamic project shortcuts
    if (key.startsWith('/') && !lookupGroup(key)) {
      const p = findBySlug(key.slice(1));
      if (p) return { kind: 'project', key: key, fn: () => cmdProject(p), project: p };
    }
    const cmd = lookupGroup(key);
    if (cmd) return { kind: 'cmd', key: key, fn: cmd.fn, arg: finalArg, desc: cmd.desc };

    // bare words: try with slash, then aliases
    if (!raw.startsWith('/')) {
      const withSlash = '/' + head;
      if (HIDDEN_COMMANDS[raw]) return { kind: 'hidden', key: raw, fn: HIDDEN_COMMANDS[raw] };
      const ak = ALIASES[withSlash] || withSlash;
      const c2 = lookupGroup(ak);
      if (c2) return { kind: 'cmd', key: ak, fn: c2.fn, arg: finalArg, isFuzzy: true };
      const p2 = findBySlug(head);
      if (p2) return { kind: 'project', key: '/' + p2.slug, fn: () => cmdProject(p2), project: p2, isFuzzy: true };
    }

    // natural language
    const intent = matchIntent(raw);
    if (intent) {
      const c3 = lookupGroup(intent);
      if (c3) return { kind: 'cmd', key: intent, fn: c3.fn, arg: '', isFuzzy: true, isNL: true };
    }

    // prefix fuzzy for bare words of 3+ chars
    if (!raw.startsWith('/') && head.length >= 3) {
      for (const g of COMMAND_GROUPS) {
        for (const k of Object.keys(g)) {
          if (k.indexOf('/' + head) === 0) return { kind: 'cmd', key: k, fn: g[k].fn, arg: '', isFuzzy: true };
        }
      }
    }
    return { kind: 'notfound' };
  }

  // Commands that skip the thinking indicator (instant feedback)
  const INSTANT_KEYS = new Set(['/clear', '/dark', '/light', '/retro', '/glass', '/undo', '/redo']);
  const THINK_VERBS = ['Processing', 'Resolving', 'Compiling', 'Querying', 'Rendering'];

  function executeCommand(input, opts) {
    opts = opts || {};
    const typed = String(input == null ? '' : input).trim();
    if (!typed) return;
    const raw = typed.toLowerCase();

    if (terminal.classList.contains('minimized')) restoreFromMinimize();

    if (!opts.noHistory) {
      commandHistory.unshift(typed);
      if (commandHistory.length > 60) commandHistory.pop();
      historyIndex = -1;
    }

    // /clear — instant, wipes output only (history + projects stay intact)
    if (raw === '/clear' || raw === 'clear') {
      outputArea.innerHTML = '';
      stopMatrix();
      return;
    }

    const resolved = resolveCommand(raw);

    // section commands update the document title (never the URL)
    if (resolved.kind !== 'notfound' && resolved.key) {
      updateDocTitle(String(resolved.key).replace(/^\//, '').split(' ')[0]);
    }

    // aliases that resolve to /clear (e.g. /cls) wipe output the same way
    if (resolved.kind !== 'notfound' && resolved.key === '/clear') {
      outputArea.innerHTML = '';
      stopMatrix();
      return;
    }

    // keep theme/undo/redo in-place; everything else surfaces in the terminal
    const inPlace = resolved.kind !== 'notfound' && INSTANT_KEYS.has(resolved.key);
    if (resolved.kind !== 'notfound' && !inPlace && store.mode !== 'terminal') {
      setMode('terminal', { noFocus: true });
    }

    const block = makeBlockWithEcho(typed);

    if (resolved.kind === 'notfound') {
      const err = document.createElement('div');
      err.className = 'output-line red';
      err.textContent = '  Command not found: "' + typed + '"';
      block.appendChild(err);
      const hint = document.createElement('div');
      hint.className = 'output-line dim';
      hint.textContent = '  Type /help to see available commands — some shell commands work too (whoami, ls, git log).';
      block.appendChild(hint);
      announce('Command not found: ' + typed);
      terminalBody.scrollTop = terminalBody.scrollHeight;
      return;
    }

    const run = () => {
      let result;
      try {
        result = resolved.kind === 'cmd' ? resolved.fn(resolved.arg) : resolved.fn();
      } catch (e) {
        result = [{ text: '  Something went wrong running that command: ' + String(e && e.message || e), cls: 'red' }];
      }
      if (result === null || result === undefined) return;
      renderInto(block, result);
    };

    if (INSTANT_KEYS.has(resolved.key) || reducedMotion()) {
      run();
      return;
    }

    const thinking = thinkingEl(resolved.isNL ? 'Interpreting' : THINK_VERBS[Math.floor(Math.random() * THINK_VERBS.length)]);
    block.appendChild(thinking);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    const delay = resolved.isNL ? 650 : 430;
    window.setTimeout(() => {
      thinking.remove();
      if (resolved.isNL) {
        const note = document.createElement('div');
        note.className = 'output-line dim';
        note.style.fontStyle = 'italic';
        note.innerHTML = '  I think you\'re looking for <span class="cmd-name">' + escapeHtml(resolved.key) + '</span> — running it:';
        block.appendChild(note);
      }
      run();
    }, delay);
  }

  // ============ AUTOCOMPLETE ============
  function allCommandEntries() {
    const entries = [];
    COMMAND_GROUPS.forEach((g) => Object.keys(g).forEach((k) => entries.push([k, g[k].desc])));
    store.projects.forEach((p) => entries.push(['/' + p.slug, 'Project — ' + p.name]));
    entries.push(['/secrets', '…are you sure you want to go there?']);
    entries.push(['/matrix', 'Green matrix rain']);
    entries.push(['/konami', 'Confetti party']);
    entries.push(['/now', 'Live local time panel']);
    entries.push(['/flip', 'Turn the terminal upside down']);
    Object.keys(ALIASES).forEach((k) => entries.push([k, 'Alias → ' + ALIASES[k]]));
    return entries;
  }

  function updateAutocomplete(value) {
    const val = value.toLowerCase().trim();
    acItems = [];
    acIndex = -1;
    if (!val) { autocompleteEl.classList.remove('show'); cmdInput.removeAttribute('aria-activedescendant'); cmdInput.setAttribute('aria-expanded', 'false'); return; }
    const matches = allCommandEntries().filter((e) => e[0].startsWith(val) || e[0].startsWith('/' + val));
    const capped = matches.slice(0, 9);
    if (!capped.length || (capped.length === 1 && capped[0][0] === val)) {
      autocompleteEl.classList.remove('show');
      cmdInput.removeAttribute('aria-activedescendant');
      cmdInput.setAttribute('aria-expanded', 'false');
      return;
    }
    acItems = capped;
    autocompleteEl.innerHTML = '';
    capped.forEach((e, i) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.id = 'ac-opt-' + i;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.innerHTML = '<span class="ac-cmd">' + escapeHtml(e[0]) + '</span><span class="ac-desc">' + escapeHtml(e[1]) + '</span>';
      item.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        cmdInput.value = e[0];
        autocompleteEl.classList.remove('show');
        cmdInput.removeAttribute('aria-activedescendant');
        cmdInput.setAttribute('aria-expanded', 'false');
        cmdInput.focus();
      });
      autocompleteEl.appendChild(item);
    });
    autocompleteEl.classList.add('show');
    cmdInput.setAttribute('aria-expanded', 'true');
  }

  function highlightAcItem() {
    $$('.autocomplete-item', autocompleteEl).forEach((el, i) => {
      el.classList.toggle('active', i === acIndex);
      el.setAttribute('aria-selected', i === acIndex ? 'true' : 'false');
      if (i === acIndex) {
        el.scrollIntoView({ block: 'nearest' });
        cmdInput.setAttribute('aria-activedescendant', el.id);
      }
    });
  }
  function completeFromAc() {
    if (acIndex >= 0 && acItems[acIndex]) cmdInput.value = acItems[acIndex][0];
    else if (acItems.length) cmdInput.value = acItems[0][0];
    autocompleteEl.classList.remove('show');
    cmdInput.removeAttribute('aria-activedescendant');
    cmdInput.setAttribute('aria-expanded', 'false');
  }

  cmdInput.addEventListener('input', () => updateAutocomplete(cmdInput.value));

  cmdInput.addEventListener('keydown', (e) => {
    const acOpen = autocompleteEl.classList.contains('show');
    if (acOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); acIndex = Math.min(acIndex + 1, acItems.length - 1); highlightAcItem(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); acIndex = Math.max(acIndex - 1, -1); highlightAcItem(); return; }
      if (e.key === 'Tab') { e.preventDefault(); completeFromAc(); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (acIndex >= 0 && acItems[acIndex]) {
          const selected = acItems[acIndex][0];
          autocompleteEl.classList.remove('show');
          cmdInput.removeAttribute('aria-activedescendant');
          cmdInput.setAttribute('aria-expanded', 'false');
          cmdInput.value = '';
          executeCommand(selected);
          return;
        }
        // If the top suggestion is just the typed value (or its /normalized
        // form), run it outright instead of forcing a second Enter.
        const top = (acIndex >= 0 && acItems[acIndex]) ? acItems[acIndex][0] : (acItems.length ? acItems[0][0] : '');
        const val = cmdInput.value.toLowerCase().trim();
        if (top && (top === val || top === '/' + val)) {
          autocompleteEl.classList.remove('show');
          cmdInput.removeAttribute('aria-activedescendant');
          cmdInput.setAttribute('aria-expanded', 'false');
          cmdInput.value = '';
          executeCommand(top);
          return;
        }
        completeFromAc();
        return;
      }
      if (e.key === 'Escape') { autocompleteEl.classList.remove('show'); cmdInput.removeAttribute('aria-activedescendant'); cmdInput.setAttribute('aria-expanded', 'false'); return; }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const val = cmdInput.value.toLowerCase().trim();
      if (!val) return;
      const entries = allCommandEntries();
      const match = entries.find((x) => x[0].startsWith(val) || x[0].startsWith('/' + val));
      if (match) { cmdInput.value = match[0]; updateAutocomplete(cmdInput.value); }
      return;
    }
    if (e.key === 'Enter') {
      autocompleteEl.classList.remove('show');
      cmdInput.removeAttribute('aria-activedescendant');
      cmdInput.setAttribute('aria-expanded', 'false');
      const value = cmdInput.value;
      cmdInput.value = '';
      executeCommand(value);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        cmdInput.value = commandHistory[historyIndex];
        updateAutocomplete(cmdInput.value);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) { historyIndex--; cmdInput.value = commandHistory[historyIndex]; }
      else { historyIndex = -1; cmdInput.value = ''; }
      updateAutocomplete(cmdInput.value);
      return;
    }
  });

  // focus the command input when typing anywhere outside a form control
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (closeOverlay.classList.contains('visible')) return;
    if (!paletteOverlay.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1) cmdInput.focus();
  });

  terminalBody.addEventListener('click', (e) => {
    if (window.getSelection().toString()) return;
    if (e.target.closest && e.target.closest('button, a, input, select, textarea, label, .form-panel')) return;
    if (store.mode === 'terminal') cmdInput.focus();
  });

  // ============ COMMAND PALETTE ============
  function paletteItems() {
    const items = [];
    Object.keys(COMMANDS).forEach((k) => items.push({ kind: 'command', name: k, desc: COMMANDS[k].desc, run: () => executeCommand(k) }));
    Object.keys(INFO_COMMANDS).forEach((k) => items.push({ kind: 'command', name: k, desc: INFO_COMMANDS[k].desc, run: () => executeCommand(k) }));
    Object.keys(THEME_COMMANDS).forEach((k) => items.push({ kind: 'command', name: k, desc: THEME_COMMANDS[k].desc, run: () => executeCommand(k) }));
    store.projects.forEach((p) => items.push({ kind: 'project', name: p.name, desc: '/' + p.slug + ' — ' + p.type, run: () => { setMode('terminal'); executeCommand('/' + p.slug); } }));
    THEME_ENUM.forEach((t) => items.push({ kind: 'theme', name: t, desc: 'Switch to the ' + t + ' theme', run: () => { applyTheme(t); appendOutputLines([{ text: '  Theme set to ' + t + ' from the palette.', cls: 'accent' }]); } }));
    [['terminal', 'Terminal home — command prompt and output'], ['board', 'Projects Board — cards, filters, bulk actions'], ['export', 'Export center — Portfolio JSON and Resume Markdown'], ['archive', 'Archive vault — restore archived projects']].forEach((v) => {
      items.push({ kind: 'view', name: MODE_LABELS[v[0]], desc: v[1], run: () => setMode(v[0]) });
    });
    return items;
  }

  let paletteResults = [];
  let paletteIndex = -1;
  let lastFocusBeforePalette = null;

  function paletteScore(item, q) {
    if (!q) return 1;
    const name = item.name.toLowerCase();
    const desc = (item.desc || '').toLowerCase();
    if (name === q) return 6;
    if (name.startsWith(q)) return 5;
    if (name.indexOf(q) !== -1) return 4;
    if (desc.indexOf(q) !== -1) return 2;
    // subsequence
    let qi = 0;
    for (let i = 0; i < name.length && qi < q.length; i++) if (name[i] === q[qi]) qi++;
    if (qi === q.length) return 1;
    return 0;
  }

  function renderPalette() {
    const q = paletteInput.value.toLowerCase().trim();
    paletteResults = paletteItems()
      .map((it) => ({ it: it, score: paletteScore(it, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.it.name.localeCompare(b.it.name))
      .slice(0, 14)
      .map((x) => x.it);
    paletteIndex = paletteResults.length ? 0 : -1;
    if (!paletteResults.length) {
      paletteList.innerHTML = '<div class="palette-empty">No matches for "' + escapeHtml(q) + '" — try a command, a project name, a theme, or "export".</div>';
      return;
    }
    paletteList.innerHTML = paletteResults.map((it, i) =>
      '<div class="palette-item' + (i === paletteIndex ? ' active' : '') + '" data-i="' + i + '" role="option">' +
      '<span class="kind-badge ' + it.kind + '">' + it.kind + '</span>' +
      '<span class="pi-name">' + escapeHtml(it.name) + '</span>' +
      '<span class="pi-desc">' + escapeHtml(it.desc || '') + '</span></div>').join('');
    $$('.palette-item', paletteList).forEach((el) => {
      el.addEventListener('click', () => activatePaletteItem(Number(el.dataset.i)));
    });
  }
  function highlightPalette() {
    $$('.palette-item', paletteList).forEach((el, i) => el.classList.toggle('active', i === paletteIndex));
    const act = $('.palette-item.active', paletteList);
    if (act) act.scrollIntoView({ block: 'nearest' });
  }
  function activatePaletteItem(i) {
    const it = paletteResults[i];
    if (!it) return;
    closePalette();
    it.run();
  }
  function openPalette() {
    lastFocusBeforePalette = document.activeElement;
    paletteOverlay.hidden = false;
    setTerminalInert(true);
    paletteInput.value = '';
    renderPalette();
    paletteInput.focus();
  }
  function closePalette(refocus) {
    paletteOverlay.hidden = true;
    setTerminalInert(false);
    if (refocus !== false) {
      const target = lastFocusBeforePalette && lastFocusBeforePalette.isConnected ? lastFocusBeforePalette : cmdInput;
      target.focus({ preventScroll: true });
    }
  }
  paletteInput.addEventListener('input', renderPalette);
  paletteInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); paletteIndex = Math.min(paletteIndex + 1, paletteResults.length - 1); highlightPalette(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); paletteIndex = Math.max(paletteIndex - 1, 0); highlightPalette(); return; }
    if (e.key === 'Enter') { e.preventDefault(); activatePaletteItem(paletteIndex); return; }
    if (e.key === 'Escape') { e.preventDefault(); closePalette(); return; }
    if (e.key === 'Tab') { e.preventDefault(); }
  });
  paletteOverlay.addEventListener('mousedown', (e) => {
    if (e.target === paletteOverlay) closePalette();
  });
  paletteOverlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = [paletteInput];
    const first = focusables[0];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === first) { e.preventDefault(); }
  });

  // ============ GLOBAL KEYBOARD ============
  document.addEventListener('keydown', (e) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (isMod && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (paletteOverlay.hidden) openPalette(); else closePalette();
      return;
    }
    if (isMod && !e.altKey && e.key.toLowerCase() === 'z') {
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      const inTextControl = tag === 'textarea' || (tag === 'input' && t.type !== 'checkbox' && t.type !== 'radio');
      if (inTextControl && (t.closest('.form-panel') || t.closest('.import-panel') || t.closest('.palette'))) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if (isMod && !e.altKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    if (e.key === 'Escape') {
      if (closeOverlay.classList.contains('visible')) { reopenTerminal(); return; }
      if (!paletteOverlay.hidden) { closePalette(); return; }
      if (matrixCanvas.classList.contains('active')) stopMatrix();
    }
  });

  const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (rmQuery.addEventListener) rmQuery.addEventListener('change', () => { if (rmQuery.matches) stopMatrix(); });

  // ============ WEBMCP ACTION CONTRACT ============
  // Modules: browse-query-v1, entity-collection-v1, artifact-transfer-v1 — bound to
  // the product values in the instruction's Bindings. Handlers drive the same
  // application logic as the visible shell, board, export, and archive surfaces.
  const ENTITY_FIELD_PROPS = {
    name: { type: 'string', description: 'Project name, 1–80 characters after trim' },
    slug: { type: 'string', description: 'URL slug: lowercase letters, digits, hyphens; 1–48 chars; unique among active projects' },
    blurb: { type: 'string', description: 'Short description, 1–280 characters after trim' },
    status: { type: 'string', enum: STATUS_ENUM, description: 'Exactly one of shipped, wip, archived' },
    tags: { type: 'array', items: { type: 'string' }, description: '1–8 unique tags, each 1–24 characters' },
    stats: { type: 'array', items: { type: 'string' }, description: '1–4 stat chips, each 1–32 characters' },
    type: { type: 'string', description: 'Project type label, 1–40 characters' },
    year: { type: 'integer', description: 'Integer from 1990 through 2100' },
  };

  const WEBMCP_TOOLS = [
    {
      name: 'browse_open',
      description: 'Open a bound destination in the live UI: terminal-home, project-detail (pass a project slug), about, export-center, or archive-vault. Uses the same navigation as the visible controls.',
      inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: ['terminal-home', 'project-detail', 'about', 'export-center', 'archive-vault'] }, slug: { type: 'string', description: 'Project slug — required for project-detail (e.g. signals)' } }, required: ['destination'], additionalProperties: false },
    },
    {
      name: 'browse_set_theme',
      description: 'Apply a session theme (dark, light, retro, or glass) exactly like /dark, /light, /retro, /glass.',
      inputSchema: { type: 'object', properties: { theme: { type: 'string', enum: THEME_ENUM } }, required: ['theme'], additionalProperties: false },
    },
    {
      name: 'browse_apply_filter',
      description: 'Filter the Projects Board by status or tag (same handler as the board chips and status:/tag: search syntax) and open the board.',
      inputSchema: { type: 'object', properties: { filter: { type: 'string', enum: ['status', 'tag'] }, value: { type: 'string', description: 'e.g. shipped, wip, or a tag name' } }, required: ['filter', 'value'], additionalProperties: false },
    },
    {
      name: 'browse_clear_filter',
      description: 'Clear the board search/filter query and restore the full visible set.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'entity_create',
      description: 'Create a project through the same validation as the visible create form. Only "name" is required; missing optional fields get generated defaults. Invalid values return the same per-field errors as the form and change nothing.',
      inputSchema: { type: 'object', properties: ENTITY_FIELD_PROPS, required: ['name'], additionalProperties: false },
    },
    {
      name: 'entity_select',
      description: 'Select a project by slug: opens its detail block in the terminal (same as the /slug shortcut).',
      inputSchema: { type: 'object', properties: { slug: { type: 'string', description: 'Active project slug' } }, required: ['slug'], additionalProperties: false },
    },
    {
      name: 'entity_update',
      description: 'Update the active project identified by "slug"; provide any of the other project fields to change them. The merged record passes the same validation as the visible edit form.',
      inputSchema: { type: 'object', properties: Object.assign({}, ENTITY_FIELD_PROPS, { newSlug: { type: 'string', description: 'Optional replacement slug (validated like the slug field)' } }), required: ['slug'], additionalProperties: false },
    },
    {
      name: 'entity_delete',
      description: 'Delete the active project with the given slug. Requires confirm=true; undoable via /undo.',
      inputSchema: { type: 'object', properties: { slug: { type: 'string' }, confirm: { type: 'boolean', description: 'Must be true to delete' } }, required: ['slug', 'confirm'], additionalProperties: false },
    },
    {
      name: 'artifact_export',
      description: 'Compile the live portfolio package and open the Export center on the requested tab. Returns metadata only — full artifact text stays in the visible preview (contents are not transported over WebMCP).',
      inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'markdown'] } }, required: ['format'], additionalProperties: false },
    },
    {
      name: 'artifact_import',
      description: 'Import the most recently exported/copied Portfolio JSON package (import mode declared-portfolio) through the same validation as the Import panel. Run artifact_export or artifact_copy first.',
      inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['declared-portfolio'] } }, required: ['mode'], additionalProperties: false },
    },
    {
      name: 'artifact_copy',
      description: 'Copy the current export text (Portfolio JSON or Resume Markdown) to the clipboard — same handler as the visible Copy button.',
      inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'markdown'] } }, required: ['format'], additionalProperties: false },
    },
  ];

  function buildEntityRecord(args) {
    const name = args && typeof args.name === 'string' ? args.name : '';
    const d = defaultsFor(name);
    return {
      name: name,
      slug: typeof args.slug === 'string' && args.slug.trim() ? args.slug : d.slug,
      blurb: typeof args.blurb === 'string' && args.blurb.trim() ? args.blurb : d.blurb,
      status: typeof args.status === 'string' ? args.status : d.status,
      tags: args.tags !== undefined ? coerceTags(args.tags) : d.tags,
      stats: args.stats !== undefined ? coerceStats(args.stats) : d.stats,
      type: typeof args.type === 'string' && args.type.trim() ? args.type : d.type,
      year: args.year !== undefined ? args.year : d.year,
    };
  }

  const WEBMCP_HANDLERS = {
    browse_open(args) {
      const destination = args.destination;
      if (!destination) return { ok: false, error: 'destination is required' };
      if (destination === 'terminal-home') {
        setMode('terminal');
        return { ok: true, destination: destination, mode: store.mode, activeProjects: store.projects.length };
      }
      if (destination === 'about') {
        setMode('terminal');
        executeCommand('/about');
        return { ok: true, destination: destination, mode: store.mode, ran: '/about' };
      }
      if (destination === 'project-detail') {
        if (!args.slug) return { ok: false, error: 'slug is required for project-detail' };
        const p = findBySlug(args.slug);
        if (!p) return { ok: false, error: 'project not found: "' + args.slug + '" (no active project has that slug)' };
        setMode('terminal');
        executeCommand('/' + p.slug);
        return { ok: true, destination: destination, mode: store.mode, project: p.name, ran: '/' + p.slug };
      }
      if (destination === 'export-center') {
        setMode('export');
        store.lastExportJson = portfolioJsonText();
        return { ok: true, destination: destination, mode: store.mode, exportTab: store.exportTab };
      }
      if (destination === 'archive-vault') {
        setMode('archive');
        return { ok: true, destination: destination, mode: store.mode, archivedProjects: store.archive.length };
      }
      return { ok: false, error: 'unknown destination: ' + destination };
    },
    browse_set_theme(args) {
      if (!args || THEME_ENUM.indexOf(args.theme) === -1) return { ok: false, error: 'theme must be one of dark, light, retro, glass' };
      applyTheme(args.theme);
      return { ok: true, theme: store.theme, mode: store.mode, rootClass: document.documentElement.className || '(none — dark default)', exportTheme: portfolioObject().theme };
    },
    browse_apply_filter(args) {
      if (!args || (args.filter !== 'status' && args.filter !== 'tag')) return { ok: false, error: 'filter must be "status" or "tag"' };
      if (typeof args.value !== 'string' || !args.value.trim()) return { ok: false, error: 'value is required' };
      store.query = args.filter + ':' + args.value.trim();
      setMode('board', { noFocus: true });
      renderBoard();
      return { ok: true, query: store.query, visibleProjects: filteredProjects().length, activeProjects: store.projects.length, mode: store.mode };
    },
    browse_clear_filter() {
      store.query = '';
      renderBoard();
      return { ok: true, query: '', visibleProjects: filteredProjects().length, activeProjects: store.projects.length };
    },
    entity_create(args) {
      args = args || {};
      const rec = buildEntityRecord(args);
      const errors = validateProject(rec);
      if (Object.keys(errors).length) {
        return { ok: false, error: 'validation failed — same rules as the visible create form', errors: errors, activeProjects: store.projects.length };
      }
      const created = createProject(rec, { quiet: true });
      toast('Created "' + created.name + '" — shortcut /' + created.slug + ' is live');
      return { ok: true, created: publicRecord(created), counts: countsInfo() };
    },
    entity_select(args) {
      if (!args || !args.slug) return { ok: false, error: 'slug is required' };
      const p = findBySlug(args.slug);
      if (!p) return { ok: false, error: 'project not found: "' + args.slug + '"' };
      setMode('terminal');
      executeCommand('/' + p.slug);
      return { ok: true, project: publicRecord(p), mode: store.mode, ran: '/' + p.slug };
    },
    entity_update(args) {
      args = args || {};
      if (!args.slug) return { ok: false, error: 'slug is required to identify the project to update' };
      const p = findBySlug(args.slug);
      if (!p) return { ok: false, error: 'project not found: "' + args.slug + '"' };
      const merged = {
        name: args.name !== undefined ? args.name : p.name,
        slug: args.newSlug !== undefined && String(args.newSlug).trim() ? args.newSlug : p.slug,
        blurb: args.blurb !== undefined ? args.blurb : p.blurb,
        status: args.status !== undefined ? args.status : p.status,
        tags: args.tags !== undefined ? coerceTags(args.tags) : p.tags.slice(),
        stats: args.stats !== undefined ? coerceStats(args.stats) : p.stats.slice(),
        type: args.type !== undefined ? args.type : p.type,
        year: args.year !== undefined ? args.year : p.year,
      };
      const errors = validateProject(merged, { excludeId: p.id });
      if (Object.keys(errors).length) {
        return { ok: false, error: 'validation failed — same rules as the visible edit form', errors: errors };
      }
      const updated = updateProject(p.id, merged, { quiet: true });
      toast('Updated "' + updated.name + '" across board, /work, and export');
      return { ok: true, updated: publicRecord(updated), counts: countsInfo() };
    },
    entity_delete(args) {
      if (!args || !args.slug) return { ok: false, error: 'slug is required' };
      if (args.confirm !== true) return { ok: false, error: 'confirm=true is required to delete a project' };
      const p = findBySlug(args.slug);
      if (!p) return { ok: false, error: 'project not found: "' + args.slug + '"' };
      const name = p.name;
      deleteProject(p.id, { quiet: true });
      toast('Deleted "' + name + '" — Ctrl+Z to undo');
      return { ok: true, deleted: args.slug, counts: countsInfo() };
    },
    artifact_export(args) {
      if (!args || (args.format !== 'json' && args.format !== 'markdown')) return { ok: false, error: 'format must be "json" or "markdown"' };
      store.exportTab = args.format === 'markdown' ? 'markdown' : 'json';
      setMode('export');
      store.lastExportJson = portfolioJsonText();
      renderExportPreview();
      return { ok: true, format: args.format, version: '1.0', theme: store.theme, consent: store.consent, projectCount: store.projects.length, note: 'Export center is open on the ' + store.exportTab + ' tab; artifact contents stay in the visible preview.' };
    },
    artifact_import(args) {
      if (!args || args.mode !== 'declared-portfolio') return { ok: false, error: 'mode must be "declared-portfolio"' };
      if (!store.lastExportJson) return { ok: false, error: 'no declared portfolio package yet — run artifact_export or artifact_copy first' };
      let doc;
      try { doc = JSON.parse(store.lastExportJson); }
      catch (e) { return { ok: false, error: 'stored package failed to parse: ' + String(e && e.message || e) }; }
      const problems = validatePortfolio(doc);
      if (problems.length) return { ok: false, error: 'import rejected by the Portfolio JSON field contract', problems: problems.slice(0, 6) };
      const n = applyImportedProjects(doc, { quiet: true });
      toast('Imported ' + n + ' projects from the declared package');
      return { ok: true, importedProjects: n, counts: countsInfo() };
    },
    artifact_copy(args) {
      if (!args || (args.format !== 'json' && args.format !== 'markdown')) return { ok: false, error: 'format must be "json" or "markdown"' };
      store.exportTab = args.format === 'markdown' ? 'markdown' : 'json';
      setMode('export');
      renderExportPreview();
      const text = currentExportText();
      store.lastExportJson = portfolioJsonText();
      try {
        const p = navigator.clipboard && navigator.clipboard.writeText(text);
        if (p && p.catch) p.catch(() => { /* clipboard may be unavailable; preview stays visible and selectable */ });
      } catch (e) { /* clipboard may be unavailable; preview remains visible */ }
      showCopyConfirm('Copied to clipboard ✓');
      return { ok: true, format: args.format, chars: text.length, note: 'Text also remains visible in the Export preview.' };
    },
  };

  window.webmcp_session_info = function () {
    return {
      contract_version: 'zto-webmcp-v1',
      app: 'designer-portfolio-terminal',
      modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
      bindings: {
        browsable_entity: 'projects',
        destinations: ['terminal-home', 'project-detail', 'about', 'export-center', 'archive-vault'],
        filters: ['status', 'tag'],
        themes: ['dark', 'light', 'retro', 'glass'],
        entity: 'project',
        entity_operations: ['create', 'select', 'update', 'delete'],
        entity_fields: ['name', 'slug', 'blurb', 'tags', 'status', 'stats', 'type', 'year'],
        artifact_operations: ['export', 'import', 'copy'],
        export_formats: ['json', 'markdown'],
        import_modes: ['declared-portfolio'],
      },
      tools: WEBMCP_TOOLS.map((t) => t.name),
    };
  };
  window.webmcp_list_tools = function () {
    return WEBMCP_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
  };
  window.webmcp_invoke_tool = function (name, args) {
    const handler = WEBMCP_HANDLERS[name];
    if (!handler) return { ok: false, error: 'unknown tool: ' + name + ' — use webmcp_list_tools for the bound set' };
    try {
      return handler(args || {});
    } catch (e) {
      return { ok: false, error: 'handler error: ' + String(e && e.message || e) };
    }
  };

  // ============ INIT ============
  const sessionStart = Date.now();
  renderAll();
  runBoot();
})();
