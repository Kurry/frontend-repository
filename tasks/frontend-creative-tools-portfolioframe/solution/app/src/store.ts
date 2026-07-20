import type {
  ContentState,
  PortfolioState,
  SectionKey,
  SectionVisibility,
  ThemeName,
  DensityMode,
  DraftEntry,
  HistorySnapshot,
  HistoryBranch,
  Project,
  Skill,
  Testimonial,
  ContactLink,
} from './types';
import { generateId, deepClone, SECTION_LABELS } from './types';

export function createDefaultContent(): ContentState {
  return {
    profile: { name: '', title: '', bio: '' },
    projects: [],
    skills: [],
    testimonials: [],
    contact: { email: '', location: '', links: [] },
  };
}

export function createDefaultState(): PortfolioState {
  return {
    content: createDefaultContent(),
    sectionOrder: ['header', 'projects', 'skills', 'testimonials', 'contact'],
    sectionVisibility: {
      header: true,
      projects: true,
      skills: true,
      testimonials: true,
      contact: true,
    },
    theme: 'sunrise',
    density: 'spacious',
    drafts: [],
    selectedProjects: [],
  };
}

const STORAGE_KEY = 'portfolioframe_state';

export function loadState(): PortfolioState {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PortfolioState;
        // Validate structure
        if (parsed && parsed.content && parsed.sectionOrder) {
          return parsed;
        }
      }
    }
  } catch {
    // Ignore parse errors — start fresh
  }
  return createDefaultState();
}

export function saveState(state: PortfolioState): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage errors
  }
}

// ---- History (explicit transitions with preserved branches) -----------------

export interface HistoryManager {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  currentState: HistorySnapshot;
  branches: HistoryBranch[];
}

/** Snapshot every user-visible facet: content plus layout. */
export function snapshotOf(state: PortfolioState, label: string): HistorySnapshot {
  return {
    content: deepClone(state.content),
    sectionOrder: deepClone(state.sectionOrder),
    sectionVisibility: deepClone(state.sectionVisibility),
    theme: state.theme,
    density: state.density,
    timestamp: Date.now(),
    label,
  };
}

export function createHistoryManager(state: PortfolioState): HistoryManager {
  return {
    past: [],
    future: [],
    currentState: snapshotOf(state, 'Initial state'),
    branches: [],
  };
}

function applySnapshot(state: PortfolioState, snap: HistorySnapshot): void {
  state.content = deepClone(snap.content);
  state.sectionOrder = deepClone(snap.sectionOrder);
  state.sectionVisibility = deepClone(snap.sectionVisibility);
  state.theme = snap.theme;
  state.density = snap.density;
  state.selectedProjects = [];
  saveState(state);
}

/**
 * Record an explicit transition. The previous visible state goes to the past;
 * if there is a pending redo timeline (the user undid and then made a new
 * change), that abandoned timeline is preserved as a selectable branch rather
 * than being discarded.
 */
export function pushHistory(history: HistoryManager, state: PortfolioState, label: string): void {
  if (history.future.length > 0) {
    const tip = history.future[history.future.length - 1];
    history.branches.push({
      id: generateId(),
      label: `Branch: ${tip.label}`,
      createdAt: Date.now(),
      chain: deepClone(history.future),
    });
    history.future = [];
  }
  history.past.push(deepClone(history.currentState));
  history.currentState = snapshotOf(state, label);
  // Cap history at 50 entries to prevent memory growth
  if (history.past.length > 50) {
    history.past = history.past.slice(-50);
  }
  if (history.branches.length > 12) {
    history.branches = history.branches.slice(-12);
  }
}

/**
 * Update the current snapshot in place for layout-only changes (theme,
 * density, section visibility, section order). These are not Undo steps on
 * their own, but the snapshot always mirrors the live visible state so the
 * next Undo restores the exact prior layout.
 */
export function syncCurrent(history: HistoryManager, state: PortfolioState, label: string): void {
  history.currentState = snapshotOf(state, label);
}

export function undo(history: HistoryManager, state: PortfolioState): HistorySnapshot | null {
  if (history.past.length === 0) return null;
  const prev = history.past.pop()!;
  history.future.unshift(deepClone(history.currentState));
  history.currentState = deepClone(prev);
  applySnapshot(state, history.currentState);
  return history.currentState;
}

