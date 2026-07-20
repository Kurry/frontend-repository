import type {
  ContentState,
  PortfolioState,
  SectionKey,
  ThemeName,
  DensityMode,
  DraftEntry,
  HistorySnapshot,
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
    // Ignore parse errors
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

export function createSnapshot(content: ContentState, label: string): HistorySnapshot {
  return {
    content: deepClone(content),
    timestamp: Date.now(),
    label,
  };
}

// ---- Undo/Redo State ----
export interface HistoryManager {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  currentState: HistorySnapshot;
}

export function createHistoryManager(initialContent: ContentState): HistoryManager {
  return {
    past: [],
    future: [],
    currentState: createSnapshot(initialContent, 'Initial state'),
  };
}

export function pushHistory(history: HistoryManager, content: ContentState, label: string): void {
  // Push current state to past, clear future (new branch)
  history.past.push(deepClone(history.currentState));
  history.currentState = createSnapshot(content, label);
  history.future = [];
  // Cap history at 50 entries to prevent memory growth
  if (history.past.length > 50) {
    history.past = history.past.slice(-50);
  }
}

export function undo(history: HistoryManager): HistorySnapshot | null {
  if (history.past.length === 0) return null;
  const prev = history.past.pop()!;
  history.future.unshift(deepClone(history.currentState));
  history.currentState = deepClone(prev);
  return history.currentState;
}

export function redo(history: HistoryManager): HistorySnapshot | null {
  if (history.future.length === 0) return null;
  const next = history.future.shift()!;
  history.past.push(deepClone(history.currentState));
  history.currentState = deepClone(next);
  return history.currentState;
}

export function canUndo(history: HistoryManager): boolean {
  return history.past.length > 0;
}

export function canRedo(history: HistoryManager): boolean {
  return history.future.length > 0;
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
  state.content = deepClone(selected.content);
  saveState(state);
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
  state.content = deepClone(selected.content);
  saveState(state);
}

export function resetState(state: PortfolioState, history: HistoryManager): void {
  const defaults = createDefaultState();
  state.content = defaults.content;
  state.sectionOrder = defaults.sectionOrder;
  state.sectionVisibility = defaults.sectionVisibility;
  state.theme = defaults.theme;
  state.density = defaults.density;
  history.past = [];
  history.future = [];
  history.currentState = createSnapshot(state.content, 'Initial state');
  saveState(state);
}

// ---- Content Operations ----
export function addProject(state: PortfolioState, history: HistoryManager): Project {
  const project: Project = {
    id: generateId(),
    title: '',
    description: '',
    category: '',
    linkLabel: '',
    linkUrl: '',
    status: 'wip',
    featured: false,
  };
  state.content.projects.push(project);
  pushHistory(history, state.content, `Add project`);
  saveState(state);
  return project;
}

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
      state.content.projects.forEach(p => p.featured = false);
  }
  
  state.content.projects.push(project);
  pushHistory(history, state.content, `Add project: ${project.title || 'Untitled'}`);
  saveState(state);
  return project;
}

