import {
  projects, skills, identity, theme, mode, cookieConsent, easterEgg, configTab,
  outputBuffer, appendLine, clearOutput,
  undo, redo, canUndo, canRedo, THEMES,
} from './store.js';

// ---------------------------------------------------------------------------
// Static portfolio copy — one coherent fictional designer identity.
// ---------------------------------------------------------------------------
const COPY = {
  about: [
    'I turn complexity into clarity. Whether it is an enterprise dashboard or a consumer mobile app, I keep asking the same question: does this remove friction? Complexity is fine. Confusion is the problem.',
    'For a decade I have led design systems and product design for research, broadcast, and hospitality teams — translating tangled requirements into interfaces people actually trust.',
  ],
  philosophy: [
    'Systems over screens. A single well-named token outlives a hundred pixel-perfect mockups, so I invest in the grammar first and let the pages fall out of it.',
    'Measure the friction, not the pixels. I pair every redesign with the support tickets and task times it moves, and I kill the work that does not move them.',
    'Ship the boring miracle. The most magical interaction is the one nobody notices because it never once got in their way.',
  ],
  testimonials: [
    { quote: 'They rebuilt our review queue in a sprint and the analysts never looked back. Calm, exact, and fast.', who: 'VP Product, research platform' },
    { quote: 'The design system paid for itself in a quarter. Three squads finally speak the same language.', who: 'Head of Engineering, hospitality group' },
    { quote: 'Our on-air tooling shipped on deadline with zero field regressions. That never happens.', who: 'Director of Broadcast UX' },
  ],
  clients: ['Meridian Research', 'LiveU Broadcast', 'ResNet Hospitality', 'TUIASI Faculty', 'Socyal People', 'Anylyze Data'],
  articles: [
    { title: 'Naming Tokens So Designers and Engineers Stop Arguing', read: '6 min' },
    { title: 'The Offline-First Onboarding Pattern, Annotated', read: '9 min' },
    { title: 'Reading a Chart the Same Way Every Time', read: '4 min' },
  ],
  awards: [
    { name: 'Product Hunt #3 — Product of the Day', year: 2023 },
    { name: 'Design Systems Guild — Systems Impact Award', year: 2024 },
    { name: 'Broadcast UX Excellence — On-Air Reliability', year: 2024 },
  ],
  contact: {
    email: () => identity.value.email,
    phone: '+1 (555) 010-2048',
    location: () => identity.value.location,
    agency: 'Design Studio — designstudio.example',
  },
};

const SOCIAL = [
  { token: 'linkedin', icon: 'tabler--brand-linkedin', label: 'LinkedIn', value: 'linkedin.com/in/yourname' },
  { token: 'facebook', icon: 'tabler--brand-facebook', label: 'Facebook', value: 'facebook.com/yourname' },
  { token: 'instagram', icon: 'tabler--brand-instagram', label: 'Instagram', value: 'instagram.com/yourname' },
];

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const statusIcon = { shipped: 'tabler--circle-check', wip: 'tabler--loader-2', archived: 'tabler--archive' };
const statusLabel = { shipped: 'Shipped', wip: 'Work in Progress', archived: 'Archived' };

function badge(status) {
  return `<span class="status-badge status-${status}"><span class="icon-[${statusIcon[status]}] size-3 shrink-0"></span>${statusLabel[status]}</span>`;
}

function tagsHtml(tags) {
  return tags.map((t) => `<span class="tag-chip">${esc(t)}</span>`).join('');
}

function projectCardHtml(p) {
  return `<div class="cli-card" data-slug="${esc(p.slug)}">
    <div class="cli-card-head">
      <span class="cli-card-name">${esc(p.name)}${p.featured ? ' <span class="icon-[tabler--star-filled] featured-star" title="Featured" aria-label="Featured"></span>' : ''}</span>
      <span class="cli-card-year">${esc(p.year)}</span>
    </div>
    ${p.type ? `<div class="cli-card-type">${esc(p.type)}</div>` : ''}
    <div class="cli-card-meta">${badge(p.status)}</div>
    <div class="cli-card-summary">${esc(p.summary)}</div>
    <div class="cli-card-tags">${tagsHtml(p.tags)}</div>
  </div>`;
}