export function redo(history: HistoryManager, state: PortfolioState): HistorySnapshot | null {
  if (history.future.length === 0) return null;
  const next = history.future.shift()!;
  history.past.push(deepClone(history.currentState));
  history.currentState = deepClone(next);
  applySnapshot(state, history.currentState);
  return history.currentState;
}

export function canUndo(history: HistoryManager): boolean {
  return history.past.length > 0;
}

export function canRedo(history: HistoryManager): boolean {
  return history.future.length > 0;
}

/**
 * Restore an abandoned branch: the branch's timeline becomes the redo stack
 * and we walk to its tip, so the visible state matches the branch exactly and
 * every step along the way stays reachable via Undo.
 */
export function selectBranch(
  history: HistoryManager,
  state: PortfolioState,
  branchId: string
): HistorySnapshot | null {
  const idx = history.branches.findIndex((b) => b.id === branchId);
  if (idx < 0) return null;
  const branch = history.branches[idx];
  history.branches.splice(idx, 1);
  history.future = deepClone(branch.chain);
  let last: HistorySnapshot | null = null;
  while (history.future.length > 0) {
    last = redo(history, state);
  }
  return last ?? history.currentState;
}

export function jumpToPastSnapshot(
  history: HistoryManager,
  state: PortfolioState,
  index: number
): void {
  if (index < 0 || index >= history.past.length) return;
  const selected = history.past[index];
  history.future = [
    deepClone(history.currentState),
    ...history.past.slice(index + 1).map(deepClone),
    ...history.future.map(deepClone),
  ];
  history.past = history.past.slice(0, index).map(deepClone);
  history.currentState = deepClone(selected);
  applySnapshot(state, history.currentState);
}

export function jumpToFutureSnapshot(
  history: HistoryManager,
  state: PortfolioState,
  index: number
): void {
  if (index < 0 || index >= history.future.length) return;
  const selected = history.future[index];
  history.past = [
    ...history.past.map(deepClone),
    deepClone(history.currentState),
    ...history.future.slice(0, index).map(deepClone),
  ];
  history.future = history.future.slice(index + 1).map(deepClone);
  history.currentState = deepClone(selected);
  applySnapshot(state, history.currentState);
}

export function resetState(state: PortfolioState, history: HistoryManager): void {
  const defaults = createDefaultState();
  state.content = defaults.content;
  state.sectionOrder = defaults.sectionOrder;
  state.sectionVisibility = defaults.sectionVisibility;
  state.theme = defaults.theme;
  state.density = defaults.density;
  state.selectedProjects = [];
  history.past = [];
  history.future = [];
  history.branches = [];
  history.currentState = snapshotOf(state, 'Initial state');
  saveState(state);
}

// ---- Content Operations ------------------------------------------------------

export function submitProject(
  state: PortfolioState,
  history: HistoryManager,
  fields: Pick<Project, 'title' | 'description' | 'category' | 'linkLabel' | 'linkUrl' | 'status' | 'featured'>
): Project {
  const project: Project = {
    id: generateId(),
    title: fields.title.trim(),
    description: fields.description.trim(),
    category: fields.category.trim(),
    linkLabel: fields.linkLabel.trim(),
    linkUrl: fields.linkUrl.trim(),
    status: fields.status,
    featured: fields.featured,
  };

  if (project.featured) {
    state.content.projects.forEach((p) => (p.featured = false));
  }

  state.content.projects.push(project);
  pushHistory(history, state, `Add project: ${project.title || 'Untitled'}`);
  saveState(state);
  return project;
}

export function updateProject(
  state: PortfolioState,
  history: HistoryManager,
  projectId: string,
  field: keyof Project,
  value: string | boolean
): void {
  const project = state.content.projects.find((p) => p.id === projectId);
  if (project) {
    if (field === 'featured' && value === true) {
      state.content.projects.forEach((p) => (p.featured = false));
    }
    (project[field] as string | boolean) = value;
    pushHistory(history, state, `Edit project ${String(field)}`);
    saveState(state);
  }
}

export function deleteProject(
  state: PortfolioState,
  history: HistoryManager,
  projectId: string
): void {
  state.content.projects = state.content.projects.filter((p) => p.id !== projectId);
  state.selectedProjects = state.selectedProjects.filter((id) => id !== projectId);
  pushHistory(history, state, 'Delete project');
  saveState(state);
}