export function updateProject(
  state: PortfolioState,
  history: HistoryManager,
  projectId: string,
  field: keyof Project,
  value: any
): void {
  const project = state.content.projects.find((p) => p.id === projectId);
  if (project) {
    if (field === 'featured' && value === true) {
       state.content.projects.forEach(p => p.featured = false);
    }
    (project[field] as any) = value;
    pushHistory(history, state.content, `Edit project ${field}`);
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
  pushHistory(history, state.content, 'Delete project');
  saveState(state);
}

export function toggleProjectSelection(state: PortfolioState, projectId: string): void {
  if (state.selectedProjects.includes(projectId)) {
    state.selectedProjects = state.selectedProjects.filter(id => id !== projectId);
  } else {
    state.selectedProjects.push(projectId);
  }
}

export function deleteSelectedProjects(state: PortfolioState, history: HistoryManager): void {
  const toDelete = state.selectedProjects;
  state.content.projects = state.content.projects.filter((p) => !toDelete.includes(p.id));
  state.selectedProjects = [];
  pushHistory(history, state.content, 'Delete selected projects');
  saveState(state);
}

export function addSkill(
  state: PortfolioState,
  history: HistoryManager,
  label: string
): { success: boolean; error: string } {
  const trimmed = label.trim();
  if (!trimmed) return { success: false, error: 'Skill name cannot be empty' };
  const exists = state.content.skills.some(
    (s) => s.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) return { success: false, error: `"${trimmed}" already exists` };

  state.content.skills.push({ id: generateId(), label: trimmed });
  pushHistory(history, state.content, `Add skill: ${trimmed}`);
  saveState(state);
  return { success: true, error: '' };
}

export function deleteSkill(state: PortfolioState, history: HistoryManager, skillId: string): void {
  state.content.skills = state.content.skills.filter((s) => s.id !== skillId);
  pushHistory(history, state.content, 'Delete skill');
  saveState(state);
}

export function addTestimonial(state: PortfolioState, history: HistoryManager): Testimonial {
  const testimonial: Testimonial = {
    id: generateId(),
    quote: '',
    name: '',
    role: '',
  };
  state.content.testimonials.push(testimonial);
  pushHistory(history, state.content, 'Add testimonial');
  saveState(state);
  return testimonial;
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
  pushHistory(history, state.content, `Add testimonial: ${testimonial.name || 'Untitled'}`);
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
  const t = state.content.testimonials.find((t) => t.id === id);
  if (t) {
    (t[field] as string) = value;
    pushHistory(history, state.content, `Edit testimonial ${field}`);
    saveState(state);
  }
}

export function deleteTestimonial(
  state: PortfolioState,
  history: HistoryManager,
  id: string
): void {
  state.content.testimonials = state.content.testimonials.filter((t) => t.id !== id);
  pushHistory(history, state.content, 'Delete testimonial');
  saveState(state);
}

export function updateProfile(
  state: PortfolioState,
  history: HistoryManager,
  field: keyof ContentState['profile'],
  value: string
): void {
  state.content.profile[field] = value;
  pushHistory(history, state.content, `Edit profile ${field}`);
  saveState(state);
}

export function updateContact(
  state: PortfolioState,
  history: HistoryManager,
  field: 'email' | 'location',
  value: string
): void {
  state.content.contact[field] = value;
  pushHistory(history, state.content, `Edit contact ${field}`);
  saveState(state);
}

export function addContactLink(
  state: PortfolioState,
  history: HistoryManager
): ContactLink | null {
  if (state.content.contact.links.length >= 3) return null;
  const link: ContactLink = { id: generateId(), label: '', url: '' };
  state.content.contact.links.push(link);
  pushHistory(history, state.content, 'Add contact link');
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
    pushHistory(history, state.content, `Edit contact link ${field}`);
    saveState(state);
  }
}

export function deleteContactLink(
  state: PortfolioState,
  history: HistoryManager,
  id: string
): void {
  state.content.contact.links = state.content.contact.links.filter((l) => l.id !== id);
  pushHistory(history, state.content, 'Delete contact link');
  saveState(state);
}

// ---- Section Operations ----
export function toggleSectionVisibility(state: PortfolioState, section: SectionKey): void {
  state.sectionVisibility[section] = !state.sectionVisibility[section];
  saveState(state);
}

export function moveSectionUp(state: PortfolioState, section: SectionKey): void {
  const idx = state.sectionOrder.indexOf(section);
  if (idx > 0) {
    const temp = state.sectionOrder[idx];
    state.sectionOrder[idx] = state.sectionOrder[idx - 1];
    state.sectionOrder[idx - 1] = temp;
    saveState(state);
  }
}

export function moveSectionDown(state: PortfolioState, section: SectionKey): void {
  const idx = state.sectionOrder.indexOf(section);
  if (idx < state.sectionOrder.length - 1) {
    const temp = state.sectionOrder[idx];
    state.sectionOrder[idx] = state.sectionOrder[idx + 1];
    state.sectionOrder[idx + 1] = temp;
    saveState(state);
  }
}

export function setTheme(state: PortfolioState, theme: ThemeName): void {
  state.theme = theme;
  saveState(state);
}

export function setDensity(state: PortfolioState, density: DensityMode): void {
  state.density = density;
  saveState(state);
}

// ---- Draft Operations ----
export function saveDraft(state: PortfolioState, name: string): void {
  const trimmedName = name.trim();
  if (!trimmedName) return;
  const draft: DraftEntry = {
    name: trimmedName,
    timestamp: Date.now(),
    content: deepClone(state.content),
    sectionOrder: deepClone(state.sectionOrder),
    sectionVisibility: deepClone(state.sectionVisibility),
    theme: state.theme,
    density: state.density,
  };
  // Replace existing draft with same name
  const existing = state.drafts.findIndex((d) => d.name === trimmedName);
  if (existing >= 0) {
    state.drafts[existing] = draft;
  } else {
    state.drafts.push(draft);
  }
  saveState(state);
}

export function loadDraft(state: PortfolioState, history: HistoryManager, name: string): void {
  const draft = state.drafts.find((d) => d.name === name);
  if (draft) {
    pushHistory(history, state.content, `Before loading draft: ${name}`);
    state.content = deepClone(draft.content);
    state.sectionOrder = deepClone(draft.sectionOrder);
    state.sectionVisibility = deepClone(draft.sectionVisibility);
    state.theme = draft.theme;
    state.density = draft.density;
    saveState(state);
  }
}