function projectDetailHtml(p) {
  return `<div class="cli-detail" data-slug="${esc(p.slug)}">
    <div class="cli-detail-title">${esc(p.name)} ${p.featured ? '<span class="icon-[tabler--star-filled] featured-star" aria-label="Featured"></span>' : ''}</div>
    <div class="cli-detail-sub">${esc(p.year)} &bull; ${esc(p.type || 'Case study')} &bull; ${badge(p.status)}</div>
    <div class="cli-detail-slug">slug: /${esc(p.slug)}</div>
    <p class="cli-detail-summary">${esc(p.summary)}</p>
    <div class="cli-card-tags">${tagsHtml(p.tags)}</div>
  </div>`;
}

const ROUTE_TITLES = {
  '': 'Your Name | Product Designer & Design Systems Lead',
  about: 'About | Product Designer & Design Systems Lead',
  work: 'Work | Selected Projects | Product Designer',
  skills: 'Skills | Design Systems, UX, Product Design',
  privacy: 'Privacy Policy',
  social: 'Connect | Product Designer',
  contact: 'Contact | Product Designer',
};

function setTitle(slug) {
  if (slug !== undefined) document.title = ROUTE_TITLES[slug] || ROUTE_TITLES[''];
}

// ---------------------------------------------------------------------------
// Command registry. kind: 'view' replaces its own prior output block; 'action'
// appends feedback; 'mode' switches the active surface.
// ---------------------------------------------------------------------------
const COMMANDS = [
  { token: '/help', group: 'Sections', desc: 'List every command grouped by section', kind: 'view', view: 'help', run: cmdHelp },
  { token: '/about', group: 'Sections', desc: 'Print the designer bio and approach', kind: 'view', view: 'about', run: cmdAbout },
  { token: '/work', group: 'Sections', desc: 'List all projects as case-study cards', kind: 'view', view: 'work', run: cmdWork },
  { token: '/clients', group: 'Sections', desc: 'Show selected client and partner names', kind: 'view', view: 'clients', run: cmdClients },
  { token: '/skills', group: 'Sections', desc: 'Render proficiency bars that fill to width', kind: 'view', view: 'skills', run: cmdSkills },
  { token: '/philosophy', group: 'Sections', desc: 'Print the working design philosophy', kind: 'view', view: 'philosophy', run: cmdPhilosophy },
  { token: '/social', group: 'Sections', desc: 'Show social profile cards with icons', kind: 'view', view: 'social', run: cmdSocial },
  { token: '/articles', group: 'Sections', desc: 'List writing and talk titles', kind: 'view', view: 'articles', run: cmdArticles },
  { token: '/testimonials', group: 'Sections', desc: 'Print client testimonials', kind: 'view', view: 'testimonials', run: cmdTestimonials },
  { token: '/awards', group: 'Sections', desc: 'List awards and recognition', kind: 'view', view: 'awards', run: cmdAwards },
  { token: '/contact', group: 'Sections', desc: 'Show every contact channel in one card', kind: 'view', view: 'contact', run: cmdContact },
  { token: '/themes', group: 'Themes', desc: 'Show theme swatches and mark the active one', kind: 'view', view: 'themes', run: cmdThemes },
  { token: '/dark', group: 'Themes', desc: 'Apply the dark theme', kind: 'action', run: () => setTheme('dark') },
  { token: '/light', group: 'Themes', desc: 'Apply the light theme', kind: 'action', run: () => setTheme('light') },
  { token: '/retro', group: 'Themes', desc: 'Apply the retro amber theme', kind: 'action', run: () => setTheme('retro') },
  { token: '/glass', group: 'Themes', desc: 'Apply the glass translucent theme', kind: 'action', run: () => setTheme('glass') },
  { token: '/board', group: 'Modes', desc: 'Open the Projects Board surface', kind: 'mode', run: () => { mode.value = 'board'; return [{ text: 'Opened Projects Board. Use the filters, sort, and multi-select controls there.', type: 'success' }]; } },
  { token: '/config', group: 'Modes', desc: 'Open Config Studio (identity, skills, profiles, diff)', kind: 'mode', run: () => { configTab.value = 'identity'; mode.value = 'config'; return [{ text: 'Opened Config Studio.', type: 'success' }]; } },
  { token: '/export', group: 'Modes', desc: 'Open Export Center (JSON, Config, CSS)', kind: 'mode', run: () => { mode.value = 'export'; return [{ text: 'Opened Export Center with live Portfolio JSON, Terminal Config, and Theme CSS.', type: 'success' }]; } },
  { token: '/import', group: 'Modes', desc: 'Open Export Center ready to import JSON', kind: 'mode', run: () => { mode.value = 'export'; configTab.value = 'import'; return [{ text: 'Opened Export Center. Paste or drop a Portfolio JSON document to import.', type: 'success' }]; } },
  { token: '/profiles', group: 'Modes', desc: 'Open Config Studio on the Profiles tab', kind: 'mode', run: () => { configTab.value = 'profiles'; mode.value = 'config'; return [{ text: 'Opened Config Studio on Profiles.', type: 'success' }]; } },
  { token: '/undo', group: 'Utility', desc: 'Undo the last structural change', kind: 'action', run: cmdUndo },
  { token: '/redo', group: 'Utility', desc: 'Redo the last undone change', kind: 'action', run: cmdRedo },
  { token: '/clear', group: 'Utility', desc: 'Empty the terminal output', kind: 'action', run: () => { clearOutput(); return []; } },
  { token: '/email', group: 'Quick info', desc: 'Show the contact email card', kind: 'view', view: 'email', run: cmdEmail },
  { token: '/phone', group: 'Quick info', desc: 'Show the contact phone card', kind: 'view', view: 'phone', run: cmdPhone },
  { token: '/linkedin', group: 'Quick info', desc: 'Show the LinkedIn card', kind: 'view', view: 'linkedin', run: () => cmdSocialOne('linkedin') },
  { token: '/facebook', group: 'Quick info', desc: 'Show the Facebook card', kind: 'view', view: 'facebook', run: () => cmdSocialOne('facebook') },
  { token: '/instagram', group: 'Quick info', desc: 'Show the Instagram card', kind: 'view', view: 'instagram', run: () => cmdSocialOne('instagram') },
  { token: '/agency', group: 'Quick info', desc: 'Show the agency card', kind: 'view', view: 'agency', run: cmdAgency },
  { token: '/location', group: 'Quick info', desc: 'Show the location card', kind: 'view', view: 'location', run: cmdLocation },
  { token: '/privacy', group: 'Quick info', desc: 'Show privacy and cookie-consent status', kind: 'view', view: 'privacy', run: cmdPrivacy },
  { token: '/konami', group: 'Easter eggs', desc: 'Fire a confetti burst over the wallpaper', kind: 'action', run: () => { easterEgg.value = 'confetti'; return [{ text: 'Konami accepted. Confetti deployed.', type: 'accent' }]; } },
  { token: '/matrix', group: 'Easter eggs', desc: 'Run a brief green digital-rain canvas', kind: 'action', run: () => { easterEgg.value = 'matrix'; return [{ text: 'Entering the matrix...', type: 'accent' }]; } },
];