export function toggleProjectSelection(state: PortfolioState, projectId: string): void {
  if (state.selectedProjects.includes(projectId)) {
    state.selectedProjects = state.selectedProjects.filter((id) => id !== projectId);
  } else {
    state.selectedProjects.push(projectId);
  }
}

export function deleteSelectedProjects(state: PortfolioState, history: HistoryManager): void {
  const toDelete = [...state.selectedProjects];
  if (toDelete.length === 0) return;
  state.content.projects = state.content.projects.filter((p) => !toDelete.includes(p.id));
  state.selectedProjects = [];
  pushHistory(history, state, `Delete ${toDelete.length} selected project${toDelete.length === 1 ? '' : 's'}`);
  saveState(state);
}

export function addSkill(
  state: PortfolioState,
  history: HistoryManager,
  label: string
): { success: boolean; error: string } {
  const trimmed = label.trim();
  if (!trimmed) return { success: false, error: 'Skill name is required — type a skill (1–40 characters) and press Enter.' };
  if (trimmed.length > 40) return { success: false, error: `Skill "${trimmed.slice(0, 20)}…" is ${trimmed.length} characters — skills are 40 characters or fewer.` };
  const exists = state.content.skills.some(
    (s) => s.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    const existing = state.content.skills.find((s) => s.label.toLowerCase() === trimmed.toLowerCase());
    return { success: false, error: `"${trimmed}" duplicates the existing skill "${existing?.label}" (duplicates are ignored, case-insensitive).` };
  }

  state.content.skills.push({ id: generateId(), label: trimmed });
  pushHistory(history, state, `Add skill: ${trimmed}`);
  saveState(state);
  return { success: true, error: '' };
}

export function deleteSkill(state: PortfolioState, history: HistoryManager, skillId: string): void {
  state.content.skills = state.content.skills.filter((s) => s.id !== skillId);
  pushHistory(history, state, 'Delete skill');
  saveState(state);
}

export function submitTestimonial(
  state: PortfolioState,
  history: HistoryManager,
  fields: Pick<Testimonial, 'quote' | 'name' | 'role'>
): Testimonial {
  const testimonial: Testimonial = {
    id: generateId(),
    quote: fields.quote.trim(),
    name: fields.name.trim(),
    role: fields.role.trim(),
  };
  state.content.testimonials.push(testimonial);
  pushHistory(history, state, `Add testimonial: ${testimonial.name || 'Untitled'}`);
  saveState(state);
  return testimonial;
}

export function updateTestimonial(
  state: PortfolioState,
  history: HistoryManager,
  id: string,
  field: keyof Testimonial,
  value: string
): void {
  const t = state.content.testimonials.find((item) => item.id === id);
  if (t) {
    (t[field] as string) = value;
    pushHistory(history, state, `Edit testimonial ${String(field)}`);
    saveState(state);
  }
}

export function deleteTestimonial(
  state: PortfolioState,
  history: HistoryManager,
  id: string
): void {
  state.content.testimonials = state.content.testimonials.filter((t) => t.id !== id);
  pushHistory(history, state, 'Delete testimonial');
  saveState(state);
}

export function updateProfile(
  state: PortfolioState,
  history: HistoryManager,
  field: keyof ContentState['profile'],
  value: string
): void {
  state.content.profile[field] = value;
  pushHistory(history, state, `Edit profile ${String(field)}`);
  saveState(state);
}

export function updateContact(
  state: PortfolioState,
  history: HistoryManager,
  field: 'email' | 'location',
  value: string
): void {
  state.content.contact[field] = value;
  pushHistory(history, state, `Edit contact ${String(field)}`);
  saveState(state);
}

export function addContactLink(
  state: PortfolioState,
  history: HistoryManager
): ContactLink | null {
  if (state.content.contact.links.length >= 3) return null;
  const link: ContactLink = { id: generateId(), label: '', url: '' };
  state.content.contact.links.push(link);
  pushHistory(history, state, 'Add contact link');
  saveState(state);
  return link;
}

