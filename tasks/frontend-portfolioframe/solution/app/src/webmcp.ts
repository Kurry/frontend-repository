// WebMCP surface for the PortfolioFrame oracle.
//
// Every tool invokes the SAME Qwik-store commands the visible controls call —
// updateProfile / updateContact / setTheme / setDensity / toggleSectionVisibility /
// moveSection{Up,Down} for the structured editor, and submitProject / submitTestimonial /
// addSkill / saveDraft / loadDraft / updateProject / updateTestimonial /
// deleteProject / deleteTestimonial / deleteSkill / deleteDraft for the entity
// collection — so a tool can never reach a success path the UI lacks. Mutating the
// reactive Qwik store proxies re-renders the editor and the live preview exactly as
// a click would.
//
// Intentionally NOT exposed as tools (they stay Playwright-driven through the real
// controls): Undo / Redo / branch selection and the History panel, Download PDF
// (window.print), the horizontally scrollable testimonials row, and section-reorder
// gesture animation. See mechanics_exclusions.
//
// Exposed on window as webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.

import type { PortfolioState, HistoryManager, SectionKey, ThemeName, DensityMode } from './types';
import {
  updateProfile,
  updateContact,
  setTheme,
  setDensity,
  toggleSectionVisibility,
  moveSectionUp,
  moveSectionDown,
  submitProject,
  updateProject,
  deleteProject,
  submitTestimonial,
  updateTestimonial,
  deleteTestimonial,
  addSkill,
  deleteSkill,
  saveDraft,
  loadDraft,
  deleteDraft,
} from './store';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['structured-editor-v1', 'entity-collection-v1'];

const SECTIONS: SectionKey[] = ['header', 'projects', 'skills', 'testimonials', 'contact'];
const THEMES: ThemeName[] = ['sunrise', 'slate', 'forest', 'blossom'];
const DENSITIES: DensityMode[] = ['compact', 'spacious'];
const PROFILE_PROPS = ['name', 'title', 'bio'] as const;
const CONTACT_PROPS = ['email', 'location'] as const;
const ITEM_TYPES = ['project', 'testimonial', 'skill', 'draft'] as const;

type Result = Record<string, unknown>;
type ItemType = (typeof ITEM_TYPES)[number];

function asSection(value: unknown): SectionKey | null {
  const v = String(value ?? '');
  return (SECTIONS as string[]).includes(v) ? (v as SectionKey) : null;
}