// Bare-word aliases and natural-language keyword intents -> command token.
const KEYWORD_INTENT = [
  [['work', 'project', 'projects', 'case', 'cases', 'portfolio', 'showcase'], '/work'],
  [['about', 'bio', 'who', 'you', 'intro', 'profile'], '/about'],
  [['skill', 'skills', 'capabilit', 'expert', 'strength'], '/skills'],
  [['client', 'clients', 'partner', 'partners'], '/clients'],
  [['philosophy', 'principle', 'approach', 'values'], '/philosophy'],
  [['social', 'connect', 'follow', 'network'], '/social'],
  [['article', 'articles', 'writing', 'blog', 'talk'], '/articles'],
  [['testimonial', 'testimonials', 'praise', 'quote'], '/testimonials'],
  [['award', 'awards', 'recognition', 'honor'], '/awards'],
  [['contact', 'reach', 'hire'], '/contact'],
  [['email', 'mail', 'message'], '/email'],
  [['phone', 'call', 'telephone'], '/phone'],
  [['linkedin'], '/linkedin'],
  [['facebook'], '/facebook'],
  [['instagram'], '/instagram'],
  [['agency', 'studio'], '/agency'],
  [['location', 'where', 'based', 'city'], '/location'],
  [['privacy', 'cookie', 'consent', 'gdpr'], '/privacy'],
  [['theme', 'themes', 'color', 'colour'], '/themes'],
  [['dark'], '/dark'],
  [['light'], '/light'],
  [['retro'], '/retro'],
  [['glass'], '/glass'],
  [['board', 'projects board'], '/board'],
  [['config', 'setting', 'settings', 'studio', 'identity'], '/config'],
  [['export', 'download', 'json'], '/export'],
  [['import'], '/import'],
  [['profile', 'profiles'], '/profiles'],
  [['help', 'command', 'commands', 'menu'], '/help'],
  [['clear', 'reset', 'clean'], '/clear'],
  [['undo'], '/undo'],
  [['redo'], '/redo'],
];

