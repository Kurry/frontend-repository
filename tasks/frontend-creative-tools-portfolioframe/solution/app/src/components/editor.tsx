import { component$, $, useSignal } from '@builder.io/qwik';
import type { PortfolioState, HistoryManager, Project, Testimonial } from '../types';
import {
  updateProfile,
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
} from '../store';

// ---- Profile Header Editor ----
interface ProfileEditorProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const ProfileEditor = component$<ProfileEditorProps>(({ state, history }) => {
  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Profile Header
      </h2>
      <div class="space-y-3">
        <div>
          <label class="editor-label" htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            class="editor-input"
            placeholder="Your full name"
            value={state.content.profile.name}
            onInput$={(e) => {
              state.content.profile.name = (e.target as HTMLInputElement).value;
              saveState(state);
            }}
            onBlur$={() => {
              pushHistory(history, state.content, 'Edit profile name');
            }}
          />
        </div>
        <div>
          <label class="editor-label" htmlFor="profile-title">Title / Tagline</label>
          <input
            id="profile-title"
            class="editor-input"
            placeholder="e.g. Senior Frontend Engineer"
            value={state.content.profile.title}
            onInput$={(e) => {
              state.content.profile.title = (e.target as HTMLInputElement).value;
              saveState(state);
            }}
            onBlur$={() => {
              pushHistory(history, state.content, 'Edit profile title');
            }}
          />
        </div>
        <div>
          <label class="editor-label" htmlFor="profile-bio">Bio</label>
          <textarea
            id="profile-bio"
            class="editor-textarea"
            placeholder="A short bio about yourself..."
            value={state.content.profile.bio}
            onInput$={(e) => {
              state.content.profile.bio = (e.target as HTMLTextAreaElement).value;
              saveState(state);
            }}
            onBlur$={() => {
              pushHistory(history, state.content, 'Edit profile bio');
            }}
          />
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

  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Projects
      </h2>

      <form
        class="space-y-3 mb-4 p-4 rounded-xl border"
        style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }}
        preventdefault:submit
        onSubmit$={() => {
          submitProject(state, history, {
            title: formTitle.value,
            description: formDescription.value,
            category: formCategory.value,
            linkLabel: formLinkLabel.value,
            linkUrl: formLinkLabel.value ? 'https://example.com' : '',
          });
          formTitle.value = '';
          formDescription.value = '';
          formCategory.value = '';
          formLinkLabel.value = '';
        }}
      >
        <p class="text-sm font-medium">Add Project</p>
        <div>
          <label class="editor-label">Title</label>
          <input
            class="editor-input"
            value={formTitle.value}
            placeholder="Project title"
            onInput$={(e) => { formTitle.value = (e.target as HTMLInputElement).value; }}
          />
        </div>
        <div>
          <label class="editor-label">Description</label>
          <textarea
            class="editor-textarea"
            value={formDescription.value}
            placeholder="What does this project do?"
            onInput$={(e) => { formDescription.value = (e.target as HTMLTextAreaElement).value; }}
          />
        </div>
        <div>
          <label class="editor-label">Category Tag</label>
          <input
            class="editor-input"
            value={formCategory.value}
            placeholder="e.g. Web App"
            onInput$={(e) => { formCategory.value = (e.target as HTMLInputElement).value; }}
          />
        </div>
        <div>
          <label class="editor-label">Link Label</label>
          <input
            class="editor-input"
            value={formLinkLabel.value}
            placeholder="e.g. View Demo"
            onInput$={(e) => { formLinkLabel.value = (e.target as HTMLInputElement).value; }}
          />
        </div>
        <button class="btn-primary" type="submit">
          Add Project
        </button>
      </form>

      {state.content.projects.length === 0 && (
        <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No projects yet. Click "Add Project" to get started.
        </p>
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

  return (
    <div class="border rounded-xl p-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium truncate">
          {project.title || 'Untitled Project'}
        </span>
        <div class="flex gap-2">
          <button
            class="btn-small"
            onClick$={() => { editing.value = !editing.value; }}
          >
            {editing.value ? 'Done' : 'Edit'}
          </button>
          <button
            class="btn-small"
            onClick$={() => deleteProject(state, history, project.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {editing.value && (
        <div class="space-y-2">
          <div>
            <label class="editor-label">Title</label>
            <input
              class="editor-input"
              value={project.title}
              placeholder="Project title"
              onInput$={(e) => { project.title = (e.target as HTMLInputElement).value; saveState(state); }}
              onBlur$={() => updateProject(state, history, project.id, 'title', project.title)}
            />
          </div>
          <div>
            <label class="editor-label">Description</label>
            <textarea
              class="editor-textarea"
              value={project.description}
              placeholder="What does this project do?"
              onInput$={(e) => { project.description = (e.target as HTMLTextAreaElement).value; }}
              onBlur$={() => updateProject(state, history, project.id, 'description', project.description)}
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="editor-label">Category Tag</label>
              <input
                class="editor-input"
                value={project.category}
                placeholder="e.g. Web App"
                onInput$={(e) => { project.category = (e.target as HTMLInputElement).value; }}
                onBlur$={() => updateProject(state, history, project.id, 'category', project.category)}
              />
            </div>
            <div>
              <label class="editor-label">Link Label</label>
              <input
                class="editor-input"
                value={project.linkLabel}
                placeholder="e.g. View Demo"
                onInput$={(e) => { project.linkLabel = (e.target as HTMLInputElement).value; }}
                onBlur$={() => updateProject(state, history, project.id, 'linkLabel', project.linkLabel)}
              />
            </div>
          </div>
          <div>
            <label class="editor-label">Link URL</label>
            <input
              class="editor-input"
              value={project.linkUrl}
              placeholder="https://..."
              onInput$={(e) => { project.linkUrl = (e.target as HTMLInputElement).value; }}
              onBlur$={() => updateProject(state, history, project.id, 'linkUrl', project.linkUrl)}
            />
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
      <h2 class="text-lg font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Skills
      </h2>

      <div class="flex gap-2 mb-2">
        <input
          class="editor-input flex-1"
          value={inputVal.value}
          placeholder="Type a skill and press Enter"
          onInput$={(e) => {
            inputVal.value = (e.target as HTMLInputElement).value;
            errorMsg.value = '';
          }}
          onKeyDown$={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              tryAddSkill();
            }
          }}
        />
        <button class="btn-primary" onClick$={tryAddSkill}>
          Add
        </button>
      </div>

      {errorMsg.value && (
        <p class="text-sm mb-2" style={{ color: '#dc2626' }}>
          {errorMsg.value}
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
                class="ml-1 text-sm font-bold cursor-pointer"
                onClick$={() => deleteSkill(state, history, skill.id)}
                style={{ color: '#dc2626' }}
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

  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Testimonials
      </h2>

      <form
        class="space-y-3 mb-4 p-4 rounded-xl border"
        style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }}
        preventdefault:submit
        onSubmit$={() => {
          submitTestimonial(state, history, {
            quote: formQuote.value,
            name: formName.value,
            role: formRole.value,
          });
          formQuote.value = '';
          formName.value = '';
          formRole.value = '';
        }}
      >
        <p class="text-sm font-medium">Add Testimonial</p>
        <div>
          <label class="editor-label">Quote</label>
          <textarea
            class="editor-textarea"
            value={formQuote.value}
            placeholder="What did they say?"
            onInput$={(e) => { formQuote.value = (e.target as HTMLTextAreaElement).value; }}
          />
        </div>
        <div>
          <label class="editor-label">Name</label>
          <input
            class="editor-input"
            value={formName.value}
            placeholder="Person's name"
            onInput$={(e) => { formName.value = (e.target as HTMLInputElement).value; }}
          />
        </div>
        <div>
          <label class="editor-label">Role</label>
          <input
            class="editor-input"
            value={formRole.value}
            placeholder="e.g. CTO at Acme"
            onInput$={(e) => { formRole.value = (e.target as HTMLInputElement).value; }}
          />
        </div>
        <button class="btn-primary" type="submit">
          Add Testimonial
        </button>
      </form>

      {state.content.testimonials.length === 0 && (
        <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No testimonials yet.
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
          <button
            class="btn-small"
            onClick$={() => { editing.value = !editing.value; }}
          >
            {editing.value ? 'Done' : 'Edit'}
          </button>
          <button
            class="btn-small"
            onClick$={() => deleteTestimonial(state, history, testimonial.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {editing.value && (
        <div class="space-y-2">
          <div>
            <label class="editor-label">Quote</label>
            <textarea
              class="editor-textarea"
              value={testimonial.quote}
              placeholder="What did they say?"
              onInput$={(e) => { testimonial.quote = (e.target as HTMLTextAreaElement).value; }}
              onBlur$={() => updateTestimonial(state, history, testimonial.id, 'quote', testimonial.quote)}
            />
          </div>
          <div>
            <label class="editor-label">Name</label>
            <input
              class="editor-input"
              value={testimonial.name}
              placeholder="Person's name"
              onInput$={(e) => { testimonial.name = (e.target as HTMLInputElement).value; }}
              onBlur$={() => updateTestimonial(state, history, testimonial.id, 'name', testimonial.name)}
            />
          </div>
          <div>
            <label class="editor-label">Role</label>
            <input
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
          "{testimonial.quote.substring(0, 120)}
          {testimonial.quote.length > 120 ? '..."' : '"'}
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
  return (
    <div class="editor-section">
      <h2 class="text-lg font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Contact
      </h2>

      <div class="space-y-3">
        <div>
          <label class="editor-label">Email</label>
          <input
            class="editor-input"
            value={state.content.contact.email}
            placeholder="you@example.com"
            onInput$={(e) => { state.content.contact.email = (e.target as HTMLInputElement).value; }}
            onBlur$={() => updateContact(state, history, 'email', state.content.contact.email)}
          />
        </div>
        <div>
          <label class="editor-label">Location</label>
          <input
            class="editor-input"
            value={state.content.contact.location}
            placeholder="San Francisco, CA"
            onInput$={(e) => { state.content.contact.location = (e.target as HTMLInputElement).value; }}
            onBlur$={() => updateContact(state, history, 'location', state.content.contact.location)}
          />
        </div>

        <div>
          <label class="editor-label">
            Custom Links ({state.content.contact.links.length}/3)
          </label>
          <div class="space-y-2 mt-1">
            {state.content.contact.links.map((link) => (
              <div key={link.id} class="flex gap-2 items-start">
                <input
                  class="editor-input"
                  style={{ width: '100px', flex: '0 0 100px' }}
                  value={link.label}
                  placeholder="Label"
                  onInput$={(e) => { link.label = (e.target as HTMLInputElement).value; }}
                  onBlur$={() => updateContactLink(state, history, link.id, 'label', link.label)}
                />
                <input
                  class="editor-input flex-1"
                  value={link.url}
                  placeholder="https://..."
                  onInput$={(e) => { link.url = (e.target as HTMLInputElement).value; }}
                  onBlur$={() => updateContactLink(state, history, link.id, 'url', link.url)}
                />
                <button
                  class="btn-small"
                  style={{ marginTop: '8px', flexShrink: 0 }}
                  onClick$={() => deleteContactLink(state, history, link.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {state.content.contact.links.length < 3 && (
              <button
                class="btn-secondary text-sm py-1 px-3"
                onClick$={() => addContactLink(state, history)}
              >
                + Add Link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