export function updateContactLink(
  state: PortfolioState,
  history: HistoryManager,
  id: string,
  field: 'label' | 'url',
  value: string
): void {
  const link = state.content.contact.links.find((l) => l.id === id);
  if (link) {
    link[field] = value;
    pushHistory(history, state, `Edit contact link ${String(field)}`);
    saveState(state);
  }
}

export function deleteContactLink(
  state: PortfolioState,
  history: HistoryManager,
  id: string
): void {
  state.content.contact.links = state.content.contact.links.filter((l) => l.id !== id);
  pushHistory(history, state, 'Delete contact link');
  saveState(state);
}

// ---- Section / Theme / Density (layout-only; not Undo steps by themselves) ---

export function toggleSectionVisibility(state: PortfolioState, history: HistoryManager, section: SectionKey): void {
  state.sectionVisibility[section] = !state.sectionVisibility[section];
  syncCurrent(history, state, `Section visibility: ${SECTION_LABELS[section]} ${state.sectionVisibility[section] ? 'shown' : 'hidden'}`);
  saveState(state);
}

export function moveSectionUp(state: PortfolioState, history: HistoryManager, section: SectionKey): void {
  const idx = state.sectionOrder.indexOf(section);
  if (idx > 0) {
    const temp = state.sectionOrder[idx];
    state.sectionOrder[idx] = state.sectionOrder[idx - 1];
    state.sectionOrder[idx - 1] = temp;
    syncCurrent(history, state, `Move ${SECTION_LABELS[section]} up`);
    saveState(state);
  }
}

export function moveSectionDown(state: PortfolioState, history: HistoryManager, section: SectionKey): void {
  const idx = state.sectionOrder.indexOf(section);
  if (idx < state.sectionOrder.length - 1) {
    const temp = state.sectionOrder[idx];
    state.sectionOrder[idx] = state.sectionOrder[idx + 1];
    state.sectionOrder[idx + 1] = temp;
    syncCurrent(history, state, `Move ${SECTION_LABELS[section]} down`);
    saveState(state);
  }
}

export function setTheme(state: PortfolioState, history: HistoryManager, theme: ThemeName): void {
  state.theme = theme;
  syncCurrent(history, state, `Theme: ${theme}`);
  saveState(state);
}

export function setDensity(state: PortfolioState, history: HistoryManager, density: DensityMode): void {
  state.density = density;
  syncCurrent(history, state, `Density: ${density}`);
  saveState(state);
}

// ---- Layout presets ------------------------------------------------------------

export type LayoutPresetName = 'classic' | 'compact-stack' | 'spotlight';

export interface LayoutPreset {
  id: LayoutPresetName;
  label: string;
  description: string;
  sectionOrder: SectionKey[];
  sectionVisibility: SectionVisibility;
  theme: ThemeName;
  density: DensityMode;
}

const allVisible: SectionVisibility = {
  header: true,
  projects: true,
  skills: true,
  testimonials: true,
  contact: true,
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Canonical resume order, Sunrise theme, Spacious spacing.',
    sectionOrder: ['header', 'projects', 'skills', 'testimonials', 'contact'],
    sectionVisibility: { ...allVisible },
    theme: 'sunrise',
    density: 'spacious',
  },
  {
    id: 'compact-stack',
    label: 'Compact stack',
    description: 'Skills-first stack, Slate theme, Compact spacing, testimonials hidden.',
    sectionOrder: ['header', 'skills', 'projects', 'testimonials', 'contact'],
    sectionVisibility: { ...allVisible, testimonials: false },
    theme: 'slate',
    density: 'compact',
  },
  {
    id: 'spotlight',
    label: 'Spotlight',
    description: 'Projects-first with testimonials, Blossom theme, Compact spacing, skills hidden.',
    sectionOrder: ['header', 'projects', 'testimonials', 'skills', 'contact'],
    sectionVisibility: { ...allVisible, skills: false },
    theme: 'blossom',
    density: 'compact',
  },
];

/** Apply a preset as one packed, undoable transition. */
export function applyLayoutPreset(state: PortfolioState, history: HistoryManager, presetId: LayoutPresetName): LayoutPreset | null {
  const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  state.sectionOrder = [...preset.sectionOrder];
  state.sectionVisibility = { ...preset.sectionVisibility };
  state.theme = preset.theme;
  state.density = preset.density;
  state.selectedProjects = [];
  pushHistory(history, state, `Apply layout preset: ${preset.label}`);
  saveState(state);
  return preset;
}