function setTheme(t) {
  theme.value = t;
  return [{ text: `Theme switched to ${t}. Run /themes to see the active swatch.`, type: 'success' }];
}

function cmdHelp() {
  const groups = {};
  for (const c of COMMANDS) (groups[c.group] ||= []).push(c);
  const lines = [{ text: 'Available commands', type: 'heading' }];
  const order = ['Sections', 'Quick info', 'Themes', 'Modes', 'Utility', 'Easter eggs'];
  for (const g of order) {
    if (!groups[g]) continue;
    lines.push({ text: g, type: 'group-label' });
    for (const c of groups[g]) lines.push({ html: `<div class="help-row"><span class="help-cmd">${esc(c.token)}</span><span class="help-desc">${esc(c.desc)}</span></div>` });
  }
  lines.push({ text: 'Projects', type: 'group-label' });
  if (projects.value.length === 0) {
    lines.push({ html: '<div class="help-row"><span class="help-desc dim">No projects yet. Open the board and add one.</span></div>' });
  } else {
    for (const p of projects.value) lines.push({ html: `<div class="help-row"><span class="help-cmd">${esc(p.slug)}</span><span class="help-desc">Open the ${esc(p.name)} detail card</span></div>` });
  }
  lines.push({ html: '<div class="help-row dim"><span class="help-desc">Tip: type a word like work or email, or a phrase like show my work — the shell resolves intent. Tab completes.</span></div>' });
  return lines;
}

function cmdAbout() {
  const id = identity.value;
  const lines = [
    { text: 'About', type: 'heading' },
    { html: `<div class="about-name">${esc(id.displayName)}</div>` },
    { html: `<div class="about-tagline">${esc(id.tagline || '')}</div>` },
    { html: `<div class="about-loc"><span class="icon-[tabler--map-pin] size-3"></span>${esc(id.location)}</div>` },
  ];
  for (const para of COPY.about) lines.push({ html: `<p class="about-para">${esc(para)}</p>` });
  return lines;
}

function cmdWork() {
  const lines = [{ text: `Work — ${projects.value.length} project${projects.value.length === 1 ? '' : 's'}`, type: 'heading' }];
  if (projects.value.length === 0) {
    lines.push({ html: '<div class="empty-view">No projects yet. Open the Projects Board (mode toggle or /board) and choose New Project, or import a Portfolio JSON document from Export Center.</div>' });
    return lines;
  }
  for (const p of projects.value) lines.push({ html: projectCardHtml(p) });
  return lines;
}

function cmdSkills() {
  const lines = [{ text: 'Skills & Capabilities', type: 'heading' }];
  if (skills.value.length === 0) {
    lines.push({ html: '<div class="empty-view">No skills recorded. Add proficiency rows in Config Studio.</div>' });
    return lines;
  }
  for (const s of skills.value) {
    const tier = s.proficiency >= 90 ? 'Expert' : s.proficiency >= 70 ? 'Advanced' : s.proficiency >= 40 ? 'Proficient' : 'Foundational';
    lines.push({
      html: `<div class="skill-row">
        <span class="skill-name">${esc(s.name)}</span>
        <span class="skill-bar" role="img" aria-label="${esc(s.name)} proficiency ${s.proficiency} percent">
          <span class="skill-fill" data-prof="${s.proficiency}"></span>
        </span>
        <span class="skill-pct">${s.proficiency}%</span>
        <span class="skill-tier">${tier}</span>
      </div>`,
    });
  }
  return lines;
}

