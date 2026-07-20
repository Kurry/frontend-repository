import { useState } from 'preact/hooks';
import * as v from 'valibot';
import { projects, mode, theme, identity, skills, cookieConsent, profiles, THEMES } from './store.js';
import { IdentitySchema, ProjectSchema, SkillSchema } from './forms.jsx';

// Mirrors the per-theme custom properties declared in index.css, keyed by
// the PortfolioDocument/Theme CSS contract names (background/text/accent/chrome)
// rather than the internal CSS variable names.
const THEME_TOKENS = {
  dark: { background: '#0f1115', text: '#e2e8f0', accent: '#38bdf8', chrome: '#334155' },
  light: { background: '#f8fafc', text: '#0f172a', accent: '#0284c7', chrome: '#cbd5e1' },
  retro: { background: '#2a211c', text: '#ffb000', accent: '#ff6600', chrome: '#7a5c29' },
  glass: { background: '#000000', text: '#ffffff', accent: '#ffffff', chrome: 'rgba(255, 255, 255, 0.2)' },
};

const ProfileSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Profile name is required"), v.maxLength(40, "Profile name must be at most 40 characters")),
  theme: v.picklist(THEMES, "Invalid theme"),
  featuredSlugs: v.pipe(v.array(v.string()), v.maxLength(3, "At most 3 featured slugs allowed"))
});

// Every PortfolioDocument key is required (profiles/skills/featuredSlugs may
// be empty arrays, but must be present) so a partial document — e.g. one
// missing theme/consent/skills — is rejected instead of silently applied.
const PortfolioImportSchema = v.object({
  schemaVersion: v.literal('1.0'),
  identity: IdentitySchema,
  theme: v.picklist(THEMES, "Invalid theme"),
  consent: v.picklist(['not_set', 'accepted', 'declined'], "Invalid consent value"),
  projects: v.array(ProjectSchema),
  skills: v.array(SkillSchema),
  featuredSlugs: v.pipe(v.array(v.string()), v.maxLength(3, "At most 3 featured slugs allowed")),
  profiles: v.array(ProfileSchema)
});

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function PreviewBlock({ title, text, filename, mimeType }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied or unavailable; leave the preview visible
      // for a manual select-and-copy instead of throwing.
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">{title}</h3>
        <div className="flex gap-2">
          <button type="button" className="btn btn-xs btn-outline" onClick={handleCopy} aria-label={`Copy ${title}`}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button type="button" className="btn btn-xs btn-outline" onClick={() => downloadTextFile(filename, text, mimeType)} aria-label={`Download ${title}`}>
            Download
          </button>
        </div>
      </div>
      <pre className="bg-base-300 p-4 rounded text-xs overflow-x-auto">{text}</pre>
    </div>
  );
}

export default function ExportCenter() {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const featuredSlugs = projects.value.filter(p => p.featured).map(p => p.slug);

  const jsonPreview = JSON.stringify({
    schemaVersion: '1.0',
    identity: identity.value,
    theme: theme.value,
    consent: cookieConsent.value,
    projects: projects.value,
    skills: skills.value,
    featuredSlugs,
    profiles: profiles.value
  }, null, 2);

  const tokens = THEME_TOKENS[theme.value] || THEME_TOKENS.dark;
  const cssPreview = `:root[data-theme="${theme.value}"] {\n  --background: ${tokens.background};\n  --text: ${tokens.text};\n  --accent: ${tokens.accent};\n  --chrome: ${tokens.chrome};\n}`;

  const configPreview = [
    '# terminal-portfolio config',
    `theme = ${theme.value}`,
    `display_name = ${identity.value.name}`,
    `email = ${identity.value.email}`,
    `location = ${identity.value.location}`,
    `featured = ${featuredSlugs.join(',')}`
  ].join('\n');

  const handleImport = () => {
    try {
       const result = v.safeParse(PortfolioImportSchema, JSON.parse(importText));
       if (result.success) {
          const importedProjects = result.output.projects;

          const seenSlugs = new Set();
          const duplicateSlug = importedProjects.find(p => {
            if (seenSlugs.has(p.slug)) return true;
            seenSlugs.add(p.slug);
            return false;
          });
          if (duplicateSlug) {
            setImportError(`Invalid import: duplicate slug "${duplicateSlug.slug}" found in projects`);
            return;
          }

          const featuredCount = importedProjects.filter(p => p.featured).length;
          if (featuredCount > 3) {
            setImportError(`Invalid import: maximum 3 featured projects allowed, found ${featuredCount}`);
            return;
          }

          const missingFeaturedSlug = result.output.featuredSlugs.find(
            slug => !importedProjects.some(p => p.slug === slug)
          );
          if (missingFeaturedSlug) {
            setImportError(`Invalid import: featuredSlugs references unknown slug "${missingFeaturedSlug}"`);
            return;
          }

          projects.value = importedProjects;
          identity.value = result.output.identity;
          theme.value = result.output.theme;
          cookieConsent.value = result.output.consent;
          skills.value = result.output.skills;
          profiles.value = result.output.profiles;
          setImportError("");
          alert("Import successful!");
       } else {
          const issue = result.issues[0];
          const path = issue.path?.map(segment => segment.key).filter(key => key !== undefined).join('.') || 'document';
          setImportError(`Invalid JSON schema at ${path}: ${issue.message}`);
       }
    } catch(err) {
       setImportError("Invalid JSON: " + err.message);
    }
  };

  return (
    <div className="h-full overflow-y-auto relative p-4 text-text-main flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">Export Center</h2>
        <button className="btn btn-sm btn-ghost" onClick={() => mode.value = 'board'}>&larr; Back to Board</button>
      </div>

      <div className="bg-base-200 p-4 rounded border border-border">
         <label className="font-bold mb-2 block" htmlFor="portfolio-import-json">Import Portfolio JSON</label>
         <textarea id="portfolio-import-json" className="textarea textarea-bordered w-full h-24 font-mono text-xs" value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste JSON here..."></textarea>
         {importError && <p className="text-error text-xs mt-1">{importError}</p>}
         <button className="btn btn-primary btn-sm mt-2" onClick={handleImport}>Import JSON</button>
      </div>

      <PreviewBlock title="Portfolio JSON" text={jsonPreview} filename="portfolio.json" mimeType="application/json" />
      <PreviewBlock title="Terminal Config" text={configPreview} filename="terminal.config" mimeType="text/plain" />
      <PreviewBlock title="Theme CSS" text={cssPreview} filename="theme.css" mimeType="text/css" />
    </div>
  );
}