// ---- Draft Operations ----------------------------------------------------------

export function validateDraftName(name: string, drafts: DraftEntry[]): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Draft name is required — enter a name to save this draft under.';
  if (trimmed.length > 60) return `Draft name is ${trimmed.length} characters — use 60 characters or fewer.`;
  const dup = drafts.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
  if (dup) return `A draft named "${dup.name}" already exists — draft names must be unique (case-insensitive).`;
  return '';
}

export function saveDraft(state: PortfolioState, name: string): DraftEntry {
  const trimmedName = name.trim();
  const draft: DraftEntry = {
    name: trimmedName,
    timestamp: Date.now(),
    content: deepClone(state.content),
    sectionOrder: deepClone(state.sectionOrder),
    sectionVisibility: deepClone(state.sectionVisibility),
    theme: state.theme,
    density: state.density,
  };
  // Replace an existing draft with the same name (case-insensitive)
  const existing = state.drafts.findIndex((d) => d.name.toLowerCase() === trimmedName.toLowerCase());
  if (existing >= 0) {
    state.drafts[existing] = draft;
  } else {
    state.drafts.push(draft);
  }
  saveState(state);
  return draft;
}

export function loadDraft(state: PortfolioState, history: HistoryManager, name: string): void {
  const draft = state.drafts.find((d) => d.name === name);
  if (draft) {
    state.content = deepClone(draft.content);
    state.sectionOrder = deepClone(draft.sectionOrder);
    state.sectionVisibility = deepClone(draft.sectionVisibility);
    state.theme = draft.theme;
    state.density = draft.density;
    state.selectedProjects = [];
    pushHistory(history, state, `Load draft: ${name}`);
    saveState(state);
  }
}

export function deleteDraft(state: PortfolioState, name: string): void {
  state.drafts = state.drafts.filter((d) => d.name !== name);
  saveState(state);
}

// ---- Completeness Checklist ------------------------------------------------------

export interface ChecklistItem {
  label: string;
  complete: boolean;
}

export function getChecklist(state: PortfolioState): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const p = state.content.profile;
  items.push({ label: 'Profile name', complete: p.name.trim().length > 0 });
  items.push({ label: 'Profile title/tagline', complete: p.title.trim().length > 0 });
  items.push({ label: 'Profile bio', complete: p.bio.trim().length > 0 });
  items.push({ label: 'At least 1 project', complete: state.content.projects.length > 0 });
  items.push({ label: 'At least 1 skill', complete: state.content.skills.length > 0 });
  items.push({ label: 'At least 1 testimonial', complete: state.content.testimonials.length > 0 });
  items.push({ label: 'Contact email', complete: state.content.contact.email.trim().length > 0 });
  items.push({ label: 'Contact location', complete: state.content.contact.location.trim().length > 0 });
  return items;
}

export function completenessCount(state: PortfolioState): { done: number; total: number } {
  const items = getChecklist(state);
  const done = items.filter((i) => i.complete).length;
  return { done, total: items.length };
}

// ---- Export package (Portfolio JSON field contract) -------------------------------

export const SCHEMA_VERSION = 'portfolioframe-v1';
export const THEMES: ThemeName[] = ['sunrise', 'slate', 'forest', 'blossom'];
export const DENSITIES: DensityMode[] = ['compact', 'spacious'];
export const SECTION_IDS = ['profile', 'projects', 'skills', 'testimonials', 'contact'] as const;
export type ExportSectionId = (typeof SECTION_IDS)[number];

function sectionIdToKey(id: ExportSectionId): SectionKey {
  return id === 'profile' ? 'header' : id;
}
function sectionKeyToId(key: SectionKey): ExportSectionId {
  return key === 'header' ? 'profile' : key;
}

