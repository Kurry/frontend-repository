import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import autoAnimate from '@formkit/auto-animate';
import type { PortfolioState } from '../types';

interface LivePreviewProps {
  state: PortfolioState;
}

function getThemeColors(theme: string): { accent: string; support: string } {
  const themes: Record<string, { accent: string; support: string }> = {
    sunrise: { accent: '#f97316', support: '#fde68a' },
    slate: { accent: '#475569', support: '#cbd5e1' },
    forest: { accent: '#15803d', support: '#bbf7d0' },
    blossom: { accent: '#db2777', support: '#fbcfe8' },
  };
  return themes[theme] || themes.sunrise;
}

interface DensitySpacing {
  section: string;
  card: string;
  gap: string;
  title: string;
}

function densityPadding(density: string): DensitySpacing {
  if (density === 'compact') {
    return { section: 'py-4', card: 'p-3', gap: 'gap-2', title: 'mb-3' };
  }
  return { section: 'py-8', card: 'p-5', gap: 'gap-4', title: 'mb-5' };
}

export const LivePreview = component$<LivePreviewProps>(({ state }) => {
  const theme = getThemeColors(state.theme);
  const spacing = densityPadding(state.density);
  const { sectionOrder, sectionVisibility } = state;
  const { profile, projects, skills, testimonials, contact } = state.content;

  const containerRef = useSignal<HTMLElement>();
  const gridRef = useSignal<HTMLDivElement>();
  const skillsRef = useSignal<HTMLDivElement>();
  const testimonialsRef = useSignal<HTMLDivElement>();

  // Section show/hide + Move Up/Down reorder animate via FLIP on the container.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (containerRef.value) {
      const controller = autoAnimate(containerRef.value, { duration: 260, respectPrefersReducedMotion: true });
      cleanup(() => controller());
    }
  });
  // Card / chip enter-exit animations inside each collection.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const controllers: Array<() => void> = [];
    for (const el of [gridRef.value, skillsRef.value, testimonialsRef.value]) {
      if (el) controllers.push(autoAnimate(el, { duration: 220, respectPrefersReducedMotion: true }));
    }
    cleanup(() => controllers.forEach((c) => c()));
  });

  // Determine if we have any content at all
  const hasContent =
    profile.name ||
    profile.title ||
    profile.bio ||
    projects.length > 0 ||
    skills.length > 0 ||
    testimonials.length > 0 ||
    contact.email ||
    contact.location ||
    contact.links.length > 0;

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });
  const completeLinks = contact.links.filter((l) => l.label.trim() && l.url.trim());

  return (
    <div
      ref={containerRef}
      class={`preview-container ${state.density === 'compact' ? 'density-compact' : 'density-spacious'}`}
      style={{
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '15px',
        color: '#1c1917',
        background: '#ffffff',
        minHeight: '100%',
      }}
    >
      {/* Render sections in order */}
      {sectionOrder.map((sectionKey) => {
        if (!sectionVisibility[sectionKey]) return null;

        switch (sectionKey) {
          case 'header':
            if (!profile.name && !profile.title && !profile.bio) {
              return (
                <section key={sectionKey} class={`preview-section ${spacing.section} text-center border-b`} style={{ borderColor: '#e7e5e4' }}>
                  <p style={{ color: '#78716c', fontSize: '13px' }}>Profile Header section — add your name and bio in the editor.</p>
                </section>
              );
            }
            return <HeaderPreview key={sectionKey} profile={profile} theme={theme} spacing={spacing} />;

          case 'projects':
            return (
              <section key={sectionKey} class={`preview-section ${spacing.section} border-b`} style={{ borderColor: '#e7e5e4' }}>
                <h2
                  class={`preview-section-title text-xl font-semibold ${spacing.title}`}
                  style={{ fontFamily: '"Poppins", sans-serif', color: theme.accent, fontSize: '20px' }}
                >
                  Projects
                </h2>
                {sortedProjects.length === 0 ? (
                  <p style={{ color: '#78716c', fontSize: '13px' }}>No projects added yet. Submit the Add Project form to see a card here.</p>
                ) : (
                  <div ref={gridRef} class={`grid grid-cols-1 sm:grid-cols-2 ${spacing.gap}`}>
                    {sortedProjects.map((p) => (
                      <div
                        key={p.id}
                        class={`preview-card rounded-2xl border ${spacing.card} ${p.featured ? 'ring-2 ring-violet-500 bg-violet-50/20' : ''}`}
                        style={{ borderColor: p.featured ? theme.accent : '#e7e5e4' }}
                      >
                        <div class="flex items-start justify-between mb-1 gap-2">
                          <h3 class="text-base font-semibold" style={{ fontFamily: '"Poppins", sans-serif', color: '#1c1917' }}>
                            {p.title || 'Untitled'}
                          </h3>
                          {p.featured && (
                            <span
                              class="preview-chip text-xs font-bold px-2 py-0.5 rounded text-white"
                              style={{ background: theme.accent }}
                            >
                              Featured
                            </span>
                          )}
                        </div>
                        <div class="flex flex-wrap gap-2 mb-2">
                          {p.category && (
                            <span
                              class="preview-chip inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ background: theme.support, color: theme.accent }}
                            >
                              {p.category}
                            </span>
                          )}
                          <span
                            class="preview-chip inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: p.status === 'shipped' ? '#dcfce7' : p.status === 'wip' ? '#fef08a' : '#e0e7ff',
                              color: p.status === 'shipped' ? '#166534' : p.status === 'wip' ? '#854d0e' : '#3730a3',
                              border: `1px solid ${p.status === 'shipped' ? '#bbf7d0' : p.status === 'wip' ? '#fde047' : '#c7d2fe'}`,
                            }}
                          >
                            {p.status === 'shipped' ? 'Shipped' : p.status === 'wip' ? 'WIP' : 'Concept'}
                          </span>
                        </div>
                        {p.description && (
                          <p class="text-sm" style={{ color: '#78716c' }}>
                            {p.description}
                          </p>
                        )}
                        {p.linkLabel && (
                          <span
                            class="preview-accent inline-block text-sm font-medium mt-2"
                            style={{ color: theme.accent }}
                          >
                            {p.linkLabel} →
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );

          case 'skills':
            return (
              <section key={sectionKey} class={`preview-section ${spacing.section} border-b`} style={{ borderColor: '#e7e5e4' }}>
                <h2
                  class={`preview-section-title text-xl font-semibold ${spacing.title}`}
                  style={{ fontFamily: '"Poppins", sans-serif', color: theme.accent, fontSize: '20px' }}
                >
                  Skills
                </h2>
                {skills.length === 0 ? (
                  <p style={{ color: '#78716c', fontSize: '13px' }}>No skills added yet. Add skills in the editor to build your chip cloud.</p>
                ) : (
                  <div ref={skillsRef} class="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s.id}
                        class="preview-chip inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{ background: theme.support, color: theme.accent }}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            );

          case 'testimonials':
            return (
              <section key={sectionKey} class={`preview-section ${spacing.section} border-b`} style={{ borderColor: '#e7e5e4' }}>
                <h2
                  class={`preview-section-title text-xl font-semibold ${spacing.title}`}
                  style={{ fontFamily: '"Poppins", sans-serif', color: theme.accent, fontSize: '20px' }}
                >
                  Testimonials
                </h2>
                {testimonials.length === 0 ? (
                  <p style={{ color: '#78716c', fontSize: '13px' }}>No testimonials added yet. Add a quote to see it in this scrollable row.</p>
                ) : (
                  <div ref={testimonialsRef} class="testimonials-scroll flex gap-4 overflow-x-auto pb-2">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        class={`preview-card rounded-2xl border flex-shrink-0 ${spacing.card}`}
                        style={{ borderColor: '#e7e5e4', minWidth: '280px', maxWidth: '340px' }}
                      >
                        <p class="text-sm italic mb-3" style={{ color: '#44403c' }}>
                          &ldquo;{t.quote}&rdquo;
                        </p>
                        <div>
                          <p class="text-sm font-semibold" style={{ color: '#1c1917' }}>
                            {t.name}
                          </p>
                          <p class="text-xs" style={{ color: '#78716c' }}>
                            {t.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );

          case 'contact':
            return (
              <section key={sectionKey} class={`preview-section ${spacing.section}`}>
                <h2
                  class={`preview-section-title text-xl font-semibold ${spacing.title}`}
                  style={{ fontFamily: '"Poppins", sans-serif', color: theme.accent, fontSize: '20px' }}
                >
                  Contact
                </h2>
                <div class="space-y-2">
                  {contact.email && (
                    <p class="text-sm">
                      <span style={{ color: '#78716c' }}>Email: </span>
                      <span class="preview-accent" style={{ color: theme.accent }}>
                        {contact.email}
                      </span>
                    </p>
                  )}
                  {contact.location && (
                    <p class="text-sm">
                      <span style={{ color: '#78716c' }}>Location: </span>
                      {contact.location}
                    </p>
                  )}
                  {completeLinks.length > 0 && (
                    <div class="flex flex-wrap gap-3 mt-2">
                      {completeLinks.map((link) => (
                        <span
                          key={link.id}
                          class="preview-accent text-sm font-medium"
                          style={{ color: theme.accent }}
                        >
                          {link.label} →
                        </span>
                      ))}
                    </div>
                  )}
                  {!contact.email && !contact.location && completeLinks.length === 0 && (
                    <p style={{ color: '#78716c', fontSize: '13px' }}>No contact info added yet. Add an email, location, or custom links in the editor.</p>
                  )}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {!hasContent && (
        <div class="text-center py-16">
          <p class="text-lg" style={{ color: '#78716c' }}>
            Start building your portfolio using the editor panel →
          </p>
        </div>
      )}
    </div>
  );
});

interface HeaderPreviewProps {
  profile: { name: string; title: string; bio: string };
  theme: { accent: string; support: string };
  spacing: { section: string; card: string; gap: string; title: string };
}

export const HeaderPreview = component$<HeaderPreviewProps>(({ profile, theme, spacing }) => {
  return (
    <section class={`preview-section ${spacing.section} text-center border-b`} style={{ borderColor: '#e7e5e4' }}>
      {profile.name && (
        <h1
          class="preview-accent text-3xl font-semibold mb-2"
          style={{ fontFamily: '"Poppins", sans-serif', color: theme.accent, fontSize: '30px' }}
        >
          {profile.name}
        </h1>
      )}
      {profile.title && (
        <p
          class="text-lg font-medium mb-3"
          style={{ fontFamily: '"Poppins", sans-serif', color: '#44403c', fontSize: '20px' }}
        >
          {profile.title}
        </p>
      )}
      {profile.bio && (
        <p class="text-sm max-w-lg mx-auto" style={{ color: '#78716c' }}>
          {profile.bio}
        </p>
      )}
    </section>
  );
});