function cmdClients() {
  return [
    { text: 'Selected Clients & Partners', type: 'heading' },
    ...COPY.clients.map((c) => ({ html: `<div class="list-row"><span class="icon-[tabler--building] size-3"></span>${esc(c)}</div>` })),
  ];
}
function cmdPhilosophy() {
  return [
    { text: 'Design Philosophy', type: 'heading' },
    ...COPY.philosophy.map((p) => ({ html: `<p class="about-para">${esc(p)}</p>` })),
  ];
}
function cmdSocial() {
  const lines = [{ text: 'Connect', type: 'heading' }];
  for (const s of SOCIAL) lines.push({ socialHtml: `<button type="button" class="social-card" data-inert="true" aria-label="${esc(s.label)} (placeholder, no navigation)"><span class="icon-[${s.icon}] size-5"></span><span class="social-body"><span class="social-label">${esc(s.label)}</span><span class="social-value">${esc(s.value)}</span></span></button>` });
  return lines;
}
function cmdSocialOne(token) {
  const s = SOCIAL.find((x) => x.token === token);
  if (!s) return [{ text: `No ${token} profile configured.`, type: 'dim' }];
  return [
    { text: s.label, type: 'heading' },
    { socialHtml: `<button type="button" class="social-card" data-inert="true" aria-label="${esc(s.label)} (placeholder, no navigation)"><span class="icon-[${s.icon}] size-5"></span><span class="social-body"><span class="social-label">${esc(s.label)}</span><span class="social-value">${esc(s.value)}</span></span></button>` },
  ];
}
function cmdArticles() {
  return [
    { text: 'Writing & Talks', type: 'heading' },
    ...COPY.articles.map((a) => ({ html: `<div class="list-row"><span class="icon-[tabler--article] size-3"></span><span class="list-main">${esc(a.title)}</span><span class="list-meta">${esc(a.read)}</span></div>` })),
  ];
}
function cmdTestimonials() {
  return [
    { text: 'Testimonials', type: 'heading' },
    ...COPY.testimonials.map((t) => ({ html: `<blockquote class="testimonial">&ldquo;${esc(t.quote)}&rdquo;<footer>— ${esc(t.who)}</footer></blockquote>` })),
  ];
}
function cmdAwards() {
  return [
    { text: 'Awards & Recognition', type: 'heading' },
    ...COPY.awards.map((a) => ({ html: `<div class="list-row"><span class="icon-[tabler--trophy] size-3"></span><span class="list-main">${esc(a.name)}</span><span class="list-meta">${esc(a.year)}</span></div>` })),
  ];
}
function cmdContact() {
  const id = identity.value;
  return [
    { text: 'Contact', type: 'heading' },
    { html: `<div class="list-row"><span class="icon-[tabler--mail] size-3"></span><span class="list-main">${esc(id.email)}</span></div>` },
    { html: `<div class="list-row"><span class="icon-[tabler--phone] size-3"></span><span class="list-main">${esc(COPY.contact.phone)}</span></div>` },
    { html: `<div class="list-row"><span class="icon-[tabler--map-pin] size-3"></span><span class="list-main">${esc(id.location)}</span></div>` },
    { html: `<div class="list-row"><span class="icon-[tabler--briefcase] size-3"></span><span class="list-main">${esc(COPY.contact.agency)}</span></div>` },
    ...SOCIAL.map((s) => ({ html: `<div class="list-row"><span class="icon-[${s.icon}] size-3"></span><span class="list-main">${esc(s.value)}</span></div>` })),
  ];
}
function cmdEmail() { return [{ text: 'Email', type: 'heading' }, { html: `<div class="list-row"><span class="icon-[tabler--mail] size-3"></span><span class="list-main">${esc(identity.value.email)}</span></div>` }]; }
function cmdPhone() { return [{ text: 'Phone', type: 'heading' }, { html: `<div class="list-row"><span class="icon-[tabler--phone] size-3"></span><span class="list-main">${esc(COPY.contact.phone)}</span></div>` }]; }
function cmdAgency() { return [{ text: 'Agency', type: 'heading' }, { html: `<div class="list-row"><span class="icon-[tabler--briefcase] size-3"></span><span class="list-main">${esc(COPY.contact.agency)}</span></div>` }]; }
function cmdLocation() { return [{ text: 'Location', type: 'heading' }, { html: `<div class="list-row"><span class="icon-[tabler--map-pin] size-3"></span><span class="list-main">${esc(identity.value.location)}</span></div>` }]; }
function cmdPrivacy() {
  return [
    { text: 'Privacy & Cookie Policy', type: 'heading' },
    { html: `<p class="about-para">This portfolio stores nothing in your browser. Projects, identity, theme, and consent live only in memory for this tab and reset on reload.</p>` },
    { html: `<div class="list-row"><span class="icon-[tabler--cookie] size-3"></span><span class="list-main">Cookie consent: <strong>${esc(cookieConsent.value)}</strong></span></div>` },
    { html: '<div class="list-row dim"><span class="help-desc">Use the consent banner, or Accept / Decline, to record a choice for this session.</span></div>' },
  ];
}

