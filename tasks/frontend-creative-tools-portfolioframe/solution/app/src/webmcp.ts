// WebMCP surface for the PortfolioFrame oracle (contract zto-webmcp-v1).
//
// Modules: structured-editor-v1 (editor_*), entity-collection-v1 (entity_*),
// artifact-transfer-v1 (artifact_*).
//
// Every tool invokes the SAME Qwik-store commands the visible controls call —
// updateProfile / updateContact / setTheme / setDensity /
// toggleSectionVisibility / moveSection{Up,Down} / updateProject for the
// structured editor; submitProject / submitTestimonial / addSkill / saveDraft /
// loadDraft / updateProject / updateTestimonial / deleteProject /
// deleteTestimonial / deleteSkill / deleteDraft for the entity collection; and
// the Export package panel's tab switching, Copy, and Import surfaces for
// artifact transfer — so a tool can never reach a success path the UI lacks.
// Mutating the reactive Qwik store proxies re-renders the editor, the live
// preview, Completeness, and both export tabs exactly as a click would.
//
// Per the mechanics exclusions, Undo/Redo/branch selection and the History
// panel, Download PDF (window.print), the horizontally scrollable testimonials
// row, section-reorder gesture animation, command-palette keyboard navigation,
// and bulk-select checkbox gestures stay Playwright-driven through the real
// controls. Artifact results never contain raw file contents, blobs, base64,
// or file paths — clipboard and downloaded files remain Playwright
// responsibilities.
//
// Exposed on window as webmcp_session_info / webmcp_list_tools /
// webmcp_invoke_tool.

import type { PortfolioState, SectionKey, ThemeName, DensityMode, ProjectStatus } from './types';
import type { HistoryManager } from './store';
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
  validateDraftName,
  generatePortfolioJSON,
  generateMarkdownResume,
  importPortfolioJSON,
  completenessCount,
  THEMES,
  DENSITIES,
  SCHEMA_VERSION,
} from './store';
import { copyToClipboard } from './clipboard';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'];

const SECTIONS: SectionKey[] = ['header', 'projects', 'skills', 'testimonials', 'contact'];
const PROFILE_PROPS = ['name', 'title', 'bio'] as const;
const CONTACT_PROPS = ['email', 'location'] as const;
const PROJECT_STATUSES: ProjectStatus[] = ['shipped', 'wip', 'concept'];
const ITEM_TYPES = ['project', 'testimonial', 'skill', 'draft'] as const;
const EXPORT_FORMATS = ['portfolio-json', 'markdown-resume'] as const;

type Result = Record<string, unknown>;
type ItemType = (typeof ITEM_TYPES)[number];
type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** UI bridge: opens the Export package panel surfaces (same controls a click would use). */
export interface WebMcpUiBridge {
  openExport: (tab: 'json' | 'markdown') => void;
  openImport: () => void;
}

function asSection(value: unknown): SectionKey | null {
  const v = String(value ?? '');
  return (SECTIONS as string[]).includes(v) ? (v as SectionKey) : null;
}

/** editor object types: the five sections plus export-package. */
function asObject(value: unknown): SectionKey | 'export-package' | null {
  const v = String(value ?? '');
  if (v === 'export-package') return 'export-package';
  return asSection(v);
}

