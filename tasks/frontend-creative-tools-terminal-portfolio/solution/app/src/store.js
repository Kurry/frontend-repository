import { signal } from '@preact/signals';
import * as v from 'valibot';
import { ProjectSchema, IdentitySchema, SkillSchema, THEMES, STATUSES } from './schemas.js';

export { THEMES, STATUSES, ProjectSchema, IdentitySchema, SkillSchema };

const SEED_PROJECTS = [
  {
    name: 'Signals',
    slug: 'signals-platform',
    year: 2024,
    type: 'Research Integrity Platform',
    summary:
      'Academic institutions use these dashboards to monitor research integrity. Tabbed navigation with sticky metrics and dynamic filtering across twelve review queues.',
    tags: ['UX Design', 'Dashboard', 'Research'],
    status: 'shipped',
    featured: false,
  },
  {
    name: 'Anylyze',
    slug: 'anylyze-data',
    year: 2024,
    type: 'Analytics Data Platform',
    summary:
      'Rebuilt the visualization layer with three-tiered typography and five component states so analysts read a chart the same way every time.',
    tags: ['Dashboard UX', 'Data Viz', 'SaaS'],
    status: 'shipped',
    featured: false,
  },
  {
    name: 'LiveU',
    slug: 'liveu-system',
    year: 2024,
    type: 'Broadcasting Enterprise',
    summary:
      '120+ components for a global live video broadcasting platform, shipped against a hard on-air deadline with zero regressions in the field.',
    tags: ['Design System', 'Enterprise', 'Broadcasting'],
    status: 'wip',
    featured: false,
  },
  {
    name: 'TUIASI',
    slug: 'tuiasi-redesign',
    year: 2023,
    type: 'Education Platform',
    summary:
      'A four-week emergency rebuild of a faculty portal; record admissions followed the relaunch and support tickets dropped by half.',
    tags: ['Web Design', 'Education UX', 'Architecture'],
    status: 'shipped',
    featured: false,
  },
  {
    name: 'ResNet AI',
    slug: 'resnet-ai',
    year: 2023,
    type: 'Hospitality Design System',
    summary:
      'Token-based consolidation of 1,300+ legacy variants into one hospitality design system that three product squads now build from.',
    tags: ['Design System', 'Hospitality'],
    status: 'archived',
    featured: false,
  },
  {
    name: 'Socyal',
    slug: 'socyal-hr',
    year: 2023,
    type: 'HR Mobile Platform',
    summary:
      'An investor-ready mobile HR product that reached #3 Product of the Day with a fully offline-first onboarding flow.',
    tags: ['Product Design', 'Mobile UX', 'Product Hunt'],
    status: 'wip',
    featured: false,
  },
];

const SEED_SKILLS = [
  { name: 'Design Systems', proficiency: 98 },
  { name: 'UX / UI Design', proficiency: 95 },
  { name: 'Data Visualization', proficiency: 90 },
  { name: 'Figma Mastery', proficiency: 95 },
  { name: 'Prototyping', proficiency: 85 },
];

const SEED_IDENTITY = {
  displayName: 'Your Name',
  email: 'hello@example.com',
  location: 'Your City, Country',
  tagline: 'Product Designer & Design Systems Lead',
};

// Deep-clone helpers so undo/redo snapshots and the Config-Diff baseline are
// fully detached from the live signals.
const clone = (value) => structuredClone(value);

// --- Live state -------------------------------------------------------------
export const projects = signal(clone(SEED_PROJECTS));
export const skills = signal(clone(SEED_SKILLS));
export const identity = signal(clone(SEED_IDENTITY));
export const profiles = signal([]);

export const theme = signal('dark');
export const mode = signal('cli'); // 'cli' | 'board' | 'config' | 'export'
export const configTab = signal('identity'); // 'identity' | 'skills' | 'featured' | 'profiles' | 'diff' | 'import'

export const filters = signal({ status: null, tag: null, featured: null });
export const sort = signal(null); // 'name-asc' | 'name-desc' | null
export const selected = signal([]); // slugs multi-selected on the board

export const cookieConsent = signal('not_set'); // 'not_set' | 'accepted' | 'declined'

export const commandHistory = signal([]);
export const outputBuffer = signal([]); // { id, view?, type?, text?, html? }

// Boot progress lives in signals (not component-local state) so that closing
// and reopening the terminal — which unmounts/remounts Terminal — resumes the
// boot animation instead of leaving it stuck, and never replays once done.
export const bootStep = signal(0);
export const bootComplete = signal(false);
export const welcomeShown = signal(false);

// Easter-egg overlay: null | 'confetti' | 'matrix'
export const easterEgg = signal(null);