function cmdThemes() {
  const lines = [{ text: 'Themes', type: 'heading' }];
  for (const t of THEMES) {
    const active = theme.value === t;
    lines.push({
      html: `<button type="button" class="theme-swatch theme-${t} ${active ? 'is-active' : ''}" data-theme-pick="${t}" aria-pressed="${active}">
        <span class="swatch-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="swatch-name">${t[0].toUpperCase()}${t.slice(1)}</span>
        ${active ? '<span class="swatch-active">Active</span>' : ''}
      </button>`,
    });
  }
  return lines;
}

function cmdUndo() {
  if (!canUndo()) return [{ text: 'Nothing to undo yet.', type: 'dim' }];
  undo();
  return [{ text: 'Undid the last change.', type: 'success' }];
}
function cmdRedo() {
  if (!canRedo()) return [{ text: 'Nothing to redo.', type: 'dim' }];
  redo();
  return [{ text: 'Redid the last undone change.', type: 'success' }];
}

// ---------------------------------------------------------------------------
// Resolution: typed input -> { command, projectSlug, error }.
// ---------------------------------------------------------------------------
function commandByToken(token) {
  return COMMANDS.find((c) => c.token === token);
}
function projectBySlug(slug) {
  const s = slug.toLowerCase();
  return projects.value.find((p) => p.slug.toLowerCase() === s);
}

function scoreIntent(input) {
  const hay = input.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [keywords, token] of KEYWORD_INTENT) {
    let score = 0;
    for (const kw of keywords) if (hay.includes(kw)) score += kw.length;
    if (score > bestScore) { bestScore = score; best = token; }
  }
  return best;
}

// Fuzzy subsequence match ratio used to rank autocomplete candidates.
function fuzzyScore(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.startsWith(q)) return 100 - t.length;
  if (t.includes(q)) return 60 - t.length;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i += 1) if (t[i] === q[qi]) qi += 1;
  if (qi === q.length) return 30 - t.length;
  return 0;
}

export function resolveCommand(input) {
  const raw = input.trim();
  if (!raw) return { command: null, projectSlug: null, error: null, empty: true };
  if (raw.startsWith('/')) {
    const token = raw.toLowerCase();
    const cmd = commandByToken(token);
    if (cmd) return { command: cmd, projectSlug: null, error: null };
    const slug = token.slice(1);
    const p = projectBySlug(slug);
    if (p) return { command: null, projectSlug: p.slug, error: null };
    return { command: null, projectSlug: null, error: `Command not found: ${token}. Try /help, or a project slug like ${projects.value[0]?.slug || 'signals-platform'}.` };
  }
  // Bare input: exact project slug first, then natural-language intent.
  const p = projectBySlug(raw);
  if (p) return { command: null, projectSlug: p.slug, error: null };
  const intent = scoreIntent(raw);
  if (intent) return { command: commandByToken(intent), projectSlug: null, error: null, intent };
  return { command: null, projectSlug: null, error: `Command not found: ${raw}. Try /help, a project slug, or a phrase like "show my work".` };
}

