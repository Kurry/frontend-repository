import { component$, $, useSignal, useTask$ } from '@builder.io/qwik';
import type { PortfolioState, Project, Testimonial, ProjectStatus } from '../types';
import type { HistoryManager } from '../store';
import {
  updateProject,
  deleteProject,
  addSkill,
  deleteSkill,
  updateTestimonial,
  deleteTestimonial,
  updateContact,
  addContactLink,
  updateContactLink,
  deleteContactLink,
  pushHistory,
  saveState,
  submitProject,
  submitTestimonial,
  toggleProjectSelection,
  deleteSelectedProjects,
} from '../store';

/** Reject rapid duplicate submissions of an identical payload (double-click safety). */
function makeDuplicateGuard() {
  let lastPayload = '';
  let lastTime = 0;
  return (payload: string): boolean => {
    const now = Date.now();
    if (payload === lastPayload && now - lastTime < 600) return true; // duplicate
    lastPayload = payload;
    lastTime = now;
    return false;
  };
}

const projectGuard = makeDuplicateGuard();
const testimonialGuard = makeDuplicateGuard();

const EMAIL_RE = /^[^@\s]+@[^@\s]+$/;

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return true; // empty is allowed (optional field)
  return EMAIL_RE.test(v);
}

// ---- Profile Header Editor ----
interface ProfileEditorProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const ProfileEditor = component$<ProfileEditorProps>(({ state, history }) => {
  const nameVal = useSignal(state.content.profile.name);
  const titleVal = useSignal(state.content.profile.title);
  const bioVal = useSignal(state.content.profile.bio);
  const nameError = useSignal('');
  const titleError = useSignal('');
  const bioError = useSignal('');

  // Sync local inputs when the store changes underneath (Undo, draft load, Import, WebMCP)
  useTask$(({ track }) => {
    track(() => state.content.profile.name);
    nameVal.value = state.content.profile.name;
  });
  useTask$(({ track }) => {
    track(() => state.content.profile.title);
    titleVal.value = state.content.profile.title;
  });
  useTask$(({ track }) => {
    track(() => state.content.profile.bio);
    bioVal.value = state.content.profile.bio;
  });

  const onNameInput = $((value: string) => {
    nameVal.value = value;
    if (value.length > 80) {
      nameError.value = `Name is ${value.length} characters — the profile name must be 1–80 characters after trim.`;
      return; // do not commit invalid value
    }
    nameError.value = '';
    state.content.profile.name = value;
    saveState(state);
  });
  const onTitleInput = $((value: string) => {
    titleVal.value = value;
    if (value.length > 120) {
      titleError.value = `Title is ${value.length} characters — the tagline must be 120 characters or fewer.`;
      return;
    }
    titleError.value = '';
    state.content.profile.title = value;
    saveState(state);
  });
  const onBioInput = $((value: string) => {
    bioVal.value = value;
    if (value.length > 600) {
      bioError.value = `Bio is ${value.length} characters — the bio must be 600 characters or fewer.`;
      return;
    }
    bioError.value = '';
    state.content.profile.bio = value;
    saveState(state);
  });

  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3">Profile Header</h2>
      <div class="space-y-3">
        <div>
          <label class="editor-label" htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            class="editor-input"
            placeholder="Your full name"
            aria-invalid={nameError.value ? 'true' : undefined}
            aria-describedby={nameError.value ? 'profile-name-error' : undefined}
            value={nameVal.value}
            onInput$={(e) => onNameInput((e.target as HTMLInputElement).value)}
            onBlur$={() => {
              if (!nameError.value) pushHistory(history, state, 'Edit profile name');
            }}
          />
          {nameError.value && (
            <p id="profile-name-error" class="field-error" role="alert">{nameError.value}</p>
          )}
        </div>
        <div>
          <label class="editor-label" htmlFor="profile-title">Title / Tagline</label>
          <input
            id="profile-title"
            class="editor-input"
            placeholder="e.g. Senior Frontend Engineer"
            aria-invalid={titleError.value ? 'true' : undefined}
            aria-describedby={titleError.value ? 'profile-title-error' : undefined}
            value={titleVal.value}
            onInput$={(e) => onTitleInput((e.target as HTMLInputElement).value)}
            onBlur$={() => {
              if (!titleError.value) pushHistory(history, state, 'Edit profile title');
            }}
          />
          {titleError.value && (
            <p id="profile-title-error" class="field-error" role="alert">{titleError.value}</p>
          )}
        </div>
        <div>
          <label class="editor-label" htmlFor="profile-bio">Bio</label>
          <textarea
            id="profile-bio"
            class="editor-textarea"
            placeholder="A short bio about yourself..."
            aria-invalid={bioError.value ? 'true' : undefined}
            aria-describedby={bioError.value ? 'profile-bio-error' : undefined}
            value={bioVal.value}
            onInput$={(e) => onBioInput((e.target as HTMLTextAreaElement).value)}
            onBlur$={() => {
              if (!bioError.value) pushHistory(history, state, 'Edit profile bio');
            }}
          />
          {bioError.value && (
            <p id="profile-bio-error" class="field-error" role="alert">{bioError.value}</p>
          )}
        </div>
      </div>
    </div>
  );
});