// Session-only personalization (no storage): last mode the shell landed on.
export const lastMode = signal('cli');

// --- Undo / redo ------------------------------------------------------------
// Structural mutations are: create, edit, delete, duplicate, batch delete,
// featured toggle(s), identity / skill / profile saves, import, profile apply.
// Theme, mode, filters, sort, consent, history and output are NOT structural.
const snapshot = () => clone({
  projects: projects.value,
  skills: skills.value,
  identity: identity.value,
  profiles: profiles.value,
});

const undoStack = signal([]);
const redoStack = signal([]);

export const canUndo = () => undoStack.value.length > 0;
export const canRedo = () => redoStack.value.length > 0;

function applySnapshot(snap) {
  projects.value = clone(snap.projects);
  skills.value = clone(snap.skills);
  identity.value = clone(snap.identity);
  profiles.value = clone(snap.profiles);
}

// Run a structural mutation: capture the pre-state for undo, clear the redo
// stack (a new action after undo discards the redo future), then mutate.
export function mutate(fn) {
  undoStack.value = [...undoStack.value, snapshot()];
  redoStack.value = [];
  fn();
}

export function undo() {
  if (!canUndo()) return;
  const prev = undoStack.value[undoStack.value.length - 1];
  redoStack.value = [...redoStack.value, snapshot()];
  undoStack.value = undoStack.value.slice(0, -1);
  applySnapshot(prev);
}

export function redo() {
  if (!canRedo()) return;
  const next = redoStack.value[redoStack.value.length - 1];
  undoStack.value = [...undoStack.value, snapshot()];
  redoStack.value = redoStack.value.slice(0, -1);
  applySnapshot(next);
}

// --- Config Diff baseline ---------------------------------------------------
export const baseline = {
  projects: clone(SEED_PROJECTS),
  skills: clone(SEED_SKILLS),
  identity: clone(SEED_IDENTITY),
  theme: 'dark',
  featured: [],
};

// --- Derived helpers --------------------------------------------------------
export const featuredSlugs = () =>
  projects.value.filter((p) => p.featured).map((p) => p.slug);

// Single source of truth for the exported PortfolioDocument so Copy, Download,
// and Import all conform to the identical shape.
export function buildPortfolioDocument() {
  return {
    schemaVersion: '1.0',
    identity: { ...identity.value },
    theme: theme.value,
    consent: cookieConsent.value,
    projects: projects.value.map((p) => ({ ...p })),
    skills: skills.value.map((s) => ({ ...s })),
    featuredSlugs: featuredSlugs(),
    profiles: profiles.value.map((p) => ({ ...p })),
  };
}

export const FEATURED_CAP = 3;

export function wouldExceedFeaturedCap(turnOnCount, ignoringSlugs = []) {
  const current = projects.value.filter(
    (p) => p.featured && !ignoringSlugs.includes(p.slug),
  ).length;
  return current + turnOnCount > FEATURED_CAP;
}

