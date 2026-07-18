/**
 * TerminalPortfolio — clean-room CLI portfolio shell.
 * Title updates only; inert nav; debranded placeholders.
 */
(function () {
  // ============ URL ROUTING ============
  const ROUTE_MAP = {
    '/about': 'about',
    '/work': 'work',
    '/clients': 'clients',
    '/skills': 'skills',
    '/contact': 'contact',
    '/social': 'social',
    '/philosophy': 'philosophy',
    '/testimonials': 'testimonials',
    '/awards': 'awards',
    '/privacy': 'privacy',
    '/articles': 'articles',
  };
  const ROUTE_TITLES = {
    '': 'Your Name | Product Designer & Design Systems Lead',
    'about': 'About | Product Designer & Design Systems Lead',
    'work': 'Work | Selected Projects | Product Designer',
    'clients': 'Clients | Selected Companies | Product Designer',
    'skills': 'Skills | Design Systems, UX, Product Design',
    'contact': 'Contact | Product Designer & Design Systems Lead',
    'social': 'Social Profiles | Product Designer',
    'philosophy': 'Design Philosophy | Product Designer',
    'testimonials': 'Testimonials | What Clients & Peers Say',
    'awards': 'Awards & Recognition | Product Designer',
    'privacy': 'Privacy Policy',
    'articles': 'Articles on Design Systems, UX & Strategy',
  };

  function updateUrl(command) {
    // Local static demo: update document title only; do not change location.
    const slug = ROUTE_MAP[command];
    if (slug !== undefined) {
      document.title = ROUTE_TITLES[slug] || ROUTE_TITLES[''];
    } else if (command === '/clear' || command === '/help') {
      document.title = ROUTE_TITLES[''];
    }
  }

  // Handle back/forward navigation
  window.addEventListener('popstate', (e) => {
    const path = window.location.pathname.replace(/^\//, '');
    const slug = path || '';
    document.title = ROUTE_TITLES[slug] || ROUTE_TITLES[''];
    if (e.state && e.state.cmd) {
      executeCommand(e.state.cmd);
    } else if (slug) {
      executeCommand('/' + slug);
    }
  });

  // ============ COMMANDS DATA ============
  const NAV_COMMANDS = {
    '/help': {
      desc: 'List all available commands',
      fn: cmdHelp
    },
    '/about': {
      desc: 'About the designer',
      fn: cmdAbout
    },
    '/work': {
      desc: 'Featured projects & case studies',
      fn: cmdWork
    },
    '/clients': {
      desc: 'Companies I\'ve worked with',
      fn: cmdClients
    },
    '/skills': {
      desc: 'Expertise & capabilities',
      fn: cmdSkills
    },
    '/philosophy': {
      desc: 'My design philosophy',
      fn: cmdPhilosophy
    },
    '/social': {
      desc: 'Social profiles & links',
      fn: cmdSocial
    },
    '/articles': {
      desc: 'Published articles & guides',
      fn: cmdArticles
    },
    '/testimonials': {
      desc: 'What people say about me',
      fn: cmdTestimonials
    },
    '/awards': {
      desc: 'Awards & recognition',
      fn: cmdAwards
    },
    '/contact': {
      desc: 'Get in touch',
      fn: cmdContact
    },
    '/clear': {
      desc: 'Clear the terminal',
      fn: cmdClear
    },
  };

  // ============ QUICK INFO COMMANDS ============
  const INFO_COMMANDS = {
    '/linkedin': {
      desc: 'LinkedIn profile',
      fn: cmdLinkedin
    },
    '/facebook': {
      desc: 'Facebook profile',
      fn: cmdFacebook
    },
    '/instagram': {
      desc: 'Instagram profile',
      fn: cmdInstagram
    },
    '/phone': {
      desc: 'Phone number',
      fn: cmdPhone
    },
    '/email': {
      desc: 'Email address',
      fn: cmdEmail
    },
    '/agency': {
      desc: 'Design Studio — agency',
      fn: cmdAgency
    },
    '/location': {
      desc: 'Where I\'m based',
      fn: cmdLocation
    },
    '/privacy': {
      desc: 'Privacy policy & cookies',
      fn: cmdPrivacy
    },
  };

  // ============ PROJECT COMMANDS ============
  const PROJECT_COMMANDS = {
    '/signals': {
      desc: 'Signals — Research Integrity Platform',
      fn: () => cmdProject('Signals')
    },
    '/anylyze': {
      desc: 'Anylyze — Analytics Data Platform',
      fn: () => cmdProject('Anylyze')
    },
    '/liveu': {
      desc: 'LiveU — Signa Design System',
      fn: () => cmdProject('LiveU — Signa Design System')
    },
    '/tuiasi': {
      desc: 'TUIASI — University Redesign',
      fn: () => cmdProject('TUIASI — University Redesign')
    },
    '/resnet': {
      desc: 'ResNet AI — Hospitality Design System',
      fn: () => cmdProject('ResNet AI')
    },
    '/socyal': {
      desc: 'Socyal — HR Mobile Platform',
      fn: () => cmdProject('Socyal')
    },
    '/app4home': {
      desc: 'App4Home — Smart Home IoT App',
      fn: () => cmdProject('App4Home')
    },
    '/cyberghost': {
      desc: 'CyberGhost VPN — Consumer Privacy',
      fn: () => cmdProject('CyberGhost VPN')
    },
    '/cognitiveseo': {
      desc: 'CognitiveSEO — SEO Dashboard',
      fn: () => cmdProject('CognitiveSEO')
    },
    '/big5': {
      desc: 'Big5 American Diner — Restaurant Brand Identity',
      fn: () => cmdProject('Big5 American Diner')
    },
    '/darnic': {
      desc: 'Darnic — NGO Campaign Branding',
      fn: () => cmdProject('Darnic for Education')
    },
    '/crafting-social': {
      desc: 'Crafting Social Stories — Workshop Brand',
      fn: () => cmdProject('Crafting Social Stories')
    },
  };

  // ============ THEME COMMANDS ============
  const THEME_COMMANDS = {
    '/dark': {
      desc: 'Dark mode (default)',
      fn: cmdDark
    },
    '/light': {
      desc: 'Light mode',
      fn: cmdLight
    },
    '/retro': {
      desc: 'Retro CRT mode',
      fn: cmdRetro
    },
    '/glass': {
      desc: 'Modern glass mode',
      fn: cmdGlass
    },
    '/themes': {
      desc: 'Browse all themes',
      fn: cmdThemes
    },
  };

  // Combined lookup for all command groups
  const ALL_COMMAND_GROUPS = [NAV_COMMANDS, INFO_COMMANDS, PROJECT_COMMANDS, THEME_COMMANDS];

  // Command aliases
  const ALIASES = {
    '/portfolio': '/work',
    '/projects': '/work',
    '/works': '/work',
    '/me': '/about',
    '/who': '/about',
    '/info': '/about',
    '/expertise': '/skills',
    '/services': '/skills',
    '/writing': '/articles',
    '/blog': '/articles',
    '/publications': '/articles',
    '/reviews': '/testimonials',
    '/recommendations': '/testimonials',
    '/recognition': '/awards',
    '/award': '/awards',
    '/trophies': '/awards',
    '/wins': '/awards',
    '/certificates': '/awards',
    '/certifications': '/awards',
    '/hire': '/contact',
    '/links': '/social',
    '/profiles': '/social',
    '/socials': '/social',
    '/reset': '/clear',
    '/cls': '/clear',
    '/call': '/phone',
    '/designstudio': '/agency',
    '/design-studio': '/agency',
    '/rocket': '/agency',
    '/fb': '/facebook',
    '/ig': '/instagram',
    '/insta': '/instagram',
    '/mail': '/email',
    // Skill names → /skills
    '/product design': '/skills',
    '/design systems': '/skills',
    '/ux research': '/skills',
    '/ux': '/skills',
    '/ui design': '/skills',
    '/ui': '/skills',
    '/data visualization': '/skills',
    '/brand': '/skills',
    '/design leadership': '/skills',
    '/accessibility': '/skills',
    '/wcag': '/skills',
    '/prototyping': '/skills',
    '/motion': '/skills',
    '/workshop': '/skills',
    // Theme aliases
    '/theme': '/themes',
    '/colors': '/themes',
    '/appearance': '/themes',
    '/darkmode': '/dark',
    '/lightmode': '/light',
    '/dark mode': '/dark',
    '/light mode': '/light',
  };

  // ============ EMAIL OBFUSCATION ============
  const _e = ['hello', 'example.com'].join('@');
  function mailto() { return 'mai' + 'lto:' + _e; }

  // ============ DOM ============
  const bootText = document.getElementById('bootText');
  const terminal = document.getElementById('terminal');
  const terminalBody = document.getElementById('terminalBody');
  const outputArea = document.getElementById('outputArea');
  const cmdInput = document.getElementById('cmdInput');
  const autocompleteEl = document.getElementById('autocomplete');
  const asciiNameEl = document.getElementById('asciiName');
  document.getElementById('emailSubtitle').textContent = _e;
  const closeOverlay = document.getElementById('closeOverlay');

  // ============ SHARP WALLPAPER (lazy) ============
  // Blur wallpaper is the LCP candidate; sharp version only matters when minimized.
  let sharpLoaded = false;
  function loadSharpWallpaper() {
    if (sharpLoaded) return;
    sharpLoaded = true;
    const sharp = document.getElementById('wallpaper-sharp');
    if (!sharp) return;
    sharp.querySelectorAll('source[data-srcset]').forEach(s => {
      s.srcset = s.dataset.srcset;
    });
    const img = sharp.querySelector('img[data-src]');
    if (img) img.src = img.dataset.src;
  }
  if ('requestIdleCallback' in window) {
    window.addEventListener('load', () => requestIdleCallback(loadSharpWallpaper, { timeout: 3000 }), { once: true });
  } else {
    window.addEventListener('load', () => setTimeout(loadSharpWallpaper, 1500), { once: true });
  }

  // ============ TITLEBAR BUTTONS ============
  terminal.querySelector('.titlebar-dot.red').addEventListener('click', () => {
    terminal.style.display = 'none';
    closeOverlay.classList.add('visible');
  });

  document.getElementById('closeReopen').addEventListener('click', () => {
    closeOverlay.classList.remove('visible');
    terminal.style.display = '';
    terminal.classList.remove('minimized');
    document.body.classList.remove('minimized');
    cmdInput.focus();
  });

  terminal.querySelector('.titlebar-dot.yellow').addEventListener('click', () => {
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

  terminal.querySelector('.titlebar-dot.green').addEventListener('click', () => {
    if (terminal.classList.contains('minimized')) {
      terminal.classList.remove('minimized');
      document.body.classList.remove('minimized');
    }
    const isMaximized = terminal.classList.toggle('maximized');
    document.body.classList.toggle('maximized', isMaximized);
  });

  let commandHistory = [];
  let historyIndex = -1;
  let acItems = [];
  let acIndex = -1;
  let helpCount = 0;
  let idleTimer = null;
  let idleCount = 0;
  let cmdCount = 0;
  let currentTheme = 'dark';

  // ============ ASCII ART ============
  const ASCII_NAME = `
██╗   ██╗ ██████╗ ██╗   ██╗██████╗     ███╗   ██╗ █████╗ ███╗   ███╗███████╗
╚██╗ ██╔╝██╔═══██╗██║   ██║██╔══██╗    ████╗  ██║██╔══██╗████╗ ████║██╔════╝
 ╚████╔╝ ██║   ██║██║   ██║██████╔╝    ██╔██╗ ██║███████║██╔████╔██║█████╗  
  ╚██╔╝  ██║   ██║██║   ██║██╔══██╗    ██║╚██╗██║██╔══██║██║╚██╔╝██║██╔══╝  
   ██║   ╚██████╔╝╚██████╔╝██║  ██║    ██║ ╚████║██║  ██║██║ ╚═╝ ██║███████╗
   ╚═╝    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝`.trim();

  // ============ PIXEL ART SCALE-TO-FIT ============
  function scalePixelArt() {
    const rocket = document.querySelector('.pixel-art');
    if (!rocket) return;
    requestAnimationFrame(() => {
      const parent = rocket.parentElement;
      if (!parent) return;
      const parentW = parent.clientWidth - 32; // account for padding
      const rocketW = rocket.scrollWidth;
      if (rocketW > parentW && parentW > 0) {
        const scale = parentW / rocketW;
        rocket.style.transform = `scale(${scale})`;
        rocket.style.transformOrigin = 'top center';
        rocket.style.height = (rocket.scrollHeight * scale) + 'px';
      }
    });
  }
  window.addEventListener('resize', scalePixelArt);

  // ============ BOOT SEQUENCE ============
  const bootLines = [
    { text: 'Initializing portfolio system...', delay: 200 },
    { text: 'Loading design tokens...', delay: 150 },
    { text: 'Mounting component library... ', delay: 200 },
    { text: '[████████████████████████] ', delay: 100, append: true },
    { text: 'done', delay: 100, cls: 'done', append: true },
    { text: '\nResolving 12 case studies...', delay: 150 },
    { text: 'Connecting to design systems core... ', delay: 200 },
    { text: 'ok', delay: 80, cls: 'done', append: true },
    { text: '\nDesign systems: operational', delay: 100 },
    { text: 'UX research modules: loaded', delay: 100 },
    { text: 'Don\'t search for /secrets here...', delay: 80, cls: 'dim' },
    { text: 'Strategic thinking: engaged', delay: 100 },
    { text: '\n✦ ', delay: 300 },
    { text: 'designer.portfolio v10.0', delay: 80, cls: 'accent', append: true },
    { text: ' — ready.\n', delay: 200, append: true },
    { text: 'Press Enter to continue...', delay: 100 },
  ];

  async function runBoot() {
    // Check if we're on a deep-link route (e.g. /about, /work)
    const routeCmd = document.body.dataset.route;
    const isDeepLink = routeCmd && routeCmd.length > 0;

    if (isDeepLink) {
      // Skip boot animation for deep links — go straight to terminal
      terminal.classList.remove('booting');
      asciiNameEl.textContent = ASCII_NAME;
      scalePixelArt();
      await sleep(100);
      cmdInput.focus();
      resetIdleTimer();
      await sleep(200);
      executeCommand(routeCmd);
      return;
    }

    let currentLine = '';
    for (const step of bootLines) {
      await sleep(step.delay || 100);
      if (step.append) {
        const span = document.createElement('span');
        if (step.cls) span.className = step.cls;
        span.textContent = step.text;
        bootText.appendChild(span);
      } else {
        const div = document.createElement('div');
        if (step.cls) div.className = step.cls;
        div.textContent = step.text;
        bootText.appendChild(div);
      }
    }

    // Wait for Enter
    await new Promise(resolve => {
      function onKey(e) {
        if (e.key === 'Enter' || e.type === 'click' || e.type === 'touchstart') {
          document.removeEventListener('keydown', onKey);
          document.removeEventListener('click', onKey);
          document.removeEventListener('touchstart', onKey);
          resolve();
        }
      }
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onKey);
      document.addEventListener('touchstart', onKey);
    });

    terminal.classList.remove('booting');
    bootText.textContent = '';
    asciiNameEl.textContent = ASCII_NAME;
    scalePixelArt();
    await sleep(100);
    cmdInput.focus();
    resetIdleTimer();

    // Show cookie consent banner if not yet decided
    if (!localStorage.getItem('cookie_consent')) {
      await sleep(600);
      showConsentBanner();
    }

    // Auto-run command from 404 redirect
    const autoCmd = sessionStorage.getItem('autoCommand');
    if (autoCmd) {
      sessionStorage.removeItem('autoCommand');
      await sleep(400);
      executeCommand(autoCmd);
    }
  }

  function showConsentBanner() {
    const banner = document.createElement('div');
    banner.className = 'output-block';
    banner.id = 'consentBanner';
    const msg = document.createElement('div');
    msg.className = 'output-line dim';
    msg.style.fontStyle = 'italic';
    msg.innerHTML = `  <span class="accent" style="opacity:0.7">[system]</span> This site uses analytics cookies (GA4) to understand traffic.`;
    banner.appendChild(msg);

    const actions = document.createElement('div');
    actions.className = 'output-line';
    actions.style.marginTop = '4px';
    actions.innerHTML = `
      <span style="margin-left:2ch">
        <button type="button" id="consentAccept" class="inert-nav" style="cursor:pointer;text-decoration:underline;color:var(--text-dim);font-style:italic;background:none;border:none;font:inherit;padding:0">Accept</button>
        <span class="dim"> · </span>
        <button type="button" id="consentDecline" class="inert-nav" style="cursor:pointer;text-decoration:underline;color:var(--text-dim);font-style:italic;background:none;border:none;font:inherit;padding:0">Decline</button>
        <span class="dim"> · </span>
        <span class="dim" style="font-style:italic">/privacy for details</span>
      </span>
    `;
    banner.appendChild(actions);
    outputArea.appendChild(banner);
    terminalBody.scrollTop = terminalBody.scrollHeight;

    document.getElementById('consentAccept').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('cookie_consent', 'granted');
      // No GA/GTM in this static demo — guard so Accept never throws.
      if (typeof gtag === 'function') {
        gtag('consent', 'update', { analytics_storage: 'granted' });
      }
      banner.innerHTML = '<div class="output-line dim" style="font-style:italic">  <span class="accent" style="opacity:0.7">[system]</span> Analytics cookies accepted. Thank you.</div>';
      setTimeout(() => banner.remove(), 3000);
    });

    document.getElementById('consentDecline').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('cookie_consent', 'denied');
      banner.innerHTML = '<div class="output-line dim" style="font-style:italic">  <span class="accent" style="opacity:0.7">[system]</span> Analytics cookies declined. No tracking cookies will be used.</div>';
      setTimeout(() => banner.remove(), 3000);
    });
  }

  // ============ PROJECT DATA (shared by cmdWork + cmdProject) ============
  const PROJECTS = [
    { name: 'Signals', year: '2024', type: 'Research Integrity Platform', desc: 'Redesigned dense research dashboards for clarity. Tabbed navigation, sticky metrics, dynamic filtering.', tags: ['UX Design', 'Dashboard', 'Research'], stats: ['60% faster retrieval', '100% WCAG', '5x less scrolling'] },
    { name: 'Anylyze', year: '2024', type: 'Analytics Data Platform', desc: 'Rebuilt data visualization layer with three-tiered typography and five component states.', tags: ['Dashboard UX', 'Data Viz', 'SaaS'], stats: ['38% faster tasks', '71% fewer errors', '9.4/10 confidence'] },
    { name: 'LiveU — Signa Design System', year: '2024', type: 'Broadcasting Enterprise', desc: '120+ components for global live video platform. Atomic Design, Plus Jakarta Sans + Inter, 8px grid.', tags: ['Design System', 'Enterprise', 'Broadcasting'], stats: ['60% faster velocity', '120+ components', '100% consistency'] },
    { name: 'TUIASI — University Redesign', year: '2023', type: 'Education Platform', desc: 'Emergency 4-week rebuild of decade-old university site. Record admissions followed.', tags: ['Web Design', 'Education UX', 'Architecture'], stats: ['+4,200 students', '91% lighter pages', '10x faster'] },
    { name: 'ResNet AI', year: '2023', type: 'Hospitality Design System', desc: 'Tamed 1,300+ scattered variants into a governed token-based system with full documentation.', tags: ['Design System', 'Tokens', 'SaaS'], stats: ['60% fewer components', '40% faster handoff', '100% a11y'] },
    { name: 'Socyal', year: '2023', type: 'HR Mobile Platform', desc: 'Took an HR tool to an investor-ready standalone mobile product. #3 Product of the Day on Product Hunt.', tags: ['Product Design', 'Mobile UX', 'Product Hunt'], stats: ['#3 Product Hunt', '5-month delivery'] },
    { name: 'App4Home', year: '2024', type: 'Smart Home IoT App', desc: 'Reimagined smart home controls with time-aware dashboard, room-based navigation, and AI recommendations.', tags: ['Mobile UX', 'IoT', 'Product Design'], stats: ['40% less clutter', '2x faster onboarding'] },
    { name: 'CyberGhost VPN', year: '2018', type: 'Consumer Privacy App', desc: 'Made VPN accessible to non-technical users. Dark mode, slide-to-connect, 30-second onboarding.', tags: ['Cybersecurity', 'Mobile UX', 'Product Design'], stats: ['3-step onboarding', 'Privacy UX leader'] },
    { name: 'CognitiveSEO', year: '2017', type: 'SEO Dashboard', desc: 'Three-module restructure with progressive disclosure. Made power-user tools accessible to marketers.', tags: ['Dashboard UX', 'Data Viz', 'SaaS'], stats: ['40% faster tasks', '30% retention ↑', '45% less cognitive load'] },
    { name: 'Big5 American Diner', year: '2020', type: 'Restaurant Brand Identity', desc: 'Full brand system anchored around five founding recipes. Mid-century American diner aesthetic.', tags: ['Branding', 'Packaging', 'Storytelling'], stats: ['#1 Hospitality Brand locally', '100% organic growth'] },
    { name: 'Darnic for Education', year: '2024', type: 'NGO Campaign Branding', desc: '"Generosity builds futures." Cohesive brand for Christmas gift-giving campaign for underserved children.', tags: ['Logo Design', 'NGO', 'Brand Guidelines'], stats: ['3x faster kit production', '100% visual cohesion'] },
    { name: 'Crafting Social Stories', year: '2024', type: 'Educational Workshop Brand', desc: 'Dual-appeal identity for children\'s workshops — playful yet credible for corporate donors.', tags: ['Branding', 'NGO', 'Visual Identity'], stats: ['↑ Volunteer sign-ups', '↑ Donor engagement'] },
  ];

  // ============ COMMAND FUNCTIONS ============

  function cmdHelp() {
    const lines = [
      { text: 'Available Commands', cls: 'heading' },
      { text: '' },
      { html: '  <span class="cmd-desc" style="text-transform:uppercase;letter-spacing:1px;font-size:0.75em">Navigation</span>' },
    ];
    for (const [cmd, data] of Object.entries(NAV_COMMANDS)) {
      lines.push({ html: `  <span class="cmd-name">${cmd}</span> <span class="cmd-desc">${data.desc}</span>` });
    }
    lines.push({ text: '' });
    lines.push({ html: '  <span class="cmd-desc" style="text-transform:uppercase;letter-spacing:1px;font-size:0.75em">Quick Info</span>' });
    for (const [cmd, data] of Object.entries(INFO_COMMANDS)) {
      lines.push({ html: `  <span class="cmd-name">${cmd}</span> <span class="cmd-desc">${data.desc}</span>` });
    }
    lines.push({ text: '' });
    lines.push({ html: '  <span class="cmd-desc" style="text-transform:uppercase;letter-spacing:1px;font-size:0.75em">Projects</span>' });
    for (const [cmd, data] of Object.entries(PROJECT_COMMANDS)) {
      lines.push({ html: `  <span class="cmd-name">${cmd}</span> <span class="cmd-desc">${data.desc}</span>` });
    }
    lines.push({ text: '' });
    lines.push({ html: '  <span class="cmd-desc" style="text-transform:uppercase;letter-spacing:1px;font-size:0.75em">Themes</span>' });
    for (const [cmd, data] of Object.entries(THEME_COMMANDS)) {
      lines.push({ html: `  <span class="cmd-name">${cmd}</span> <span class="cmd-desc">${data.desc}</span>` });
    }
    lines.push({ text: '' });
    lines.push({ text: 'Aliases: /portfolio, /projects, /me, /hire, /call, /mail', cls: 'dim' });
    lines.push({ text: 'Tip: Use ↑↓ arrows for command history, Tab for autocomplete', cls: 'dim' });
    lines.push({ text: '' });
    lines.push({ text: '  ...and a few others, if you know where to look.', cls: 'dim', style: 'opacity:0.5;font-style:italic' });
    return lines;
  }

  function cmdAbout() {
    return [
      { text: 'About Your Name', cls: 'heading' },
      { text: '' },
      { text: '  Product designer with 15+ years building interfaces that people actually want to use. Design Systems Lead at Design Studio — shipping products across multiple markets.' },
      { text: '' },
      { text: 'What I do', cls: 'heading' },
      { text: '' },
      { text: '  I turn complexity into clarity. From enterprise dashboards to consumer mobile apps, my work sits at the intersection of design craft, systems thinking, and business strategy.' },
      { text: '' },
      { text: '  At every stage I ask: "Does this remove friction?" Complexity isn\'t the enemy — confusion is.' },
      { text: '' },
      { text: 'Career path', cls: 'heading' },
      { text: '' },
      { text: '  Started freelancing while studying design and digital media. Worked at design studios, then joined a consumer privacy product in 2018 — redesigning their app into a 3-step, 30-second onboarding experience.' },
      { text: '' },
      { text: '  Co-founded Design Studio. Through the studio: 120+ component design system for a live-video platform, research dashboards for Signals, analytics platform for Anylyze, a record-breaking university redesign (+4,200 students), and an HR product that launched as #3 Product of the Day on Product Hunt.', cls: 'accent' },
      { text: '' },
      { text: '  This very site — the one you\'re reading — picked up 4 international design awards in 2026: Awwwards, The FWA, CSS Design Awards, and CSS Winner. → /awards', cls: 'green' },
      { text: '' },
      { text: 'Teaching & mentoring', cls: 'heading' },
      { text: '' },
      { text: '  Dribbble Education mentor (2021–2023) alongside Dan Mall, teaching Design Systems, Product Design, and UI Design. One of the original mentors for the Scaling Design Systems course.' },
      { text: '' },
      { text: '  Product Psychology Masterclass — Growth.Design (2025). 17+ published articles on design systems & strategy.' },
      { text: '' },
      { text: 'Beyond the screen', cls: 'heading' },
      { text: '' },
      { text: '  ◆ Mentor to the next wave of UX/UI talent', cls: 'cyan' },
      { text: '  ◆ Workshop facilitator & public speaker', cls: 'cyan' },
      { text: '  ◆ Design systems evangelist', cls: 'cyan' },
      { text: '  ◆ NGO collaborator — designing for education', cls: 'cyan' },
      { text: '' },
      { text: '  → /work to see what I\'ve shipped', cls: 'dim' },
      { text: '  → /testimonials to see what people say', cls: 'dim' },
      { text: '  // try: cat readme.md', cls: 'dim', style: 'opacity:0.4' },
    ];
  }

  function cmdWork() {
    const container = document.createElement('div');
    container.innerHTML = `<div class="output-line heading">Featured Work</div>
      <div class="output-line dim" style="margin-bottom:12px">  12 projects &bull; 2017–2024 &bull; across 6 countries</div>`;

    PROJECTS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <span class="project-year">${p.year}</span>
        <div class="project-name">${p.name}</div>
        <div class="project-type">${p.type}</div>
        <div class="project-desc">${p.desc}</div>
        <div class="project-tags">${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
        ${p.stats ? `<div class="project-stats">${p.stats.map(s => `<span class="project-stat">✦ ${s}</span>`).join('')}</div>` : ''}
      `;
      container.appendChild(card);
    });

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /clients to see who I\'ve worked with';
    container.appendChild(hint);

    return container;
  }

  function cmdClients() {
    const clients = [
      'CyberGhost VPN', 'LiveU', 'CognitiveSEO', 'Signals',
      'Anylyze', 'ResNet AI', 'Socyal', 'App4Home',
      'Comodo', 'Dribbble', 'GlobalAI', 'Golden Path',
      'Optymyze', 'SkyControl', 'Nestle', 'WHO',
      'FameUp', 'Horexa', 'Digitail', 'BrandMentions',
      'SedCom Libris', 'Portokal', 'Big5 American Diner', 'Katiusa',
      'TUIASI', 'Holy Cow', 'Ideate Plus', 'Wawsome',
      'Local Happinez', 'Uzina de Zambete'
    ];

    const container = document.createElement('div');
    container.innerHTML = `<div class="output-line heading">Clients & Companies</div>
      <div class="output-line dim" style="margin-bottom:12px">  Across Europe, US, Israel, and UAE</div>`;

    const grid = document.createElement('div');
    grid.className = 'client-grid';
    clients.forEach(c => {
      const item = document.createElement('div');
      item.className = 'client-item';
      item.textContent = c;
      grid.appendChild(item);
    });
    container.appendChild(grid);

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /work for detailed case studies';
    container.appendChild(hint);

    return container;
  }

  function cmdSkills() {
    const skills = [
      { name: 'Product Design', pct: 97, color: 'accent' },
      { name: 'Design Systems', pct: 95, color: 'accent' },
      { name: 'UX Research & Strategy', pct: 90, color: 'green' },
      { name: 'UI & Visual Design', pct: 95, color: 'green' },
      { name: 'Data Visualization', pct: 88, color: 'blue' },
      { name: 'Brand & Identity', pct: 85, color: 'purple' },
      { name: 'Design Leadership', pct: 92, color: 'purple' },
      { name: 'Accessibility (WCAG)', pct: 90, color: 'cyan' },
      { name: 'Prototyping & Motion', pct: 85, color: 'cyan' },
      { name: 'Workshop Facilitation', pct: 88, color: 'blue' },
    ];

    const container = document.createElement('div');
    container.innerHTML = `<div class="output-line heading">Expertise & Capabilities</div><div style="height:8px"></div>`;

    skills.forEach(s => {
      const bar = document.createElement('div');
      bar.className = 'skill-bar';
      bar.innerHTML = `
        <span class="skill-label">${s.name}</span>
        <div class="bar-track"><div class="bar-fill ${s.color}" data-width="${s.pct}%"></div></div>
        <span class="skill-pct">${s.pct}%</span>
      `;
      container.appendChild(bar);
    });

    const toolsSection = document.createElement('div');
    toolsSection.innerHTML = `
      <div class="output-line heading" style="margin-top:20px">Tools</div>
      <div class="output-line" style="margin-top:4px">  Figma &bull; Adobe XD &bull; Sketch &bull; After Effects</div>
      <div class="output-line">  Miro &bull; FigJam &bull; Notion &bull; Linear</div>
      <div class="output-line">  HTML/CSS &bull; Webflow &bull; Framer</div>
      <div class="output-line dim" style="margin-top:12px">  → /philosophy to see how I think</div>
      <div class="output-line dim" style="margin-top:4px;opacity:0.4">  $ ls</div>
    `;
    container.appendChild(toolsSection);

    // Animate bars after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        container.querySelectorAll('.bar-fill').forEach(el => {
          el.style.width = el.dataset.width;
        });
      }, 100);
    });

    return container;
  }

  function cmdPhilosophy() {
    return [
      { text: 'Design Philosophy', cls: 'heading' },
      { text: '' },
      { text: '  "Does this remove friction?"', cls: 'accent' },
      { text: '  — The question I ask at every stage.' },
      { text: '' },
      { text: '  ◆ Research First', cls: 'green' },
      { text: '    Analytics, session recordings, user feedback. Intuition is a hypothesis — data is the proof.' },
      { text: '' },
      { text: '  ◆ Built to Scale', cls: 'green' },
      { text: '    Design systems for faster dev cycles and consistent experiences across platforms.' },
      { text: '' },
      { text: '  ◆ Outcomes Over Outputs', cls: 'green' },
      { text: '    Beautiful screens mean nothing without measurable business results.' },
      { text: '' },
      { text: '  ◆ Clarity Over Density', cls: 'green' },
      { text: '    Complexity isn\'t the enemy — confusion is. Every element earns its pixel.' },
      { text: '' },
      { text: '  ◆ Accessibility as Baseline', cls: 'green' },
      { text: '    Not an afterthought. WCAG compliance is where design starts, not where it ends.' },
      { text: '' },
      { text: '  → /contact to start a conversation', cls: 'dim' },
    ];
  }

  function cmdSocial() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">Social Profiles</div>
      <div style="height:8px"></div>
    `;

    const links = [
      { icon: 'in', name: 'LinkedIn', url: '#', color: 'blue', handle: '/in/yourname' },
      { icon: 'fb', name: 'Facebook', url: '#', color: 'blue', handle: '/yourname' },
      { icon: 'ig', name: 'Instagram', url: '#', color: 'purple', handle: '@yourname' },
      { icon: '🚀', name: 'Design Studio', url: '#', color: 'accent', handle: 'designstudio.example' },
      { icon: '🌐', name: 'Website', url: '#', color: 'green', handle: 'portfolio.example' },
    ];

    links.forEach(l => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'social-link inert-nav';
      row.innerHTML = `
        <span class="social-badge ${l.color}">${l.icon}</span>
        <span class="social-name">${l.name}</span>
        <span class="social-handle">${l.handle}</span>
        <span class="social-arrow">→</span>
      `;
      container.appendChild(row);
    });

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /contact to get in touch directly';
    container.appendChild(hint);

    return container;
  }

  function cmdAwards() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">Awards & Recognition</div>
      <div class="output-line dim" style="margin-bottom:12px">  portfolio — 2026</div>
    `;

    const awards = [
      { icon: '✦', name: 'Awwwards',          handle: 'Honorable Mention',              url: '#',                  color: 'accent' },
      { icon: '✦', name: 'The FWA',           handle: 'Featured Case',                  url: '#',     color: 'purple' },
      { icon: '✦', name: 'CSS Design Awards', handle: 'Best UI · Best UX · Innovation', url: '#',                       color: 'green'  },
      { icon: '✦', name: 'CSS Winner',        handle: 'Site of the Day',                url: '#',   color: 'blue'   },
    ];

    awards.forEach(a => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'social-link inert-nav';
      row.innerHTML = `
        <span class="social-badge ${a.color}">${a.icon}</span>
        <span class="social-name">${a.name}</span>
        <span class="social-handle">${a.handle}</span>
        <span class="social-arrow">→</span>
      `;
      container.appendChild(row);
    });

    const blurb = document.createElement('div');
    blurb.className = 'output-line dim';
    blurb.style.marginTop = '12px';
    blurb.textContent = '  Four international design awards for a single site in one year — a CLI-themed portfolio that argued you don\'t need a carousel to win juries.';
    container.appendChild(blurb);

    const certHeading = document.createElement('div');
    certHeading.className = 'output-line heading';
    certHeading.style.marginTop = '20px';
    certHeading.textContent = 'Certifications';
    container.appendChild(certHeading);
    container.insertAdjacentHTML('beforeend', '<div style="height:8px"></div>');

    const cert = document.createElement('button');
    cert.type = 'button';
    cert.className = 'social-link inert-nav';
    cert.innerHTML = `
      <span class="social-badge green">✓</span>
      <span class="social-name">Growth.Design</span>
      <span class="social-handle">Product Psychology Masterclass · 2025</span>
      <span class="social-arrow">→</span>
    `;
    container.appendChild(cert);

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.innerHTML = '  → /about for the full story<br>  → /work to see what else has shipped';
    container.appendChild(hint);

    const easter = document.createElement('div');
    easter.className = 'output-line dim';
    easter.style.cssText = 'margin-top:4px;opacity:0.4';
    easter.textContent = '  // trophy.case --list';
    container.appendChild(easter);

    return container;
  }

  function cmdContact() {
    return [
      { text: 'Get in Touch', cls: 'heading' },
      { text: '' },
      { text: '  ✉  ' + _e, cls: 'accent' },
      { text: '  📞  +1 (555) 000-0000', cls: 'blue' },
      { text: '  📍  Your City, Country', cls: 'purple' },
      { text: '  🚀  designstudio.example — agency', cls: 'green' },
      { text: '' },
      { text: '  Open to: design leadership roles, consulting, design system engagements, workshops & talks.' },
      { text: '' },
      { text: '  Let\'s build something that matters.', cls: 'accent' },
      { text: '' },
      { text: '  → /social for all my profiles', cls: 'dim' },
      { text: '  // or just: sudo hire designer', cls: 'dim', style: 'opacity:0.4' },
    ];
  }

  function cmdTestimonials() {
    const testimonials = [
      {
        name: 'Jessica Ibbotson',
        title: 'Education Support, Dribbble',
        relation: 'Managed the designer directly',
        quote: 'They were one of the original mentors for the Design Systems course. As a clear expert in his field, They sculpted each lesson with clarity and precision, transforming complexity into teachability. His influence didn\'t stop at imparting knowledge; it permeated the very fabric of the mentorship program, shaping it into a nurturing environment where budding designers could flourish. What sets them apart is his exceptional ability to forge personal connections with his students. His passion for design is infectious, serving as a constant source of motivation and inspiration for those around him.',
        color: 'accent',
      },
      {
        name: 'Adrian Banu',
        title: 'VP, Product at Optymyze',
        relation: 'Senior collaborator',
        quote: 'He\'s a top-notch Product Design expert whose work really makes a difference in every project he touches. What\'s impressive about the designer is not just his skill in making things look good, but also how he thinks about the whole user experience from start to finish. They are also great at communicating. He really listens to what everyone has to say, takes the time to analyze things before making decisions, and always comes up with smart solutions to any problem.',
        color: 'blue',
      },
      {
        name: 'Lead Experience Designer',
        title: 'Lead Experience Designer, EPAM Systems',
        relation: 'Worked together',
        quote: 'They possess a rare combination of creativity, technical expertise, and leadership skills that make him stand out in the field of UX design. His deep understanding of design principles and methodologies enables him to consistently deliver intuitive and user-centric solutions. They foster a collaborative work environment where ideas are freely exchanged, and everyone feels empowered to contribute their best work.',
        color: 'green',
      },
      {
        name: 'Ionut Patrascoiu',
        title: 'CEO & Founder, FameUp',
        relation: 'Client',
        quote: 'I highly recommend this designer for his outstanding skills in UI/UX design. Throughout our collaboration, he showcased exemplary leadership qualities and demonstrated a proactive approach to every task. It was a pleasure working with them, and I\'m confident he will continue to excel in his future endeavors.',
        color: 'purple',
      },
      {
        name: 'Earl Carvalho',
        title: 'Product Solutions Manager, Mobile Apps',
        relation: 'Worked with the designer',
        quote: 'What truly sets them apart is his knack for thinking outside the box and bringing innovative solutions to the table. Whether it\'s his UX expertise or his inventive approach to problem-solving, They consistently impresses. His open-mindedness and willingness to listen make him not only a great manager but also an invaluable teammate.',
        color: 'cyan',
      },
      {
        name: 'Lavinia Gherasim',
        title: 'Senior Java Software Engineer',
        relation: 'Engineering partner',
        quote: 'His designs are consistently intuitive, creating an effortless experience for end-users. the designer\'s capacity to grasp technical aspects, despite his non-technical background, is impressive. This proficiency not only facilitates smoother collaboration with technical teams but also enables him to envision innovative solutions that seamlessly integrate with technical needs.',
        color: 'purple',
      },
      {
        name: 'Elena Levy',
        title: 'UX UI / Product / Design Systems Designer',
        relation: 'Mentee at Dribbble',
        quote: 'They are among the best of the design mentors I\'ve worked with, and I learned a lot from him. His patience and determination to make a design system work smarter rather than harder is something all Product Designers and engineers truly value. They demonstrated a brilliant technical mindset and a particularly sophisticated visual design aesthetic.',
        color: 'blue',
      },
    ];

    const container = document.createElement('div');
    container.innerHTML = `<div class="output-line heading">Testimonials</div>
      <div class="output-line dim" style="margin-bottom:12px">  What colleagues, clients, and mentees say</div>`;

    testimonials.forEach(t => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-name" style="font-size:0.9em">"${t.quote}"</div>
        <div style="margin-top:8px">
          <span class="${t.color}" style="font-weight:600">— ${t.name}</span>
          <span class="dim" style="margin-left:4px">${t.title}</span>
        </div>
        <div class="dim" style="font-size:0.75em;margin-top:2px">${t.relation}</div>
      `;
      container.appendChild(card);
    });

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.innerHTML = '  → <button type="button" class="inert-nav" style="color:var(--accent);text-decoration:underline;cursor:pointer;background:none;border:none;font:inherit;padding:0">LinkedIn</button> for all recommendations';
    container.appendChild(hint);

    return container;
  }

  function cmdArticles() {
    const articles = [
      { cat: 'Design Systems', items: [
        { title: 'The complete guide to Design Systems in 2026', url: '#/articles/design-systems-guide/' },
        { title: 'Design System 101: Building a scalable Design System from scratch', url: '#/articles/design-system-101/' },
        { title: 'Design tokens: the complete technical guide', url: '#/articles/design-tokens-guide/' },
        { title: 'Design system governance: who owns what and how decisions get made', url: '#/articles/design-system-governance/' },
        { title: 'Design System vs. style guide vs. pattern library', url: '#/articles/design-system-vs-style-guide/' },
        { title: 'Glossary of scalable Design Systems', url: '#/articles/design-systems-glossary/' },
      ]},
      { cat: 'UX & Product', items: [
        { title: 'UX design guide: best practices, metrics, and modern workflows', url: '#/articles/ux-design-guide/' },
        { title: 'Design-led development: How to truly blend UX and Agile', url: '#/articles/design-led-development/' },
        { title: 'AI in UX: Best practices for designing with artificial intelligence', url: '#/articles/designing-with-ai/' },
      ]},
      { cat: 'Branding & Strategy', items: [
        { title: 'Branding for digital products: A strategy blueprint', url: '#/articles/branding-digital-products/' },
        { title: 'Strategic storytelling: a practical guide for business growth', url: '#/articles/storytelling-guide/' },
        { title: 'Beyond the slogan: Mastering brand messaging through story', url: '#/articles/brand-messaging/' },
      ]},
      { cat: 'SEO & Content', items: [
        { title: 'Content marketing for SaaS and product companies: what actually works', url: '#/articles/content-marketing-saas/' },
        { title: 'SEO and content strategy for product companies', url: '#/articles/seo-content-strategy-guide/' },
        { title: 'Technical SEO checklist for product websites', url: '#/articles/technical-seo-checklist/' },
        { title: 'How to build topical authority (and why it beats keyword chasing)', url: '#/articles/topical-authority/' },
        { title: 'Storytelling formats that win: How to get featured in AI answers', url: '#/articles/ai-answers-seo/' },
      ]},
    ];

    const container = document.createElement('div');
    container.innerHTML = `<div class="output-line heading">Published Articles</div>
      <div class="output-line dim" style="margin-bottom:12px">  17 articles on designstudio.example</div>`;

    articles.forEach(group => {
      const catEl = document.createElement('div');
      catEl.className = 'output-line';
      catEl.style.marginTop = '12px';
      catEl.innerHTML = `<span style="text-transform:uppercase;letter-spacing:1px;font-size:0.75em;color:var(--accent)">${group.cat}</span>`;
      container.appendChild(catEl);

      group.items.forEach(a => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'social-link inert-nav';
        row.style.padding = '6px 12px';
        row.innerHTML = `
          <span class="social-name" style="flex:1">${a.title}</span>
          <span class="social-arrow">→</span>
        `;
        container.appendChild(row);
      });
    });

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  All published on designstudio.example';
    container.appendChild(hint);

    return container;
  }

  // ============ QUICK INFO FUNCTIONS ============

  function cmdLinkedin() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">LinkedIn</div>
      <div style="height:8px"></div>
    `;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'social-link inert-nav';
    link.innerHTML = `
      <span class="social-badge blue">in</span>
      <span class="social-name">Your Name</span>
      <span class="social-handle">/in/yourname</span>
      <span class="social-arrow">→</span>
    `;
    container.appendChild(link);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /social for all profiles';
    container.appendChild(hint);
    return container;
  }

  function cmdFacebook() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">Facebook</div>
      <div style="height:8px"></div>
    `;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'social-link inert-nav';
    link.innerHTML = `
      <span class="social-badge blue">fb</span>
      <span class="social-name">Your Name</span>
      <span class="social-handle">/yourname</span>
      <span class="social-arrow">→</span>
    `;
    container.appendChild(link);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /social for all profiles';
    container.appendChild(hint);
    return container;
  }

  function cmdInstagram() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">Instagram</div>
      <div style="height:8px"></div>
    `;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'social-link inert-nav';
    link.innerHTML = `
      <span class="social-badge purple">ig</span>
      <span class="social-name">Your Name</span>
      <span class="social-handle">@yourname</span>
      <span class="social-arrow">→</span>
    `;
    container.appendChild(link);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /social for all profiles';
    container.appendChild(hint);
    return container;
  }

  function cmdPhone() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">Phone</div>
      <div style="height:8px"></div>
    `;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'social-link inert-nav';
    link.innerHTML = `
      <span class="social-badge green">📞</span>
      <span class="social-name">+1 (555) 000-0000</span>
      <span class="social-handle">placeholder</span>
      <span class="social-arrow">→</span>
    `;
    container.appendChild(link);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /contact for all contact options';
    container.appendChild(hint);
    return container;
  }

  function cmdEmail() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">Email</div>
      <div style="height:8px"></div>
    `;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'social-link inert-nav';
    link.innerHTML = `
      <span class="social-badge accent">✉</span>
      <span class="social-name">${_e}</span>
      <span class="social-handle">placeholder</span>
      <span class="social-arrow">→</span>
    `;
    container.appendChild(link);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /contact for all contact options';
    container.appendChild(hint);
    return container;
  }

  function cmdAgency() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="output-line heading">Design Studio</div>
      <div style="height:8px"></div>
    `;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'social-link inert-nav';
    link.innerHTML = `
      <span class="social-badge accent">🚀</span>
      <span class="social-name">Design Studio</span>
      <span class="social-handle">designstudio.example</span>
      <span class="social-arrow">→</span>
    `;
    container.appendChild(link);
    const desc = document.createElement('div');
    desc.className = 'output-line';
    desc.style.marginTop = '8px';
    desc.textContent = '  Design & product studio based in Your City, Country.';
    container.appendChild(desc);
    const desc2 = document.createElement('div');
    desc2.className = 'output-line';
    desc2.textContent = '  We build interfaces that people actually want to use.';
    container.appendChild(desc2);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /work to see our projects';
    container.appendChild(hint);
    return container;
  }

  function cmdLocation() {
    return [
      { text: 'Location', cls: 'heading' },
      { text: '' },
      { text: '  📍  Your City, Country', cls: 'accent' },
      { text: '  🌍  Working across Europe, US, Israel, UAE' },
      { text: '  🕐  Your local timezone' },
      { text: '' },
      { text: '  → /contact to get in touch', cls: 'dim' },
    ];
  }

  function cmdPrivacy() {
    const consent = localStorage.getItem('cookie_consent');
    const status = consent === 'granted' ? 'accepted' : consent === 'denied' ? 'declined' : 'not set';
    return [
      { text: 'Privacy Policy', cls: 'heading' },
      { text: '' },
      { text: '  Last updated: March 2026' },
      { text: '' },
      { text: 'What this site collects', cls: 'heading' },
      { text: '' },
      { text: '  This site uses Google Analytics 4 (via Google Tag Manager) to understand how visitors interact with the site — pages viewed, time spent, and general traffic patterns.' },
      { text: '' },
      { text: '  No personal data is collected beyond what GA4 gathers by default. No names, no emails, no tracking across other websites.' },
      { text: '' },
      { text: 'Cookies', cls: 'heading' },
      { text: '' },
      { text: '  Analytics cookies are only set if you accept them. If you decline, GA4 runs in cookieless mode — aggregated data only, no identifying information.' },
      { text: '' },
      { text: `  Your current choice: ${status}`, cls: status === 'accepted' ? 'green' : status === 'declined' ? 'red' : 'dim' },
      { text: '' },
      { text: 'Your rights (GDPR)', cls: 'heading' },
      { text: '' },
      { text: '  You have the right to:' },
      { text: '  ◆ Know what data is collected about you', cls: 'cyan' },
      { text: '  ◆ Request deletion of your data', cls: 'cyan' },
      { text: '  ◆ Withdraw consent at any time', cls: 'cyan' },
      { text: '  ◆ File a complaint with a supervisory authority', cls: 'cyan' },
      { text: '' },
      { text: '  To exercise these rights or ask questions, email ' + _e, cls: 'accent' },
      { text: '' },
      { text: 'Data controller', cls: 'heading' },
      { text: '' },
      { text: '  Your Name' },
      { text: '  Design Studio (designstudio.example)' },
      { text: '  100 Design Street, Your City, Country' },
      { text: '  ' + _e },
      { text: '' },
      { text: '  → /contact for all contact options', cls: 'dim' },
    ];
  }

  // ============ PROJECT COMMAND FUNCTION ============

  function cmdProject(projectName) {
    const project = PROJECTS.find(p => p.name === projectName);
    if (!project) return [{ text: `  Project "${projectName}" not found.`, cls: 'red' }];

    const container = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <span class="project-year">${project.year}</span>
      <div class="project-name">${project.name}</div>
      <div class="project-type">${project.type}</div>
      <div class="project-desc">${project.desc}</div>
      <div class="project-tags">${project.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
      ${project.stats ? `<div class="project-stats">${project.stats.map(s => `<span class="project-stat">✦ ${s}</span>`).join('')}</div>` : ''}
    `;
    container.appendChild(card);

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /work for all projects  •  /contact to discuss this project';
    container.appendChild(hint);
    return container;
  }

  // ============ THEME FUNCTIONS ============

  function setWallpaper(_theme) {
    const picture = document.getElementById('wallpaper-picture');
    if (!picture) return;
    const sources = picture.querySelectorAll('source');
    const img = picture.querySelector('img');
    // Only dark wallpaper assets are bundled; CSS theme classes handle light/retro/glass.
    // Reuse dark blur assets so theme switches never 404 missing *-theme.* files.
    sources[0].srcset = 'dark-theme-blur.avif';
    sources[1].srcset = 'dark-theme-blur.webp';
    if (img) img.src = 'dark-theme-blur.webp';
  }

  function cmdDark() {
    document.documentElement.className = '';
    currentTheme = 'dark';
    setWallpaper('dark');
    return [
      { text: '  ✦ Dark mode activated. The way it should be.', cls: 'accent' },
    ];
  }

  function cmdLight() {
    document.documentElement.className = 'theme-light';
    currentTheme = 'light';
    setWallpaper('light');
    return [
      { text: '  ☀ Light mode activated. My eyes... but okay.', cls: 'yellow' },
    ];
  }

  function cmdRetro() {
    document.documentElement.className = 'theme-retro';
    currentTheme = 'retro';
    setWallpaper('retro');
    return [
      { text: '  ▓ CRT mode engaged. Welcome to 1983.', cls: 'green' },
      { text: '  Scanlines: ON | Phosphor: GREEN | Nostalgia: MAX', cls: 'dim' },
    ];
  }

  function cmdGlass() {
    document.documentElement.className = 'theme-glass';
    currentTheme = 'glass';
    setWallpaper('glass');
    return [
      { text: '  ◈ Glass mode activated. Transparency at its finest.', cls: 'accent' },
    ];
  }

  function cmdThemes() {
    const themes = [
      { cmd: '/dark', label: 'Dark', desc: 'Default — deep tones, easy on the eyes', colors: ['#1a1b26', '#24273a', '#e8a87c', '#c3c7d1'], active: currentTheme === 'dark' },
      { cmd: '/light', label: 'Light', desc: 'Clean, bright, and professional', colors: ['#f5f5f5', '#ffffff', '#d08a5a', '#3c3c3c'], active: currentTheme === 'light' },
      { cmd: '/retro', label: 'Retro', desc: '1983 CRT phosphor glow — scanlines included', colors: ['#2b2b2b', '#1a1a1a', '#33ff33', '#00cc00'], active: currentTheme === 'retro' },
      { cmd: '/glass', label: 'Glass', desc: 'Frosted glass with depth and blur', colors: ['#1a1b26', '#2a2d3a', '#e8a87c', '#8b9cc7'], active: currentTheme === 'glass' },
    ];

    const container = document.createElement('div');
    container.innerHTML = `<div class="output-line heading">Themes</div><div class="output-line" style="margin-bottom:12px">  Type a theme name to switch. Current: <span class="accent">${currentTheme}</span></div>`;

    themes.forEach(t => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 12px;margin:4px 0;border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:border-color 0.2s,background 0.2s';
      if (t.active) row.style.borderColor = 'var(--accent)';
      const swatches = t.colors.map(c => `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${c};border:1px solid rgba(255,255,255,0.1)"></span>`).join('');
      row.innerHTML = `<div style="display:flex;gap:4px">${swatches}</div><span class="cmd-name">${t.cmd}</span><span class="cmd-desc">${t.desc}</span>${t.active ? '<span class="accent" style="margin-left:auto;font-size:0.75em">● active</span>' : ''}`;
      row.addEventListener('click', () => executeCommand(t.cmd));
      row.addEventListener('mouseenter', () => { row.style.borderColor = 'var(--accent)'; row.style.background = 'rgba(232,168,124,0.04)'; });
      row.addEventListener('mouseleave', () => { row.style.borderColor = t.active ? 'var(--accent)' : 'var(--border)'; row.style.background = ''; });
      container.appendChild(row);
    });

    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.cssText = 'margin-top:12px;font-style:italic';
    hint.textContent = '  Themes persist during your session. Refresh to reset.';
    container.appendChild(hint);
    return container;
  }

  function cmdClear() {
    outputArea.innerHTML = '';
    return null;
  }

  // ============ EASTER EGG COMMANDS ============

  // Hidden commands object (not shown in /help autocomplete)
  const HIDDEN_COMMANDS = {};

  function registerHidden(name, fn) {
    HIDDEN_COMMANDS[name] = fn;
  }

  // /easter-eggs — secret cheat sheet
  registerHidden('/easter-eggs', function() {
    return [
      { text: 'Secret Commands', cls: 'heading' },
      { text: '  Shhh... you found the cheat sheet.', cls: 'dim' },
      { text: '' },
      { text: '  Hidden Commands', cls: 'heading' },
      { html: '  <span class="cmd-name">sudo hire designer</span> <span class="cmd-desc">Fake contract with progress bar</span>' },
      { html: '  <span class="cmd-name">rm -rf doubts</span> <span class="cmd-desc">Remove all your doubts</span>' },
      { html: '  <span class="cmd-name">/matrix</span> <span class="cmd-desc">Matrix green rain</span>' },
      { html: '  <span class="cmd-name">/figma</span> <span class="cmd-desc">Where I actually live</span>' },
      { html: '  <span class="cmd-name">/coffee</span> <span class="cmd-desc">Design fuel status</span>' },
      { html: '  <span class="cmd-name">ls</span> <span class="cmd-desc">Skills as Linux files</span>' },
      { html: '  <span class="cmd-name">cat readme.md</span> <span class="cmd-desc">A hidden personal message</span>' },
      { html: '  <span class="cmd-name">ping designer</span> <span class="cmd-desc">Am I available? Find out</span>' },
      { html: '  <span class="cmd-name">git log</span> <span class="cmd-desc">Totally real commit history</span>' },
      { html: '  <span class="cmd-name">whoami</span> <span class="cmd-desc">The terminal knows you</span>' },
      { html: '  <span class="cmd-name">exit</span> <span class="cmd-desc">Try to leave. I dare you.</span>' },
      { text: '' },
      { text: '  Themes', cls: 'heading' },
      { html: '  <span class="cmd-name">/dark</span> <span class="cmd-desc">Default dark theme</span>' },
      { html: '  <span class="cmd-name">/light</span> <span class="cmd-desc">Light mode (controversial)</span>' },
      { html: '  <span class="cmd-name">/retro</span> <span class="cmd-desc">CRT green phosphor + scanlines</span>' },
      { text: '' },
      { text: '  Secrets', cls: 'heading' },
      { html: '  <span class="cmd-name">/konami</span> <span class="cmd-desc">Party mode with confetti</span>' },
      { html: '  <span class="cmd-name">↑↑↓↓←→←→BA</span> <span class="cmd-desc">Konami code on keyboard</span>' },
      { html: '  <span class="cmd-name">/help x3</span> <span class="cmd-desc">Type help 3 times in a row...</span>' },
      { html: '  <span class="cmd-name">Idle 60s</span> <span class="cmd-desc">Terminal gets impatient</span>' },
    ];
  });
  registerHidden('/eastereggs', function() { return HIDDEN_COMMANDS['/easter-eggs'](); });
  registerHidden('/secrets', function() { return HIDDEN_COMMANDS['/easter-eggs'](); });

  // /secret (singular) — "I'm feeling lucky" random hidden command
  const luckyCommands = [
    '/matrix', 'sudo hire designer', 'rm -rf doubts', '/figma', '/coffee',
    'ls', 'cat readme.md', 'ping designer', 'git log', 'whoami', '/konami'
  ];
  registerHidden('/secret', function() {
    const pick = luckyCommands[Math.floor(Math.random() * luckyCommands.length)];
    setTimeout(() => executeCommand(pick), 1200);
    return [
      { text: '  I\'m feeling lucky...', cls: 'accent', style: 'font-style:italic' },
      { html: `  Rolling the dice → <span class="cmd-name">${pick}</span>`, cls: 'dim' },
    ];
  });

  // /matrix — green rain
  registerHidden('/matrix', function() {
    runMatrixRain();
    return [
      { text: '  Entering the Matrix...', cls: 'green' },
      { text: '  There is no spoon. Only good design.', cls: 'dim' },
    ];
  });

  // sudo hire designer
  registerHidden('sudo hire designer', function() {
    const container = document.createElement('div');
    const progressEl = document.createElement('div');
    progressEl.className = 'output-line dim';
    progressEl.textContent = '  [░░░░░░░░░░░░░░░░░░░░] 0%';
    const doneEl = document.createElement('div');
    doneEl.className = 'output-line accent';
    doneEl.style.cssText = 'display:none;margin-top:8px';
    doneEl.textContent = '  ✦ Contract sent! Your Name will be in touch shortly.';
    const hintEl = document.createElement('div');
    hintEl.className = 'output-line dim';
    hintEl.style.display = 'none';
    container.innerHTML = `
      <div class="output-line green">  [sudo] password for visitor: ********</div>
      <div class="output-line green">  ✓ Authentication successful.</div>
      <div class="output-line" style="margin-top:8px">  Sending contract to Your Name...</div>
    `;
    container.appendChild(progressEl);
    container.appendChild(doneEl);
    container.appendChild(hintEl);
    // Animate progress bar (scoped nodes — safe if command is run more than once)
    setTimeout(() => {
      let pct = 0;
      const iv = setInterval(() => {
        pct += Math.random() * 15 + 5;
        if (pct >= 100) {
          pct = 100;
          clearInterval(iv);
          progressEl.textContent = '  [████████████████████] 100%';
          progressEl.className = 'output-line green';
          doneEl.style.display = '';
          hintEl.textContent = '  (Okay fine, just email ' + _e + ')';
          hintEl.style.display = '';
          terminalBody.scrollTop = terminalBody.scrollHeight;
        } else {
          const filled = Math.round(pct / 5);
          const empty = 20 - filled;
          progressEl.textContent = `  [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round(pct)}%`;
        }
      }, 200);
    }, 300);
    return container;
  });

  // rm -rf doubts
  registerHidden('rm -rf doubts', function() {
    return [
      { text: '  $ rm -rf doubts/', cls: 'dim' },
      { text: '  Removing doubts/impostor-syndrome... done', cls: 'green' },
      { text: '  Removing doubts/will-he-deliver... done', cls: 'green' },
      { text: '  Removing doubts/is-he-expensive... done', cls: 'green' },
      { text: '  Removing doubts/can-he-lead... done', cls: 'green' },
      { text: '' },
      { text: '  ✦ All doubts removed. You should definitely hire me.', cls: 'accent' },
    ];
  });

  // /figma
  registerHidden('/figma', function() {
    return [
      { text: '  ┌─────────────────────────────────────┐' },
      { text: '  │                                     │' },
      { text: '  │   ███  ██  ██████  ███   ███  ███   │', cls: 'purple' },
      { text: '  │   █    █   █       █ █ █ █   █   █  │', cls: 'purple' },
      { text: '  │   ███  █   █  ██   █  █  █   █████  │', cls: 'blue' },
      { text: '  │   █    █   █   █   █     █   █   █  │', cls: 'green' },
      { text: '  │   █    ██  █████   █     █   █   █  │', cls: 'accent' },
      { text: '  │                                     │' },
      { text: '  └─────────────────────────────────────┘' },
      { text: '' },
      { text: '  I live here. Send help.', cls: 'accent' },
      { text: '  Current tab count: ∞', cls: 'dim' },
      { text: '  Unsaved changes: always', cls: 'dim' },
    ];
  });

  // /coffee
  registerHidden('/coffee', function() {
    return [
      { text: '           ( (', cls: 'dim' },
      { text: '            ) )', cls: 'dim' },
      { text: '         ........', cls: 'dim' },
      { text: '         |      |]', cls: 'accent' },
      { text: '         \\      /', cls: 'accent' },
      { text: '          `----´', cls: 'accent' },
      { text: '' },
      { text: '  Design fuel level:', cls: 'heading' },
      { text: '  [████████████████░░░░] 80%', cls: 'green' },
      { text: '' },
      { text: '  Status: Caffeinated and pixel-pushing', cls: 'dim' },
      { text: '  Daily intake: Yes', cls: 'dim' },
    ];
  });

  // ls
  registerHidden('ls', function() {
    return [
      { text: '  drwxr-xr-x  you   design-systems.exe', cls: 'green' },
      { text: '  drwxr-xr-x  you   ux-research.doc', cls: 'blue' },
      { text: '  -rwxr-xr-x  you   figma-mastery.cfg', cls: 'accent' },
      { text: '  -rw-r--r--  you   pixel-perfection.so', cls: 'purple' },
      { text: '  -rwxr-xr-x  you   strategic-thinking.bin', cls: 'cyan' },
      { text: '  drwxr-xr-x  you   workshop-facilitation/', cls: 'green' },
      { text: '  -rw-r--r--  you   accessibility.a11y', cls: 'yellow' },
      { text: '  -rwxr-xr-x  you   brand-identity.svg', cls: 'accent' },
      { text: '  -rw-r--r--  you   coffee-dependency.lock', cls: 'dim' },
      { text: '  -rw-------  you   secret-design-sauce.enc', cls: 'red' },
    ];
  });

  // cat readme.md
  registerHidden('cat readme.md', function() {
    return [
      { text: '  # README.md', cls: 'heading' },
      { text: '' },
      { text: '  Hey, you found this. Nice.', cls: 'accent' },
      { text: '' },
      { text: '  If you\'re reading this, you\'re probably the kind of' },
      { text: '  person who inspects elements, reads source code, and' },
      { text: '  appreciates the details. We\'d get along.' },
      { text: '' },
      { text: '  I believe the best design is invisible. It doesn\'t' },
      { text: '  make you think about the interface — it makes you' },
      { text: '  think about your goals. Every pixel I push is in' },
      { text: '  service of that belief.' },
      { text: '' },
      { text: '  The world has enough pretty mockups that never ship.' },
      { text: '  I build things that do.', cls: 'green' },
      { text: '' },
      { text: '  — Your Name', cls: 'accent' },
    ];
  });

  // ping designer
  registerHidden('ping designer', function() {
    const container = document.createElement('div');
    container.innerHTML = `<div class="output-line dim">  PING designer.portfolio (192.168.1.337): 56 data bytes</div>`;
    const pings = [
      '64 bytes from HQ: icmp_seq=0 ttl=64 time=0.1ms — Always online',
      '64 bytes from HQ: icmp_seq=1 ttl=64 time=0.2ms — Available for great projects',
      '64 bytes from HQ: icmp_seq=2 ttl=64 time=0.1ms — Responds faster than your current designer',
      '64 bytes from HQ: icmp_seq=3 ttl=64 time=0.3ms — Will not ghost you',
    ];
    pings.forEach((p, i) => {
      const line = document.createElement('div');
      line.className = 'output-line green';
      line.style.opacity = '0';
      line.style.transition = 'opacity 0.3s';
      line.textContent = `  ${p}`;
      container.appendChild(line);
      setTimeout(() => { line.style.opacity = '1'; }, (i + 1) * 600);
    });
    const stats = document.createElement('div');
    stats.className = 'output-line dim';
    stats.style.marginTop = '8px';
    stats.style.opacity = '0';
    stats.style.transition = 'opacity 0.3s';
    stats.textContent = '  --- designer.portfolio ping statistics ---';
    container.appendChild(stats);
    const stats2 = document.createElement('div');
    stats2.className = 'output-line dim';
    stats2.style.opacity = '0';
    stats2.style.transition = 'opacity 0.3s';
    stats2.textContent = '  4 packets transmitted, 4 received, 0% packet loss';
    container.appendChild(stats2);
    setTimeout(() => { stats.style.opacity = '1'; stats2.style.opacity = '1'; }, 3000);
    return container;
  });

  // git log
  registerHidden('git log', function() {
    return [
      { text: '  commit a1b2c3d (HEAD -> main)', cls: 'yellow' },
      { text: '  Author: Your Name <' + _e + '>', cls: 'dim' },
      { text: '  Date: today', cls: 'dim' },
      { text: '' },
      { text: '      Fixed pixel that was 1px off. Again.', cls: 'accent' },
      { text: '' },
      { text: '  commit e4f5g6h', cls: 'yellow' },
      { text: '  Date: yesterday', cls: 'dim' },
      { text: '' },
      { text: '      Removed 47 unnecessary gradients from client mockup' },
      { text: '' },
      { text: '  commit i7j8k9l', cls: 'yellow' },
      { text: '  Date: 2 days ago', cls: 'dim' },
      { text: '' },
      { text: '      Convinced stakeholder that Comic Sans is not on-brand' },
      { text: '' },
      { text: '  commit m0n1o2p', cls: 'yellow' },
      { text: '  Date: 3 days ago', cls: 'dim' },
      { text: '' },
      { text: '      Refactored entire design system at 2am. No regrets.' },
      { text: '' },
      { text: '  commit q3r4s5t', cls: 'yellow' },
      { text: '  Date: last week', cls: 'dim' },
      { text: '' },
      { text: '      Deleted production Figma file. Recovered it. Nobody noticed.' },
      { text: '' },
      { text: '  commit u6v7w8x', cls: 'yellow' },
      { text: '  Date: last month', cls: 'dim' },
      { text: '' },
      { text: '      Added dark mode. Refused to add light mode. Stood ground.' },
    ];
  });

  // whoami
  registerHidden('whoami', function() {
    return [
      { text: '  You\'re the person about to hire a great designer.', cls: 'accent' },
      { text: '' },
      { text: '  (Trust the terminal. It knows things.)', cls: 'dim' },
    ];
  });

  // exit / quit
  registerHidden('quit', function() { return HIDDEN_COMMANDS['exit'](); });
  registerHidden('/exit', function() { return HIDDEN_COMMANDS['exit'](); });
  registerHidden('/quit', function() { return HIDDEN_COMMANDS['exit'](); });
  registerHidden('exit', function() {
    return [
      { text: '  There is no escape.', cls: 'red' },
      { text: '  But /contact is a way forward.', cls: 'green' },
      { text: '' },
      { text: '  (You\'re stuck here now. Might as well explore.)', cls: 'dim' },
    ];
  });


  // /konami (also triggered by key sequence)
  registerHidden('/konami', function() {
    runConfetti();
    return [
      { text: '  🎉 ↑ ↑ ↓ ↓ ← → ← → B A', cls: 'accent' },
      { text: '  PARTY MODE ACTIVATED!', cls: 'yellow' },
      { text: '' },
      { text: '  You found the Konami code! Have some confetti.', cls: 'green' },
    ];
  });

  // ============ MATRIX RAIN ============

  function runMatrixRain() {
    const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.add('active');

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789DESIGNER';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    let frameCount = 0;
    const maxFrames = 180; // ~3 seconds at 60fps

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#33ff33';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      frameCount++;
      if (frameCount < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        // Fade out
        canvas.classList.remove('active');
        setTimeout(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 400);
      }
    }
    draw();
  }

  // ============ CONFETTI ============

  function runConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#e8a87c', '#7ec89b', '#7caae8', '#e87c7c', '#b88ce8', '#e8d87c', '#7ce8d8'];
    const particles = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let frameCount = 0;
    const maxFrames = 180;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;
      const fade = frameCount > 120 ? 1 - (frameCount - 120) / 60 : 1;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        p.vy += 0.05;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frameCount < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  }

  // ============ KONAMI CODE LISTENER ============

  const konamiSequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIndex = 0;

  document.addEventListener('keydown', (e) => {
    if (e.key === konamiSequence[konamiIndex] || e.key.toLowerCase() === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        konamiIndex = 0;
        executeCommand('/konami');
      }
    } else {
      konamiIndex = 0;
    }
  });

  // ============ IDLE TIMER ============

  const idleHints = [
    'Still there? Try /work to see what I\'ve built...',
    'This terminal has more commands than you think...',
    'Psst — ever tried typing ls in a portfolio?',
    'The Konami code works here. Just saying.',
    'Some commands don\'t need a slash. Try: whoami',
    'Type /secrets if you like finding hidden things.',
  ];

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    const firstDelay = idleCount === 0 ? 10000 : 45000;
    idleTimer = setTimeout(function showIdleHint() {
      const block = document.createElement('div');
      block.className = 'output-block';
      const line = document.createElement('div');
      line.className = 'output-line dim';
      line.style.fontStyle = 'italic';
      line.textContent = '  ' + idleHints[Math.min(idleCount, idleHints.length - 1)];
      block.appendChild(line);
      outputArea.appendChild(block);
      terminalBody.scrollTop = terminalBody.scrollHeight;
      idleCount++;
      // Schedule next hint if more remain
      if (idleCount < idleHints.length) {
        idleTimer = setTimeout(showIdleHint, 45000);
      }
    }, firstDelay);
  }

  // ============ COMMAND EXECUTION ============

  function applyStaggerAnimation(container) {
    const selectors = '.output-line, .project-card, .client-item, .skill-bar';
    const children = container.querySelectorAll(selectors);
    let index = 0;
    const maxStagger = 30;
    children.forEach(el => {
      // Skip cmd-echo children and empty spacer lines
      if (el.closest('.cmd-echo')) return;
      if (el.classList.contains('output-line') && !el.textContent.trim() && !el.innerHTML.trim()) return;
      if (index < maxStagger) {
        el.classList.add('stagger-child');
        el.style.setProperty('--i', index);
        index++;
      } else {
        el.classList.add('stagger-child');
        el.style.setProperty('--i', maxStagger);
      }
    });
  }

  function renderCommandResult(block, hiddenFn, cmd) {
    const fn = hiddenFn || (cmd && cmd.fn);
    if (!fn) return;
    const result = fn();
    if (result === null) return;
    if (result instanceof HTMLElement) {
      block.appendChild(result);
    } else if (Array.isArray(result)) {
      result.forEach(line => {
        const div = document.createElement('div');
        div.className = 'output-line' + (line.cls ? ' ' + line.cls : '');
        if (line.style) div.setAttribute('style', line.style);
        if (line.html) {
          div.innerHTML = line.html;
        } else {
          div.textContent = line.text;
        }
        block.appendChild(div);
      });
    }
    // Apply staggered reveal animation to content children
    applyStaggerAnimation(block);
  }

  // ============ NATURAL LANGUAGE INTENT MATCHING ============
  const INTENT_MAP = [
    // About
    { cmd: '/about', phrases: ['about designer', 'who is designer', 'who is this', 'tell me about', 'who are you', 'about you', 'about him', 'who is he', 'introduce yourself', 'bio', 'background', 'what do you do', 'what does designer do'] },
    // Contact
    { cmd: '/contact', phrases: ['get in touch', 'call designer', 'reach out', 'hire designer', 'contact designer', 'how to reach', 'how to contact', 'want to hire', 'book a call', 'schedule a call', 'talk to designer', 'message designer', 'reach designer', 'send a message', 'i need a designer', 'looking for a designer', 'need help with design'] },
    // Work / Portfolio
    { cmd: '/work', phrases: ['show work', 'show portfolio', 'show projects', 'your work', 'your projects', 'case studies', 'what have you done', 'what did you build', 'see your work', 'previous work', 'past projects', 'portfolio pieces'] },
    // Skills
    { cmd: '/skills', phrases: ['what can you do', 'your skills', 'your capabilities', 'your expertise', 'what do you know', 'areas of expertise', 'skill set', 'services you offer', 'what services'] },
    // Clients
    { cmd: '/clients', phrases: ['who have you worked with', 'your clients', 'companies', 'who do you work for', 'worked with', 'client list', 'past clients'] },
    // Social
    { cmd: '/social', phrases: ['social media', 'social links', 'social profiles', 'follow designer', 'find designer online', 'your socials', 'online presence'] },
    // Testimonials
    { cmd: '/testimonials', phrases: ['what people say', 'reviews', 'feedback', 'recommendations', 'what others say', 'client feedback', 'endorsements'] },
    // Philosophy
    { cmd: '/philosophy', phrases: ['design philosophy', 'how do you work', 'your approach', 'your process', 'design approach', 'how you design', 'your methodology', 'your principles', 'values'] },
    // Email
    { cmd: '/email', phrases: ['email address', 'your email', 'designer email', 'mail address', 'send email', 'write email'] },
    // Phone
    { cmd: '/phone', phrases: ['phone number', 'your phone', 'designer phone', 'call number', 'telephone'] },
    // LinkedIn
    { cmd: '/linkedin', phrases: ['linkedin profile', 'your linkedin', 'designer linkedin', 'find on linkedin'] },
    // Location
    { cmd: '/location', phrases: ['where are you', 'where is designer', 'your location', 'based in', 'where based', 'what city', 'which country'] },
    // Articles
    { cmd: '/articles', phrases: ['your articles', 'blog posts', 'what have you written', 'publications', 'your writing', 'read articles'] },
    // Awards
    { cmd: '/awards', phrases: ['your awards', 'recognition', 'have you won', 'won any awards', 'design awards', 'awwwards', 'the fwa', 'css design awards', 'css winner', 'certifications', 'certificates', 'growth design'] },
    // Agency
    { cmd: '/agency', phrases: ['your agency', 'design studio', 'your company', 'your studio'] },
    // Themes
    { cmd: '/themes', phrases: ['change theme', 'change color', 'change colours', 'dark mode', 'light mode', 'switch theme', 'change appearance', 'change the look', 'how to change theme', 'customize'] },
    // Help
    { cmd: '/help', phrases: ['help me', 'what can i do', 'list commands', 'show commands', 'available commands', 'how does this work', 'instructions', 'what is this'] },
  ];

  function matchIntent(input) {
    const lower = input.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    for (const intent of INTENT_MAP) {
      for (const phrase of intent.phrases) {
        // Exact phrase match
        if (lower === phrase) return intent.cmd;

        // Input contains the full phrase
        if (lower.includes(phrase)) {
          const score = phrase.length / lower.length;
          if (score > bestScore) { bestScore = score; bestMatch = intent.cmd; }
          continue;
        }

        // Word overlap scoring — at least 2 matching words needed
        const inputWords = lower.split(/\s+/);
        const phraseWords = phrase.split(/\s+/);
        const matchingWords = phraseWords.filter(w => inputWords.includes(w));
        if (matchingWords.length >= 2 || (matchingWords.length === 1 && phraseWords.length === 1)) {
          const score = matchingWords.length / phraseWords.length * 0.8;
          if (score > bestScore) { bestScore = score; bestMatch = intent.cmd; }
        }
      }
    }

    // Only return if confidence is reasonable
    return bestScore >= 0.4 ? bestMatch : null;
  }

  function executeCommand(input) {
    const raw = input.trim().toLowerCase();
    if (!raw) return;

    // Restore from minimized mode
    if (terminal.classList.contains('minimized')) {
      terminal.classList.remove('minimized');
      document.body.classList.remove('minimized');
      terminal.dataset.wasMaximized = '';
    }

    // Reset idle timer on any command
    resetIdleTimer();

    // Save to history
    commandHistory.unshift(input.trim());
    if (commandHistory.length > 50) commandHistory.pop();
    historyIndex = -1;

    // Command counter milestones
    cmdCount++;
    const milestones = {
      3: 'You\'ve run 3 commands. There are more hiding beneath the surface.',
      5: 'Bored of the dark? Try /themes — there are 4 looks to choose from.',
      7: 'Getting curious? Try typing whoami or ls — this isn\'t your average portfolio.',
      12: 'Power user detected. Type /secrets for the full map.',
    };
    if (milestones[cmdCount]) {
      setTimeout(() => {
        const note = document.createElement('div');
        note.className = 'output-block';
        const sys = document.createElement('div');
        sys.className = 'output-line dim';
        sys.style.fontStyle = 'italic';
        sys.innerHTML = `  <span class="accent" style="opacity:0.7">[system]</span> ${milestones[cmdCount]}`;
        note.appendChild(sys);
        outputArea.appendChild(note);
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }, 1500);
    }

    // Track help count for easter egg
    if (raw === '/help' || raw === 'help') {
      helpCount++;
      if (helpCount >= 3) {
        helpCount = 0;
        // Auto-redirect after showing help
        setTimeout(() => {
          const nudge = document.createElement('div');
          nudge.className = 'output-block';
          const line = document.createElement('div');
          line.className = 'output-line accent';
          line.style.fontStyle = 'italic';
          line.textContent = '  You seem lost. Here, let me just show you...';
          nudge.appendChild(line);
          outputArea.appendChild(nudge);
          terminalBody.scrollTop = terminalBody.scrollHeight;
          setTimeout(() => executeCommand('/about'), 800);
        }, 500);
      }
    } else {
      helpCount = 0;
    }

    // Check hidden commands first
    const hiddenFn = HIDDEN_COMMANDS[raw];

    // Resolve aliases for regular commands
    const resolved = ALIASES[raw] || raw;
    let cmd = NAV_COMMANDS[resolved] || INFO_COMMANDS[resolved] || PROJECT_COMMANDS[resolved] || THEME_COMMANDS[resolved];

    // If no match yet, try prefixing with "/" for bare-word input
    let isFuzzyMatch = false;
    let fuzzyResolved = null;
    if (!cmd && !hiddenFn && !raw.startsWith('/')) {
      const withSlash = '/' + raw;
      const aliasResolved = ALIASES[withSlash] || withSlash;
      const fuzzyCmd = NAV_COMMANDS[aliasResolved] || INFO_COMMANDS[aliasResolved] || PROJECT_COMMANDS[aliasResolved] || THEME_COMMANDS[aliasResolved];
      if (fuzzyCmd) {
        cmd = fuzzyCmd;
        isFuzzyMatch = true;
        fuzzyResolved = aliasResolved;
      }
    }

    // Natural language intent matching — detect phrases and map to commands
    if (!cmd && !hiddenFn) {
      const intentMatch = matchIntent(raw);
      if (intentMatch) {
        const intentCmd = NAV_COMMANDS[intentMatch] || INFO_COMMANDS[intentMatch] || PROJECT_COMMANDS[intentMatch] || THEME_COMMANDS[intentMatch];
        if (intentCmd) {
          cmd = intentCmd;
          isFuzzyMatch = true;
          fuzzyResolved = intentMatch;
        }
      }
    }

    // Update URL for routable commands
    const finalCmd = fuzzyResolved || resolved;
    updateUrl(finalCmd);

    // Create output block
    const block = document.createElement('div');
    block.className = 'output-block';

    // Echo the command
    const echo = document.createElement('div');
    echo.className = 'cmd-echo';
    echo.innerHTML = `<span class="prompt-symbol">&gt;</span> ${escapeHtml(input.trim())}`;
    block.appendChild(echo);

    // Commands that skip thinking animation
    const skipThinking = ['/clear', 'clear', '/matrix', 'matrix'];
    const needsThinking = !skipThinking.includes(raw) && (hiddenFn || cmd);

    if (needsThinking) {
      if (isFuzzyMatch) {
        // Multi-step "intent detection" animation for bare-word input
        const thinking = document.createElement('div');
        thinking.className = 'thinking-indicator';
        thinking.innerHTML = `<span class="thinking-text">Processing</span><span class="thinking-dots"><span></span><span></span><span></span></span>`;
        block.appendChild(thinking);
        outputArea.appendChild(block);
        requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });

        const isNaturalLanguage = input.trim().includes(' ');
        const delay1 = 600 + Math.random() * 800;
        setTimeout(() => {
          // Step 1: acknowledge the input
          thinking.remove();
          const step1 = document.createElement('div');
          step1.className = 'output-line dim';
          step1.style.fontStyle = 'italic';
          step1.innerHTML = isNaturalLanguage
            ? `  Interpreting: "${escapeHtml(input.trim())}"...`
            : `  "${escapeHtml(input.trim())}" doesn't look like a valid command...`;
          block.appendChild(step1);
          requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });

          const delay2 = 800 + Math.random() * 600;
          setTimeout(() => {
            // Step 2: "assuming intent"
            const step2 = document.createElement('div');
            step2.className = 'output-line accent';
            step2.style.fontStyle = 'italic';
            step2.innerHTML = isNaturalLanguage
              ? `  I think you're looking for <span class="cmd-name">${fuzzyResolved}</span> — loading results`
              : `  Assuming you meant <span class="cmd-name">${fuzzyResolved}</span> — loading results`;
            block.appendChild(step2);

            // Step 2.5: show new thinking dots
            const thinking2 = document.createElement('div');
            thinking2.className = 'thinking-indicator';
            thinking2.innerHTML = `<span class="thinking-text">Resolving</span><span class="thinking-dots"><span></span><span></span><span></span></span>`;
            block.appendChild(thinking2);
            requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });

            const delay3 = 600 + Math.random() * 800;
            setTimeout(() => {
              // Step 3: show the actual result
              thinking2.remove();
              renderCommandResult(block, hiddenFn, cmd);
              requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });
              setTimeout(() => {
                block.querySelectorAll('.bar-fill').forEach(el => {
                  el.style.width = el.dataset.width;
                });
              }, 100);
            }, delay3);
          }, delay2);
        }, delay1);
      } else {
        // Standard thinking animation for proper /commands
        const thinking = document.createElement('div');
        thinking.className = 'thinking-indicator';
        const thinkingPhrases = [
          'Processing', 'Fetching data', 'Loading', 'Compiling',
          'Resolving', 'Querying', 'Scanning', 'Rendering'
        ];
        const phrase = thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];
        thinking.innerHTML = `<span class="thinking-text">${phrase}</span><span class="thinking-dots"><span></span><span></span><span></span></span>`;
        block.appendChild(thinking);
        outputArea.appendChild(block);
        requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });

        // ~8% chance: briefly glitch a hidden command name into the thinking text
        if (Math.random() < 0.08) {
          const glitchWords = ['matrix', 'sudo hire designer', 'konami', 'secrets', 'ping designer', 'git log', 'figma', 'coffee'];
          const glitchWord = glitchWords[Math.floor(Math.random() * glitchWords.length)];
          const textEl = thinking.querySelector('.thinking-text');
          const glitchDelay = 200 + Math.random() * 400;
          setTimeout(() => {
            if (!textEl || !textEl.parentNode) return;
            const original = textEl.textContent;
            textEl.textContent = glitchWord;
            textEl.style.opacity = '0.6';
            textEl.style.fontStyle = 'italic';
            setTimeout(() => {
              if (!textEl.parentNode) return;
              textEl.textContent = original;
              textEl.style.opacity = '';
              textEl.style.fontStyle = '';
            }, 120 + Math.random() * 80);
          }, glitchDelay);
        }

        // Random delay 800-2500ms for natural feel
        const delay = 800 + Math.random() * 1700;
        setTimeout(() => {
          thinking.remove();
          renderCommandResult(block, hiddenFn, cmd);
          requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });
          setTimeout(() => {
            block.querySelectorAll('.bar-fill').forEach(el => {
              el.style.width = el.dataset.width;
            });
          }, 100);
        }, delay);
      }
    } else {
      // Instant execution for clear, matrix, and unknown commands
      if (hiddenFn) {
        renderCommandResult(block, hiddenFn, null);
      } else if (cmd) {
        const result = cmd.fn();
        if (result === null) return; // /clear
      } else {
        const err = document.createElement('div');
        err.className = 'output-line red';
        err.textContent = `  Command not found: "${input.trim()}"`;
        block.appendChild(err);
        const hint = document.createElement('div');
        hint.className = 'output-line dim';
        const errorBreadcrumbs = [
          'Type /help to see available commands',
          'Type /help to see available commands. Hint: some Unix commands work here too...',
          'Type /help to see available commands. Or try something unexpected.',
          'Type /help — or don\'t. Some commands aren\'t listed there.',
        ];
        hint.textContent = '  ' + errorBreadcrumbs[Math.floor(Math.random() * errorBreadcrumbs.length)];
        block.appendChild(hint);
      }
      outputArea.appendChild(block);
      requestAnimationFrame(() => { terminalBody.scrollTop = terminalBody.scrollHeight; });
      setTimeout(() => {
        block.querySelectorAll('.bar-fill').forEach(el => {
          el.style.width = el.dataset.width;
        });
      }, 100);
    }
  }

  // ============ AUTOCOMPLETE ============

  function updateAutocomplete(value) {
    const val = value.toLowerCase().trim();
    acItems = [];
    acIndex = -1;

    if (!val || val.length < 1) {
      autocompleteEl.classList.remove('show');
      return;
    }

    const allCmds = [].concat(...ALL_COMMAND_GROUPS.map(g => Object.entries(g)));

    // Inject secret/secrets into autocomplete after 3 chars
    const secretEntries = [
      ['/secrets', { desc: '...are you sure you want to go there?' }],
      ['/secret', { desc: 'I\'m feeling lucky' }],
    ];
    const withSecrets = allCmds.concat(secretEntries);

    const matches = withSecrets.filter(([cmd]) => cmd.startsWith(val) || cmd.startsWith('/' + val));

    if (matches.length === 0 || (matches.length === 1 && matches[0][0] === val)) {
      autocompleteEl.classList.remove('show');
      return;
    }

    acItems = matches;
    autocompleteEl.innerHTML = '';
    matches.forEach(([cmd, data], i) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `<span class="ac-cmd">${cmd}</span><span class="ac-desc">${data.desc}</span>`;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        cmdInput.value = cmd;
        autocompleteEl.classList.remove('show');
        cmdInput.focus();
      });
      autocompleteEl.appendChild(item);
    });

    autocompleteEl.classList.add('show');
  }

  // ============ EVENT LISTENERS ============

  cmdInput.addEventListener('input', () => {
    updateAutocomplete(cmdInput.value);
  });

  cmdInput.addEventListener('keydown', (e) => {
    // Autocomplete navigation
    if (autocompleteEl.classList.contains('show')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        acIndex = Math.min(acIndex + 1, acItems.length - 1);
        highlightAcItem();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        acIndex = Math.max(acIndex - 1, -1);
        highlightAcItem();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (acIndex >= 0 && acItems[acIndex]) {
          cmdInput.value = acItems[acIndex][0];
        } else if (acItems.length > 0) {
          cmdInput.value = acItems[0][0];
        }
        autocompleteEl.classList.remove('show');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (acIndex >= 0 && acItems[acIndex]) {
          cmdInput.value = acItems[acIndex][0];
        } else if (acItems.length > 0) {
          cmdInput.value = acItems[0][0];
        }
        autocompleteEl.classList.remove('show');
        const value = cmdInput.value;
        cmdInput.value = '';
        executeCommand(value);
        return;
      }
      if (e.key === 'Escape') {
        autocompleteEl.classList.remove('show');
        return;
      }
    }

    // Tab autocomplete without dropdown
    if (e.key === 'Tab' && !autocompleteEl.classList.contains('show')) {
      e.preventDefault();
      const val = cmdInput.value.toLowerCase().trim();
      if (val) {
        const allKeys = [].concat(...ALL_COMMAND_GROUPS.map(g => Object.keys(g)));
        const match = allKeys.find(c => c.startsWith(val) || c.startsWith('/' + val));
        if (match) cmdInput.value = match;
      }
      return;
    }

    // Enter = execute
    if (e.key === 'Enter') {
      autocompleteEl.classList.remove('show');
      const value = cmdInput.value;
      cmdInput.value = '';
      executeCommand(value);
      return;
    }

    // History navigation (when autocomplete is closed)
    if (e.key === 'ArrowUp' && !autocompleteEl.classList.contains('show')) {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        cmdInput.value = commandHistory[historyIndex];
      }
      return;
    }
    if (e.key === 'ArrowDown' && !autocompleteEl.classList.contains('show')) {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        cmdInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = -1;
        cmdInput.value = '';
      }
      return;
    }
  });

  function highlightAcItem() {
    autocompleteEl.querySelectorAll('.autocomplete-item').forEach((el, i) => {
      el.classList.toggle('active', i === acIndex);
      if (i === acIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  // Focus input on click anywhere in terminal body
  terminalBody.addEventListener('click', (e) => {
    if (!window.getSelection().toString()) {
      cmdInput.focus();
    }
  });

  // Also focus on any keypress
  document.addEventListener('keydown', (e) => {
    if (e.target !== cmdInput && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
      cmdInput.focus();
    }
  });

  // ============ UTILITIES ============

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============ INIT ============
  runBoot();

})();