export function generatePortfolioJSON(state: PortfolioState): string {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: state.content.profile.name,
      title: state.content.profile.title,
      bio: state.content.profile.bio,
    },
    projects: state.content.projects.map((p) => {
      const out: Record<string, unknown> = {
        title: p.title,
        description: p.description,
        categoryTag: p.category,
        linkLabel: p.linkLabel,
        status: p.status,
        featured: p.featured,
      };
      if (p.linkUrl) out.linkUrl = p.linkUrl;
      return out;
    }),
    skills: state.content.skills.map((s) => s.label),
    testimonials: state.content.testimonials.map((t) => ({
      quote: t.quote,
      name: t.name,
      role: t.role,
    })),
    contact: {
      email: state.content.contact.email,
      location: state.content.contact.location,
      links: state.content.contact.links.map((l) => ({ label: l.label, href: l.url })),
    },
    sections: state.sectionOrder.map((key) => ({
      id: sectionKeyToId(key),
      visible: state.sectionVisibility[key],
    })),
    theme: state.theme,
    density: state.density,
  };
  return JSON.stringify(data, null, 2);
}

export function generateMarkdownResume(state: PortfolioState): string {
  const p = state.content.profile;
  let md = `# ${p.name || 'Untitled'}\n`;
  if (p.title) md += `**${p.title}**\n\n`;
  if (p.bio) md += `${p.bio}\n\n`;

  const c = state.content.contact;
  if (c.email || c.location || c.links.length > 0) {
    md += `## Contact\n`;
    if (c.email) md += `- Email: ${c.email}\n`;
    if (c.location) md += `- Location: ${c.location}\n`;
    c.links.forEach((l) => {
      if (l.label || l.url) md += `- [${l.label || 'Link'}](${l.url || '#'})\n`;
    });
    md += '\n';
  }

  if (state.content.projects.length > 0) {
    md += `## Projects\n`;
    state.content.projects.forEach((proj) => {
      md += `### ${proj.title || 'Untitled project'}\n`;
      md += `*${proj.category || 'Uncategorized'}* | Status: ${proj.status}${proj.featured ? ' | Featured' : ''}\n\n`;
      if (proj.description) md += `${proj.description}\n\n`;
      if (proj.linkLabel && proj.linkUrl) md += `[${proj.linkLabel}](${proj.linkUrl})\n\n`;
    });
  }

  if (state.content.skills.length > 0) {
    md += `## Skills\n`;
    md += state.content.skills.map((s) => s.label).join(', ') + '\n\n';
  }

  if (state.content.testimonials.length > 0) {
    md += `## Testimonials\n`;
    state.content.testimonials.forEach((t) => {
      md += `> "${t.quote}"\n> — **${t.name}**, ${t.role}\n\n`;
    });
  }

  return md.trim();
}