function scrollEditorTo(label: string): void {
  const el = Array.from(document.querySelectorAll('h2, h1')).find(
    (h) => (h.textContent ?? '').trim().toLowerCase() === label.toLowerCase()
  );
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatToTab(format: unknown): 'json' | 'markdown' {
  return String(format ?? '') === 'markdown-resume' ? 'markdown' : 'json';
}

export function registerWebMcp(state: PortfolioState, history: HistoryManager, ui: WebMcpUiBridge): void {
  // ---- structured-editor-v1 (editor_ prefix) --------------------------------

  const SECTION_LABELS_LOCAL: Record<SectionKey, string> = {
    header: 'Profile Header',
    projects: 'Projects',
    skills: 'Skills',
    testimonials: 'Testimonials',
    contact: 'Contact',
  };

  function editorSelect(args: Result): Result {
    const object = asObject(args.object ?? args.section);
    if (!object) {
      return { ok: false, error: `object must be one of ${SECTIONS.join(', ')}, export-package` };
    }
    if (object === 'export-package') {
      ui.openExport('json');
      return {
        ok: true,
        operation: 'select',
        object,
        formats: [...EXPORT_FORMATS],
        panel: 'open',
      };
    }
    scrollEditorTo(SECTION_LABELS_LOCAL[object]);
    return {
      ok: true,
      operation: 'select',
      object,
      visible: state.sectionVisibility[object],
      order: state.sectionOrder.indexOf(object),
      counts:
        object === 'projects'
          ? { items: state.content.projects.length }
          : object === 'skills'
            ? { items: state.content.skills.length }
            : object === 'testimonials'
              ? { items: state.content.testimonials.length }
              : undefined,
    };
  }

  // update_property: profile/contact fields, theme, density, section
  // visibility, section order, and project status/featured — each routed to
  // the identical store command the visible control uses.
  function editorUpdateProperty(args: Result): Result {
    const property = String(args.property ?? '');
    const value = args.value;
    const object = asObject(args.object ?? args.section);

    if ((PROFILE_PROPS as readonly string[]).includes(property)) {
      updateProfile(state, history, property as (typeof PROFILE_PROPS)[number], String(value ?? ''));
      return { ok: true, operation: 'update_property', object: 'header', property, value: String(value ?? '') };
    }
    if ((CONTACT_PROPS as readonly string[]).includes(property)) {
      updateContact(state, history, property as (typeof CONTACT_PROPS)[number], String(value ?? ''));
      return { ok: true, operation: 'update_property', object: 'contact', property, value: String(value ?? '') };
    }
    if (property === 'theme') {
      const t = String(value ?? '') as ThemeName;
      if (!THEMES.includes(t)) return { ok: false, error: `theme must be one of ${THEMES.join(', ')}` };
      setTheme(state, history, t);
      return { ok: true, operation: 'update_property', object: 'preview', property, value: t };
    }
    if (property === 'density') {
      const d = String(value ?? '') as DensityMode;
      if (!DENSITIES.includes(d)) return { ok: false, error: `density must be one of ${DENSITIES.join(', ')}` };
      setDensity(state, history, d);
      return { ok: true, operation: 'update_property', object: 'preview', property, value: d };
    }
    if (property === 'visibility') {
      const section = asObject(args.section ?? args.object);
      if (!section || section === 'export-package') {
        return { ok: false, error: `visibility requires object/section to be one of ${SECTIONS.join(', ')}` };
      }
      const target = String(value ?? '') === 'false' ? false : Boolean(value);
      if (state.sectionVisibility[section] !== target) toggleSectionVisibility(state, history, section);
      return { ok: true, operation: 'update_property', object: section, property, value: target };
    }
    if (property === 'order') {
      const section = asObject(args.section ?? args.object);
      if (!section || section === 'export-package') {
        return { ok: false, error: `order requires object/section to be one of ${SECTIONS.join(', ')}` };
      }
      const dir = String(value ?? '');
      if (dir === 'up') moveSectionUp(state, history, section);
      else if (dir === 'down') moveSectionDown(state, history, section);
      else return { ok: false, error: "order value must be 'up' or 'down'" };
      return { ok: true, operation: 'update_property', object: section, property, value: dir, order: state.sectionOrder.slice() };
    }
    if (property === 'status' || property === 'featured') {
      const projects = state.content.projects;
      if (projects.length === 0) return { ok: false, error: 'no projects exist yet — create one via entity_create first' };
      const id = String(args.id ?? '');
      const target = id ? projects.find((p) => p.id === id) : projects[projects.length - 1];
      if (!target) return { ok: false, error: `project not found: ${id}` };
      if (property === 'status') {
        const s = String(value ?? '') as ProjectStatus;
        if (!PROJECT_STATUSES.includes(s)) {
          return { ok: false, error: `status must be one of ${PROJECT_STATUSES.join(', ')}` };
        }
        updateProject(state, history, target.id, 'status', s);
        return { ok: true, operation: 'update_property', object: 'projects', property, id: target.id, value: s };
      }
      const featured = String(value ?? '') === 'false' ? false : Boolean(value);
      updateProject(state, history, target.id, 'featured', featured);
      return { ok: true, operation: 'update_property', object: 'projects', property, id: target.id, value: featured };
    }
    return {
      ok: false,
      error: `property must be one of ${[...PROFILE_PROPS, ...CONTACT_PROPS, 'theme', 'density', 'visibility', 'order', 'status', 'featured'].join(', ')}`,
    };
  }

  // switch_mode: density presets (Compact / Spacious) — same command as the Density toggle.
  function editorSwitchMode(args: Result): Result {
    const mode = String(args.mode ?? args.value ?? '') as DensityMode;
    if (!DENSITIES.includes(mode)) return { ok: false, error: `mode must be one of ${DENSITIES.join(', ')}` };
    setDensity(state, history, mode);
    return { ok: true, operation: 'switch_mode', mode };
  }

  // preview: read-only snapshot of the assembled preview (does NOT print).
  function editorPreview(): Result {
    const count = completenessCount(state);
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
      completeness: `${count.done} of ${count.total} complete`,
    };
  }

  // ---- entity-collection-v1 (entity_ prefix) ---------------------------------
  // Entity: portfolio-item. entity_field names the collection an operation
  // targets: project | testimonial | skill | draft.

  function itemType(args: Result): ItemType | null {
    const t = String(args.type ?? args.field ?? args.entity_field ?? '');
    return (ITEM_TYPES as readonly string[]).includes(t) ? (t as ItemType) : null;
  }

  function entityCreate(args: Result): Result {
    const type = itemType(args);
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')} (entity portfolio-item)` };
    if (type === 'project') {
      const title = String(args.title ?? '').trim();
      const category = String(args.categoryTag ?? args.category ?? '').trim();
      const status = String(args.status ?? 'wip') as ProjectStatus;
      if (!title) return { ok: false, error: 'title is required (1–80 characters) — same rule as the Add Project form' };
      if (title.length > 80) return { ok: false, error: `title is ${title.length} characters — must be 80 or fewer` };
      if (!category) return { ok: false, error: 'categoryTag is required (1–32 characters)' };
      if (category.length > 32) return { ok: false, error: `categoryTag is ${category.length} characters — must be 32 or fewer` };
      if (!PROJECT_STATUSES.includes(status)) {
        return { ok: false, error: `status must be one of ${PROJECT_STATUSES.join(', ')}` };
      }
      const p = submitProject(state, history, {
        title,
        description: String(args.description ?? ''),
        category,
        linkLabel: String(args.linkLabel ?? ''),
        linkUrl: String(args.linkUrl ?? ''),
        status,
        featured: args.featured === true,
      });
      return { ok: true, operation: 'create', type, id: p.id, count: state.content.projects.length };
    }
    if (type === 'testimonial') {
      const quote = String(args.quote ?? '').trim();
      const name = String(args.name ?? '').trim();
      const role = String(args.role ?? '').trim();
      if (!quote) return { ok: false, error: 'quote is required (1–400 characters)' };
      if (quote.length > 400) return { ok: false, error: `quote is ${quote.length} characters — must be 400 or fewer` };
      if (!name || name.length > 80) return { ok: false, error: 'name is required (1–80 characters)' };
      if (!role || role.length > 80) return { ok: false, error: 'role is required (1–80 characters)' };
      const t = submitTestimonial(state, history, { quote, name, role });
      return { ok: true, operation: 'create', type, id: t.id, count: state.content.testimonials.length };
    }
    if (type === 'skill') {
      const res = addSkill(state, history, String(args.label ?? args.name ?? ''));
      if (!res.success) return { ok: false, operation: 'create', type, error: res.error };
      return { ok: true, operation: 'create', type, count: state.content.skills.length };
    }
    // draft: Save As Draft under a name.
    const name = String(args.name ?? '').trim();
    const nameError = validateDraftName(name, state.drafts);
    if (nameError) return { ok: false, error: nameError };
    saveDraft(state, name);
    return { ok: true, operation: 'create', type, name, count: state.drafts.length };
  }

  function entitySelect(args: Result): Result {
    const type = itemType(args);
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')} (entity portfolio-item)` };
    if (type === 'draft') {
      const name = String(args.name ?? args.id ?? '');
      if (!state.drafts.some((d) => d.name === name)) {
        return { ok: false, error: `draft not found: ${name}` };
      }
      loadDraft(state, history, name); // same path as the drafts-list "Load" button
      return { ok: true, operation: 'select', type, name, loaded: true };
    }
    if (type === 'project') {
      const id = String(args.id ?? '');
      const list = state.content.projects;
      if (!id) return { ok: true, operation: 'select', type, items: list.map((p) => ({ id: p.id, title: p.title, status: p.status, featured: p.featured })) };
      const item = list.find((p) => p.id === id);
      return item
        ? { ok: true, operation: 'select', type, item: { ...item } }
        : { ok: false, error: `project not found: ${id}` };
    }
    if (type === 'testimonial') {
      const id = String(args.id ?? '');
      const list = state.content.testimonials;
      if (!id) return { ok: true, operation: 'select', type, items: list.map((t) => ({ id: t.id, name: t.name })) };
      const item = list.find((t) => t.id === id);
      return item
        ? { ok: true, operation: 'select', type, item: { ...item } }
        : { ok: false, error: `testimonial not found: ${id}` };
    }
    // skill
    return { ok: true, operation: 'select', type, items: state.content.skills.map((s) => ({ id: s.id, label: s.label })) };
  }

  function entityUpdate(args: Result): Result {
    const type = itemType(args);
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')} (entity portfolio-item)` };
    if (type === 'project') {
      const id = String(args.id ?? '');
      if (!state.content.projects.some((p) => p.id === id)) return { ok: false, error: `project not found: ${id}` };
      const field = String(args.field ?? '');
      const allowed = ['title', 'description', 'category', 'categoryTag', 'linkLabel', 'linkUrl', 'status', 'featured'];
      if (!allowed.includes(field)) return { ok: false, error: `project field must be one of ${allowed.join(', ')}` };
      if (field === 'status' && !PROJECT_STATUSES.includes(String(args.value ?? '') as ProjectStatus)) {
        return { ok: false, error: `status must be one of ${PROJECT_STATUSES.join(', ')}` };
      }
      if (field === 'featured') {
        updateProject(state, history, id, 'featured', String(args.value ?? '') === 'true' || args.value === true);
      } else if (field === 'categoryTag') {
        updateProject(state, history, id, 'category', String(args.value ?? ''));
      } else {
        updateProject(state, history, id, field as 'title', String(args.value ?? ''));
      }
      return { ok: true, operation: 'update', type, id, field };
    }
    if (type === 'testimonial') {
      const id = String(args.id ?? '');
      if (!state.content.testimonials.some((t) => t.id === id)) return { ok: false, error: `testimonial not found: ${id}` };
      const field = String(args.field ?? '');
      const allowed = ['quote', 'name', 'role'];
      if (!allowed.includes(field)) return { ok: false, error: `testimonial field must be one of ${allowed.join(', ')}` };
      updateTestimonial(state, history, id, field as 'quote', String(args.value ?? ''));
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
    if (!type) return { ok: false, error: `type must be one of ${ITEM_TYPES.join(', ')} (entity portfolio-item)` };
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

  // ---- artifact-transfer-v1 (artifact_ prefix) --------------------------------
  // Artifacts are the Export package texts. Results never contain the artifact
  // contents — clipboard text and downloaded files stay Playwright-visible.

  function artifactExport(args: Result): Result {
    const format = String(args.format ?? 'portfolio-json');
    if (!(EXPORT_FORMATS as readonly string[]).includes(format)) {
      return { ok: false, error: `format must be one of ${EXPORT_FORMATS.join(', ')}` };
    }
    const tab = formatToTab(format);
    ui.openExport(tab); // same surface as the top-bar "Export package" button + tab click
    return {
      ok: true,
      operation: 'export',
      format: format as ExportFormat,
      schemaVersion: SCHEMA_VERSION,
      tab,
      live: true,
      counts: {
        projects: state.content.projects.length,
        skills: state.content.skills.length,
        testimonials: state.content.testimonials.length,
      },
    };
  }

  function artifactCopy(args: Result): Result {
    const format = String(args.format ?? 'portfolio-json');
    if (!(EXPORT_FORMATS as readonly string[]).includes(format)) {
      return { ok: false, error: `format must be one of ${EXPORT_FORMATS.join(', ')}` };
    }
    const tab = formatToTab(format);
    const text = tab === 'json' ? generatePortfolioJSON(state) : generateMarkdownResume(state);
    ui.openExport(tab);
    // Same clipboard path as the panel's Copy export button; the clipboard
    // text itself remains a Playwright responsibility.
    void copyToClipboard(text);
    return { ok: true, operation: 'copy', format: format as ExportFormat, tab, confirmed: true };
  }

  function artifactImport(args: Result): Result {
    const mode = String(args.mode ?? 'portfolio-package');
    if (mode !== 'portfolio-package') {
      return { ok: false, error: 'import mode must be portfolio-package' };
    }
    ui.openImport(); // opens the Import package surface (paste or choose a file)
    return {
      ok: true,
      operation: 'import',
      mode,
      schemaVersion: SCHEMA_VERSION,
      surface: 'Import package panel is open — paste Portfolio JSON or choose an exported portfolio.json file, then press Import.',
    };
  }

  // ---- registry ------------------------------------------------------------

  type Handler = (args: Result) => Result;
  const TOOLS: { name: string; description: string; handler: Handler }[] = [
    {
      name: 'editor_select',
      description:
        'Select an editor object. args.object is header|projects|skills|testimonials|contact (scrolls its editor into view and returns visibility/order/counts) or export-package (opens the Export package panel and returns its formats).',
      handler: editorSelect,
    },
    {
      name: 'editor_update_property',
      description:
        'Update an editor property via the same command the visible control uses. args.property: name|title|bio (Profile Header), email|location (Contact), theme (sunrise|slate|forest|blossom), density (compact|spacious), visibility (args.object/section + boolean args.value), order (args.object/section + args.value up|down), or status|featured (a project; args.id optional — defaults to the most recent project).',
      handler: editorUpdateProperty,
    },
    {
      name: 'editor_switch_mode',
      description: 'Switch the preview density preset. args.mode is compact or spacious (same as the Density toggle).',
      handler: editorSwitchMode,
    },
    {
      name: 'editor_preview',
      description:
        'Read-only snapshot of the assembled preview (theme, density, visible section order, item counts, completeness). Does not trigger print.',
      handler: () => editorPreview(),
    },
    {
      name: 'entity_create',
      description:
        'Create a portfolio-item. args.type: project (title required 1–80, categoryTag required 1–32, optional description/linkLabel/linkUrl, status shipped|wip|concept, featured boolean), testimonial (quote 1–400, name 1–80, role 1–80), skill (label; case-insensitive duplicates rejected), or draft (name; Save As Draft, unique case-insensitive, ≤60 chars). Same command path as the visible forms.',
      handler: entityCreate,
    },
    {
      name: 'entity_select',
      description:
        'Select a portfolio-item. args.type: project|testimonial|skill (args.id returns the item, omit for the list) or draft (args.name loads it — same as the drafts-list Load button).',
      handler: entitySelect,
    },
    {
      name: 'entity_update',
      description:
        'Update a portfolio-item. args.type: project (args.id + args.field title|description|categoryTag|linkLabel|linkUrl|status|featured + args.value), testimonial (args.field quote|name|role), or draft (args.name re-saves current content under that name). Skills are immutable.',
      handler: entityUpdate,
    },
    {
      name: 'entity_delete',
      description:
        'Delete a portfolio-item. args.type: project|testimonial|skill via args.id, or draft via args.name. Requires args.confirm=true (mirrors the visible delete controls).',
      handler: entityDelete,
    },
    {
      name: 'artifact_export',
      description:
        'Open the Export package panel on a format tab. args.format: portfolio-json (default) or markdown-resume. The preview text is compiled live from the store; artifact contents are not returned here (clipboard/downloads are Playwright-visible).',
      handler: artifactExport,
    },
    {
      name: 'artifact_import',
      description:
        'Open the Import package surface (mode portfolio-package) to paste Portfolio JSON or choose an exported portfolio.json file. Validation follows the Portfolio JSON field contract; the file/paste step stays Playwright-driven.',
      handler: artifactImport,
    },
    {
      name: 'artifact_copy',
      description:
        'Copy the live-compiled export text for args.format (portfolio-json default, or markdown-resume) to the clipboard via the same handler as the panel Copy export button, with visible confirmation in the panel. Clipboard contents themselves remain a Playwright responsibility.',
      handler: artifactCopy,
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