export function deleteDraft(state: PortfolioState, name: string): void {
  state.drafts = state.drafts.filter((d) => d.name !== name);
  saveState(state);
}

// ---- Completeness Checklist ----
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

export function generatePortfolioJSON(state: PortfolioState): string {
  const data = {
    schemaVersion: 'portfolioframe-v1',
    profile: state.content.profile,
    projects: state.content.projects.map(({ id, ...rest }) => rest),
    skills: state.content.skills.map(s => s.label),
    testimonials: state.content.testimonials.map(({ id, ...rest }) => rest),
    contact: {
      email: state.content.contact.email,
      location: state.content.contact.location,
      links: state.content.contact.links.map(({ id, ...rest }) => rest)
    },
    preferences: {
      sectionOrder: state.sectionOrder,
      sectionVisibility: state.sectionVisibility,
      theme: state.theme,
      density: state.density
    }
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
    c.links.forEach(l => {
      md += `- [${l.label}](${l.url})\n`;
    });
    md += '\n';
  }

  if (state.content.projects.length > 0) {
    md += `## Projects\n`;
    state.content.projects.forEach(proj => {
      md += `### ${proj.title}\n`;
      if (proj.category) md += `*${proj.category}* | Status: ${proj.status}${proj.featured ? ' | Featured' : ''}\n\n`;
      if (proj.description) md += `${proj.description}\n\n`;
      if (proj.linkLabel && proj.linkUrl) md += `[${proj.linkLabel}](${proj.linkUrl})\n\n`;
    });
  }

  if (state.content.skills.length > 0) {
    md += `## Skills\n`;
    md += state.content.skills.map(s => s.label).join(', ') + '\n\n';
  }

  if (state.content.testimonials.length > 0) {
    md += `## Testimonials\n`;
    state.content.testimonials.forEach(t => {
      md += `> "${t.quote}"\n> — **${t.name}**, ${t.role}\n\n`;
    });
  }

  return md.trim();
}

export function importPortfolioJSON(state: PortfolioState, history: HistoryManager, jsonString: string): { success: boolean, error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (data.schemaVersion !== 'portfolioframe-v1') {
      return { success: false, error: 'Invalid schemaVersion. Expected portfolioframe-v1' };
    }

    if (!data.profile || !data.projects || !data.skills || !data.testimonials || !data.contact || !data.preferences) {
        return { success: false, error: 'Missing required keys in JSON' };
    }
    
    // Status validation
    for (const proj of data.projects) {
        if (!['shipped', 'wip', 'concept'].includes(proj.status)) {
            return { success: false, error: `Invalid project status: ${proj.status}` };
        }
    }
    
    // Featured validation
    const featuredCount = data.projects.filter((p: any) => p.featured).length;
    if (featuredCount > 1) {
        return { success: false, error: 'More than one featured project is not allowed' };
    }
    
    // Theme and density validation
    const themes = ['sunrise', 'slate', 'forest', 'blossom'];
    if (!themes.includes(data.preferences.theme)) {
        return { success: false, error: `Invalid theme: ${data.preferences.theme}` };
    }
    const densities = ['compact', 'spacious'];
    if (!densities.includes(data.preferences.density)) {
        return { success: false, error: `Invalid density: ${data.preferences.density}` };
    }

    state.content = {
      profile: {
        name: data.profile.name || '',
        title: data.profile.title || '',
        bio: data.profile.bio || ''
      },
      projects: data.projects.map((p: any) => ({
        id: generateId(),
        title: p.title || '',
        description: p.description || '',
        category: p.category || '',
        linkLabel: p.linkLabel || '',
        linkUrl: p.linkUrl || '',
        status: p.status || 'wip',
        featured: !!p.featured
      })),
      skills: data.skills.map((s: string) => ({ id: generateId(), label: s })),
      testimonials: data.testimonials.map((t: any) => ({
        id: generateId(),
        quote: t.quote || '',
        name: t.name || '',
        role: t.role || ''
      })),
      contact: {
        email: data.contact.email || '',
        location: data.contact.location || '',
        links: (data.contact.links || []).map((l: any) => ({
          id: generateId(),
          label: l.label || '',
          url: l.url || ''
        }))
      }
    };

    state.sectionOrder = data.preferences.sectionOrder;
    state.sectionVisibility = data.preferences.sectionVisibility;
    state.theme = data.preferences.theme;
    state.density = data.preferences.density;
    state.selectedProjects = [];

    pushHistory(history, state.content, 'Import Portfolio JSON');
    saveState(state);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Malformed JSON: ${err.message}` };
  }
}

export { SECTION_LABELS, generateId };