// ---- Projects Editor ----
interface ProjectsEditorProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const ProjectsEditor = component$<ProjectsEditorProps>(({ state, history }) => {
  const formTitle = useSignal('');
  const formDescription = useSignal('');
  const formCategory = useSignal('');
  const formLinkLabel = useSignal('');
  const formLinkUrl = useSignal('');
  const formStatus = useSignal<ProjectStatus>('wip');
  const formFeatured = useSignal(false);
  const titleError = useSignal('');
  const categoryError = useSignal('');
  const descError = useSignal('');
  const labelError = useSignal('');
  const statusError = useSignal('');

  const clearErrors = $(() => {
    titleError.value = '';
    categoryError.value = '';
    descError.value = '';
    labelError.value = '';
    statusError.value = '';
  });

  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3">Projects</h2>

      <form
        class="space-y-3 mb-4 p-4 rounded-xl border"
        style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }}
        preventdefault:submit
        onSubmit$={() => {
          // Field contract: title 1–80, categoryTag 1–32, description ≤500,
          // linkLabel ≤40, status closed enum shipped|wip|concept.
          let invalid = false;
          const title = formTitle.value.trim();
          if (!title) {
            titleError.value = 'Title is required — enter a project title (1–80 characters).';
            invalid = true;
          } else if (title.length > 80) {
            titleError.value = `Title is ${title.length} characters — keep it to 80 characters or fewer.`;
            invalid = true;
          }
          const category = formCategory.value.trim();
          if (!category) {
            categoryError.value = 'Category Tag is required — enter a short tag (1–32 characters), e.g. Web App.';
            invalid = true;
          } else if (category.length > 32) {
            categoryError.value = `Category Tag is ${category.length} characters — keep it to 32 characters or fewer.`;
            invalid = true;
          }
          if (formDescription.value.trim().length > 500) {
            descError.value = `Description is ${formDescription.value.trim().length} characters — keep it to 500 characters or fewer.`;
            invalid = true;
          }
          if (formLinkLabel.value.trim().length > 40) {
            labelError.value = `Link Label is ${formLinkLabel.value.trim().length} characters — keep it to 40 characters or fewer.`;
            invalid = true;
          }
          if (!['shipped', 'wip', 'concept'].includes(formStatus.value)) {
            statusError.value = 'Status must be exactly one of shipped, wip, or concept.';
            invalid = true;
          }
          if (invalid) return;

          const payload = JSON.stringify([title, category, formStatus.value, formFeatured.value]);
          if (projectGuard(payload)) return; // rapid duplicate submit — create exactly one record

          submitProject(state, history, {
            title: formTitle.value,
            description: formDescription.value,
            category: formCategory.value,
            linkLabel: formLinkLabel.value,
            linkUrl: formLinkUrl.value,
            status: formStatus.value,
            featured: formFeatured.value,
          });
          clearErrors();
          formTitle.value = '';
          formDescription.value = '';
          formCategory.value = '';
          formLinkLabel.value = '';
          formLinkUrl.value = '';
          formStatus.value = 'wip';
          formFeatured.value = false;
        }}
      >
        <p class="text-sm font-medium">Add Project</p>
        <div>
          <label class="editor-label" for="proj-title">Title</label>
          <input
            id="proj-title"
            class="editor-input"
            value={formTitle.value}
            placeholder="Project title"
            aria-invalid={titleError.value ? 'true' : undefined}
            aria-describedby={titleError.value ? 'proj-title-error' : undefined}
            onInput$={(e) => {
              formTitle.value = (e.target as HTMLInputElement).value;
              titleError.value = '';
            }}
          />
          {titleError.value && (
            <p id="proj-title-error" class="field-error" role="alert">{titleError.value}</p>
          )}
        </div>
        <div>
          <label class="editor-label" for="proj-desc">Description</label>
          <textarea
            id="proj-desc"
            class="editor-textarea"
            value={formDescription.value}
            placeholder="What does this project do?"
            aria-invalid={descError.value ? 'true' : undefined}
            aria-describedby={descError.value ? 'proj-desc-error' : undefined}
            onInput$={(e) => {
              formDescription.value = (e.target as HTMLTextAreaElement).value;
              descError.value = '';
            }}
          />
          {descError.value && (
            <p id="proj-desc-error" class="field-error" role="alert">{descError.value}</p>
          )}
        </div>
        <div>
          <label class="editor-label" for="proj-cat">Category Tag</label>
          <input
            id="proj-cat"
            class="editor-input"
            value={formCategory.value}
            placeholder="e.g. Web App"
            aria-invalid={categoryError.value ? 'true' : undefined}
            aria-describedby={categoryError.value ? 'proj-cat-error' : undefined}
            onInput$={(e) => {
              formCategory.value = (e.target as HTMLInputElement).value;
              categoryError.value = '';
            }}
          />
          {categoryError.value && (
            <p id="proj-cat-error" class="field-error" role="alert">{categoryError.value}</p>
          )}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="editor-label" for="proj-label">Link Label</label>
            <input
              id="proj-label"
              class="editor-input"
              value={formLinkLabel.value}
              placeholder="e.g. View Demo"
              aria-invalid={labelError.value ? 'true' : undefined}
              aria-describedby={labelError.value ? 'proj-label-error' : undefined}
              onInput$={(e) => {
                formLinkLabel.value = (e.target as HTMLInputElement).value;
                labelError.value = '';
              }}
            />
            {labelError.value && (
              <p id="proj-label-error" class="field-error" role="alert">{labelError.value}</p>
            )}
          </div>
          <div>
            <label class="editor-label" for="proj-url">Link URL</label>
            <input
              id="proj-url"
              class="editor-input"
              value={formLinkUrl.value}
              placeholder="https://..."
              onInput$={(e) => {
                formLinkUrl.value = (e.target as HTMLInputElement).value;
              }}
            />
          </div>
        </div>
        <div class="flex gap-4 items-center">
          <div class="flex-1">
            <label class="editor-label" for="proj-status">Status</label>
            <select
              id="proj-status"
              class="editor-input"
              value={formStatus.value}
              onChange$={(e) => {
                formStatus.value = (e.target as HTMLSelectElement).value as ProjectStatus;
                statusError.value = '';
              }}
            >
              <option value="wip">WIP</option>
              <option value="shipped">Shipped</option>
              <option value="concept">Concept</option>
            </select>
            {statusError.value && (
              <p class="field-error" role="alert">{statusError.value}</p>
            )}
          </div>
          <div class="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="proj-feat"
              class="checkbox"
              checked={formFeatured.value}
              onChange$={(e) => (formFeatured.value = (e.target as HTMLInputElement).checked)}
            />
            <label class="text-sm cursor-pointer" for="proj-feat">Featured</label>
          </div>
        </div>
        <button class="btn-primary" type="submit">
          Add Project
        </button>
      </form>

      {state.content.projects.length === 0 && (
        <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No projects yet. Fill in the Add Project form — a title and category tag are required — to create your first project card.
        </p>
      )}

      {state.selectedProjects.length > 0 && (
        <div
          class="mb-3 p-3 rounded-lg flex items-center justify-between"
          style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
          role="region"
          aria-label="Bulk project actions"
        >
          <span class="text-sm font-medium" style={{ color: '#4c1d95' }}>
            {state.selectedProjects.length} selected
          </span>
          <button
            type="button"
            class="btn-small"
            style={{ color: '#dc2626', borderColor: '#fecaca' }}
            onClick$={() => deleteSelectedProjects(state, history)}
          >
            Delete selected
          </button>
        </div>
      )}

      <div class="space-y-3">
        {state.content.projects.map((project) => (
          <ProjectCard key={project.id} project={project} state={state} history={history} />
        ))}
      </div>
    </div>
  );
});