export function importPortfolioJSON(
  state: PortfolioState,
  history: HistoryManager,
  jsonString: string
): { success: boolean; error?: string } {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(jsonString);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Import rejected: the package is not decodable JSON (${msg}). Paste a Portfolio JSON export.` };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { success: false, error: 'Import rejected: the package must be a JSON object matching the Portfolio JSON field contract.' };
  }

  if (data.schemaVersion !== SCHEMA_VERSION) {
    return {
      success: false,
      error: `Import rejected: schemaVersion must be exactly "${SCHEMA_VERSION}" (got ${JSON.stringify(data.schemaVersion ?? null)}).`,
    };
  }

  for (const key of ['profile', 'projects', 'skills', 'testimonials', 'contact', 'sections', 'theme', 'density']) {
    if (!(key in data)) {
      return { success: false, error: `Import rejected: missing required top-level key "${key}".` };
    }
  }

  if (!THEMES.includes(data.theme as ThemeName)) {
    return { success: false, error: `Import rejected: theme must be one of ${THEMES.join(', ')} (got ${JSON.stringify(data.theme)}).` };
  }
  if (!DENSITIES.includes(data.density as DensityMode)) {
    return { success: false, error: `Import rejected: density must be one of ${DENSITIES.join(', ')} (got ${JSON.stringify(data.density)}).` };
  }

  if (!Array.isArray(data.projects)) {
    return { success: false, error: 'Import rejected: "projects" must be an array of project objects.' };
  }
  for (let i = 0; i < (data.projects as unknown[]).length; i++) {
    const proj = (data.projects as Record<string, unknown>[])[i];
    if (!proj || typeof proj !== 'object') {
      return { success: false, error: `Import rejected: projects[${i}] must be an object.` };
    }
    if (!['shipped', 'wip', 'concept'].includes(String(proj.status))) {
      return {
        success: false,
        error: `Import rejected: projects[${i}].status must be one of shipped, wip, concept (got ${JSON.stringify(proj.status)}).`,
      };
    }
  }
  const featuredCount = (data.projects as Record<string, unknown>[]).filter((p) => p && p.featured === true).length;
  if (featuredCount > 1) {
    return { success: false, error: `Import rejected: at most one project may have featured true (found ${featuredCount}).` };
  }

  if (!Array.isArray(data.skills)) {
    return { success: false, error: 'Import rejected: "skills" must be an array of strings.' };
  }
  for (let i = 0; i < (data.skills as unknown[]).length; i++) {
    const s = (data.skills as unknown[])[i];
    if (typeof s !== 'string' || s.trim().length === 0 || s.trim().length > 40) {
      return { success: false, error: `Import rejected: skills[${i}] must be a string of 1–40 characters.` };
    }
  }

  if (!Array.isArray(data.testimonials)) {
    return { success: false, error: 'Import rejected: "testimonials" must be an array of testimonial objects.' };
  }

  if (!Array.isArray(data.sections)) {
    return { success: false, error: 'Import rejected: "sections" must be an array of {id, visible} objects.' };
  }
  const seen = new Set<string>();
  for (const s of data.sections as Record<string, unknown>[]) {
    const id = String(s?.id ?? '');
    if (!(SECTION_IDS as readonly string[]).includes(id)) {
      return {
        success: false,
        error: `Import rejected: sections[].id must be one of ${SECTION_IDS.join(', ')} (got ${JSON.stringify(s?.id ?? null)}).`,
      };
    }
    if (typeof s?.visible !== 'boolean') {
      return { success: false, error: `Import rejected: sections entry "${id}" must have a boolean "visible".` };
    }
    if (seen.has(id)) {
      return { success: false, error: `Import rejected: section "${id}" is listed more than once.` };
    }
    seen.add(id);
  }
  if (seen.size !== SECTION_IDS.length) {
    return { success: false, error: 'Import rejected: sections must list every section (profile, projects, skills, testimonials, contact) exactly once.' };
  }

  const profile = (data.profile ?? {}) as Record<string, unknown>;
  const contact = (data.contact ?? {}) as Record<string, unknown>;

  // All validation passed — commit the imported state as one undoable transition.
  state.content = {
    profile: {
      name: String(profile.name ?? ''),
      title: String(profile.title ?? ''),
      bio: String(profile.bio ?? ''),
    },
    projects: (data.projects as Record<string, unknown>[]).map((p) => ({
      id: generateId(),
      title: String(p.title ?? ''),
      description: String(p.description ?? ''),
      category: String(p.categoryTag ?? p.category ?? ''),
      linkLabel: String(p.linkLabel ?? ''),
      linkUrl: String(p.linkUrl ?? p.href ?? ''),
      status: String(p.status) as Project['status'],
      featured: p.featured === true,
    })),
    skills: (data.skills as string[]).map((s) => ({ id: generateId(), label: s })),
    testimonials: (data.testimonials as Record<string, unknown>[]).map((t) => ({
      id: generateId(),
      quote: String(t?.quote ?? ''),
      name: String(t?.name ?? ''),
      role: String(t?.role ?? ''),
    })),
    contact: {
      email: String(contact.email ?? ''),
      location: String(contact.location ?? ''),
      links: Array.isArray(contact.links)
        ? (contact.links as Record<string, unknown>[]).slice(0, 3).map((l) => ({
            id: generateId(),
            label: String(l?.label ?? ''),
            url: String(l?.href ?? l?.url ?? ''),
          }))
        : [],
    },
  };

  state.sectionOrder = (data.sections as Record<string, unknown>[]).map((s) => sectionIdToKey(s.id as ExportSectionId));
  const visibility: SectionVisibility = { header: true, projects: true, skills: true, testimonials: true, contact: true };
  for (const s of data.sections as Record<string, unknown>[]) {
    visibility[sectionIdToKey(s.id as ExportSectionId)] = s.visible === true;
  }
  state.sectionVisibility = visibility;
  state.theme = data.theme as ThemeName;
  state.density = data.density as DensityMode;
  state.selectedProjects = [];

  pushHistory(history, state, 'Import Portfolio JSON');
  saveState(state);

  return { success: true };
}

export { SECTION_LABELS, generateId };