function scrollEditorTo(label: string): void {
  const el = Array.from(document.querySelectorAll('h2, h1')).find(
    (h) => (h.textContent ?? '').trim().toLowerCase() === label.toLowerCase()
  );
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function registerWebMcp(state: PortfolioState, history: HistoryManager): void {
  // ---- structured-editor-v1 (editor prefix) --------------------------------

  // update_property: profile/contact fields, theme, density, section visibility,
  // and section order — each routed to the identical store command the visible
  // control uses.
  function editorUpdateProperty(args: Result): Result {
    const property = String(args.property ?? '');
    const value = args.value;

    if ((PROFILE_PROPS as readonly string[]).includes(property)) {
      updateProfile(state, history, property as (typeof PROFILE_PROPS)[number], String(value ?? ''));
      return { ok: true, operation: 'update_property', property, value: String(value ?? '') };
    }
    if ((CONTACT_PROPS as readonly string[]).includes(property)) {
      updateContact(state, history, property as (typeof CONTACT_PROPS)[number], String(value ?? ''));
      return { ok: true, operation: 'update_property', property, value: String(value ?? '') };
    }
    if (property === 'theme') {
      const t = String(value ?? '') as ThemeName;
      if (!THEMES.includes(t)) return { ok: false, error: `theme must be one of ${THEMES.join(', ')}` };
      setTheme(state, t);
      return { ok: true, operation: 'update_property', property, value: t };
    }
    if (property === 'density') {
      const d = String(value ?? '') as DensityMode;
      if (!DENSITIES.includes(d)) return { ok: false, error: `density must be one of ${DENSITIES.join(', ')}` };
      setDensity(state, d);
      return { ok: true, operation: 'update_property', property, value: d };
    }
    if (property === 'visibility') {
      const section = asSection(args.section);
      if (!section) return { ok: false, error: `section must be one of ${SECTIONS.join(', ')}` };
      const target = Boolean(value);
      if (state.sectionVisibility[section] !== target) toggleSectionVisibility(state, section);
      return { ok: true, operation: 'update_property', property, section, value: target };
    }
    if (property === 'order') {
      const section = asSection(args.section);
      if (!section) return { ok: false, error: `section must be one of ${SECTIONS.join(', ')}` };
      const dir = String(value ?? '');
      if (dir === 'up') moveSectionUp(state, section);
      else if (dir === 'down') moveSectionDown(state, section);
      else return { ok: false, error: "order value must be 'up' or 'down'" };
      return { ok: true, operation: 'update_property', property, section, value: dir, order: state.sectionOrder.slice() };
    }
    return { ok: false, error: `unknown property: ${property}` };
  }

  // switch_mode: density presets (Compact / Spacious) — same command as the Density toggle.
  function editorSwitchMode(args: Result): Result {
    const mode = String(args.mode ?? args.value ?? '') as DensityMode;
    if (!DENSITIES.includes(mode)) return { ok: false, error: `mode must be one of ${DENSITIES.join(', ')}` };
    setDensity(state, mode);
    return { ok: true, operation: 'switch_mode', mode };
  }

  // select: read a section's current content and scroll its editor into view.
  function editorSelect(args: Result): Result {
    const section = asSection(args.section ?? args.object);
    if (!section) return { ok: false, error: `section must be one of ${SECTIONS.join(', ')}` };
    const labels: Record<SectionKey, string> = {
      header: 'Profile Header',
      projects: 'Projects',
      skills: 'Skills',
      testimonials: 'Testimonials',
      contact: 'Contact',
    };
    scrollEditorTo(labels[section]);
    return {
      ok: true,
      operation: 'select',
      section,
      visible: state.sectionVisibility[section],
      order: state.sectionOrder.indexOf(section),
    };
  }

  // preview: read-only snapshot of the assembled preview (does NOT print).
  function editorPreview(): Result {
    return {
      ok: true,
      operation: 'preview',
      theme: state.theme,
      density: state.density,
      sections: state.sectionOrder.filter((s) => state.sectionVisibility[s]),
      counts: {
        projects: state.content.projects.length,
        skills: state.content.skills.length,
        testimonials: state.content.testimonials.length,
      },
    };
  }

  // ---- entity-collection-v1 (entity prefix) --------------------------------
  // entity_fields names the collection an operation targets: project | testimonial
  // | skill | draft.

  function itemType(args: Result): ItemType | null {
    const t = String(args.type ?? args.field ?? '');
    return (ITEM_TYPES as readonly string[]).includes(t) ? (t as ItemType) : null;
  }

  function entityCreate(args: Result): Result {
    const type = itemType(args);
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')}` };
    if (type === 'project') {
      const p = submitProject(state, history, {
        title: String(args.title ?? ''),
        description: String(args.description ?? ''),
        category: String(args.category ?? ''),
        linkLabel: String(args.linkLabel ?? ''),
        linkUrl: String(args.linkUrl ?? ''),
      });
      return { ok: true, operation: 'create', type, id: p.id, count: state.content.projects.length };
    }
    if (type === 'testimonial') {
      const t = submitTestimonial(state, history, {
        quote: String(args.quote ?? ''),
        name: String(args.name ?? ''),
        role: String(args.role ?? ''),
      });
      return { ok: true, operation: 'create', type, id: t.id, count: state.content.testimonials.length };
    }
    if (type === 'skill') {
      const res = addSkill(state, history, String(args.label ?? args.name ?? ''));
      if (!res.success) return { ok: false, operation: 'create', type, error: res.error };
      return { ok: true, operation: 'create', type, count: state.content.skills.length };
    }
    // draft: Save As Draft under a name.
    const name = String(args.name ?? '').trim();
    if (!name) return { ok: false, error: 'draft name is required' };
    saveDraft(state, name);
    return { ok: true, operation: 'create', type, name, count: state.drafts.length };
  }

  function entitySelect(args: Result): Result {
    const type = itemType(args);
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')}` };
    if (type === 'draft') {
      const name = String(args.name ?? args.id ?? '');
      if (!state.drafts.some((d) => d.name === name)) return { ok: false, error: `draft not found: ${name}` };
      loadDraft(state, history, name); // same path as the drafts-list "Load" button
      return { ok: true, operation: 'select', type, name };
    }
    // project / testimonial / skill: read-only lookup (no store-level select command).
    if (type === 'project') {
      const id = String(args.id ?? '');
      const list = state.content.projects;
      if (!id) return { ok: true, operation: 'select', type, items: list.map((p) => ({ id: p.id, title: p.title })) };
      const item = list.find((p) => p.id === id);
      return item ? { ok: true, operation: 'select', type, item } : { ok: false, error: `project not found: ${id}` };
    }
    if (type === 'testimonial') {
      const id = String(args.id ?? '');
      const list = state.content.testimonials;
      if (!id) return { ok: true, operation: 'select', type, items: list.map((t) => ({ id: t.id, name: t.name })) };
      const item = list.find((t) => t.id === id);
      return item ? { ok: true, operation: 'select', type, item } : { ok: false, error: `testimonial not found: ${id}` };
    }
    // skill
    return { ok: true, operation: 'select', type, items: state.content.skills.map((s) => ({ id: s.id, label: s.label })) };
  }

  function entityUpdate(args: Result): Result {
    const type = itemType(args);
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')}` };
    if (type === 'project') {
      const id = String(args.id ?? '');
      if (!state.content.projects.some((p) => p.id === id)) return { ok: false, error: `project not found: ${id}` };
      const field = String(args.field ?? '');
      const allowed = ['title', 'description', 'category', 'linkLabel', 'linkUrl'];
      if (!allowed.includes(field)) return { ok: false, error: `project field must be one of ${allowed.join(', ')}` };
      updateProject(state, history, id, field as never, String(args.value ?? ''));
      return { ok: true, operation: 'update', type, id, field };
    }
    if (type === 'testimonial') {
      const id = String(args.id ?? '');
      if (!state.content.testimonials.some((t) => t.id === id)) return { ok: false, error: `testimonial not found: ${id}` };
      const field = String(args.field ?? '');
      const allowed = ['quote', 'name', 'role'];
      if (!allowed.includes(field)) return { ok: false, error: `testimonial field must be one of ${allowed.join(', ')}` };
      updateTestimonial(state, history, id, field as never, String(args.value ?? ''));
      return { ok: true, operation: 'update', type, id, field };
    }
    if (type === 'draft') {
      const name = String(args.name ?? '').trim();
      if (!name) return { ok: false, error: 'draft name is required' };
      saveDraft(state, name); // re-save current content under the name (overwrite)
      return { ok: true, operation: 'update', type, name };
    }
    return { ok: false, error: 'skills are immutable — delete and recreate instead' };
  }

  function entityDelete(args: Result): Result {
    if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
    const type = itemType(args);
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')}` };
    if (type === 'project') {
      const id = String(args.id ?? '');
      if (!state.content.projects.some((p) => p.id === id)) return { ok: false, error: `project not found: ${id}` };
      deleteProject(state, history, id);
      return { ok: true, operation: 'delete', type, id, count: state.content.projects.length };
    }
    if (type === 'testimonial') {
      const id = String(args.id ?? '');
      if (!state.content.testimonials.some((t) => t.id === id)) return { ok: false, error: `testimonial not found: ${id}` };
      deleteTestimonial(state, history, id);
      return { ok: true, operation: 'delete', type, id, count: state.content.testimonials.length };
    }
    if (type === 'skill') {
      const id = String(args.id ?? '');
      if (!state.content.skills.some((s) => s.id === id)) return { ok: false, error: `skill not found: ${id}` };
      deleteSkill(state, history, id);
      return { ok: true, operation: 'delete', type, id, count: state.content.skills.length };
    }
    // draft
    const name = String(args.name ?? args.id ?? '');
    if (!state.drafts.some((d) => d.name === name)) return { ok: false, error: `draft not found: ${name}` };
    deleteDraft(state, name);
    return { ok: true, operation: 'delete', type, name, count: state.drafts.length };
  }

  // ---- registry ------------------------------------------------------------

  type Handler = (args: Result) => Result;
  const TOOLS: { name: string; description: string; handler: Handler }[] = [
    {
      name: 'editor-select',
      description:
        'Select a preview section (header|projects|skills|testimonials|contact) via args.section; scrolls its editor into view and returns its current visibility/order.',
      handler: editorSelect,
    },
    {
      name: 'editor-update_property',
      description:
        'Update a section property. args.property is name|title|bio (profile), email|location (contact), theme (sunrise|slate|forest|blossom), density (compact|spacious), visibility (with args.section, args.value boolean), or order (with args.section, args.value up|down). Same command path as the visible control.',
      handler: editorUpdateProperty,
    },
    {
      name: 'editor-switch_mode',
      description: 'Switch the preview density preset. args.mode is compact or spacious (same as the Density toggle).',
      handler: editorSwitchMode,
    },
    {
      name: 'editor-preview',
      description: 'Read-only snapshot of the assembled preview (theme, density, visible section order, item counts). Does not trigger print.',
      handler: () => editorPreview(),
    },
    {
      name: 'entity-create',
      description:
        'Create a collection item. args.type is project (title/description/category/linkLabel/linkUrl), testimonial (quote/name/role), skill (label; case-insensitive duplicates are rejected), or draft (name; Save As Draft). Same command path as the visible form/button.',
      handler: entityCreate,
    },
    {
      name: 'entity-select',
      description:
        'Select a collection item. args.type is project|testimonial|skill (returns the item or the list) or draft (loads it — same as the drafts-list Load button).',
      handler: entitySelect,
    },
    {
      name: 'entity-update',
      description:
        'Update a collection item. args.type is project or testimonial (args.id + args.field + args.value) or draft (args.name; re-saves current content under that name). Skills are immutable.',
      handler: entityUpdate,
    },
    {
      name: 'entity-delete',
      description:
        'Delete a collection item by args.type (project|testimonial|skill via args.id, draft via args.name). Requires confirm=true (mirrors the delete control).',
      handler: entityDelete,
    },
  ];

  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = (name: string, args: Result = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