// Candidates for the autocomplete dropdown given the live input.
export function getCompletions(input) {
  const raw = input.trim();
  if (!raw) return [];
  const out = [];
  if (raw.startsWith('/')) {
    const q = raw.toLowerCase();
    for (const c of COMMANDS) {
      const score = fuzzyScore(q, c.token);
      if (score > 0) out.push({ score, token: c.token, label: c.token, desc: c.desc, kind: 'command' });
    }
    for (const p of projects.value) {
      const score = fuzzyScore(q, `/${p.slug}`);
      if (score > 0) out.push({ score: score + 1, token: p.slug, label: `/${p.slug}`, desc: `Open ${p.name}`, kind: 'project' });
    }
  } else {
    const q = raw.toLowerCase();
    for (const p of projects.value) {
      const bySlug = fuzzyScore(q, p.slug);
      const byName = fuzzyScore(q, p.name.toLowerCase());
      const score = Math.max(bySlug, byName);
      if (score > 0) out.push({ score: score + 1, token: p.slug, label: p.name, desc: `Open ${p.name} (${p.slug})`, kind: 'project' });
    }
    // Intent-driven command suggestions for bare phrases/words.
    const seen = new Set();
    for (const [keywords, token] of KEYWORD_INTENT) {
      const kw = keywords.find((k) => q.includes(k) || fuzzyScore(q, k) > 40);
      if (!kw || seen.has(token)) continue;
      seen.add(token);
      const c = commandByToken(token);
      out.push({ score: 20, token: c.token, label: c.token, desc: c.desc, kind: 'intent' });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Execution with echo + thinking indicator + (view replacement | append).
// ---------------------------------------------------------------------------
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function processCommand(input) {
  const raw = input.trim();
  if (!raw) return;
  const { command, projectSlug, error, intent } = resolveCommand(raw);

  if (error) {
    appendLine({ text: `> ${raw}`, type: 'echo' });
    appendLine({ text: error, type: 'error' });
    return;
  }

  if (projectSlug) {
    const p = projectBySlug(projectSlug);
    if (!p) { appendLine({ text: `> ${raw}`, type: 'echo' }); appendLine({ text: `Command not found: ${raw}.`, type: 'error' }); return; }
    appendLine({ text: `> ${raw}`, type: 'echo' });
    setTitle('work');
    revealView(`detail-${p.slug}`, [
      { text: `Project — ${p.name}`, type: 'heading' },
      { html: projectDetailHtml(p) },
    ]);
    return;
  }

  const cmd = command;
  setTitle(cmd.token.replace(/^\//, ''));
  appendLine({ text: `> ${raw}`, type: 'echo' });

  const resultLines = cmd.run();
  if (cmd.kind === 'view') {
    revealView(cmd.view, resultLines);
  } else {
    // action / mode: append feedback (may be empty for /clear)
    if (resultLines && resultLines.length) {
      revealAppend(resultLines);
    }
  }
}

// Show a thinking indicator, then replace it with the revealed block.
function revealView(viewId, lines) {
  const reduce = prefersReducedMotion();
  const thinkingId = `think-${viewId}-${Date.now()}`;
  if (!reduce) appendLine({ id: thinkingId, view: viewId, text: '…', type: 'thinking' });
  const finish = () => {
    outputReplace(viewId, thinkingId, lines);
  };
  if (reduce) finish();
  else setTimeout(finish, 220);
}

function revealAppend(lines) {
  const reduce = prefersReducedMotion();
  if (reduce) { for (const l of lines) appendLine(l); return; }
  const thinkingId = `think-app-${Date.now()}`;
  appendLine({ id: thinkingId, text: '…', type: 'thinking' });
  setTimeout(() => {
    outputBuffer.value = outputBuffer.value.filter((l) => l.id !== thinkingId);
    for (const l of lines) appendLine(l);
  }, 180);
}

function outputReplace(viewId, thinkingId, lines) {
  // Remove the thinking line for this view (if present) and any prior block of
  // the same view, then append the new stamped block — so list views never
  // accumulate stale duplicates in the DOM.
  const stamped = lines.map((l, i) => ({ id: `v-${viewId}-${Date.now()}-${i}`, view: viewId, ...l }));
  outputBuffer.value = [
    ...outputBuffer.value.filter((l) => l.view !== viewId && l.id !== thinkingId),
    ...stamped,
  ];
}

export const COMMAND_TOKENS = COMMANDS.map((c) => c.token);