// --- Validators (return { ok, errors } where errors is field -> message) ----
export function validateProject(data) {
  const result = v.safeParse(ProjectSchema, data);
  if (result.success) return { ok: true, value: result.output };
  const errors = {};
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

export function validateIdentity(data) {
  const result = v.safeParse(IdentitySchema, data);
  if (result.success) return { ok: true, value: result.output };
  const errors = {};
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

export function validateSkill(data) {
  const result = v.safeParse(SkillSchema, data);
  if (result.success) return { ok: true, value: result.output };
  return { ok: false, message: result.issues[0]?.message || 'Invalid skill' };
}

// --- Structural mutation API (used by both the UI and WebMCP) ---------------
export function uniqueSlug(base, existing = projects.value) {
  let slug = base;
  let n = 2;
  const taken = new Set(existing.map((p) => p.slug));
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export function createProject(data, { record = true } = {}) {
  const { ok, value, errors } = validateProject(data);
  if (!ok) return { ok: false, errors };
  if (projects.value.some((p) => p.slug === value.slug)) {
    return { ok: false, errors: { slug: 'A project with this slug already exists. Choose a unique lowercase slug.' } };
  }
  if (value.featured && wouldExceedFeaturedCap(1)) {
    return { ok: false, errors: { featured: 'At most 3 projects may be featured at once. Unfeature another before pinning this one.' } };
  }
  const project = { ...value };
  const run = () => { projects.value = [...projects.value, project]; };
  if (record) mutate(run); else run();
  return { ok: true, value: project };
}

export function updateProject(slug, data, { record = true } = {}) {
  const existing = projects.value.find((p) => p.slug === slug);
  if (!existing) return { ok: false, errors: { slug: `No project with slug ${slug}.` } };
  const merged = { ...existing, ...data };
  const { ok, value, errors } = validateProject(merged);
  if (!ok) return { ok: false, errors };
  if (projects.value.some((p) => p.slug !== slug && p.slug === value.slug)) {
    return { ok: false, errors: { slug: 'A project with this slug already exists. Choose a unique lowercase slug.' } };
  }
  if (value.featured && wouldExceedFeaturedCap(1, [slug])) {
    return { ok: false, errors: { featured: 'At most 3 projects may be featured at once. Unfeature another before pinning this one.' } };
  }
  const run = () => {
    projects.value = projects.value.map((p) => (p.slug === slug ? { ...value } : p));
    if (value.slug !== slug) {
      selected.value = selected.value.map((selectedSlug) => (selectedSlug === slug ? value.slug : selectedSlug));
      profiles.value = profiles.value.map((profile) => ({
        ...profile,
        featuredSlugs: profile.featuredSlugs.map((featuredSlug) => (featuredSlug === slug ? value.slug : featuredSlug)),
      }));
    }
  };
  if (record) mutate(run); else run();
  return { ok: true, value };
}

export function deleteProject(slug, { record = true } = {}) {
  if (!projects.value.some((p) => p.slug === slug)) return { ok: false };
  const run = () => {
    projects.value = projects.value.filter((p) => p.slug !== slug);
    selected.value = selected.value.filter((s) => s !== slug);
    profiles.value = profiles.value.map((profile) => ({
      ...profile,
      featuredSlugs: profile.featuredSlugs.filter((featuredSlug) => featuredSlug !== slug),
    }));
  };
  if (record) mutate(run); else run();
  return { ok: true };
}

export function duplicateProject(slug, { record = true } = {}) {
  const src = projects.value.find((p) => p.slug === slug);
  if (!src) return { ok: false, errors: { slug: `No project with slug ${slug}.` } };
  const copy = {
    ...src,
    name: `${src.name} (copy)`,
    featured: false,
    slug: uniqueSlug(`${src.slug}-copy`),
  };
  const { ok, value, errors } = validateProject(copy);
  if (!ok) return { ok: false, errors };
  const run = () => { projects.value = [...projects.value, { ...value }]; };
  if (record) mutate(run); else run();
  return { ok: true, value };
}

export function toggleFeatured(slug, { record = true } = {}) {
  const target = projects.value.find((p) => p.slug === slug);
  if (!target) return { ok: false, message: `No project with slug ${slug}.` };
  const nextFeatured = !target.featured;
  if (nextFeatured && wouldExceedFeaturedCap(1, [slug])) {
    return { ok: false, message: 'At most 3 projects may be featured at once. Unfeature another before pinning this one.' };
  }
  const run = () => {
    projects.value = projects.value.map((p) => (p.slug === slug ? { ...p, featured: nextFeatured } : p));
  };
  if (record) mutate(run); else run();
  return { ok: true, featured: nextFeatured };
}

// Batch featured: flip each selected project's flag. When turning projects on
// would exceed the cap, feature as many as fit (in selection order) and report
// the remainder so the caller can surface a featured-limit message.
export function batchFeatured(slugs, { record = true } = {}) {
  const list = slugs.filter((s) => projects.value.some((p) => p.slug === s));
  if (list.length === 0) return { ok: false, message: 'Select at least one project first.' };
  const turningOn = list.filter((s) => !projects.value.find((p) => p.slug === s).featured);
  const headroom = FEATURED_CAP - projects.value.filter((p) => p.featured).length;
  let overflow = 0;
  if (turningOn.length > headroom) overflow = turningOn.length - Math.max(headroom, 0);
  const allowedOn = new Set(turningOn.slice(0, Math.max(headroom, 0)));
  const run = () => {
    projects.value = projects.value.map((p) => {
      if (!list.includes(p.slug)) return p;
      if (p.featured) return { ...p, featured: false }; // toggling off always allowed
      return { ...p, featured: allowedOn.has(p.slug) };
    });
  };
  if (record) mutate(run); else run();
  return {
    ok: true,
    overflow,
    message: overflow > 0
      ? `Featured limit reached: at most ${FEATURED_CAP} projects may be featured. ${overflow} selected project(s) stayed unfeatured.`
      : '',
  };
}

export function batchDelete(slugs, { record = true } = {}) {
  const list = slugs.filter((s) => projects.value.some((p) => p.slug === s));
  if (list.length === 0) return { ok: false, message: 'Select at least one project first.' };
  const set = new Set(list);
  const run = () => {
    projects.value = projects.value.filter((p) => !set.has(p.slug));
    selected.value = selected.value.filter((s) => !set.has(s));
    profiles.value = profiles.value.map((profile) => ({
      ...profile,
      featuredSlugs: profile.featuredSlugs.filter((featuredSlug) => !set.has(featuredSlug)),
    }));
  };
  if (record) mutate(run); else run();
  return { ok: true, count: list.length };
}

export function saveIdentity(data, { record = true } = {}) {
  const { ok, value, errors } = validateIdentity(data);
  if (!ok) return { ok: false, errors };
  const run = () => { identity.value = { ...value }; };
  if (record) mutate(run); else run();
  return { ok: true, value };
}

export function saveSkills(rows, { record = true } = {}) {
  const errors = {};
  const seen = new Set();
  const cleaned = rows.map((row, idx) => {
    const { ok, value, message } = validateSkill(row);
    if (!ok) { errors[idx] = message; return null; }
    const key = value.name.toLowerCase();
    if (seen.has(key)) { errors[idx] = 'Skill name must be unique among your skills.'; return null; }
    seen.add(key);
    return value;
  });
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const run = () => { skills.value = cleaned.map((s) => ({ ...s })); };
  if (record) mutate(run); else run();
  return { ok: true };
}

const ProfileSchemaLocal = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Profile name is required. Give this shell profile a name.'), v.maxLength(40, 'Profile name must be at most 40 characters.')),
  theme: v.picklist(THEMES, 'Theme must be one of dark, light, retro, glass.'),
  featuredSlugs: v.pipe(v.array(v.string()), v.maxLength(3, 'A profile may pin at most 3 featured projects.')),
});

export function validateProfile(data) {
  const result = v.safeParse(ProfileSchemaLocal, data);
  if (result.success) {
    const missing = result.output.featuredSlugs.find(
      (s) => !projects.value.some((p) => p.slug === s),
    );
    if (missing) return { ok: false, errors: { featuredSlugs: `Cannot pin unknown project slug "${missing}".` } };
    return { ok: true, value: result.output };
  }
  const errors = {};
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

export function saveProfile(data, { record = true } = {}) {
  const { ok, value, errors } = validateProfile(data);
  if (!ok) return { ok: false, errors };
  if (profiles.value.some((p) => p.name.toLowerCase() === value.name.toLowerCase())) {
    return { ok: false, errors: { name: 'A profile with this name already exists. Choose a unique name.' } };
  }
  const profile = { ...value };
  const run = () => { profiles.value = [...profiles.value, profile]; };
  if (record) mutate(run); else run();
  return { ok: true, value: profile };
}

// Applying a profile restores its theme + featured pins. Theme is a view
// preference (not undo-tracked) but the featured-pin change is structural.
export function applyProfile(name) {
  const profile = profiles.value.find((p) => p.name === name);
  if (!profile) return { ok: false, message: `No saved profile named "${name}".` };
  const slugs = new Set(profile.featuredSlugs);
  const run = () => {
    projects.value = projects.value.map((p) => ({ ...p, featured: slugs.has(p.slug) }));
  };
  mutate(run);
  theme.value = profile.theme;
  return { ok: true };
}

// Import a fully-validated PortfolioDocument. Structural: snapshot before
// replacing the four undo-tracked collections; theme + consent are view prefs.
export function applyImportedDocument(doc) {
  const snapProjects = clone(doc.projects);
  const snapSkills = clone(doc.skills);
  const snapIdentity = clone(doc.identity);
  const snapProfiles = clone(doc.profiles);
  mutate(() => {
    projects.value = snapProjects;
    skills.value = snapSkills;
    identity.value = snapIdentity;
    profiles.value = snapProfiles;
  });
  theme.value = doc.theme;
  cookieConsent.value = doc.consent;
  selected.value = [];
  outputBuffer.value = [];
  return { ok: true };
}

// --- Output buffer helpers --------------------------------------------------
let _id = 0;
const nextId = () => `l${_id++}`;

// Append a single feedback line (actions, echoes, confirmations).
export function appendLine(line) {
  outputBuffer.value = [...outputBuffer.value, { id: nextId(), ...line }];
}

// Render a "view" block: any prior block with the same view id is replaced so
// list views (/work, /skills, ...) never accumulate stale duplicates in the
// DOM (which would break count-delta measurements), while unrelated echoes and
// other views stay as scrollback history.
export function showView(viewId, lines) {
  const stamped = lines.map((l) => ({ id: nextId(), view: viewId, ...l }));
  outputBuffer.value = [
    ...outputBuffer.value.filter((l) => l.view !== viewId),
    ...stamped,
  ];
}

export function clearOutput() {
  outputBuffer.value = [];
}