interface ProjectCardProps {
  project: Project;
  state: PortfolioState;
  history: HistoryManager;
}

export const ProjectCard = component$<ProjectCardProps>(({ project, state, history }) => {
  const editing = useSignal(false);
  const isSelected = state.selectedProjects.includes(project.id);

  return (
    <div
      class={`border rounded-xl p-4 space-y-3 ${isSelected ? 'ring-2 ring-violet-500 bg-violet-50/30' : ''}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 overflow-hidden">
          <input
            type="checkbox"
            class="checkbox"
            checked={isSelected}
            onChange$={() => toggleProjectSelection(state, project.id)}
            aria-label={`Select ${project.title || 'project'} for bulk actions`}
          />
          <span class="text-sm font-medium truncate flex-1">
            {project.title || 'Untitled Project'}
          </span>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-small" onClick$={() => { editing.value = !editing.value; }}>
            {editing.value ? 'Done' : 'Edit'}
          </button>
          <button
            type="button"
            class="btn-small"
            aria-label={`Delete project ${project.title || 'Untitled'}`}
            onClick$={() => deleteProject(state, history, project.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {editing.value && (
        <div class="space-y-2">
          <div>
            <label class="editor-label" for={`edit-title-${project.id}`}>Title</label>
            <input
              id={`edit-title-${project.id}`}
              class="editor-input"
              value={project.title}
              placeholder="Project title"
              onInput$={(e) => { project.title = (e.target as HTMLInputElement).value; }}
              onBlur$={() => updateProject(state, history, project.id, 'title', project.title)}
            />
          </div>
          <div>
            <label class="editor-label" for={`edit-desc-${project.id}`}>Description</label>
            <textarea
              id={`edit-desc-${project.id}`}
              class="editor-textarea"
              value={project.description}
              placeholder="What does this project do?"
              onInput$={(e) => { project.description = (e.target as HTMLTextAreaElement).value; }}
              onBlur$={() => updateProject(state, history, project.id, 'description', project.description)}
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="editor-label" for={`edit-cat-${project.id}`}>Category Tag</label>
              <input
                id={`edit-cat-${project.id}`}
                class="editor-input"
                value={project.category}
                placeholder="e.g. Web App"
                onInput$={(e) => { project.category = (e.target as HTMLInputElement).value; }}
                onBlur$={() => updateProject(state, history, project.id, 'category', project.category)}
              />
            </div>
            <div>
              <label class="editor-label" for={`edit-label-${project.id}`}>Link Label</label>
              <input
                id={`edit-label-${project.id}`}
                class="editor-input"
                value={project.linkLabel}
                placeholder="e.g. View Demo"
                onInput$={(e) => { project.linkLabel = (e.target as HTMLInputElement).value; }}
                onBlur$={() => updateProject(state, history, project.id, 'linkLabel', project.linkLabel)}
              />
            </div>
          </div>
          <div>
            <label class="editor-label" for={`edit-url-${project.id}`}>Link URL</label>
            <input
              id={`edit-url-${project.id}`}
              class="editor-input"
              value={project.linkUrl}
              placeholder="https://..."
              onInput$={(e) => { project.linkUrl = (e.target as HTMLInputElement).value; }}
              onBlur$={() => updateProject(state, history, project.id, 'linkUrl', project.linkUrl)}
            />
          </div>
          <div class="flex gap-4 items-center">
            <div class="flex-1">
              <label class="editor-label" for={`edit-status-${project.id}`}>Status</label>
              <select
                id={`edit-status-${project.id}`}
                class="editor-input"
                value={project.status}
                onChange$={(e) => {
                  const val = (e.target as HTMLSelectElement).value as ProjectStatus;
                  updateProject(state, history, project.id, 'status', val);
                }}
              >
                <option value="wip">WIP</option>
                <option value="shipped">Shipped</option>
                <option value="concept">Concept</option>
              </select>
            </div>
            <div class="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id={`edit-feat-${project.id}`}
                class="checkbox"
                checked={project.featured}
                onChange$={(e) => {
                  updateProject(state, history, project.id, 'featured', (e.target as HTMLInputElement).checked);
                }}
              />
              <label class="text-sm cursor-pointer" for={`edit-feat-${project.id}`}>Featured</label>
            </div>
          </div>
        </div>
      )}

      {!editing.value && project.description && (
        <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {project.description.substring(0, 100)}
          {project.description.length > 100 ? '...' : ''}
        </p>
      )}
    </div>
  );
});

// ---- Skills Editor ----
interface SkillsEditorProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const SkillsEditor = component$<SkillsEditorProps>(({ state, history }) => {
  const inputVal = useSignal('');
  const errorMsg = useSignal('');

  const tryAddSkill = $(() => {
    const result = addSkill(state, history, inputVal.value);
    if (result.success) {
      inputVal.value = '';
      errorMsg.value = '';
    } else {
      errorMsg.value = result.error;
    }
  });

  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3">Skills</h2>

      <div class="flex gap-2 mb-2">
        <div class="flex-1">
          <label class="editor-label" for="skill-input">Skill</label>
          <input
            id="skill-input"
            class="editor-input"
            value={inputVal.value}
            placeholder="Type a skill and press Enter (or paste several, comma-separated)"
            aria-invalid={errorMsg.value ? 'true' : undefined}
            aria-describedby={errorMsg.value ? 'skill-error' : undefined}
            onInput$={(e) => {
              inputVal.value = (e.target as HTMLInputElement).value;
              errorMsg.value = '';
            }}
            onPaste$={(e) => {
              // Alternate input: pasting "Design, React, Motion" adds each distinct skill.
              const text = e.clipboardData?.getData('text') ?? '';
              if (text.includes(',')) {
                e.preventDefault();
                let lastError = '';
                for (const part of text.split(',')) {
                  if (!part.trim()) continue;
                  const res = addSkill(state, history, part);
                  if (!res.success) lastError = res.error;
                }
                errorMsg.value = lastError;
                inputVal.value = '';
              }
            }}
            onKeyDown$={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Read from the event target so rapid fill+Enter sequences can't
                // race the signal update; identical command path as the Add button.
                const value = (e.target as HTMLInputElement).value;
                const result = addSkill(state, history, value);
                if (result.success) {
                  inputVal.value = '';
                  errorMsg.value = '';
                } else {
                  errorMsg.value = result.error;
                }
              }
            }}
          />
        </div>
        <button type="button" class="btn-primary self-end" onClick$={tryAddSkill}>
          Add
        </button>
      </div>

      {errorMsg.value && (
        <p id="skill-error" class="field-error mb-2" role="alert">
          {errorMsg.value}
        </p>
      )}

      {state.content.skills.length === 0 && !errorMsg.value && (
        <p class="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
          No skills yet. Type a skill name (up to 40 characters) and press Enter or Add.
        </p>
      )}

      <div class="flex flex-wrap gap-2">
        {state.content.skills.map((skill) => {
          const themeColors = getThemeStyles(state.theme);
          return (
            <span
              key={skill.id}
              class="skill-chip-editor"
              style={{ background: themeColors.support, color: 'var(--color-text-primary)' }}
            >
              {skill.label}
              <button
                type="button"
                class="ml-1 text-sm font-bold cursor-pointer"
                onClick$={() => deleteSkill(state, history, skill.id)}
                style={{ color: '#dc2626' }}
                aria-label={`Remove skill ${skill.label}`}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
});

// Helper to get theme colors
function getThemeStyles(theme: string): { accent: string; support: string } {
  const themes: Record<string, { accent: string; support: string }> = {
    sunrise: { accent: '#f97316', support: '#fde68a' },
    slate: { accent: '#475569', support: '#cbd5e1' },
    forest: { accent: '#15803d', support: '#bbf7d0' },
    blossom: { accent: '#db2777', support: '#fbcfe8' },
  };
  return themes[theme] || themes.sunrise;
}

// ---- Testimonials Editor ----
interface TestimonialsEditorProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const TestimonialsEditor = component$<TestimonialsEditorProps>(({ state, history }) => {
  const formQuote = useSignal('');
  const formName = useSignal('');
  const formRole = useSignal('');
  const quoteError = useSignal('');
  const nameError = useSignal('');
  const roleError = useSignal('');

  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3">Testimonials</h2>

      <form
        class="space-y-3 mb-4 p-4 rounded-xl border"
        style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }}
        preventdefault:submit
        onSubmit$={() => {
          // Field contract: quote 1–400, name 1–80, role 1–80 (all required).
          let invalid = false;
          const quote = formQuote.value.trim();
          if (!quote) {
            quoteError.value = 'Quote is required — enter what they said (1–400 characters).';
            invalid = true;
          } else if (quote.length > 400) {
            quoteError.value = `Quote is ${quote.length} characters — keep it to 400 characters or fewer.`;
            invalid = true;
          }
          const name = formName.value.trim();
          if (!name) {
            nameError.value = 'Name is required — enter the person’s name (1–80 characters).';
            invalid = true;
          } else if (name.length > 80) {
            nameError.value = `Name is ${name.length} characters — keep it to 80 characters or fewer.`;
            invalid = true;
          }
          const role = formRole.value.trim();
          if (!role) {
            roleError.value = 'Role is required — e.g. CTO at Acme (1–80 characters).';
            invalid = true;
          } else if (role.length > 80) {
            roleError.value = `Role is ${role.length} characters — keep it to 80 characters or fewer.`;
            invalid = true;
          }
          if (invalid) return;

          const payload = JSON.stringify([quote, name, role]);
          if (testimonialGuard(payload)) return; // rapid duplicate submit — create exactly one entry

          submitTestimonial(state, history, {
            quote: formQuote.value,
            name: formName.value,
            role: formRole.value,
          });
          quoteError.value = '';
          nameError.value = '';
          roleError.value = '';
          formQuote.value = '';
          formName.value = '';
          formRole.value = '';
        }}
      >
        <p class="text-sm font-medium">Add Testimonial</p>
        <div>
          <label class="editor-label" for="test-quote">Quote</label>
          <textarea
            id="test-quote"
            class="editor-textarea"
            value={formQuote.value}
            placeholder="What did they say?"
            aria-invalid={quoteError.value ? 'true' : undefined}
            aria-describedby={quoteError.value ? 'test-quote-error' : undefined}
            onInput$={(e) => {
              formQuote.value = (e.target as HTMLTextAreaElement).value;
              quoteError.value = '';
            }}
          />
          {quoteError.value && (
            <p id="test-quote-error" class="field-error" role="alert">{quoteError.value}</p>
          )}
        </div>
        <div>
          <label class="editor-label" for="test-name">Name</label>
          <input
            id="test-name"
            class="editor-input"
            value={formName.value}
            placeholder="Person's name"
            aria-invalid={nameError.value ? 'true' : undefined}
            aria-describedby={nameError.value ? 'test-name-error' : undefined}
            onInput$={(e) => {
              formName.value = (e.target as HTMLInputElement).value;
              nameError.value = '';
            }}
          />
          {nameError.value && (
            <p id="test-name-error" class="field-error" role="alert">{nameError.value}</p>
          )}
        </div>
        <div>
          <label class="editor-label" for="test-role">Role</label>
          <input
            id="test-role"
            class="editor-input"
            value={formRole.value}
            placeholder="e.g. CTO at Acme"
            aria-invalid={roleError.value ? 'true' : undefined}
            aria-describedby={roleError.value ? 'test-role-error' : undefined}
            onInput$={(e) => {
              formRole.value = (e.target as HTMLInputElement).value;
              roleError.value = '';
            }}
          />
          {roleError.value && (
            <p id="test-role-error" class="field-error" role="alert">{roleError.value}</p>
          )}
        </div>
        <button class="btn-primary" type="submit">
          Add Testimonial
        </button>
      </form>

      {state.content.testimonials.length === 0 && (
        <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No testimonials yet. Add a quote, the person&rsquo;s name, and their role to show social proof in the preview.
        </p>
      )}

      <div class="space-y-3">
        {state.content.testimonials.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} state={state} history={history} />
        ))}
      </div>
    </div>
  );
});

interface TestimonialCardProps {
  testimonial: Testimonial;
  state: PortfolioState;
  history: HistoryManager;
}

export const TestimonialCard = component$<TestimonialCardProps>(({ testimonial, state, history }) => {
  const editing = useSignal(false);

  return (
    <div class="border rounded-xl p-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium truncate">
          {testimonial.name || 'Untitled'}
        </span>
        <div class="flex gap-2">
          <button type="button" class="btn-small" onClick$={() => { editing.value = !editing.value; }}>
            {editing.value ? 'Done' : 'Edit'}
          </button>
          <button
            type="button"
            class="btn-small"
            aria-label={`Delete testimonial from ${testimonial.name || 'Unnamed'}`}
            onClick$={() => deleteTestimonial(state, history, testimonial.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {editing.value && (
        <div class="space-y-2">
          <div>
            <label class="editor-label" for={`edit-quote-${testimonial.id}`}>Quote</label>
            <textarea
              id={`edit-quote-${testimonial.id}`}
              class="editor-textarea"
              value={testimonial.quote}
              placeholder="What did they say?"
              onInput$={(e) => { testimonial.quote = (e.target as HTMLTextAreaElement).value; }}
              onBlur$={() => updateTestimonial(state, history, testimonial.id, 'quote', testimonial.quote)}
            />
          </div>
          <div>
            <label class="editor-label" for={`edit-name-${testimonial.id}`}>Name</label>
            <input
              id={`edit-name-${testimonial.id}`}
              class="editor-input"
              value={testimonial.name}
              placeholder="Person's name"
              onInput$={(e) => { testimonial.name = (e.target as HTMLInputElement).value; }}
              onBlur$={() => updateTestimonial(state, history, testimonial.id, 'name', testimonial.name)}
            />
          </div>
          <div>
            <label class="editor-label" for={`edit-role-${testimonial.id}`}>Role</label>
            <input
              id={`edit-role-${testimonial.id}`}
              class="editor-input"
              value={testimonial.role}
              placeholder="e.g. CTO at Acme"
              onInput$={(e) => { testimonial.role = (e.target as HTMLInputElement).value; }}
              onBlur$={() => updateTestimonial(state, history, testimonial.id, 'role', testimonial.role)}
            />
          </div>
        </div>
      )}

      {!editing.value && testimonial.quote && (
        <p class="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
          &ldquo;{testimonial.quote.substring(0, 120)}
          {testimonial.quote.length > 120 ? '...' : ''}&rdquo;
        </p>
      )}
    </div>
  );
});

// ---- Contact Editor ----
interface ContactEditorProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const ContactEditor = component$<ContactEditorProps>(({ state, history }) => {
  const emailVal = useSignal(state.content.contact.email);
  const emailError = useSignal('');
  const locationError = useSignal('');
  const linkError = useSignal('');

  useTask$(({ track }) => {
    track(() => state.content.contact.email);
    emailVal.value = state.content.contact.email;
  });

  const onEmailInput = $((value: string) => {
    emailVal.value = value;
    if (!isValidEmail(value)) {
      emailError.value = 'Email needs exactly one @ with text on both sides — e.g. you@example.com. The invalid value is not saved.';
      return; // do not commit the invalid email to the preview
    }
    emailError.value = '';
    state.content.contact.email = value;
    saveState(state);
  });

  const onLocationInput = $((value: string) => {
    if (value.length > 120) {
      locationError.value = `Location is ${value.length} characters — keep it to 120 characters or fewer.`;
      return;
    }
    locationError.value = '';
    state.content.contact.location = value;
    saveState(state);
  });

  const validateLink = $((id: string) => {
    const link = state.content.contact.links.find((l) => l.id === id);
    if (!link) return;
    if (link.label.length > 40) {
      linkError.value = `Link label is ${link.label.length} characters — keep it to 40 characters or fewer.`;
      return;
    }
    if ((link.label.trim() && !link.url.trim()) || (!link.label.trim() && link.url.trim())) {
      linkError.value = 'Each custom link needs both a label (1–40 characters) and a non-empty URL.';
      return;
    }
    linkError.value = '';
  });

  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3">Contact</h2>

      <div class="space-y-3">
        <div>
          <label class="editor-label" for="contact-email">Email</label>
          <input
            id="contact-email"
            class="editor-input"
            value={emailVal.value}
            placeholder="you@example.com"
            aria-invalid={emailError.value ? 'true' : undefined}
            aria-describedby={emailError.value ? 'contact-email-error' : undefined}
            onInput$={(e) => onEmailInput((e.target as HTMLInputElement).value)}
            onBlur$={() => {
              if (!emailError.value) updateContact(state, history, 'email', state.content.contact.email);
            }}
          />
          {emailError.value && (
            <p id="contact-email-error" class="field-error" role="alert">{emailError.value}</p>
          )}
        </div>
        <div>
          <label class="editor-label" for="contact-location">Location</label>
          <input
            id="contact-location"
            class="editor-input"
            value={state.content.contact.location}
            placeholder="San Francisco, CA"
            aria-invalid={locationError.value ? 'true' : undefined}
            aria-describedby={locationError.value ? 'contact-location-error' : undefined}
            onInput$={(e) => onLocationInput((e.target as HTMLInputElement).value)}
            onBlur$={() => {
              if (!locationError.value) updateContact(state, history, 'location', state.content.contact.location);
            }}
          />
          {locationError.value && (
            <p id="contact-location-error" class="field-error" role="alert">{locationError.value}</p>
          )}
        </div>

        <div>
          <label class="editor-label" for={`link-label-${state.content.contact.links[0]?.id ?? 'none'}`}>
            Custom Links ({state.content.contact.links.length}/3)
          </label>
          {linkError.value && (
            <p class="field-error" role="alert">{linkError.value}</p>
          )}
          <div class="space-y-2 mt-1">
            {state.content.contact.links.map((link) => (
              <div key={link.id} class="flex gap-2 items-start">
                <div style={{ width: '110px', flex: '0 0 110px' }}>
                  <input
                    class="editor-input"
                    value={link.label}
                    placeholder="Label"
                    aria-label={`Custom link ${state.content.contact.links.indexOf(link) + 1} label`}
                    onInput$={(e) => { link.label = (e.target as HTMLInputElement).value; linkError.value = ''; }}
                    onBlur$={() => { updateContactLink(state, history, link.id, 'label', link.label); validateLink(link.id); }}
                  />
                </div>
                <input
                  class="editor-input flex-1"
                  value={link.url}
                  placeholder="https://..."
                  aria-label={`Custom link ${state.content.contact.links.indexOf(link) + 1} URL`}
                  onInput$={(e) => { link.url = (e.target as HTMLInputElement).value; linkError.value = ''; }}
                  onBlur$={() => { updateContactLink(state, history, link.id, 'url', link.url); validateLink(link.id); }}
                />
                <button
                  type="button"
                  class="btn-small"
                  style={{ marginTop: '4px', flexShrink: 0 }}
                  aria-label={`Remove custom link ${link.label || state.content.contact.links.indexOf(link) + 1}`}
                  onClick$={() => deleteContactLink(state, history, link.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {state.content.contact.links.length < 3 && (
              <button type="button" class="btn-secondary text-sm py-1 px-3" onClick$={() => addContactLink(state, history)}>
                + Add Link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
